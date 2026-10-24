import type { IssuerProfile } from "./account";
import type { AppLanguage } from "./auth";
import type { ISODate, ISODateTime, MAD, MonthKey } from "./common";

/** A long-term renter. Tenants are invite-only: they can sign in once they accept. */
export interface Tenant {
  id: string;
  /** Account of the manager who rents to them */
  accountId: string;
  /** Set once the tenant has accepted an invitation and can sign in. */
  userId?: string;
  name: string;
  email: string;
  phone: string;
  /** Language of the invitation and their portal */
  language: AppLanguage;
  /** When the invitation was last sent; absent if none was sent */
  invitedAt?: ISODateTime;
}

export type LeaseStatus = "active" | "ending" | "ended";

/** A new monthly rent agreed for later periods, e.g. on renewal. */
export interface RentChange {
  amountMAD: MAD;
  /** Applies to rent periods starting on or after this day */
  from: ISODate;
}

export interface Lease {
  id: string;
  unitId: string;
  tenantId: string;
  startDate: ISODate;
  /** Exclusive end */
  endDate: ISODate;
  /** Rent in force today */
  monthlyRentMAD: MAD;
  /** Scheduled rent changes, earliest first */
  rentChanges?: RentChange[];
  depositMAD: MAD;
  /** Day of the month rent falls due (1–28) */
  rentDueDay: number;
  contractFileUrl: string;
  contractFileName?: string;
  status: LeaseStatus;
}

export type RentInvoiceStatus = "unpaid" | "paid" | "late";

/** Monthly rent request from the manager to the tenant, paid by bank transfer to the issuer RIB. */
export interface RentInvoice {
  id: string;
  /** Issuer's sequence, e.g. "R-202610-003" */
  number: string;
  leaseId: string;
  period: MonthKey;
  issuedAt: ISODate;
  amountMAD: MAD;
  /** Copy of the issuer details at the time the invoice was issued. */
  issuerProfile: IssuerProfile;
  status: RentInvoiceStatus;
  dueDate: ISODate;
  paidAt?: ISODate;
}

/** Where an outstanding rent stands on a given day. */
export type RentDueState = "late" | "due_today" | "upcoming";

/** An outstanding rent: a late invoice, or rent falling due within the next days. */
export interface RentDueItem {
  leaseId: string;
  period: MonthKey;
  /** Absent when the rent for the period has not been invoiced yet */
  invoiceId?: string;
  amountMAD: MAD;
  dueDate: ISODate;
  state: RentDueState;
  tenantName: string;
  unitName: string;
  propertyName: string;
}

/** A lease with the people and places around it, for the lease drawer. */
export interface LeaseDetail {
  lease: Lease;
  tenant?: Tenant;
  unitName: string;
  propertyName: string;
  image: string;
  /** Rent schedule, latest period first */
  invoices: RentInvoice[];
}

/** Where a lease stands on a given day; "ending" means 60 days or fewer remain. */
export type LeaseState = "upcoming" | "active" | "ending" | "ended";

/** Rent status shown on a lease: late wins, then whether the current rent is paid. */
export type LeaseRentStatus = "paid" | "unpaid" | "late";

/** Status of one month in a rent schedule; "not_invoiced" is past due without an invoice. */
export type RentScheduleState = RentInvoiceStatus | "scheduled" | "not_invoiced";

export interface RentScheduleRow {
  period: MonthKey;
  amountMAD: MAD;
  dueDate: ISODate;
  state: RentScheduleState;
  invoice?: RentInvoice;
}

/** A lease as listed on the Leases screen. */
export interface LeaseSummary {
  lease: Lease;
  tenantName: string;
  unitName: string;
  propertyName: string;
  image: string;
  state: LeaseState;
  /** Days until the lease ends; negative once ended */
  daysLeft: number;
  rentStatus: LeaseRentStatus;
  /** Earliest rent not yet received */
  nextDue?: { period: MonthKey; dueDate: ISODate; amountMAD: MAD };
}

/** Everything the lease detail page shows. */
export interface LeaseView extends LeaseSummary {
  tenant?: Tenant;
  propertyAddress: string;
  city: string;
  /** Rent schedule, oldest period first */
  schedule: RentScheduleRow[];
}

/** A rent invoice with who and what it is for. */
export interface RentInvoiceRow {
  invoice: RentInvoice;
  /** Status on the day it is read: unpaid invoices past their due date count as late */
  status: RentInvoiceStatus;
  tenant?: Tenant;
  unitName: string;
  propertyName: string;
  propertyAddress: string;
  city: string;
}

export interface RentInvoicesView {
  /** Month that "Generate this month's invoices" issues */
  period: MonthKey;
  invoices: RentInvoiceRow[];
  /** Running leases with no invoice for `period` yet */
  missingThisMonth: number;
}

export interface NewTenantInput {
  name: string;
  email: string;
  phone: string;
  language: AppLanguage;
}

export interface CreateLeaseInput {
  unitId: string;
  tenant: { existingId: string } | { create: NewTenantInput };
  startDate: ISODate;
  /** Exclusive end */
  endDate: ISODate;
  monthlyRentMAD: MAD;
  depositMAD: MAD;
  rentDueDay: number;
  contractFileUrl: string;
  contractFileName: string;
}

/** Where the tenant's next rent stands: paid, unpaid, late, or not due yet. */
export type TenantRentStatus = "paid" | "unpaid" | "late" | "upcoming";

/** The person or company a tenant rents from, and how to reach them. */
export interface TenantManager {
  /** Conciergerie company or Owner, as printed on the rent invoices */
  name: string;
  /** Person to contact */
  contactName: string;
  email: string;
  phone?: string;
}

/** The next rent the tenant has to pay: the earliest one not yet received. */
export interface TenantNextRent {
  period: MonthKey;
  amountMAD: MAD;
  dueDate: ISODate;
  status: TenantRentStatus;
  /** Absent while the manager has not issued the invoice yet */
  invoice?: RentInvoice;
}

/** Everything the tenant portal shows: the signed-in tenant's own lease and invoices, nothing else. */
export interface TenantPortal {
  /** The tenant record the manager keeps; absent until the manager adds the tenant */
  tenant?: Tenant;
  /** The running or upcoming lease, else the latest one; null until the manager creates one */
  lease: LeaseView | null;
  manager: TenantManager;
  /** Bank details rent is paid to today; each invoice keeps the ones it was issued with */
  payee?: IssuerProfile;
  nextRent?: TenantNextRent;
  /** The tenant's rent invoices: outstanding first, then newest period first */
  invoices: RentInvoiceRow[];
}

export interface TenantContactInput {
  name: string;
  phone: string;
}
