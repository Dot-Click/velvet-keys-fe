import { addDays, differenceInCalendarDays } from "date-fns";
import { today } from "@/lib/clock";
import { lastMonths, parseDay, toISODate, toMonthKey } from "@/lib/dates";
import type {
  ActivityEntry,
  AttentionItem,
  BillingCycle,
  CommandCenter,
  CycleStep,
  MrrPoint,
  UpcomingEvent,
} from "@/types/admin-overview";
import type {
  AdminPricing,
  AdminPropertyRow,
  AdminRevenue,
  ClientSummary,
} from "@/types/platform-admin";
import type { AdminInvoiceListItem, BillingProduct } from "@/types/subscription";
import {
  adminBillingService,
  adminClientsService,
  adminPricingService,
  adminPropertiesService,
  adminRevenueService,
} from "./platform-admin-service";

/**
 * The Admin Overview has no dedicated backend endpoint. Everything below is derived from the
 * real admin routes (velvet-keys-be/app/api/v1/admin.py):
 *   GET /admin/revenue            -> MRR excl. VAT + 12-month history, units trend
 *   GET /admin/billing/invoices   -> every subscription invoice (all pages): unpaid, overdue,
 *                                    this billing cycle, upcoming due dates, read-only invoices
 *   GET /admin/clients            -> active clients, signups, units, free periods, read-only
 *   GET /admin/pricing            -> prices (units trend), free sync slots, price-change history
 *   GET /admin/clients/{id}       -> per-client audit timeline (bans, offers) and paidAt, used
 *                                    by the activity feed for the accounts that can have them
 *   GET /admin/properties         -> last delist / relist per property
 */

const PRODUCTS: BillingProduct[] = ["str", "ltr", "sync"];
const HORIZON_DAYS = 30;
const ENDING_SOON_DAYS = 7;
const ACTIVITY_LIMIT = 14;
/** The backend's page size is capped at 10 for this route (see fetchAllInvoices). */
const INVOICE_PAGE = 10;
/** Client detail is slow on the backend; cap how many the activity feed opens, and how many at once. */
const DETAIL_LIMIT = 12;
const DETAIL_CONCURRENCY = 3;

const UNPAID = new Set(["sent", "overdue"]);
const ISSUED = (invoice: AdminInvoiceListItem) =>
  invoice.status !== "draft" && invoice.status !== "void";

/**
 * Every invoice, page by page. `pageSize` is deliberately NOT sent: the backend's
 * `PageParams.page_size` is `Literal[10, 25, 50]`, which rejects the query-string value
 * ("10" is a string) with a 422, so only the default page size of 10 works.
 */
async function fetchAllInvoices(): Promise<AdminInvoiceListItem[]> {
  const first = await adminBillingService.listInvoices({ page: 1 });
  const pages = Math.ceil(first.total / INVOICE_PAGE);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
      adminBillingService.listInvoices({ page: index + 2 }),
    ),
  );
  const seen = new Set<string>();
  return [first, ...rest]
    .flatMap((page) => page.items)
    .filter((invoice) => (seen.has(invoice.id) ? false : (seen.add(invoice.id), true)));
}

const monthOf = (iso: string) => iso.slice(0, 7);

/** The backend flips SENT invoices to OVERDUE (and the account to read-only) the day after the
 * due date, in a daily job. Until that job has run, a SENT invoice past its due date is overdue too. */
export function isOverdue(invoice: AdminInvoiceListItem, todayISO: string): boolean {
  if (invoice.status === "overdue") return true;
  return invoice.status === "sent" && invoice.dueDate !== null && invoice.dueDate < todayISO;
}

const step = (invoices: AdminInvoiceListItem[]): CycleStep => ({
  count: invoices.length,
  amountMinor: invoices.reduce((sum, invoice) => sum + invoice.totalMinor, 0),
});

const deltaOf = (now: number, before: number | undefined | null) =>
  before === undefined || before === null ? null : now - before;

function buildMrr(revenue: AdminRevenue): MrrPoint[] {
  return revenue.months.slice(-12).map((month) => ({
    month: month.month,
    strMinor: month.strMinor,
    ltrMinor: month.ltrMinor,
    syncMinor: month.syncMinor,
    // Billed minus VAT = the invoices' subtotal, i.e. after free-month (offer) lines
    totalMinor: month.billedMinor - month.vatMinor,
  }));
}

function buildCycle(invoices: AdminInvoiceListItem[], todayISO: string): BillingCycle | null {
  const issued = invoices.filter((invoice) => ISSUED(invoice) && invoice.issuedAt);
  if (issued.length === 0) return null;
  const cycleMonth = issued.map((invoice) => monthOf(invoice.issuedAt!)).sort().at(-1)!;
  const inCycle = issued.filter((invoice) => invoice.issuedAt!.startsWith(cycleMonth));
  const weekEnd = toISODate(addDays(parseDay(todayISO), 7));
  return {
    period: monthOf(inCycle[0]!.periodStart),
    issuedOn: inCycle
      .map((invoice) => invoice.issuedAt!.slice(0, 10))
      .reduce((max, day) => (day > max ? day : max)),
    issued: step(inCycle),
    paid: step(inCycle.filter((invoice) => invoice.status === "paid")),
    dueThisWeek: step(
      inCycle.filter(
        (invoice) =>
          invoice.status === "sent" &&
          invoice.dueDate !== null &&
          invoice.dueDate >= todayISO &&
          invoice.dueDate <= weekEnd,
      ),
    ),
    overdue: step(inCycle.filter((invoice) => isOverdue(invoice, todayISO))),
  };
}

function buildUpcoming(
  clients: ClientSummary[],
  invoices: AdminInvoiceListItem[],
  todayISO: string,
): UpcomingEvent[] {
  const horizonISO = toISODate(addDays(parseDay(todayISO), HORIZON_DAYS));
  const upcoming: UpcomingEvent[] = [];
  for (const client of clients) {
    if (client.status === "banned") continue;
    for (const product of PRODUCTS) {
      const until = client.freeUntil[product];
      if (!until || until < todayISO || until > horizonISO) continue;
      upcoming.push({
        id: `free-${client.id}-${product}`,
        kind: "free_end",
        date: until,
        accountId: client.id,
        clientName: client.name,
        product,
      });
    }
  }
  for (const invoice of invoices) {
    if (invoice.status !== "sent" || !invoice.dueDate) continue;
    const common = {
      accountId: invoice.accountId,
      clientName: invoice.accountName,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amountMinor: invoice.totalMinor,
    };
    if (invoice.dueDate >= todayISO && invoice.dueDate <= horizonISO) {
      upcoming.push({ id: `due-${invoice.id}`, kind: "invoice_due", date: invoice.dueDate, ...common });
    }
    // run_daily_billing_check: read-only from the day after the due date
    const readOnlyDay = toISODate(addDays(parseDay(invoice.dueDate), 1));
    if (readOnlyDay >= todayISO && readOnlyDay <= horizonISO) {
      upcoming.push({ id: `ro-${invoice.id}`, kind: "read_only", date: readOnlyDay, ...common });
    }
  }
  return upcoming.sort((a, b) => a.date.localeCompare(b.date));
}

function buildAttention(
  clients: ClientSummary[],
  invoices: AdminInvoiceListItem[],
  upcoming: UpcomingEvent[],
  now: Date,
): AttentionItem[] {
  const todayISO = toISODate(now);
  const attention: AttentionItem[] = [];
  const overdue = invoices
    .filter((invoice) => isOverdue(invoice, todayISO))
    .map((invoice) => ({
      invoice,
      days: Math.max(0, differenceInCalendarDays(now, parseDay(invoice.dueDate ?? todayISO))),
    }))
    .sort((a, b) => b.days - a.days);
  for (const { invoice, days } of overdue) {
    attention.push({
      id: `overdue-${invoice.id}`,
      kind: "overdue",
      accountId: invoice.accountId,
      clientName: invoice.accountName,
      invoice,
      daysOverdue: days,
      amountMinor: invoice.totalMinor,
    });
  }
  for (const client of clients.filter((item) => item.status === "readonly")) {
    const unpaid = invoices
      .filter((item) => item.accountId === client.id && UNPAID.has(item.status))
      .sort((a, b) => (a.issuedAt ?? "").localeCompare(b.issuedAt ?? ""));
    attention.push({
      id: `readonly-${client.id}`,
      kind: "read_only",
      accountId: client.id,
      clientName: client.name,
      ...(unpaid[0] ? { invoice: unpaid[0] } : {}),
      amountMinor: unpaid.reduce((sum, item) => sum + item.totalMinor, 0),
    });
  }
  for (const event of upcoming) {
    if (event.kind !== "free_end") continue;
    const daysLeft = differenceInCalendarDays(parseDay(event.date), now);
    if (daysLeft >= ENDING_SOON_DAYS) continue;
    attention.push({
      id: `ending-${event.id}`,
      kind: "ending",
      accountId: event.accountId,
      clientName: event.clientName,
      ...(event.product ? { product: event.product } : {}),
      lastDay: event.date,
      daysLeft,
    });
  }
  return attention;
}

function signupsAndPrices(clients: ClientSummary[], pricing: AdminPricing): ActivityEntry[] {
  const entries: ActivityEntry[] = clients.map((client) => ({
    id: `signup-${client.id}`,
    kind: "signup",
    at: client.signupAt,
    actor: client.name,
    accountId: client.id,
    clientName: client.name,
  }));
  for (const change of pricing.history) {
    entries.push({
      id: `price-${change.id}`,
      kind: "price",
      at: change.changedAt,
      actor: change.changedBy,
      product: change.product,
      priceMinor: change.toMinor,
    });
  }
  return entries;
}

export function newestFirst(entries: ActivityEntry[], now: Date): ActivityEntry[] {
  const seen = new Set<string>();
  return entries
    .filter((entry) => (seen.has(entry.id) ? false : (seen.add(entry.id), true)))
    .filter((entry) => new Date(entry.at).getTime() <= now.getTime() + 86_400_000)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, ACTIVITY_LIMIT);
}

async function mapLimited<T, R>(items: T[], limit: number, run: (item: T) => Promise<R>) {
  const results: R[] = [];
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++]!;
      try {
        results.push(await run(item));
      } catch {
        // One client failing to load must not hide the rest of the feed
      }
    }
  });
  await Promise.all(workers);
  return results;
}

export const adminOverviewService = {
  async getCommandCenter(): Promise<CommandCenter> {
    const now = today();
    const todayISO = toISODate(now);
    const period = toMonthKey(now);
    const months6 = lastMonths(6, now);

    const [revenue, invoices, clients, pricing] = await Promise.all([
      adminRevenueService.get(),
      fetchAllInvoices(),
      adminClientsService.list(),
      adminPricingService.get(),
    ]);
    const revenueByMonth = new Map(revenue.months.map((month) => [month.month, month]));

    // MRR excl. VAT, by service month
    const history = buildMrr(revenue);
    const mrrNow = history.at(-1)?.totalMinor ?? 0;

    // Active clients today, by signup month; "new this month" counts every signup this month
    const active = clients.filter((client) => client.status === "active");
    const activeBy = (month: string) =>
      active.filter((client) => monthOf(client.signupAt) <= month).length;
    const clientSpark = months6.map(activeBy);
    const newThisMonth = clients.filter((client) => client.signupAt.startsWith(period)).length;

    // Units today from the client list; earlier months from the units billed that month
    // (revenue by product divided by the unit price, prices have one value per product)
    const onPlatform = clients.filter((client) => client.status !== "banned");
    const units = onPlatform.reduce(
      (sum, client) => ({
        str: sum.str + client.units.str,
        ltr: sum.ltr + client.units.ltr,
        synced: sum.synced + client.units.synced,
      }),
      { str: 0, ltr: 0, synced: 0 },
    );
    const billedUnits = (month: string): number | null => {
      const row = revenueByMonth.get(month);
      if (!row || row.invoices === 0) return null;
      const { strPriceMinor, ltrPriceMinor } = pricing.prices;
      return Math.round(
        (strPriceMinor ? row.strMinor / strPriceMinor : 0) +
          (ltrPriceMinor ? row.ltrMinor / ltrPriceMinor : 0),
      );
    };
    const unitsNow = units.str + units.ltr;
    const unitSpark = months6.map((month) =>
      month === period ? unitsNow : (billedUnits(month) ?? 0),
    );

    // Unpaid: today's figure, and the unpaid invoices of each service month up to then
    const unpaid = invoices.filter((invoice) => UNPAID.has(invoice.status));
    const outstandingNow = unpaid.reduce((sum, invoice) => sum + invoice.totalMinor, 0);
    const outstandingAt = (month: string) =>
      unpaid
        .filter((invoice) => monthOf(invoice.periodStart) <= month)
        .reduce((sum, invoice) => sum + invoice.totalMinor, 0);
    const outstandingSpark = months6.map((month) =>
      month === period ? outstandingNow : outstandingAt(month),
    );
    const overdueList = invoices.filter((invoice) => isOverdue(invoice, todayISO));

    const upcoming = buildUpcoming(clients, invoices, todayISO);

    return {
      asOf: todayISO,
      mrr: {
        value: mrrNow,
        delta: deltaOf(mrrNow, history.at(-2)?.totalMinor),
        spark: history.slice(-6).map((point) => point.totalMinor),
        history,
      },
      clients: {
        value: active.length,
        delta: deltaOf(active.length, clientSpark.at(-2)),
        spark: clientSpark,
        newThisMonth,
      },
      units: {
        ...units,
        spark: unitSpark,
        delta: deltaOf(unitsNow, billedUnits(months6.at(-2)!)),
      },
      outstanding: {
        value: outstandingNow,
        delta: deltaOf(outstandingNow, outstandingSpark.at(-2)),
        spark: outstandingSpark,
        overdueCount: overdueList.length,
        overdueAmountMinor: overdueList.reduce((sum, invoice) => sum + invoice.totalMinor, 0),
      },
      freeSync: { used: pricing.freeSync.used, total: pricing.freeSync.total },
      cycle: buildCycle(invoices, todayISO),
      upcoming,
      attention: buildAttention(clients, invoices, upcoming, now),
      activity: newestFirst(signupsAndPrices(clients, pricing), now),
    };
  },

  /**
   * The rest of the activity feed. The backend has no platform-wide audit-log endpoint; the audit
   * events it exposes are per client (`ClientDetail.timeline`: ban / unban / manual_offer) and per
   * property (`AdminPropertyRow.lastModeration`). Client detail is slow, so it is opened only for
   * the accounts that can carry such events: banned, read-only, with a free offer, or with a paid
   * invoice (whose `paidAt` the invoice list does not carry).
   */
  async getActivity(): Promise<ActivityEntry[]> {
    const now = today();
    const [clients, pricing, properties, paid] = await Promise.all([
      adminClientsService.list(),
      adminPricingService.get(),
      adminPropertiesService.list().catch(() => [] as AdminPropertyRow[]),
      adminBillingService
        .listInvoices({ status: "paid" })
        .then((page) => page.items)
        .catch(() => [] as AdminInvoiceListItem[]),
    ]);
    const entries = signupsAndPrices(clients, pricing);

    for (const property of properties) {
      const action = property.lastModeration;
      if (!action || (action.kind !== "delist" && action.kind !== "relist")) continue;
      entries.push({
        id: `action-${action.id}`,
        kind: action.kind,
        at: action.at,
        actor: action.adminName,
        accountId: property.accountId,
        clientName: property.clientName,
      });
    }

    const paidAccounts = new Set(paid.map((invoice) => invoice.accountId));
    const candidates = clients
      .filter(
        (client) =>
          client.status !== "active" ||
          Object.keys(client.freeUntil).length > 0 ||
          paidAccounts.has(client.id),
      )
      .sort((a, b) => b.signupAt.localeCompare(a.signupAt))
      .slice(0, DETAIL_LIMIT);

    const details = await mapLimited(candidates, DETAIL_CONCURRENCY, (client) =>
      adminClientsService.get(client.id),
    );
    for (const detail of details) {
      for (const event of detail.timeline) {
        const action = event.action;
        if (!action) continue;
        const kind =
          action.kind === "manual_offer"
            ? "offer"
            : action.kind === "ban" || action.kind === "unban"
              ? action.kind
              : null;
        if (!kind) continue;
        entries.push({
          id: `action-${action.id}`,
          kind,
          at: action.at,
          actor: action.adminName,
          accountId: detail.id,
          clientName: detail.name,
        });
      }
      for (const invoice of detail.invoices) {
        if (invoice.status !== "paid" || !invoice.paidAt) continue;
        entries.push({
          id: `payment-${invoice.id}`,
          kind: "payment",
          at: invoice.paidAt,
          actor: "",
          accountId: detail.id,
          clientName: detail.name,
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
        });
      }
    }
    return newestFirst(entries, now);
  },
};
