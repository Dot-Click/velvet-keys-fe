import type { ISODate, ISODateTime, MonthKey } from "./common";
import type { AdminInvoiceListItem, BillingProduct } from "./subscription";

/**
 * The Admin Overview ("command center"), derived on the client from real backend endpoints
 * (see services/admin-overview-service.ts). Every amount is in integer minor units (MAD).
 */

/** One month of recurring revenue excluding VAT, by service month. */
export interface MrrPoint {
  month: MonthKey;
  strMinor: number;
  ltrMinor: number;
  syncMinor: number;
  totalMinor: number;
}

/** A KPI with its trend; the last spark point is today's value. */
export interface TrendFigure {
  value: number;
  /** Change since last month; null when last month has no comparable figure */
  delta: number | null;
  spark: number[];
}

export interface CycleStep {
  count: number;
  amountMinor: number;
}

export interface BillingCycle {
  /** Service month the invoices cover */
  period: MonthKey;
  /** Day the invoices were issued */
  issuedOn: ISODate;
  issued: CycleStep;
  paid: CycleStep;
  dueThisWeek: CycleStep;
  overdue: CycleStep;
}

export type UpcomingKind = "free_end" | "invoice_due" | "read_only";

export interface UpcomingEvent {
  id: string;
  kind: UpcomingKind;
  date: ISODate;
  accountId: string;
  clientName: string;
  invoiceId?: string;
  invoiceNumber?: string;
  product?: BillingProduct;
  amountMinor?: number;
}

export type AttentionKind = "overdue" | "read_only" | "ending";

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  accountId: string;
  clientName: string;
  /** The invoice to remind about or mark paid (overdue invoices and read-only accounts) */
  invoice?: AdminInvoiceListItem;
  daysOverdue?: number;
  amountMinor?: number;
  product?: BillingProduct;
  lastDay?: ISODate;
  daysLeft?: number;
}

export type ActivityKind =
  | "signup"
  | "payment"
  | "offer"
  | "ban"
  | "unban"
  | "delist"
  | "relist"
  | "price"
  | "reminder";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  at: ISODateTime;
  /** Who did it: an Admin, or the client for signups; empty when the backend does not say */
  actor: string;
  accountId?: string;
  clientName?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  product?: BillingProduct;
  /** Price changes: new price, minor units */
  priceMinor?: number;
}

export interface CommandCenter {
  asOf: ISODate;
  mrr: TrendFigure & { history: MrrPoint[] };
  clients: TrendFigure & { newThisMonth: number };
  units: { str: number; ltr: number; synced: number; spark: number[]; delta: number | null };
  outstanding: TrendFigure & { overdueCount: number; overdueAmountMinor: number };
  freeSync: { used: number; total: number };
  cycle: BillingCycle | null;
  upcoming: UpcomingEvent[];
  attention: AttentionItem[];
  /** Entries derivable from the overview's own data (signups, price changes) */
  activity: ActivityEntry[];
}
