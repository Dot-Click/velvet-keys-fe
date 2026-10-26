import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import type { DataScope } from "@/types/common";
import type { PropertyListFilter } from "@/types/portfolio";
import type {
  BookingListFilter,
  CalendarQuery,
  HousekeepingFilter,
} from "@/types/str";
import {
  issuerProfileService,
  leasesService as realLeasesService,
  rentInvoicesService as realRentInvoicesService,
  tenantPortalService,
} from "@/services/ltr-service";
import type { LeaseListFilter, RentInvoiceListFilter } from "@/types/ltr";
import { subscriptionService } from "@/services/subscription-service";
import type { InvoiceListFilter } from "@/types/subscription";
import { channexService } from "@/services/channex-service";
import { ownerFinancialsService } from "@/services/owner-financials-service";
import type { FinancialQuery, OwnerKpis, PeriodView } from "@/types/owner-financials";
import { today } from "@/lib/clock";
import { parseDay, toISODate } from "@/lib/dates";
import {
  calendarWindows,
  loadAllPages,
  mergeCalendars,
  monthBounds,
  monthKeysEnding,
  toMonthlyPnl,
  type MonthlyPnl,
} from "@/lib/owner-analytics";
import {
  expensesService as realExpensesService,
  ticketsService,
  workersService as realWorkersService,
} from "@/services/ops-service";
import type { ExpenseListFilter, TicketListFilter } from "@/types/ops";
import {
  bookingsService as strBookingsService,
  calendarService,
  housekeepingService,
  todayService,
} from "@/services/str-service";
import { useDataScope } from "@/hooks/use-data-scope";
import { assertOnline } from "@/lib/pwa";
import {
  commissionService,
  ownersService,
  propertiesService,
} from "@/services/portfolio-service";
import { settingsService } from "@/services/accounts-service";

/** Every query here lives under this key, so a write can refresh all panel data at once. */
const ROOT = "panel-data";

function key(scope: DataScope, ...parts: unknown[]): QueryKey {
  return [ROOT, scope.accountId, scope.userId ?? "", scope.ownerId ?? "all", ...parts];
}

function useScopedQuery<T>(
  parts: unknown[],
  load: (scope: DataScope) => Promise<T>,
  keepPrevious = false,
) {
  const scope = useDataScope();
  return useQuery({
    queryKey: key(scope, ...parts),
    queryFn: () => load(scope),
    enabled: Boolean(scope.accountId),
    ...(keepPrevious ? { placeholderData: keepPreviousData } : {}),
  });
}

/** Every property the user can see (selectors and filters that need the whole list). */
export const useProperties = () =>
  useScopedQuery(["properties"], () => propertiesService.listAll());

/** One page of properties, with the backend's search and filters. */
export const usePropertiesPage = (filter: PropertyListFilter) =>
  useScopedQuery(["properties-page", filter], () => propertiesService.list(filter), true);

/** A property with its units and quick stats. */
export const usePortfolioProperty = (propertyId: string | null) => {
  const scope = useDataScope();
  return useQuery({
    queryKey: key(scope, "portfolio-property", propertyId),
    queryFn: () => propertiesService.get(propertyId ?? ""),
    enabled: Boolean(scope.accountId && propertyId),
  });
};

/** One page of bookings with the backend's tabs, filters and search. */
export const useBookingsPage = (filter: BookingListFilter) =>
  useScopedQuery(["bookings-page", filter], () => strBookingsService.list(filter), true);

export const useBookingDetail = (bookingId: string | null) => {
  const scope = useDataScope();
  return useQuery({
    queryKey: key(scope, "booking-detail", bookingId),
    queryFn: () => strBookingsService.get(bookingId ?? ""),
    enabled: Boolean(scope.accountId && bookingId),
  });
};

/** Guest search for the booking form; idle until at least 2 characters are typed. */
export const useGuestSearch = (term: string) => {
  const scope = useDataScope();
  const trimmed = term.trim();
  return useQuery({
    queryKey: key(scope, "guest-search", trimmed),
    queryFn: () => strBookingsService.searchGuests(trimmed),
    enabled: Boolean(scope.accountId && trimmed.length >= 2),
  });
};

/** Nested properties -> units -> bookings/leases/housekeeping/blocks for a date range. */
export const useCalendarView = (input: CalendarQuery) =>
  useScopedQuery(["calendar-view", input], () => calendarService.get(input), true);

export const useHousekeepingList = (filter: HousekeepingFilter) =>
  useScopedQuery(["housekeeping", filter], () => housekeepingService.list(filter), true);

/** The Today screen: arrivals, departures, housekeeping, unit status board, sync issues. */
export const useTodayBoard = () => useScopedQuery(["today"], () => todayService.get());

/** Maintenance tickets, one page (list view) with the backend's filters. */
export const useTicketsPage = (filter: TicketListFilter) =>
  useScopedQuery(["tickets-page", filter], () => ticketsService.list(filter), true);

/** Kanban board: tickets already grouped by status. */
export const useTicketBoard = () => useScopedQuery(["ticket-board"], () => ticketsService.board());

export const useTicketDetail = (ticketId: string | null) => {
  const scope = useDataScope();
  return useQuery({
    queryKey: key(scope, "ticket-detail", ticketId),
    queryFn: () => ticketsService.get(ticketId ?? ""),
    enabled: Boolean(scope.accountId && ticketId),
  });
};

export const useMaintenanceSummary = () =>
  useScopedQuery(["maintenance-summary"], () => ticketsService.summary());

/** Every worker, for pickers (the backend list is paged; this loads up to 50). */
export const useWorkerList = (q?: string) =>
  useScopedQuery(["worker-list", q ?? ""], () => realWorkersService.list(1, 50, q));

export const useExpensesPage = (filter: ExpenseListFilter) =>
  useScopedQuery(["expenses-page", filter], () => realExpensesService.list(filter), true);

export const useExpenseSummary = () =>
  useScopedQuery(["expense-summary"], () => realExpensesService.summary());

export const useUtilities = () =>
  useScopedQuery(["utilities"], () => realExpensesService.utilities());

export const useOwnerExpenseKpis = (filter: { propertyId?: string; from?: string; to?: string }) =>
  useScopedQuery(["owner-expense-kpis", filter], () => realExpensesService.ownerKpis(filter), true);

/** One page of leases with the backend's status tabs and late-rent filter. */
export const useLeasesPage = (filter: LeaseListFilter) =>
  useScopedQuery(["leases-page", filter], () => realLeasesService.list(filter), true);

/** A lease with its rent schedule. */
export const useLeaseDetailView = (leaseId: string | null) => {
  const scope = useDataScope();
  return useQuery({
    queryKey: key(scope, "lease-detail-view", leaseId),
    queryFn: () => realLeasesService.get(leaseId ?? ""),
    enabled: Boolean(scope.accountId && leaseId),
  });
};

export const useRentInvoicesPage = (filter: RentInvoiceListFilter) =>
  useScopedQuery(["rent-invoices-page", filter], () => realRentInvoicesService.list(filter), true);

export const useIssuerProfile = () =>
  useScopedQuery(["issuer-profile"], () => issuerProfileService.get());

/**
 * LTR units with no active lease, for the new-lease form. The backend has no dedicated
 * "available units" endpoint, so this loads every property's units (small lists in practice)
 * and filters to LTR, non-archived ones here; an overlapping lease is still rejected by the
 * backend at submit time (LEASE_OVERLAP).
 */
export const useAvailableLtrUnits = () =>
  useScopedQuery(["available-ltr-units"], async () => {
    const [properties, leases] = await Promise.all([
      propertiesService.listAll(),
      // Every lease that is not ended (active, ending soon or still to start) keeps its unit busy.
      loadAllPages((page) => realLeasesService.list({ page })),
    ]);
    const todayKey = toISODate(today());
    const busyUnitIds = new Set(
      leases
        .filter((lease) => lease.status !== "ended" && lease.endDate >= todayKey)
        .map((lease) => lease.unitId),
    );
    const details = await Promise.all(properties.map((property) => propertiesService.get(property.id)));
    return details.flatMap((property) =>
      property.units
        .filter((unit) => unit.type === "LTR" && !unit.archivedAt && !busyUnitIds.has(unit.id))
        .map((unit) => ({ unit, property })),
    );
  });

export const useTenantHome = () => useScopedQuery(["tenant-home"], () => tenantPortalService.home());
export const useTenantLease = () =>
  useScopedQuery(["tenant-lease"], () => tenantPortalService.lease());
export const useTenantContract = () =>
  useScopedQuery(["tenant-contract"], () => tenantPortalService.contract());
export const useTenantRentInvoices = (page = 1, pageSize: 10 | 25 | 50 = 25) =>
  useScopedQuery(
    ["tenant-rent-invoices", page, pageSize],
    () => tenantPortalService.rentInvoices(page, pageSize),
    true,
  );

export const useBillingSummary = () =>
  useScopedQuery(["billing-summary"], () => subscriptionService.summary());

export const useSubscriptionInvoices = (filter: InvoiceListFilter) =>
  useScopedQuery(["subscription-invoices", filter], () => subscriptionService.listInvoices(filter), true);

export const useSubscriptionInvoice = (invoiceId: string | null) => {
  const scope = useDataScope();
  return useQuery({
    queryKey: key(scope, "subscription-invoice", invoiceId),
    queryFn: () => subscriptionService.getInvoice(invoiceId ?? ""),
    enabled: Boolean(scope.accountId && invoiceId),
  });
};

/**
 * A unit's channel connections. Polls every 5s while any connection is "pending" (the manager
 * just started a Channex authorization and hasn't finished it yet), same idea as
 * `useReportStatus`'s poll-until-ready below.
 */
export const useUnitConnections = (unitId: string | null) => {
  const scope = useDataScope();
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: key(scope, "unit-connections", unitId),
    queryFn: async () => {
      const connections = await channexService.listConnections(unitId ?? "");
      const pending = connections.filter((connection) => connection.status === "pending");
      if (pending.length === 0) return connections;
      // Listing connections only reads what we already have in our own DB -- nothing else
      // polls Channex to find out a Pending connection actually went live, so without this a
      // row would sit on "Pending" forever even after the manager finished authorizing on
      // Channex's side. sync-status is what actually asks Channex and updates our record.
      const refreshed = await Promise.all(
        pending.map((connection) => channexService.syncStatus(connection.id)),
      );
      // This can flip a connection to "connected" or "error" behind the account-status and
      // today-board aggregates' backs -- unlike every other write here, it isn't routed
      // through usePanelMutation, so nothing else tells the header/sidebar counts to catch up.
      if (refreshed.some((connection) => connection.status !== "pending")) {
        void queryClient.invalidateQueries({ queryKey: key(scope, "channex-account-status") });
        void queryClient.invalidateQueries({ queryKey: key(scope, "today") });
      }
      const byId = new Map(refreshed.map((connection) => [connection.id, connection]));
      return connections.map((connection) => byId.get(connection.id) ?? connection);
    },
    enabled: Boolean(scope.accountId && unitId),
    refetchInterval: (query) =>
      query.state.data?.some((connection) => connection.status === "pending") ? 5000 : false,
  });
};

export const useChannexAccountStatus = () =>
  useScopedQuery(["channex-account-status"], () => channexService.accountStatus());

export const useOwnerKpis = (filter: FinancialQuery) =>
  useScopedQuery(["owner-kpis", filter], () => ownerFinancialsService.kpis(filter), true);

export const usePortfolioBreakdown = (
  filter: Omit<FinancialQuery, "propertyId"> & { page?: number; pageSize?: 10 | 25 | 50 },
) =>
  useScopedQuery(
    ["portfolio-breakdown", filter],
    () => ownerFinancialsService.portfolioBreakdown(filter),
    true,
  );

export const useDemandHeatmap = (view: PeriodView, propertyId?: string) =>
  useScopedQuery(
    ["demand-heatmap", view, propertyId ?? "all"],
    () => ownerFinancialsService.demandHeatmap(view, propertyId),
    true,
  );

export const usePropertyFinancials = (
  propertyId: string | null,
  filter: Omit<FinancialQuery, "propertyId"> = {},
) => {
  const scope = useDataScope();
  return useQuery({
    queryKey: key(scope, "property-financials", propertyId, filter),
    queryFn: () => ownerFinancialsService.propertyDetail(propertyId ?? "", filter),
    enabled: Boolean(scope.accountId && propertyId),
  });
};

/** Every row of the portfolio breakdown (the backend pages it 10 at a time). */
export const usePortfolioBreakdownAll = (filter: Omit<FinancialQuery, "propertyId"> = {}) =>
  useScopedQuery(
    ["portfolio-breakdown-all", filter],
    () => loadAllPages((page) => ownerFinancialsService.portfolioBreakdown({ ...filter, page })),
    true,
  );

/**
 * Portfolio (or one property's) P&L for each of the last `count` months, ending with the
 * current one: one real /owner/kpis call per month. This is how the monthly trend charts and
 * the month-by-month ledger are built, since the backend has no portfolio-level trend endpoint.
 */
export const useOwnerMonthlyTrend = (count = 6, propertyId?: string) => {
  const months = monthKeysEnding(today(), count);
  return useScopedQuery(
    ["owner-monthly-trend", months, propertyId ?? "all"],
    async (): Promise<MonthlyPnl[]> => {
      const rows = await Promise.all(
        months.map((month) =>
          ownerFinancialsService.kpis({ ...monthBounds(month), ...(propertyId ? { propertyId } : {}) }),
        ),
      );
      return months.map((month, index) => toMonthlyPnl(month, rows[index] as OwnerKpis));
    },
    true,
  );
};

/** /owner/kpis for each given property over the same period, keyed by property id. */
export const useOwnerPropertyKpis = (propertyIds: string[], filter: Omit<FinancialQuery, "propertyId">) =>
  useScopedQuery(
    ["owner-property-kpis", [...propertyIds].sort(), filter],
    async () => {
      const rows = await Promise.all(
        propertyIds.map((propertyId) => ownerFinancialsService.kpis({ ...filter, propertyId })),
      );
      // A plain record, not a Map: the query cache is persisted to storage as JSON
      const byId: Record<string, OwnerKpis> = {};
      propertyIds.forEach((id, index) => {
        byId[id] = rows[index] as OwnerKpis;
      });
      return byId;
    },
    true,
  );

/**
 * This month's STR-only occupancy per property, from the backend's own demand heatmap
 * (GET /owner/demand-heatmap?view=month&propertyId=…): the mean of its daily STR occupancy.
 * Pass no ids for nothing; pass "all" in the list for the whole portfolio.
 */
export const useOwnerStrOccupancy = (propertyIds: string[]) =>
  useScopedQuery(
    ["owner-str-occupancy", [...propertyIds].sort()],
    async () => {
      const heatmaps = await Promise.all(
        propertyIds.map((id) => ownerFinancialsService.demandHeatmap("month", id === "all" ? undefined : id)),
      );
      // A plain record, not a Map: the query cache is persisted to storage as JSON
      const byId: Record<string, number> = {};
      propertyIds.forEach((id, index) => {
        const days = heatmaps[index]?.data ?? [];
        const mean = days.length === 0 ? 0 : days.reduce((sum, day) => sum + day.occupancyPct, 0) / days.length;
        byId[id] = Math.round(mean * 10) / 10;
      });
      return byId;
    },
    true,
  );

/**
 * Units with their bookings and leases over [from, to) from /calendar (split into windows the
 * endpoint accepts). Source for STR occupancy, ADR, leased LTR units and the demand grid.
 */
export const useOwnerCalendar = (from: string, to: string, propertyId?: string) =>
  useScopedQuery(
    ["owner-calendar", from, to, propertyId ?? "all"],
    async () => {
      const windows = calendarWindows(parseDay(from), parseDay(to));
      const calendars = await Promise.all(
        windows.map((window) => calendarService.get({ ...window, ...(propertyId ? { propertyId } : {}) })),
      );
      return mergeCalendars(calendars);
    },
    true,
  );

/** Distinct workers paid (worker_pay expenses) in a date range: the "team on payroll". */
export const useOwnerPayrollTeam = (from: string, to: string) =>
  useScopedQuery(["owner-payroll-team", from, to], async () => {
    const expenses = await loadAllPages((page) =>
      realExpensesService.list({ category: "worker_pay", from, to, page }),
    );
    return new Set(expenses.map((expense) => expense.workerId ?? expense.workerName ?? expense.id)).size;
  });

export type OwnerAttentionKind = "critical_repair" | "arrival" | "unpaid_balance" | "late_rent";

export interface OwnerAttentionItem {
  id: string;
  kind: OwnerAttentionKind;
  urgency: "critical" | "warning" | "info";
  subject: string;
  propertyName: string;
  unitName: string;
  /** ISO date or date-time the item refers to. */
  at?: string;
  amountMinor?: number;
}

/**
 * The owner's "attention required" feed, assembled from real lists: today's arrivals, open
 * critical repairs, late rent invoices and unpaid bookings.
 */
export const useOwnerAttention = () =>
  useScopedQuery(["owner-attention"], async (): Promise<OwnerAttentionItem[]> => {
    const [todayBoard, tickets, lateRent, unpaid] = await Promise.all([
      todayService.get(),
      ticketsService.list({ urgency: "critical" }),
      realRentInvoicesService.list({ status: "late" }),
      strBookingsService.list({ status: "unpaid" }),
    ]);
    const items: OwnerAttentionItem[] = [
      ...tickets.items
        .filter((ticket) => ticket.status !== "resolved")
        .map((ticket) => ({
          id: `ticket-${ticket.id}`,
          kind: "critical_repair" as const,
          urgency: "critical" as const,
          subject: ticket.title,
          propertyName: ticket.propertyName,
          unitName: ticket.unitName,
          at: ticket.reportedAt,
        })),
      ...lateRent.items.map((invoice) => ({
        id: `rent-${invoice.id}`,
        kind: "late_rent" as const,
        urgency: "critical" as const,
        subject: invoice.tenantName,
        propertyName: invoice.propertyName,
        unitName: invoice.unitName,
        amountMinor: invoice.amountMinor,
      })),
      ...unpaid.items
        .filter((booking) => booking.status !== "cancelled")
        .map((booking) => ({
          id: `unpaid-${booking.id}`,
          kind: "unpaid_balance" as const,
          urgency: "warning" as const,
          subject: booking.guest.name,
          propertyName: booking.propertyName,
          unitName: booking.unitName,
          amountMinor: booking.amountMinor,
        })),
      ...todayBoard.arrivals.map((booking) => ({
        id: `arrival-${booking.id}`,
        kind: "arrival" as const,
        urgency: "info" as const,
        subject: booking.guest.name,
        propertyName: booking.propertyName,
        unitName: booking.unitName,
        at: booking.checkIn,
      })),
    ];
    return items;
  });

/** Recent bookings, open repair tickets and leases for one property (owner property detail). */
export const useOwnerPropertyOperations = (propertyId: string | null) => {
  const scope = useDataScope();
  return useQuery({
    queryKey: key(scope, "owner-property-operations", propertyId),
    enabled: Boolean(scope.accountId && propertyId),
    queryFn: async () => {
      const id = propertyId ?? "";
      const [bookings, tickets, leases] = await Promise.all([
        strBookingsService.list({ propertyId: id }),
        loadAllPages((page) => ticketsService.list({ propertyId: id, page })),
        loadAllPages((page) => realLeasesService.list({ page })),
      ]);
      return {
        recentBookings: [...bookings.items]
          .filter((booking) => booking.status !== "cancelled")
          .sort((a, b) => b.checkIn.localeCompare(a.checkIn)),
        openTickets: tickets.filter((ticket) => ticket.status !== "resolved"),
        leases,
      };
    },
  });
};

export const useReportsPage = (page = 1, pageSize: 10 | 25 | 50 = 25) =>
  useScopedQuery(
    ["reports", page, pageSize],
    () => ownerFinancialsService.listReports(page, pageSize),
    true,
  );

/**
 * Polls one report until it leaves "queued" (ready or failed), every 2.5 seconds. Idle until
 * a report id is given.
 */
export const useReportStatus = (reportId: string | null) => {
  const scope = useDataScope();
  return useQuery({
    queryKey: key(scope, "report-status", reportId),
    queryFn: () => ownerFinancialsService.reportStatus(reportId ?? ""),
    enabled: Boolean(scope.accountId && reportId),
    refetchInterval: (query) => (query.state.data?.status === "queued" ? 2500 : false),
  });
};

export interface RentDueRow {
  invoiceId: string;
  leaseId: string;
  period: string;
  amountMinor: number;
  currency: string;
  dueDate: string;
  state: "late" | "due_today" | "upcoming";
  tenantName: string;
  unitName: string;
  propertyName: string;
}

/**
 * Late rent, plus rent invoiced but not yet due, across every lease in scope: the Today screen's
 * "Rent due" widget and the sidebar's rent-due badge both read this. The backend has no single
 * cross-lease "rent due soon" aggregate endpoint, only a paged, status-filterable invoice list,
 * so this combines two real /rent-invoices queries instead of a projected schedule; a lease
 * whose rent for an upcoming period hasn't been invoiced yet (via "Generate invoices") won't
 * show up here until it has, same as the Rent Invoices page itself.
 */
export const useRentDue = () =>
  useScopedQuery(["rent-due"], async (): Promise<RentDueRow[]> => {
    const day = toISODate(today());
    const [late, dueSoon] = await Promise.all([
      loadAllPages((page) => realRentInvoicesService.list({ status: "late", page })),
      loadAllPages((page) => realRentInvoicesService.list({ status: "unpaid", page })),
    ]);
    const rows = [...late, ...dueSoon].map(
      (invoice): RentDueRow => ({
        invoiceId: invoice.id,
        leaseId: invoice.leaseId,
        period: invoice.period,
        amountMinor: invoice.amountMinor,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        state: invoice.dueDate < day ? "late" : invoice.dueDate === day ? "due_today" : "upcoming",
        tenantName: invoice.tenantName,
        unitName: invoice.unitName,
        propertyName: invoice.propertyName,
      }),
    );
    const rank = { late: 0, due_today: 1, upcoming: 2 } as const;
    return rows.sort(
      (a, b) =>
        rank[a.state] - rank[b.state] ||
        a.dueDate.localeCompare(b.dueDate) ||
        a.propertyName.localeCompare(b.propertyName),
    );
  });

export const useCommission = (page = 1, pageSize: 10 | 25 | 50 = 25) =>
  useScopedQuery(["commission", page, pageSize], () => commissionService.list(page, pageSize), true);

export const useOwners = (page = 1, pageSize: 10 | 25 | 50 = 25) =>
  useScopedQuery(["owners", page, pageSize], () => ownersService.list(page, pageSize), true);

/** Owner invitations not accepted yet, each with a copyable link (conciergerie only). */
export const usePendingInvites = () =>
  useScopedQuery(["pending-invites"], () => ownersService.pendingInvites());

/** Every owner, for pickers that need the whole list. */
export const useAllOwners = () => useScopedQuery(["owners-all"], () => ownersService.listAll());

export const useOwner = (ownerUserId: string) =>
  useScopedQuery(["owner", ownerUserId], () => ownersService.get(ownerUserId));

export const usePlatformSettings = () =>
  useScopedQuery(["platform-settings"], () => settingsService.get());

/** Runs a service write with the current scope, then refreshes every panel query. */
export function usePanelMutation<TInput, TResult>(
  write: (input: TInput, scope: DataScope) => Promise<TResult>,
) {
  const scope = useDataScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TInput) => {
      assertOnline();
      return write(input, scope);
    },
    // Fire-and-forget: returning the promise would keep the mutation pending until every
    // active query refetched, freezing the dialog "Saving..." state on slow refetches.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ROOT] });
    },
  });
}
