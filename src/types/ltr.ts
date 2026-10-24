/**
 * Long-term rental shapes exactly as the backend returns them
 * (velvet-keys-be/app/schemas/leases.py). Amounts are integer minor units + currency.
 */

/** Stored lease status. */
export type LeaseStatus = "active" | "ending" | "ended";
/** Status the backend computes from dates for display. */
export type ComputedLeaseStatus = "active" | "ending_soon" | "ended";
export type LeaseStatusFilter = "active" | "ending" | "ended";
export type RentInvoiceStatus = "unpaid" | "paid" | "late";
export type RentScheduleStatus = "unpaid" | "paid" | "late" | "not_yet_generated";

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface TenantInput {
  name: string;
  email: string;
  phone?: string | null;
}

export interface Lease {
  id: string;
  unitId: string;
  unitName: string;
  propertyName: string;
  tenant: Tenant;
  startDate: string;
  endDate: string;
  monthlyRentMinor: number;
  currency: string;
  depositMinor: number;
  rentDueDay: number;
  status: LeaseStatus;
  computedStatus: ComputedLeaseStatus;
  nextDueDate: string | null;
  nextDueStatus: "unpaid" | "late" | null;
}

export interface RentScheduleRow {
  /** "YYYY-MM" */
  period: string;
  dueDate: string;
  amountMinor: number;
  status: RentScheduleStatus;
  invoiceId: string | null;
}

export interface LeaseDetail extends Lease {
  contractFileId: string | null;
  rentSchedule: RentScheduleRow[];
}

export interface LeaseListFilter {
  page?: number;
  pageSize?: 10 | 25 | 50;
  status?: LeaseStatusFilter;
  lateRent?: boolean;
  q?: string;
}

export interface CreateLeaseInput {
  unitId: string;
  /** Exactly one of tenantId (existing tenant) or tenant (new tenant) */
  tenantId?: string;
  tenant?: TenantInput;
  startDate: string;
  endDate: string;
  monthlyRentMinor: number;
  depositMinor: number;
  currency?: string;
  /** 1..28 */
  rentDueDay: number;
  contractFileId?: string | null;
  inviteTenant?: boolean;
}

export interface UpdateLeaseInput {
  depositMinor?: number;
  rentDueDay?: number;
  contractFileId?: string | null;
}

export interface RenewLeaseInput {
  newEndDate: string;
  newMonthlyRentMinor?: number;
  effectiveFrom?: string;
}

export interface RentInvoice {
  id: string;
  leaseId: string;
  tenantName: string;
  unitName: string;
  propertyName: string;
  /** "YYYY-MM" */
  period: string;
  amountMinor: number;
  currency: string;
  dueDate: string;
  status: RentInvoiceStatus;
  paidAt: string | null;
  number: string;
}

export interface RentInvoiceListFilter {
  page?: number;
  pageSize?: 10 | 25 | 50;
  status?: RentInvoiceStatus;
  period?: string;
  leaseId?: string;
}

export interface SkippedLease {
  leaseId: string;
  /** An ErrorCode value, e.g. ISSUER_PROFILE_INCOMPLETE */
  reason: string;
}

export interface GenerateRentInvoicesResult {
  created: RentInvoice[];
  skipped: SkippedLease[];
}

export interface MarkReceivedInput {
  paidAt?: string;
  note?: string;
}

export interface IssuerProfile {
  name: string | null;
  address: string | null;
  ice: string | null;
  rib: string | null;
}

export interface IssuerProfileInput {
  name: string;
  address: string;
  ice?: string | null;
  rib: string;
}

export interface TenantNextRent {
  amountMinor: number;
  currency: string;
  dueDate: string;
  status: RentInvoiceStatus;
}

export interface TenantHome {
  unitName: string;
  propertyAddress: string;
  nextRent: TenantNextRent | null;
  issuerRib: string | null;
}

export interface TenantLease {
  unitName: string;
  propertyAddress: string;
  startDate: string;
  endDate: string;
  monthlyRentMinor: number;
  depositMinor: number;
  managerName: string;
  managerContact: string | null;
}

export interface TenantContract {
  contractFileId: string;
  /** Null when storage is not configured; `note` then says why. */
  downloadUrl: string | null;
  note: string | null;
}
