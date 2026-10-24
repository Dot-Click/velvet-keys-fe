import type { Account, OfferProduct } from "./account";
import type { ISODate, ISODateTime, MAD, MonthKey } from "./common";

export type InvoiceLineType = "str" | "ltr" | "sync" | "offer";

export interface InvoiceLine {
  type: InvoiceLineType;
  units: number;
  unitPrice: MAD;
  /** Days billed per unit in this line (a full month bills every day of the period). */
  days: number;
  total: MAD;
  /** Printed label, e.g. "STR units × 200 MAD" or "Launch offer – free month 1 of 2". */
  label: string;
  /** Launch offer details for 0 MAD lines, so the label can be translated. */
  offer?: {
    covers: "str" | "ltr" | "sync";
    month: number;
    of: number;
  };
}

/**
 * "free" is a 0 MAD invoice (a launch-offer month): nothing to collect, so it is never payable,
 * never outstanding and never triggers a reminder or read-only mode.
 */
export type SubscriptionInvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "free";

/** The bank transfer an Admin recorded against an invoice. */
export interface InvoicePayment {
  /** Reference printed on the bank statement */
  reference: string;
  note?: string;
  /** Name of the Admin who recorded it */
  recordedBy: string;
  recordedAt: ISODateTime;
}

/** Invoice Velvet Keys issues to an account holder for their subscription. */
export interface SubscriptionInvoice {
  id: string;
  number: string;
  accountId: string;
  period: MonthKey;
  lines: InvoiceLine[];
  subtotal: MAD;
  vat: MAD;
  total: MAD;
  status: SubscriptionInvoiceStatus;
  /** True until Admin registers the company legal details (ICE, IF, RC, Patente, RIB). */
  proForma: boolean;
  issuedAt: ISODate;
  dueDate: ISODate;
  /** Day the transfer arrived (set with `payment` when an Admin marks the invoice paid) */
  paidAt?: ISODate;
  payment?: InvoicePayment;
}

/** What an invoice page needs to print the sender, the client and the VAT rate. */
export interface InvoiceDocumentContext {
  account: Pick<Account, "name" | "issuerProfile">;
  /** Name and email of the account holder, for the invoice header */
  holder: { name: string; email: string };
  companyLegal: CompanyLegal;
  vatRate: number;
}

/** One change to a unit price. Prices only apply to billing periods from `effectiveFrom`. */
export interface PriceChange {
  id: string;
  product: OfferProduct;
  /** Price before the change; null for the launch price */
  from: MAD | null;
  to: MAD;
  /** First billing period charged at the new price */
  effectiveFrom: MonthKey;
  changedAt: ISODateTime;
  /** Name of the Admin who made the change */
  changedBy: string;
}

export interface CompanyLegal {
  name: string;
  address: string;
  ice: string;
  if: string;
  rc: string;
  patente: string;
  rib: string;
}

export interface PlatformSettings {
  /** Monthly prices per unit, excluding VAT */
  prices: {
    str: MAD;
    ltr: MAD;
    sync: MAD;
  };
  vatRate: number;
  /** Signups before this moment (Casablanca time) get the launch offer. */
  launchDeadline: ISODateTime;
  freeSyncSlots: {
    total: number;
    used: number;
  };
  companyLegal: CompanyLegal;
}

/** The figures an estimate returns: lines and totals for one billing period. */
export interface InvoiceTotals {
  period: MonthKey;
  lines: InvoiceLine[];
  subtotal: MAD;
  vat: MAD;
  total: MAD;
}

/** Everything the Billing screen shows an account holder. */
export interface BillingOverview {
  account: Account;
  /** Name and email of the account holder, for the invoice header */
  holder: { name: string; email: string };
  prices: PlatformSettings["prices"];
  vatRate: number;
  launchDeadline: ISODateTime;
  companyLegal: CompanyLegal;
  /** Units running as STR / LTR today, and STR units syncing with Airbnb or Booking.com */
  unitCounts: { str: number; ltr: number; synced: number };
  /** The invoice issued on the 1st of next month for the month in progress */
  estimate: InvoiceTotals;
  /** Free channel sync: until a day (exclusive), ended on a day, or never (slots were full) */
  freeSync:
    { state: "active"; until: ISODate } | { state: "ended"; until: ISODate } | { state: "full" };
  /** Overdue first, then newest period first */
  invoices: SubscriptionInvoice[];
}
