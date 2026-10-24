import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { addDays } from "date-fns";
import { HelpCircle } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  ChannelUnitCard,
  type ChannelUnitRow,
} from "@/components/conciergerie/channels/channel-unit-card";
import { SyncHero } from "@/components/conciergerie/channels/sync-hero";
import {
  ConnectChannelDialog,
  type ConnectMode,
} from "@/components/conciergerie/connect-channel-dialog";
import { EmptyState } from "@/components/empty-state";
import { ListSearch } from "@/components/list-controls";
import { ListPagination } from "@/components/list-pagination";
import { PageHeader } from "@/components/page-header";
import { QueryView } from "@/components/panel-states";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCalendarView, useChannexAccountStatus, usePlatformSettings } from "@/hooks/use-portfolio-data";
import { compareText, useSort, type Comparators } from "@/hooks/use-sort";
import { useUrlPagination } from "@/hooks/use-url-state";
import { today } from "@/lib/clock";
import { toISODate } from "@/lib/dates";
import { formatMAD } from "@/lib/currency";
import { combineQueries } from "@/lib/queries";
import { matchesQuery } from "@/lib/search";
import type { AccountChannexStatus, Channel } from "@/types/channex";

export const Route = createFileRoute("/conciergerie/channels")({
  component: ChannelsPage,
});

const PAGE_SIZE = 12;

function ChannelsPage() {
  // The backend has no single "channel connections across all units" endpoint (connections are
  // per unit), so the roster of STR units comes from the calendar endpoint (already real, already
  // used elsewhere) for a single day -- it carries unit/property names without the N+1 cost of
  // fetching every property's detail. Each unit's own connections load lazily in its card.
  const day = toISODate(today());
  // The backend rejects `to === from` (INVALID_DATE_RANGE); `to` must be strictly after `from`.
  const nextDay = toISODate(addDays(today(), 1));
  const query = combineQueries(
    useCalendarView({ from: day, to: nextDay, type: "STR" }),
    useChannexAccountStatus(),
    usePlatformSettings(),
  );
  return (
    <QueryView query={query} skeleton="gallery">
      {([calendar, status, settings]) => (
        <ChannelsContent
          rows={calendar.properties.flatMap((property) =>
            property.units.map((unit) => ({
              unitId: unit.unitId,
              unitName: unit.unitName,
              propertyId: property.propertyId,
              propertyName: property.propertyName,
            })),
          )}
          status={status}
          syncPrice={settings.prices.sync}
        />
      )}
    </QueryView>
  );
}

type DialogState = { unit: ChannelUnitRow; mode: ConnectMode; channel: Channel; connectionId?: string };

const SORTS: Comparators<ChannelUnitRow> = {
  unit: (a, b) => compareText(`${a.propertyName} ${a.unitName}`, `${b.propertyName} ${b.unitName}`),
};

function ChannelsContent({
  rows,
  status,
  syncPrice,
}: {
  rows: ChannelUnitRow[];
  status: AccountChannexStatus;
  syncPrice: number;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const navigate = useNavigate();
  const [dialog, setDialog] = React.useState<DialogState | null>(null);
  const [search, setSearch] = React.useState("");
  const matching = rows.filter((row) => matchesQuery(search, row.unitName, row.propertyName));
  const sorting = useSort(matching, SORTS, { key: "unit", dir: "asc" });
  const pager = useUrlPagination(sorting.items, { fixedPageSize: PAGE_SIZE });
  const price = formatMAD(syncPrice);

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumb={[
          { label: t("common:nav.group.operations") },
          { label: t("common:nav.channels") },
        ]}
        title={t("channels.pageTitle")}
        description={t("channels.pageLine")}
        actions={
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outlineGold" size="sm" className="h-9">
                <HelpCircle className="size-4" aria-hidden="true" />
                {t("channels.howTitle")}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 border-border bg-[#141414] p-4 text-xs">
              <ol className="space-y-3">
                {(["how1", "how2", "how3"] as const).map((key, index) => (
                  <li key={key} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full border border-primary/40 text-[0.68rem] tabular-nums text-primary">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed text-muted-foreground">
                      {t(`channels.${key}`)}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 border-t border-border/60 pt-3 text-muted-foreground">
                {t("channels.pricing", { price })}
              </p>
            </PopoverContent>
          </Popover>
        }
      />

      <SyncHero
        synced={status.totalConnectedUnits}
        errors={status.syncIssueCount}
        lastSyncAt={undefined}
        note={t("channels.pricing", { price })}
      />

      {rows.length === 0 ? (
        <EmptyState
          illustrationName="empty-channels"
          title={t("channels.emptyTitle")}
          description={t("channels.emptyLine")}
          action={t("today.emptyCta")}
          onAction={() => void navigate({ to: "/conciergerie/properties" })}
        />
      ) : (
        <section className="space-y-4">
          <ListSearch
            value={search}
            onChange={setSearch}
            placeholder={t("common:listControls.placeholder.channels")}
            className="sm:w-72"
          />

          {pager.total === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
              {t("common:listControls.noResults")}
            </p>
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {pager.items.map((row) => (
                  <li key={row.unitId}>
                    <ChannelUnitCard
                      unit={row}
                      onConnect={(target, channel) => setDialog({ unit: target, mode: "connect", channel })}
                      onReconnect={(target, channel, connectionId) =>
                        setDialog({ unit: target, mode: "reconnect", channel, connectionId })
                      }
                    />
                  </li>
                ))}
              </ul>
              <ListPagination pagination={pager} mono={false} />
            </>
          )}
        </section>
      )}

      <ConnectChannelDialog
        unit={dialog?.unit ?? null}
        mode={dialog?.mode ?? "connect"}
        channel={dialog?.channel ?? "airbnb"}
        {...(dialog?.connectionId ? { connectionId: dialog.connectionId } : {})}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
