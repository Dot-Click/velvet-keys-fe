import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { addDays, addMonths, getDaysInMonth, startOfMonth, startOfWeek } from "date-fns";
import { Ban, Plus } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { useAuth } from "@/components/auth-provider";
import { BookingDrawer } from "@/components/conciergerie/booking-drawer";
import { AddStayDrawer, type StayDraft } from "@/components/conciergerie/calendar/add-stay-drawer";
import { AgendaView } from "@/components/conciergerie/calendar/agenda-view";
import { BlockDetailsDrawer } from "@/components/conciergerie/calendar/block-details-drawer";
import { calendarErrorKey } from "@/components/conciergerie/calendar/calendar-errors";
import { CalendarToolbar } from "@/components/conciergerie/calendar/calendar-toolbar";
import {
  TYPE_FILTERS,
  VIEW_MODES,
  ZOOMS,
  ZOOM_DAYS,
  ZOOM_LEAD,
  itemsByUnit,
  type CalendarItem,
  type CalendarRow,
  type CalendarViewMode,
  type CalendarZoom,
  type PropertyGroup,
} from "@/components/conciergerie/calendar/calendar-model";
import { TimelineGrid, type StayChange } from "@/components/conciergerie/calendar/timeline-grid";
import { MonthView } from "@/components/conciergerie/calendar/month-view";
import { LeaseDrawer } from "@/components/conciergerie/lease-drawer";
import { NewLeaseDrawer } from "@/components/conciergerie/new-lease-drawer";
import { PageHeader } from "@/components/page-header";
import { PanelErrorState } from "@/components/panel-states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCalendarView, usePanelMutation, useProperties } from "@/hooks/use-portfolio-data";
import { parseOneOf, parseString, useSetSearchParams } from "@/hooks/use-url-state";
import { today } from "@/lib/clock";
import { formatDate, formatDateFields } from "@/lib/currency";
import { parseDay, toISODate } from "@/lib/dates";
import { hasCapability } from "@/lib/roles";
import { matchesQuery } from "@/lib/search";
import { bookingsService } from "@/services/str-service";

export const Route = createFileRoute("/conciergerie/calendar")({
  component: CalendarPage,
});

const parseView = parseOneOf(VIEW_MODES);
const parseZoom = parseOneOf(ZOOMS);
const parseType = parseOneOf(TYPE_FILTERS);
const parseIsoDay = (raw: unknown) =>
  typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;

/** First day and length of what a view shows around its anchor day. */
function rangeOf(view: CalendarViewMode, zoom: CalendarZoom, anchor: Date) {
  if (view === "month") {
    const start = startOfMonth(anchor);
    return { start, length: getDaysInMonth(start) };
  }
  if (view === "agenda") return { start: startOfWeek(anchor, { weekStartsOn: 1 }), length: 7 };
  return { start: anchor, length: ZOOM_DAYS[zoom] };
}

function CalendarPage() {
  const { t } = useTranslation(["conciergerie", "common"]);
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const setParams = useSetSearchParams();

  // Phones open on the agenda; everything else on the timeline
  const view = parseView(search["view"]) ?? (mobile ? "agenda" : "timeline");
  const zoom = parseZoom(search["zoom"]) ?? "2w";
  const type = parseType(search["type"]) ?? "all";
  const property = parseString(search["property"]) ?? "all";
  const query = parseString(search["q"]) ?? "";
  const todayDate = today();
  const todayIso = toISODate(todayDate);
  const startParam = parseIsoDay(search["start"]);
  const anchor = startParam
    ? parseDay(startParam)
    : view === "timeline"
      ? addDays(todayDate, -ZOOM_LEAD[zoom])
      : todayDate;
  const range = rangeOf(view, zoom, anchor);
  const days = React.useMemo(
    () => Array.from({ length: range.length }, (_, index) => addDays(range.start, index)),
    [range.start.getTime(), range.length], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const last = days[days.length - 1] ?? range.start;
  const rangeKey = `${view}-${toISODate(range.start)}-${range.length}`;

  // Only the visible range: the backend caps how wide a calendar request may be
  const calendar = useCalendarView({
    from: toISODate(range.start),
    to: toISODate(addDays(range.start, range.length)),
    ...(property === "all" ? {} : { propertyId: property }),
    ...(type === "all" ? {} : { type }),
  });
  const propertyList = useProperties();
  const { session } = useAuth();
  const canWrite = Boolean(session && hasCapability(session.profile, "operations"));

  const [scrollToToday, setScrollToToday] = React.useState(0);
  const [selected, setSelected] = React.useState<CalendarItem | null>(null);
  const [stayDraft, setStayDraft] = React.useState<StayDraft | null>(null);
  const [leaseUnit, setLeaseUnit] = React.useState<string | null | undefined>(undefined);
  const moveStay = usePanelMutation(
    ({ id, checkIn, checkOut }: { id: string; checkIn: string; checkOut: string }) =>
      bookingsService.update(id, { checkIn, checkOut }),
  );

  const data = calendar.data;
  const items = React.useMemo(() => itemsByUnit(data?.properties ?? []), [data]);
  const allRows = React.useMemo<CalendarRow[]>(
    () =>
      (data?.properties ?? []).flatMap((entry) =>
        entry.units.map((unit) => ({ property: entry, unit })),
      ),
    [data],
  );
  const properties = React.useMemo(
    () => (propertyList.data ?? []).map((item) => ({ id: item.id, name: item.name })),
    [propertyList.data],
  );
  const groups = React.useMemo<PropertyGroup[]>(
    () =>
      (data?.properties ?? [])
        .map((entry) => ({
          propertyId: entry.propertyId,
          propertyName: entry.propertyName,
          occupancyPct: entry.propertyOccupancyPct,
          units: entry.units.filter((unit) =>
            matchesQuery(query, unit.unitName, entry.propertyName),
          ),
        }))
        .filter((group) => group.units.length > 0),
    [data, query],
  );
  const visibleRows = React.useMemo(() => {
    const ids = new Set(groups.flatMap((group) => group.units.map((unit) => unit.unitId)));
    return allRows.filter((row) => ids.has(row.unit.unitId));
  }, [groups, allRows]);
  const visibleItems = React.useMemo(
    () => visibleRows.flatMap((row) => items.get(row.unit.unitId) ?? []),
    [visibleRows, items],
  );
  const strRows = allRows.filter((row) => row.unit.type === "STR");
  const rowOf = (unitId: string) => allRows.find((row) => row.unit.unitId === unitId);

  const shift = (direction: 1 | -1) => {
    const next =
      view === "month"
        ? addMonths(startOfMonth(anchor), direction)
        : addDays(range.start, direction * range.length);
    setParams({ start: toISODate(next) });
  };

  const goToday = () => {
    setParams({ start: undefined });
    setScrollToToday((count) => count + 1);
  };

  const label =
    view === "month"
      ? formatDateFields(range.start, { month: "long", year: "numeric" })
      : view === "agenda"
        ? t("calendar.weekOf", {
            date: formatDateFields(range.start, { day: "numeric", month: "long" }),
          })
        : `${formatDateFields(range.start, { day: "numeric", month: "short" })} – ${formatDate(
            last,
            {
              day: "numeric",
              month: "short",
              year: "numeric",
            },
          )}`;

  const conflictToast = React.useCallback(
    (error?: unknown) =>
      toast.error(t("calendar.conflictAlert"), {
        description: error ? t(calendarErrorKey(error)) : t("calendar.errors.BOOKING_OVERLAP"),
      }),
    [t],
  );

  const onMoveStay = async ({ item, checkIn, checkOut }: StayChange) => {
    await moveStay.mutateAsync({ id: item.id, checkIn, checkOut });
    toast.success(t("calendar.moved", { name: item.booking.guest.name }), {
      description: `${formatDateFields(parseDay(checkIn), { day: "numeric", month: "short" })} – ${formatDateFields(parseDay(checkOut), { day: "numeric", month: "short" })}`,
    });
  };

  const openDraft = (mode: "stay" | "block") => {
    const first = mode === "stay" ? strRows[0] : allRows[0];
    if (!first) return;
    setStayDraft({
      unitId: first.unit.unitId,
      checkIn: todayIso,
      checkOut: toISODate(addDays(todayDate, 1)),
      mode,
    });
  };

  if (calendar.isError) return <PanelErrorState onRetry={() => void calendar.refetch()} />;

  const selectedRow = selected ? rowOf(selected.unitId) : undefined;
  const leaseId = selected?.kind === "lease" ? selected.id : null;
  const other = selected?.kind === "turnover" || selected?.kind === "block" ? selected : null;
  const close = () => setSelected(null);

  return (
    <div className="mx-auto flex h-[calc(100dvh-var(--shell-top,64px)-6rem)] max-w-[1720px] flex-col gap-3 px-4 pt-5 sm:px-6 md:h-[calc(100dvh-var(--shell-top,64px)-2.5rem)] lg:px-8">
      <PageHeader
        breadcrumb={[
          { label: t("common:nav.group.operations") },
          { label: t("common:nav.calendar") },
        ]}
        title={t("calendar.pageTitle")}
        description={t("calendar.pageLine")}
        actions={
          canWrite ? (
            <div className="hidden items-center gap-2 md:flex">
              <ReadOnlyGuard>
                <Button
                  size="sm"
                  variant="outlineGold"
                  onClick={() => openDraft("block")}
                  disabled={allRows.length === 0}
                  className="h-9"
                >
                  <Ban className="size-4" aria-hidden="true" />
                  {t("calendar.blockDates")}
                </Button>
              </ReadOnlyGuard>
              <ReadOnlyGuard>
                <Button
                  size="sm"
                  onClick={() => openDraft("stay")}
                  disabled={strRows.length === 0}
                  className="h-9"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  {t("calendar.addBooking")}
                </Button>
              </ReadOnlyGuard>
            </div>
          ) : undefined
        }
      />

      <CalendarToolbar
        view={view}
        onViewChange={(next) =>
          setParams({
            view: next === (mobile ? "agenda" : "timeline") ? undefined : next,
            start: undefined,
          })
        }
        zoom={zoom}
        onZoomChange={(next) =>
          setParams({ zoom: next === "2w" ? undefined : next, start: undefined })
        }
        label={label}
        onToday={goToday}
        onPrevious={() => shift(-1)}
        onNext={() => shift(1)}
        type={type}
        onTypeChange={(next) =>
          setParams({ type: next === "all" ? undefined : next }, { replace: true })
        }
        property={property}
        onPropertyChange={(next) =>
          setParams({ property: next === "all" ? undefined : next }, { replace: true })
        }
        properties={properties}
        search={query}
        onSearchChange={(next) => setParams({ q: next || undefined }, { replace: true })}
      />

      <div className="min-h-0 flex-1">
        {!data ? (
          <Skeleton className="h-full rounded-2xl" />
        ) : groups.length === 0 ? (
          <div className="grid h-full place-items-center rounded-2xl border border-dashed border-border/70 p-8 text-center">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("calendar.noUnitsMatch")}</p>
              <Button
                variant="outlineGold"
                size="sm"
                onClick={() => setParams({ type: undefined, property: undefined, q: undefined })}
              >
                {t("calendar.clearFilters")}
              </Button>
            </div>
          </div>
        ) : view === "timeline" ? (
          <TimelineGrid
            groups={groups}
            items={items}
            days={days}
            zoom={zoom}
            rangeKey={rangeKey}
            todayIso={todayIso}
            canWrite={canWrite}
            scrollToToday={scrollToToday}
            onOpenItem={setSelected}
            onCreateStay={({ unit, checkIn, checkOut }) =>
              setStayDraft({ unitId: unit.unitId, checkIn, checkOut, mode: "stay" })
            }
            onAddLease={(unitId) => setLeaseUnit(unitId)}
            onMoveStay={onMoveStay}
            onConflict={conflictToast}
          />
        ) : view === "month" ? (
          <MonthView
            anchor={range.start}
            items={visibleItems}
            todayIso={todayIso}
            onPickDay={(day) =>
              setParams({ view: undefined, start: toISODate(addDays(day, -ZOOM_LEAD[zoom])) })
            }
          />
        ) : (
          <AgendaView
            days={days}
            rows={visibleRows}
            items={items}
            todayIso={todayIso}
            onOpenItem={setSelected}
          />
        )}
      </div>

      <BookingDrawer
        booking={selected?.kind === "stay" ? selected.booking : null}
        onClose={close}
      />
      <LeaseDrawer leaseId={leaseId} onClose={close} />
      <BlockDetailsDrawer item={other} row={selectedRow} canWrite={canWrite} onClose={close} />
      {canWrite && (
        <AddStayDrawer draft={stayDraft} rows={allRows} onClose={() => setStayDraft(null)} />
      )}
      <NewLeaseDrawer
        open={leaseUnit !== undefined}
        initialUnitId={leaseUnit ?? null}
        onClose={() => setLeaseUnit(undefined)}
      />
    </div>
  );
}
