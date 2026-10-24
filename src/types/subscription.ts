/**
 * What an account pays Velvet Keys (velvet-keys-be/app/schemas/billing.py). Not to be confused
 * with rent invoices (src/types/ltr.ts). Amounts are integer minor units, always in MAD.
 */

export type SubscriptionInvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "free" | "void";
export type BillingProduct = "str" | "ltr" | "sync";
export type OfferSource = "launch" | "manual" | "free_sync";
export type FreeSyncStatus = "slots_available" | "slots_full" | "not_applicable";
export type InvoiceStatusStep = "issued" | "reminder_sent" | "readonly" | "paid" | "void";

export interface BillingLine {
  type: string;
  /** i18n key for the line label */
  labelKey: string;
  labelParams: Record<string, unknown>;
  units: number;
  unitPriceMinor: number;
  days: number | null;
  periodDays: number | null;
  totalMinor: number;
}

export interface EstimatedInvoice {
  lines: BillingLine[];
  subtotalMinor: number;
  vatMinor: number;
  totalMinor: number;
}

export interface ActiveOffer {
  product: BillingProduct;
  /** ISO date the free period ends (exclusive) */
  freeUntil: string;
  source: OfferSource;
}

export interface BillingSummary {
  strUnits: number;
  ltrUnits: number;
  syncedUnits: number;
  strPriceMinor: number;
  ltrPriceMinor: number;
  syncPriceMinor: number;
  estimatedNextInvoice: EstimatedInvoice;
  offers: ActiveOffer[];
  freeSyncStatus: FreeSyncStatus;
}

export interface InvoiceListItem {
  id: string;
  number: string;
  periodStart: string;
  periodEnd: string;
  totalMinor: number;
  status: SubscriptionInvoiceStatus;
  proForma: boolean;
  dueDate: string | null;
  issuedAt: string | null;
}

export interface AdminInvoiceListItem extends InvoiceListItem {
  accountId: string;
  accountName: string;
}

export interface InvoiceTimelineStep {
  step: InvoiceStatusStep;
  at: string;
  label: string;
}

/**
 * Velvet Keys' own company legal details as they were on file when the invoice was issued
 * (app/services/billing.py snapshots `settings.company_legal` verbatim, so keys stay as stored
 * rather than camelCased). Any field may be missing until an Admin completes the company profile.
 */
export interface InvoiceSellerSnapshot {
  name?: string;
  address?: string;
  ice?: string;
  if?: string;
  rc?: string;
  patente?: string;
  rib?: string;
}

/** The account's billing identity as it was when the invoice was issued. */
export interface InvoiceBilledToSnapshot {
  name?: string;
  address?: string;
  ice?: string;
}

export interface InvoiceDetail extends InvoiceListItem {
  lines: BillingLine[];
  subtotalMinor: number;
  vatMinor: number;
  sellerSnapshot: InvoiceSellerSnapshot;
  billedToSnapshot: InvoiceBilledToSnapshot;
  statusTimeline: InvoiceTimelineStep[];
}

export interface AdminInvoiceDetail extends InvoiceDetail {
  accountId: string;
  accountName: string;
}

export interface GeneratedInvoiceSummary {
  id: string;
  accountId: string;
  number: string;
  totalMinor: number;
  status: SubscriptionInvoiceStatus;
}

export interface GenerateInvoicesResult {
  created: GeneratedInvoiceSummary[];
  skipped: { accountId: string; reason: string }[];
}

export interface InvoiceListFilter {
  page?: number;
  pageSize?: 10 | 25 | 50;
  status?: SubscriptionInvoiceStatus;
}

export interface InvoiceAmount {
  amountMinor: number;
  count: number;
}

export interface InvoiceStatusCounts {
  total: number;
  sent: number;
  overdue: number;
  paid: number;
  free: number;
  draft: number;
  void: number;
  proForma: number;
}

/** Platform-wide aggregates across every invoice, independent of the current page/filter. */
export interface AdminInvoiceSummary {
  outstanding: InvoiceAmount;
  overdue: InvoiceAmount;
  dueThisWeek: InvoiceAmount;
  dueThisWeekUntil: string;
  paidThisMonth: InvoiceAmount;
  paidThisMonthPeriod: string;
  statusCounts: InvoiceStatusCounts;
}
