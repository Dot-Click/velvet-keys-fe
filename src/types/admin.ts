import type { Account, AccountType, LaunchOfferType, OfferProduct } from "./account";
import type { AccountStatus, AppLanguage } from "./auth";
import type {
  CompanyLegal,
  InvoiceDocumentContext,
  InvoiceTotals,
  PriceChange,
  SubscriptionInvoice,
} from "./billing";
import type { ISODate, ISODateTime, MAD, MonthKey } from "./common";
import type { PropertyStatus } from "./property";

/** Units a client runs today. Synced units are STR units connected to a channel. */
export interface UnitCounts {
  str: number;
  ltr: number;
  synced: number;
}

export type AdminActionKind = "ban" | "unban" | "delist" | "relist" | "manual_offer" | "reminder";

/** A moderation, offer or reminder decision an Admin made, kept with its reason for the audit trail. */
export interface AdminAction {
  id: string;
  kind: AdminActionKind;
  accountId: string;
  /** Set for delist and relist */
  propertyId?: string | undefined;
  /** Set for invoice reminders */
  invoiceId?: string | undefined;
  invoiceNumber?: string | undefined;
  reason: string;
  /** Name of the Admin who acted */
  adminName: string;
  at: ISODateTime;
  /** Free months granted per product, for manual offers */
  months?: Partial<Record<OfferProduct, number>> | undefined;
}

/** A client account as listed on the Clients screen. */
export interface ClientSummary {
  account: Account;
  holder: { name: string; email: string; phone?: string };
  units: UnitCounts;
  propertyCount: number;
  /** End (exclusive) of each product's free period, launch offer and Admin grants included */
  freeUntil: Partial<Record<OfferProduct, ISODate>>;
  overdueCount: number;
}

export type ClientUserRole = "holder" | "team" | "owner" | "tenant";

/** Whether a person can sign in yet. */
export type ClientUserAccess = "active" | "invited" | "not_invited";

/** Someone who belongs to a client: their team, their Owners and their tenants. */
export interface ClientUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: ClientUserRole;
  language: AppLanguage;
  access: ClientUserAccess;
}

/** A property as the Admin sees it, platform-wide. */
export interface AdminPropertyRow {
  id: string;
  name: string;
  city: string;
  image: string;
  accountId: string;
  clientName: string;
  ownerName: string;
  units: { str: number; ltr: number; total: number };
  status: PropertyStatus;
  /** Latest delist or relist, with its reason */
  lastModeration?: AdminAction;
}

/** One dated step in a client's offer and moderation history. */
export type ClientTimelineEvent =
  | { kind: "signup"; at: ISODateTime; offer: LaunchOfferType }
  | { kind: "free_end"; at: ISODate; product: OfferProduct; ended: boolean }
  | { kind: "action"; at: ISODateTime; action: AdminAction };

export interface ClientDetail extends ClientSummary {
  /** What the month in progress will be billed */
  estimate: InvoiceTotals;
  invoices: SubscriptionInvoice[];
  properties: AdminPropertyRow[];
  users: ClientUser[];
  /** Oldest first */
  timeline: ClientTimelineEvent[];
}

export type AdminAlert =
  | {
      kind: "free_period_ending";
      accountId: string;
      clientName: string;
      product: OfferProduct;
      /** Last free day */
      lastDay: ISODate;
      daysLeft: number;
    }
  | {
      kind: "overdue_invoice";
      accountId: string;
      clientName: string;
      invoice: SubscriptionInvoice;
      daysOverdue: number;
    }
  | { kind: "read_only"; accountId: string; clientName: string; overdueAmount: MAD };

export interface AdminOverview {
  clients: Record<AccountStatus, number> & { total: number };
  units: UnitCounts;
  /** Monthly recurring revenue excl. VAT: what the month in progress will bill, free months deducted */
  mrr: MAD;
  /** Subscription invoices issued this month, incl. VAT */
  month: { period: MonthKey; billed: MAD; collected: MAD; issued: number; paid: number };
  overdue: { count: number; amount: MAD };
  freeSyncSlots: { used: number; total: number };
  alerts: AdminAlert[];
}

export interface GrantOfferInput {
  months: Partial<Record<OfferProduct, number>>;
  reason: string;
}

/** The client an invoice is billed to, as the Admin lists it. */
export interface InvoiceClient {
  id: string;
  name: string;
  type: AccountType;
  status: AccountStatus;
}

/** A subscription invoice with its client, for the platform-wide Invoices table. */
export interface AdminInvoiceRow {
  invoice: SubscriptionInvoice;
  client: InvoiceClient;
  /** Days past the due date; 0 unless the invoice is overdue */
  daysOverdue: number;
  /** Overdue invoices the client has in total, this one included */
  clientOverdueCount: number;
}

export type InvoiceStepKey = "issued" | "reminder" | "readonly" | "paid";

/** done: it happened; pending: still to come; skipped: never needed because the invoice was paid */
export type InvoiceStepState = "done" | "pending" | "skipped";

/** One step in an invoice's life: issued, day-5 reminder, day-8 read-only, paid. */
export interface InvoiceStep {
  key: InvoiceStepKey;
  state: InvoiceStepState;
  /** Day the step happened or is due */
  date: ISODate;
}

export interface AdminInvoiceDetail extends AdminInvoiceRow {
  document: InvoiceDocumentContext;
  steps: InvoiceStep[];
  reminders?: AdminAction[];
}

export interface MarkPaidInput {
  /** Day the transfer arrived */
  paidOn: ISODate;
  reference: string;
  note: string;
}

export interface MarkPaidResult {
  invoice: SubscriptionInvoice;
  accountStatus: AccountStatus;
  /** True when this payment took the client's team from read-only back to active */
  restored: boolean;
  /** Overdue invoices the client still has after this payment */
  stillOverdue: number;
}

/** What was billed and collected in one month, by the month invoices were issued. */
export interface RevenueMonth {
  month: MonthKey;
  /** Subscription revenue by product, excluding VAT */
  str: MAD;
  ltr: MAD;
  sync: MAD;
  vat: MAD;
  /** Invoice totals incl. VAT */
  billed: MAD;
  /** The part of `billed` on paid invoices */
  collected: MAD;
  invoices: number;
}

export interface AdminRevenue {
  /** Oldest first, one entry per month even when nothing was issued */
  months: RevenueMonth[];
  totals: Omit<RevenueMonth, "month">;
}

export interface PriceCard {
  product: OfferProduct;
  /** Price billed for the month in progress */
  current: MAD;
  /** Price already scheduled for a later period, when it differs from the current one */
  upcoming?: { price: MAD; effectiveFrom: MonthKey };
}

/** A unit whose account is using one of the free channel sync slots. */
export interface FreeSyncUnit {
  unitId: string;
  unitName: string;
  propertyName: string;
  accountId: string;
  clientName: string;
  /** End (exclusive) of the account's free sync period */
  freeUntil: ISODate;
  /** True while the free period still runs */
  active: boolean;
}

export interface AdminPricing {
  prices: PriceCard[];
  vatRate: number;
  /** Billing period in progress, whose prices are the ones in force */
  currentPeriod: MonthKey;
  /** First billing period a price saved now applies to */
  nextPeriod: MonthKey;
  /** Newest first */
  history: PriceChange[];
  launchDeadline: ISODateTime;
  freeSync: { total: number; used: number; units: FreeSyncUnit[] };
}

export interface SavePricesInput {
  prices: Partial<Record<OfferProduct, MAD>>;
}

export interface AdminSettings {
  companyLegal: CompanyLegal;
  /** Invoices still printed as Pro-forma */
  proFormaInvoices: number;
}

export interface SaveCompanyLegalResult {
  companyLegal: CompanyLegal;
  /** True when every legal field is filled in, so invoices are final */
  complete: boolean;
  /** Pro-forma invoices re-issued as final by this save */
  reissued: number;
}
