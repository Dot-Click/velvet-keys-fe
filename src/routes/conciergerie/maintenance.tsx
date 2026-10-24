import { createFileRoute } from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { useAuth } from "@/components/auth-provider";
import { KanbanBoard } from "@/components/conciergerie/maintenance/kanban-board";
import { LogRepairDrawer } from "@/components/conciergerie/maintenance/log-repair-drawer";
import { maintenanceErrorKey } from "@/components/conciergerie/maintenance/maintenance-errors";
import { ResolveDialog } from "@/components/conciergerie/maintenance/resolve-dialog";
import { TicketDrawer } from "@/components/conciergerie/maintenance/ticket-drawer";
import {
  UrgencyPill,
  ticketCost,
  useTicketAge,
} from "@/components/conciergerie/maintenance/ticket-parts";
import { WorkersDrawer } from "@/components/conciergerie/maintenance/workers-drawer";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { FilterChips } from "@/components/filter-chips";
import { InitialsAvatar } from "@/components/initials-avatar";
import { ListSearch } from "@/components/list-controls";
import { PageHeader } from "@/components/page-header";
import { QueryView } from "@/components/panel-states";
import { SummaryStrip } from "@/components/summary-strip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ViewToggle, type ListView } from "@/components/view-toggle";
import {
  useMaintenanceSummary,
  usePanelMutation,
  useTicketBoard,
  useTicketsPage,
} from "@/hooks/use-portfolio-data";
import {
  parseOneOf,
  parsePositiveInt,
  parseString,
  useSetSearchParams,
  useUrlState,
  type UrlPagination,
} from "@/hooks/use-url-state";
import { useReadOnly } from "@/hooks/use-read-only";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import type { Page } from "@/lib/apiClient";
import { formatHours } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { hasCapability } from "@/lib/roles";
import { matchesQuery } from "@/lib/search";
import { ticketsService } from "@/services/ops-service";
import type { Ticket, TicketBoard, TicketStatus } from "@/types/ops";

export const Route = createFileRoute("/conciergerie/maintenance")({
  component: MaintenancePage,
});

const VIEWS = ["board", "list"] as const;
type BoardView = (typeof VIEWS)[number];
const STATUSES: TicketStatus[] = ["reported", "assigned", "in_progress", "resolved"];
const STATUS_FILTERS = ["all", ...STATUSES] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const SEARCH_DELAY_MS = 300;

/** Status moves with instant feedback: the card jumps at once and snaps back if the write fails. */
function useTicketMover() {
  const { t } = useTranslation("conciergerie");
  const [optimistic, setOptimistic] = React.useState<Record<string, TicketStatus>>({});
  const [resolving, setResolving] = React.useState<Ticket | null>(null);
  const write = usePanelMutation(
    ({
      id,
      status,
      actualCostMinor,
    }: {
      id: string;
      status: TicketStatus;
      actualCostMinor: number | null;
    }) =>
      ticketsService.update(id, {
        status,
        ...(actualCostMinor !== null ? { actualCostMinor } : {}),
      }),
  );

  const run = (ticket: Ticket, status: TicketStatus, actualCostMinor: number | null) => {
    setOptimistic((current) => ({ ...current, [ticket.id]: status }));
    write.mutate(
      { id: ticket.id, status, actualCostMinor },
      {
        onSuccess: () =>
          toast.success(t("maintenance.statusUpdated"), {
            description: t("maintenance.statusUpdatedBody", {
              status: t(`maintenance.status.${status}`),
            }),
          }),
        onError: (error) => toast.error(t(maintenanceErrorKey(error))),
        onSettled: () =>
          setOptimistic((current) => {
            const { [ticket.id]: _settled, ...rest } = current;
            return rest;
          }),
      },
    );
  };

  const move = (ticket: Ticket, status: TicketStatus) => {
    if (ticket.status === status) return;
    if (status === "resolved") setResolving(ticket);
    else run(ticket, status, null);
  };

  const withStatus = (ticket: Ticket): Ticket => ({
    ...ticket,
    status: optimistic[ticket.id] ?? ticket.status,
  });

  const dialog = (
    <ResolveDialog
      ticket={resolving}
      onCancel={() => setResolving(null)}
      onConfirm={(ticket, cost) => {
        setResolving(null);
        run(ticket, "resolved", cost);
      }}
    />
  );

  return { move, withStatus, dialog };
}

type Mover = ReturnType<typeof useTicketMover>;

function MaintenancePage() {
  const { t } = useTranslation(["conciergerie", "common"]);
  const { session } = useAuth();
  const canWrite = session ? hasCapability(session.profile, "operations") : false;
  const setParams = useSetSearchParams();
  const [view] = useUrlState<BoardView>("view", "board", parseOneOf(VIEWS));
  const [status, setStatus] = useUrlState<StatusFilter>(
    "status",
    "all",
    parseOneOf(STATUS_FILTERS),
  );
  const [q] = useUrlState("q", "", parseString);
  const [search, setSearch] = React.useState(q);
  const [logOpen, setLogOpen] = React.useState(false);
  const [workersOpen, setWorkersOpen] = React.useState(false);
  const mover = useTicketMover();

  // The URL follows the search box once typing pauses
  React.useEffect(() => {
    if (search.trim() === q) return;
    const handle = window.setTimeout(
      () => setParams({ q: search.trim() || undefined, page: undefined }, { replace: true }),
      SEARCH_DELAY_MS,
    );
    return () => window.clearTimeout(handle);
  }, [search, q, setParams]);

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumb={[
          { label: t("common:nav.group.finance") },
          { label: t("common:nav.maintenance") },
        ]}
        title={t("maintenance.pageTitle")}
        description={t("maintenance.pageLine")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outlineGold"
              size="sm"
              onClick={() => setWorkersOpen(true)}
              className="h-9"
            >
              <Users className="size-4" aria-hidden="true" />
              {t("maintenance.workers.manage")}
            </Button>
            {canWrite && (
              <ReadOnlyGuard>
                <Button size="sm" onClick={() => setLogOpen(true)} className="h-9">
                  <Plus className="size-4" aria-hidden="true" />
                  {t("maintenance.logRepair")}
                </Button>
              </ReadOnlyGuard>
            )}
          </div>
        }
      />

      <SummaryTiles />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <ListSearch
            value={search}
            onChange={setSearch}
            placeholder={t("common:listControls.placeholder.tickets")}
            className="sm:w-72"
          />
          {view === "list" && (
            <FilterChips
              label={t("maintenance.colStatus")}
              value={status}
              onChange={(next) => setStatus(next, { replace: true })}
              chips={STATUS_FILTERS.map((value) => ({
                value,
                label:
                  value === "all" ? t("maintenance.allStatuses") : t(`maintenance.status.${value}`),
              }))}
            />
          )}
        </div>
        <ViewToggle
          value={view === "board" ? "cards" : "table"}
          labels={{ table: t("maintenance.viewList"), cards: t("maintenance.viewBoard") }}
          onChange={(next: ListView) =>
            setParams({
              view: next === "table" ? "list" : undefined,
              status: undefined,
              page: undefined,
            })
          }
        />
      </div>

      {view === "board" ? (
        <BoardPane q={q} canWrite={canWrite} mover={mover} onLog={() => setLogOpen(true)} />
      ) : (
        <ListPane
          q={q}
          status={status}
          canWrite={canWrite}
          mover={mover}
          onLog={() => setLogOpen(true)}
        />
      )}

      {mover.dialog}
      {canWrite && <LogRepairDrawer open={logOpen} onClose={() => setLogOpen(false)} />}
      <WorkersDrawer open={workersOpen} canWrite={canWrite} onClose={() => setWorkersOpen(false)} />
    </div>
  );
}

function SummaryTiles() {
  const { t } = useTranslation(["conciergerie", "common"]);
  const summary = useMaintenanceSummary();
  if (summary.isError) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
      >
        <span className="text-muted-foreground">{t("common:states.errorBody")}</span>
        <Button variant="outline" size="sm" onClick={() => void summary.refetch()}>
          {t("common:states.retry")}
        </Button>
      </div>
    );
  }
  if (!summary.data) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-[88px] rounded-xl" />
        ))}
      </div>
    );
  }
  const { openCount, criticalCount, avgResolutionHours, monthRepairSpendMinor } = summary.data;
  return (
    <SummaryStrip
      items={[
        { id: "open", label: t("maintenance.summary.open"), value: openCount },
        {
          id: "critical",
          label: t("maintenance.summary.critical"),
          value: criticalCount,
          ...(criticalCount > 0 ? { tone: "ruby" as const, pulse: true } : {}),
        },
        {
          id: "avg",
          label: t("maintenance.summary.avgResolution"),
          value: avgResolutionHours ?? 0,
          tone: "jade",
          display: avgResolutionHours === null ? "—" : formatHours(avgResolutionHours),
        },
        {
          id: "spend",
          label: t("maintenance.summary.spend"),
          value: monthRepairSpendMinor,
          tone: "gold",
          display: <span dir="ltr">{formatMoney(monthRepairSpendMinor, ACCOUNT_CURRENCY)}</span>,
        },
      ]}
    />
  );
}

function flatten(board: TicketBoard): Ticket[] {
  return [...board.reported, ...board.assigned, ...board.inProgress, ...board.resolved];
}

function BoardPane({
  q,
  canWrite,
  mover,
  onLog,
}: {
  q: string;
  canWrite: boolean;
  mover: Mover;
  onLog: () => void;
}) {
  const query = useTicketBoard();
  return (
    <QueryView query={query} skeleton="board">
      {(board) => (
        <BoardContent board={board} q={q} canWrite={canWrite} mover={mover} onLog={onLog} />
      )}
    </QueryView>
  );
}

function BoardContent({
  board,
  q,
  canWrite,
  mover,
  onLog,
}: {
  board: TicketBoard;
  q: string;
  canWrite: boolean;
  mover: Mover;
  onLog: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const { isReadOnly } = useReadOnly();
  const ageOf = useTicketAge();
  const setParams = useSetSearchParams();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const all = flatten(board).map(mover.withStatus);
  const shown = all.filter((ticket) =>
    matchesQuery(
      q,
      ticket.title,
      ticket.description,
      ticket.propertyName,
      ticket.unitName,
      ticket.workerName,
    ),
  );
  const selected = all.find((ticket) => ticket.id === selectedId) ?? null;

  return (
    <>
      <KanbanBoard
        tickets={shown}
        readOnly={isReadOnly || !canWrite}
        ageOf={ageOf}
        onOpen={(ticket) => setSelectedId(ticket.id)}
        onMove={mover.move}
        onViewResolved={() => setParams({ view: "list", status: "resolved", page: undefined })}
      />
      <TicketDrawer
        ticket={selected}
        canWrite={canWrite}
        onClose={() => setSelectedId(null)}
        onMove={mover.move}
      />
    </>
  );
}

function ListPane({
  q,
  status,
  canWrite,
  mover,
  onLog,
}: {
  q: string;
  status: StatusFilter;
  canWrite: boolean;
  mover: Mover;
  onLog: () => void;
}) {
  const [page] = useUrlState("page", 1, parsePositiveInt);
  const query = useTicketsPage({
    page,
    ...(q ? { q } : {}),
    ...(status !== "all" ? { status } : {}),
  });
  return (
    <QueryView query={query} skeleton="table">
      {(data) => (
        <ListContent
          data={data}
          filtered={Boolean(q) || status !== "all"}
          canWrite={canWrite}
          mover={mover}
          onLog={onLog}
        />
      )}
    </QueryView>
  );
}

function ListContent({
  data,
  filtered,
  canWrite,
  mover,
  onLog,
}: {
  data: Page<Ticket>;
  filtered: boolean;
  canWrite: boolean;
  mover: Mover;
  onLog: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const ageOf = useTicketAge();
  const setParams = useSetSearchParams();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const items = data.items.map(mover.withStatus);
  const selected = items.find((ticket) => ticket.id === selectedId) ?? null;

  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));
  const pager: UrlPagination<Ticket> = {
    page: data.page,
    pageSize: data.pageSize,
    pageCount,
    total: data.total,
    from: data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1,
    to: Math.min(data.page * data.pageSize, data.total),
    items,
    loadMore: false,
    setPage: (next) =>
      setParams({ page: Math.min(Math.max(1, next), pageCount) === 1 ? undefined : next }),
    // The backend fixes the page size; there is nothing to change
    setPageSize: () => undefined,
  };

  const columns: DataTableColumn<Ticket>[] = [
    {
      id: "title",
      header: t("maintenance.fieldTitle"),
      hideOnMobile: true,
      cell: (ticket) => <TicketTitleCell ticket={ticket} />,
    },
    {
      id: "unit",
      header: t("maintenance.sort.unit"),
      cell: (ticket) => (
        <span className="block text-xs">
          <span className="block text-foreground">{ticket.unitName}</span>
          <span className="block text-muted-foreground">{ticket.propertyName}</span>
        </span>
      ),
    },
    {
      id: "urgency",
      header: t("maintenance.fieldUrgency"),
      cell: (ticket) => <UrgencyPill urgency={ticket.urgency} />,
    },
    {
      id: "status",
      header: t("maintenance.colStatus"),
      cell: (ticket) => (
        <span className="text-xs text-foreground">{t(`maintenance.status.${ticket.status}`)}</span>
      ),
    },
    {
      id: "worker",
      header: t("maintenance.fieldWorker"),
      cell: (ticket) =>
        ticket.workerName ? (
          <span className="inline-flex items-center gap-2 text-xs text-foreground">
            <InitialsAvatar name={ticket.workerName} size="sm" className="size-6 text-[0.55rem]" />
            {ticket.workerName}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{t("maintenance.unassigned")}</span>
        ),
    },
    {
      id: "age",
      header: t("maintenance.sort.reportedAt"),
      cell: (ticket) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">{ageOf(ticket)}</span>
      ),
    },
    {
      id: "cost",
      header: t("maintenance.fieldCost"),
      align: "end",
      cell: (ticket) => (
        <span dir="ltr" className="whitespace-nowrap tabular-nums text-foreground">
          {ticketCost(ticket) ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <>
      <DataTable
        label={t("maintenance.pageTitle")}
        columns={columns}
        pagination={pager}
        getRowId={(ticket) => ticket.id}
        onRowClick={(ticket) => setSelectedId(ticket.id)}
        mobileTitle={(ticket) => <TicketTitleCell ticket={ticket} />}
        rowClassName={(ticket) =>
          ticket.urgency === "critical" && ticket.status !== "resolved"
            ? "[&>td:first-child]:shadow-[inset_3px_0_0_#FF85A1] rtl:[&>td:first-child]:shadow-[inset_-3px_0_0_#FF85A1] border-s-[3px] border-s-[#FF85A1] md:border-s-0"
            : undefined
        }
        empty={
          <p className="rounded-xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
            {t("common:listControls.noResults")}
          </p>
        }
      />
      <TicketDrawer
        ticket={selected}
        canWrite={canWrite}
        onClose={() => setSelectedId(null)}
        onMove={mover.move}
      />
    </>
  );
}

function TicketTitleCell({ ticket }: { ticket: Ticket }) {
  return <span className="min-w-0 truncate text-[0.85rem] text-foreground">{ticket.title}</span>;
}
