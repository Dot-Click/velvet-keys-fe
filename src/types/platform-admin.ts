import type { AccountStatus, AppLanguage } from "./auth";
import type {
  AdminInvoiceListItem,
  AdminInvoiceSummary,
  BillingProduct,
  SubscriptionInvoiceStatus,
} from "./subscription";

/**
 * Velvet Keys staff console shapes exactly as the backend returns them
 * (velvet-keys-be/app/schemas/admin.py). Amounts are integer minor units, always in MAD.
 */

export type AccountType = "owner" | "conciergerie";
export type PropertyModerationStatus = "active" | "delisted";

export interface AdminAccount {
  id: string;
  name: string;
  type: AccountType;
  status: AccountStatus;
  bannedReason: string | null;
}

export interface AdminAction {
  id: string;
  kind: string;
  accountId: string | null;
  propertyId?: string | null;
  reason: string | null;
  adminName: string;
  at: string;
  /** Free months granted per product, for manual offers */
  months?: Record<string, number> | null;
}

export interface Holder {
  name: string;
  email: string;
  phone?: string | null;
}

export interface ClientUnitCounts {
  str: number;
  ltr: number;
  synced: number;
}

export type ClientOfferType = "none" | "str" | "ltr" | "str_ltr" | "str_sync_ltr";

export interface ClientSummary {
  id: string;
  type: AccountType;
  holderUserId: string;
  name: string;
  status: AccountStatus;
  signupAt: string;
  language: AppLanguage;
  holder: Holder;
  units: ClientUnitCounts;
  propertyCount: number;
  /** ISO date per product (str/ltr/sync) that still has a free period */
  freeUntil: Partial<Record<BillingProduct, string>>;
  overdueCount: number;
  /** Every product this account has ever been granted an offer for, combined into one bundle label */
  offer: ClientOfferType;
  /** ISO datetime of the most recent paid invoice, or null if the client never paid */
  lastPaymentAt: string | null;
}

export interface ClientTimelineEvent {
  kind: string;
  at: string;
  action?: AdminAction | null;
}

export interface InvoiceLineEstimate {
  type: string;
  units: number;
  unitPriceMinor: number;
  totalMinor: number;
  label: string;
}

export interface InvoiceEstimate {
  period: string;
  lines: InvoiceLineEstimate[];
  subtotalMinor: number;
  vatMinor: number;
  totalMinor: number;
}

export interface ClientInvoice {
  id: string;
  number: string;
  accountId: string;
  period: string;
  subtotalMinor: number;
  vatMinor: number;
  totalMinor: number;
  status: SubscriptionInvoiceStatus;
  proForma: boolean;
  issuedAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
}

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  language: AppLanguage;
  access: string;
}

export interface AdminPropertyRow {
  id: string;
  name: string;
  city: string;
  accountId: string;
  clientName: string;
  ownerName: string;
  units: { str: number; ltr: number; total: number };
  status: PropertyModerationStatus;
  lastModeration?: AdminAction | null;
}

export interface ClientDetail extends ClientSummary {
  estimate: InvoiceEstimate;
  invoices: ClientInvoice[];
  properties: AdminPropertyRow[];
  users: ClientUser[];
  timeline: ClientTimelineEvent[];
}

export interface ClientListFilter {
  type?: AccountType;
  status?: AccountStatus;
  offer?: string;
  q?: string;
}

export interface AdminPrices {
  strPriceMinor: number;
  ltrPriceMinor: number;
  syncPriceMinor: number;
}

export interface PriceChange {
  id: string;
  product: BillingProduct;
  fromMinor: number | null;
  toMinor: number;
  effectiveFrom: string;
  changedAt: string;
  changedBy: string;
}

export interface FreeSync {
  total: number;
  used: number;
}

export interface AdminPricing {
  prices: AdminPrices;
  vatRatePct: number;
  currentPeriod: string;
  nextPeriod: string;
  history: PriceChange[];
  launchDeadline: string;
  freeSync: FreeSync;
}

export interface RevenueMonth {
  month: string;
  strMinor: number;
  ltrMinor: number;
  syncMinor: number;
  vatMinor: number;
  billedMinor: number;
  collectedMinor: number;
  invoices: number;
}

export interface AdminRevenue {
  months: RevenueMonth[];
  totals: RevenueMonth;
}

/** Company details printed on invoices. The backend names the VAT identifier field "if". */
export interface CompanyLegal {
  name: string;
  address: string;
  ice: string;
  if: string;
  rc: string;
  patente: string;
  rib: string;
}

export interface AdminSettings {
  companyLegal: CompanyLegal;
  proFormaInvoices: number;
}

export interface SaveCompanyLegalResult {
  companyLegal: CompanyLegal;
  complete: boolean;
  /** Pro-forma invoices re-issued now that the legal details are complete */
  reissued: number;
}

export interface AdminInvoiceFilter {
  page?: number;
  pageSize?: 10 | 25 | 50;
  status?: SubscriptionInvoiceStatus;
  accountId?: string;
  period?: string;
  proForma?: boolean;
}

export type { AdminInvoiceListItem, AdminInvoiceSummary };
