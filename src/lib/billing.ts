import {
  addMonths,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInMonths,
  startOfMonth,
} from "date-fns";
import type { Account, LaunchOffer, LaunchOfferType, OfferProduct } from "@/types/account";
import type { CompanyLegal, InvoiceLine, PlatformSettings } from "@/types/billing";
import type { MonthKey } from "@/types/common";
import type { Unit } from "@/types/property";
import { today } from "@/lib/clock";
import {
  monthRange,
  overlapDays,
  parseDay,
  rangeDays,
  round2,
  toISODate,
  toMonthKey,
  type DayRange,
} from "@/lib/dates";
import { unitTypeSegments } from "@/lib/finance";

/** Free months per product in the launch offer and the free sync window. */
export const FREE_MONTHS = {
  str: 2,
  ltr: 2,
  ltrWithSyncBundle: 3,
  sync: 2,
} as const;

/**
 * Launch offer for an account that signed up before the deadline:
 * STR only → 2 STR months; LTR only → 2 LTR months; STR + LTR → 2 + 2;
 * STR + sync + LTR → 2 STR + 3 LTR. Free months run from the signup day.
 */
export function computeLaunchOffer(input: {
  signupDate: string;
  launchDeadline: string;
  hasStr: boolean;
  hasLtr: boolean;
  hasSync: boolean;
}): LaunchOffer {
  const signedUp = new Date(input.signupDate);
  if (signedUp > new Date(input.launchDeadline) || (!input.hasStr && !input.hasLtr)) {
    return { type: "none" };
  }

  const type: LaunchOfferType =
    input.hasStr && input.hasLtr
      ? input.hasSync
        ? "str_sync_ltr"
        : "str_ltr"
      : input.hasStr
        ? "str"
        : "ltr";

  const start = parseDay(input.signupDate);
  const ltrMonths = type === "str_sync_ltr" ? FREE_MONTHS.ltrWithSyncBundle : FREE_MONTHS.ltr;
  return {
    type,
    ...(input.hasStr ? { strFreeUntil: toISODate(addMonths(start, FREE_MONTHS.str)) } : {}),
    ...(input.hasLtr ? { ltrFreeUntil: toISODate(addMonths(start, ltrMonths)) } : {}),
    ...(input.hasStr && input.hasLtr ? { bundleCompletedAt: toISODate(start) } : {}),
  };
}

/** Free channel sync for the first platform-wide synced units: 2 months from signup. */
export function computeFreeSyncUntil(signupDate: string): string {
  return toISODate(addMonths(parseDay(signupDate), FREE_MONTHS.sync));
}

/** The latest of several ISO dates, ignoring missing ones. */
function latestDay(...days: (string | undefined)[]): string | undefined {
  return days.reduce<string | undefined>(
    (latest, day) => (day && (!latest || day > latest) ? day : latest),
    undefined,
  );
}

/**
 * End (exclusive) of each product's free period: the launch offer or the free sync window,
 * extended by any months an Admin granted. Missing when the product was never free.
 */
export function freePeriodEnds(
  account: Pick<Account, "launchOffer" | "freeSyncUntil">,
): Partial<Record<OfferProduct, string>> {
  const offer = account.launchOffer;
  const granted = (product: OfferProduct) =>
    (offer.manualOffers ?? []).map((grant) => grant.freeUntil[product]);
  const ends = {
    str: latestDay(offer.strFreeUntil, ...granted("str")),
    ltr: latestDay(offer.ltrFreeUntil, ...granted("ltr")),
    sync: latestDay(account.freeSyncUntil, ...granted("sync")),
  };
  return Object.fromEntries(Object.entries(ends).filter(([, day]) => day)) as Partial<
    Record<OfferProduct, string>
  >;
}

/**
 * End (exclusive) of an account's free channel sync while it still runs on `day`: its own window
 * (with any months an Admin granted), or, while platform slots remain, the window a first synced
 * unit would open. Null otherwise.
 */
export function openFreeSyncUntil(
  account: Pick<Account, "freeSyncUntil" | "signupDate" | "launchOffer">,
  slots: PlatformSettings["freeSyncSlots"],
  day: Date,
): string | null {
  const until =
    freePeriodEnds(account).sync ??
    (slots.used < slots.total ? computeFreeSyncUntil(account.signupDate) : undefined);
  return until && parseDay(until) > day ? until : null;
}

export interface FreeMonthProgress {
  /** Free month in progress (1-based), or the last one once the offer has ended */
  month: number;
  /** Free months in total */
  of: number;
  /** Share of the free period already used, 0–1 */
  progress: number;
  /** Last free day (inclusive) */
  lastDay: Date;
  ended: boolean;
}

/** Where a launch-offer free period stands on `day`: free month X of Y, from signup to `until`. */
export function freeMonthProgress(signupDate: string, until: string, day: Date): FreeMonthProgress {
  const start = parseDay(signupDate);
  const end = parseDay(until);
  const of = Math.max(1, differenceInCalendarMonths(end, start));
  const total = Math.max(1, differenceInCalendarDays(end, start));
  const used = Math.min(Math.max(differenceInCalendarDays(day, start), 0), total);
  return {
    month: Math.min(of, Math.max(1, differenceInMonths(day, start) + 1)),
    of,
    progress: used / total,
    lastDay: new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1),
    ended: day >= end,
  };
}

/** Invoices are due 7 days after issue; a reminder goes out on day 5 and the team goes read-only on day 8. */
export const INVOICE_DUE_DAYS = 7;
export const PAYMENT_REMINDER_DAY = 5;
export const READ_ONLY_DAY = 8;

/** Days since an invoice was issued (the issue day is day 0). */
export function daysSinceIssue(invoice: { issuedAt: string }, day: Date): number {
  return differenceInCalendarDays(day, parseDay(invoice.issuedAt));
}

/** Unpaid and between the day-5 reminder and the day before read-only. */
export function isPaymentDueSoon(
  invoice: { issuedAt: string; status: string },
  day: Date,
): boolean {
  const since = daysSinceIssue(invoice, day);
  return invoice.status === "sent" && since >= PAYMENT_REMINDER_DAY && since < READ_ONLY_DAY;
}

/** Invoices stay "Pro-forma" until every company legal field is filled in. */
export function isCompanyLegalComplete(legal: CompanyLegal): boolean {
  return Object.values(legal).every((value) => value.trim().length > 0);
}

export interface InvoiceEstimate {
  accountId: string;
  period: MonthKey;
  lines: InvoiceLine[];
  subtotal: number;
  vat: number;
  total: number;
}

export interface EstimateContext {
  /** Every unit of the account's properties, including removed ones */
  units: Unit[];
  settings: Pick<PlatformSettings, "prices" | "vatRate">;
  /** Month to bill; defaults to the current month */
  period?: MonthKey;
}

type Covers = "str" | "ltr" | "sync";

/** Splits a stretch into the days before `freeUntil` (free) and the rest (paid). */
function splitFree(segment: DayRange, freeUntil: Date | null) {
  if (!freeUntil) return { free: 0, paid: rangeDays(segment) };
  const free = overlapDays(segment, { from: segment.from, to: freeUntil });
  return { free, paid: rangeDays(segment) - free };
}

function latest(...dates: (string | undefined)[]): Date | null {
  const parsed = dates.filter((value): value is string => Boolean(value)).map(parseDay);
  if (parsed.length === 0) return null;
  return parsed.reduce((a, b) => (a > b ? a : b));
}

/** Days the unit was billed for channel sync: from connection until it was switched off. */
function syncWindow(unit: Unit): DayRange | null {
  const connection = unit.channelConnection;
  if (!connection) return null;
  const from = parseDay(connection.connectedSince);
  if (connection.disconnectedAt) return { from, to: parseDay(connection.disconnectedAt) };
  const connected =
    connection.airbnb.status === "connected" || connection.bookingCom.status === "connected";
  return connected ? { from, to: new Date(8640000000000000) } : null;
}

/** Groups per-unit day counts into lines: one line per distinct number of billed days. */
function groupByDays(dayCounts: number[]): { units: number; days: number }[] {
  const byDays = new Map<number, number>();
  for (const days of dayCounts) {
    if (days > 0) byDays.set(days, (byDays.get(days) ?? 0) + 1);
  }
  return [...byDays.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([days, units]) => ({ units, days }));
}

const PAID_LABELS: Record<Covers, string> = {
  str: "STR units",
  ltr: "LTR units",
  sync: "Channel sync",
};

/**
 * Lines for an account's invoice: STR units × price, LTR units × price, synced units × sync price,
 * each prorated by the days a unit was billable in the period. Days inside a launch offer or the
 * free sync window become 0 MAD "Launch offer – free month X of Y" lines.
 */
export function estimateNextInvoice(account: Account, context: EstimateContext): InvoiceEstimate {
  const period = context.period ?? toMonthKey(today());
  const range = monthRange(period);
  const periodDays = rangeDays(range);
  const { prices, vatRate } = context.settings;
  const ends = freePeriodEnds(account);
  const freeUntil: Record<Covers, Date | null> = {
    str: latest(ends.str),
    ltr: latest(ends.ltr),
    sync: latest(ends.sync),
  };

  const paid: Record<Covers, number[]> = { str: [], ltr: [], sync: [] };
  const free: Record<Covers, number[]> = { str: [], ltr: [], sync: [] };

  for (const unit of context.units) {
    const counts = {
      str: { free: 0, paid: 0 },
      ltr: { free: 0, paid: 0 },
      sync: { free: 0, paid: 0 },
    };

    for (const segment of unitTypeSegments(unit, "STR", range)) {
      const split = splitFree(segment, freeUntil.str);
      counts.str.free += split.free;
      counts.str.paid += split.paid;

      const window = syncWindow(unit);
      if (window) {
        const synced = {
          from: window.from > segment.from ? window.from : segment.from,
          to: window.to < segment.to ? window.to : segment.to,
        };
        if (rangeDays(synced) > 0) {
          const syncSplit = splitFree(synced, freeUntil.sync);
          counts.sync.free += syncSplit.free;
          counts.sync.paid += syncSplit.paid;
        }
      }
    }
    for (const segment of unitTypeSegments(unit, "LTR", range)) {
      const split = splitFree(segment, freeUntil.ltr);
      counts.ltr.free += split.free;
      counts.ltr.paid += split.paid;
    }

    for (const covers of ["str", "ltr", "sync"] as const) {
      paid[covers].push(counts[covers].paid);
      free[covers].push(counts[covers].free);
    }
  }

  const lines: InvoiceLine[] = [];
  for (const covers of ["str", "ltr", "sync"] as const) {
    const unitPrice = prices[covers];
    for (const { units, days } of groupByDays(paid[covers])) {
      const prorated = days < periodDays ? ` (prorated ${days}/${periodDays} days)` : "";
      lines.push({
        type: covers,
        units,
        unitPrice,
        days,
        total: round2((units * unitPrice * days) / periodDays),
        label: `${PAID_LABELS[covers]} × ${unitPrice} MAD${prorated}`,
      });
    }
  }

  const signupMonth = startOfMonth(parseDay(account.signupDate));
  for (const covers of ["str", "ltr", "sync"] as const) {
    const until = freeUntil[covers];
    if (!until) continue;
    const of = Math.max(1, differenceInCalendarMonths(until, parseDay(account.signupDate)));
    const month = Math.min(of, differenceInCalendarMonths(range.from, signupMonth) + 1);
    for (const { units, days } of groupByDays(free[covers])) {
      lines.push({
        type: "offer",
        units,
        unitPrice: 0,
        days,
        total: 0,
        label: `Launch offer – free month ${month} of ${of} (${PAID_LABELS[covers]})`,
        offer: { covers, month, of },
      });
    }
  }

  const subtotal = round2(lines.reduce((sum, line) => sum + line.total, 0));
  const vat = round2(subtotal * vatRate);
  return { accountId: account.id, period, lines, subtotal, vat, total: round2(subtotal + vat) };
}
