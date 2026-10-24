import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { DayTimeline } from "@/components/conciergerie/today/day-timeline";
import { KpiTiles, type TodayFocus } from "@/components/conciergerie/today/kpi-tiles";
import { NeedsAttention } from "@/components/conciergerie/today/needs-attention";
import { SyncIssueBar } from "@/components/conciergerie/today/sync-issue-bar";
import {
  buildAttention,
  buildTodayItems,
  type TodayItem,
  type TodayItemKind,
} from "@/components/conciergerie/today/today-items";
import { UnitStatusBoard } from "@/components/conciergerie/today/unit-status-board";
import { PageHeader } from "@/components/page-header";
import { QueryView } from "@/components/panel-states";
import { useMinuteClock } from "@/hooks/use-minute-clock";
import { usePanelMutation, useTodayBoard } from "@/hooks/use-portfolio-data";
import { parseOneOf, useUrlState } from "@/hooks/use-url-state";
import { hasErrorCode } from "@/lib/apiClient";
import { formatDate } from "@/lib/currency";
import { hasCapability } from "@/lib/roles";
import { matchesQuery } from "@/lib/search";
import { bookingsService, housekeepingService } from "@/services/str-service";
import type { Booking, HousekeepingTask, Today } from "@/types/str";

export const Route = createFileRoute("/conciergerie/today")({
  component: ConciergeTodayPage,
});

const FOCUS_OPTIONS = ["all", "check_in", "check_out", "housekeeping"] as const;

function ConciergeTodayPage() {
  const { t } = useTranslation(["conciergerie", "common"]);
  const navigate = useNavigate();
  const query = useTodayBoard();

  return (
    <QueryView query={query} skeleton="split">
      {(today) => <TodayContent data={today} refetch={() => void query.refetch()} />}
    </QueryView>
  );
}

function greetingKey(clock: string) {
  const hour = Number(clock.slice(0, 2));
  if (hour < 12) return "today.greeting.morning";
  if (hour < 18) return "today.greeting.afternoon";
  return "today.greeting.evening";
}

interface ItemWrite {
  item: TodayItem;
  done: boolean;
}

/** Runs the backend call behind an item: check-in, check-out or the housekeeping status. */
function writeItem({ item, done }: ItemWrite): Promise<Booking | HousekeepingTask> {
  if (item.kind === "check_in" && item.booking) return bookingsService.checkIn(item.booking.id);
  if (item.kind === "check_out" && item.booking) return bookingsService.checkOut(item.booking.id);
  if (item.kind === "housekeeping" && item.task) {
    return housekeepingService.setStatus(item.task.id, done ? "done" : "scheduled");
  }
  return Promise.reject(new Error("Unsupported today item"));
}

function TodayContent({ data, refetch }: { data: Today; refetch: () => void }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const { session } = useAuth();
  const { clock, label: clockLabel } = useMinuteClock();
  const [focus, setFocus] = useUrlState<TodayFocus>("focus", "all", parseOneOf(FOCUS_OPTIONS));
  const [search, setSearch] = React.useState("");
  const [focusItemId, setFocusItemId] = React.useState<string | null>(null);
  const clearFocusItem = React.useCallback(() => setFocusItemId(null), []);
  const canWrite = session ? hasCapability(session.profile, "operations") : false;

  // Instant feedback while the write and the refetch are in flight
  const [optimistic, setOptimistic] = React.useState<Record<string, boolean>>({});
  const write = usePanelMutation(writeItem);
  const items = React.useMemo(
    () =>
      buildTodayItems(data).map((item) => ({ ...item, done: optimistic[item.id] ?? item.done })),
    [data, optimistic],
  );
  const attention = React.useMemo(
    () => buildAttention(data).filter((entry) => !(optimistic[entry.itemId] ?? false)),
    [data, optimistic],
  );

  const titleOf = (item: TodayItem) => {
    switch (item.kind) {
      case "check_in":
        return t("today.arrivalTitle", { name: item.booking?.guest.name ?? "" });
      case "check_out":
        return t("today.departureTitle", { name: item.booking?.guest.name ?? "" });
      case "housekeeping":
        return t("today.turnoverTitle");
    }
  };

  const personOf = (item: TodayItem) =>
    item.booking
      ? t("today.guestLine", { name: item.booking.guest.name, count: item.booking.guestsCount })
      : null;

  const actionLabel = (kind: TodayItemKind) =>
    t(
      {
        check_in: "today.markArrived",
        check_out: "today.markDeparted",
        housekeeping: "today.markCleaned",
      }[kind],
    );

  const blockedLabel = (item: TodayItem) =>
    item.kind === "check_out" && !item.canAct ? t("today.notCheckedIn") : null;

  const errorMessage = (error: unknown) => {
    if (hasErrorCode(error, "ACCOUNT_READ_ONLY")) return t("portfolioErrors.ACCOUNT_READ_ONLY");
    if (hasErrorCode(error, "BOOKING_NOT_FOUND", "HOUSEKEEPING_NOT_FOUND")) {
      return t("today.errors.notFound");
    }
    return t("common:states.errorBody");
  };

  const run = (item: TodayItem, done: boolean, onSuccess?: () => void) => {
    setOptimistic((prev) => ({ ...prev, [item.id]: done }));
    write.mutate(
      { item, done },
      {
        ...(onSuccess ? { onSuccess } : {}),
        onError: (error) => {
          toast.error(errorMessage(error));
          if (hasErrorCode(error, "BOOKING_NOT_FOUND", "HOUSEKEEPING_NOT_FOUND")) refetch();
        },
        onSettled: () =>
          setOptimistic((prev) => {
            const { [item.id]: _settled, ...rest } = prev;
            return rest;
          }),
      },
    );
  };

  const markDone = (item: TodayItem) => {
    if (!canWrite || !item.canAct) return;
    const title = titleOf(item);
    run(item, true, () => {
      toast.success(t("today.actionCompleted", { title }), {
        description: t("today.statusUpdated", { unit: item.unitName }),
        // Only housekeeping can be reopened: the backend has no undo for check-in/out
        ...(item.kind === "housekeeping"
          ? {
              action: {
                label: t("today.undo"),
                onClick: () => run(item, false, () => toast.info(t("today.reverted", { title }))),
              },
            }
          : {}),
      });
    });
  };

  const undo = (item: TodayItem) => {
    if (!canWrite || item.kind !== "housekeeping") return;
    run(item, false, () => toast.info(t("today.reverted", { title: titleOf(item) })));
  };

  const matches = (item: TodayItem) =>
    matchesQuery(
      search,
      titleOf(item),
      item.booking?.guest.name,
      item.booking?.guest.email,
      item.booking?.guest.phone,
      item.propertyName,
      item.unitName,
    );

  const countKind = (kind: TodayItemKind) => {
    const ofKind = items.filter((item) => item.kind === kind);
    return { total: ofKind.length, done: ofKind.filter((item) => item.done).length };
  };

  const showInList = (itemId: string) => {
    if (focus !== "all") setFocus("all", { replace: true });
    setSearch("");
    setFocusItemId(itemId);
  };

  const firstName = session?.profile.displayName.split(" ")[0] ?? "";

  return (
    <div className="mx-auto max-w-[1720px] space-y-4 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumb={[{ label: t("common:nav.group.operations") }, { label: t("common:nav.today") }]}
        title={t(greetingKey(clock), { name: firstName })}
        description={
          <span className="font-serif text-[0.95rem] italic text-primary/90">
            {formatDate(new Date(`${data.date}T12:00:00`), {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        }
        actions={
          <span className="inline-flex h-9 items-center gap-2 rounded-full border border-[#A2E8DD]/30 bg-[#A2E8DD]/8 px-3 text-xs text-[#A2E8DD]">
            <span className="size-1.5 animate-pulse rounded-full bg-[#A2E8DD]" aria-hidden="true" />
            <time className="tabular-nums" dir="ltr">
              {t("today.clock", { time: clockLabel })}
            </time>
          </span>
        }
      />

      <KpiTiles
        arrivals={countKind("check_in")}
        departures={countKind("check_out")}
        housekeeping={countKind("housekeeping")}
        active={focus}
        onSelect={(next) => setFocus(next, { replace: true })}
      />

      <SyncIssueBar count={data.syncIssueCount} />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <DayTimeline
          className="lg:col-span-8"
          items={items}
          filter={focus}
          onFilterChange={(next) => setFocus(next, { replace: true })}
          search={search}
          onSearchChange={setSearch}
          matches={matches}
          titleOf={titleOf}
          personOf={personOf}
          actionLabel={actionLabel}
          blockedLabel={blockedLabel}
          canWrite={canWrite}
          onDone={markDone}
          onUndo={undo}
          focusItemId={focusItemId}
          onFocusHandled={clearFocusItem}
        />

        <aside className="space-y-4 lg:sticky lg:top-[calc(var(--shell-top,64px)+1rem)] lg:col-span-4">
          <NeedsAttention items={attention} onShowInList={showInList} />
          <UnitStatusBoard units={data.unitStatusBoard} />
        </aside>
      </div>
    </div>
  );
}
