import { api, type Page } from "@/lib/apiClient";
import type {
  CreateLeaseInput,
  GenerateRentInvoicesResult,
  IssuerProfile,
  IssuerProfileInput,
  Lease,
  LeaseDetail,
  LeaseListFilter,
  MarkReceivedInput,
  RenewLeaseInput,
  RentInvoice,
  RentInvoiceListFilter,
  TenantContract,
  TenantHome,
  TenantLease,
  UpdateLeaseInput,
} from "@/types/ltr";

function query(filter: object) {
  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export const leasesService = {
  list(filter: LeaseListFilter = {}): Promise<Page<Lease>> {
    return api.get<Page<Lease>>("/leases", query(filter));
  },

  get(id: string): Promise<LeaseDetail> {
    return api.get<LeaseDetail>(`/leases/${id}`);
  },

  /** Fails with LEASE_OVERLAP, UNIT_NOT_LTR, INVALID_DATE_RANGE, TENANT_NOT_FOUND... */
  create(input: CreateLeaseInput): Promise<Lease> {
    return api.post<Lease>("/leases", input);
  },

  update(id: string, patch: UpdateLeaseInput): Promise<Lease> {
    return api.patch<Lease>(`/leases/${id}`, patch);
  },

  renew(id: string, input: RenewLeaseInput): Promise<Lease> {
    return api.post<Lease>(`/leases/${id}/renew`, input);
  },

  end(id: string, endDate: string): Promise<Lease> {
    return api.post<Lease>(`/leases/${id}/end`, { endDate });
  },

  /** Returns the new invitation; the previous one is revoked. */
  resendTenantInvite(id: string): Promise<{ id: string; email: string; expiresAt: string }> {
    return api.post(`/leases/${id}/tenant-invite/resend`);
  },
};

export const rentInvoicesService = {
  list(filter: RentInvoiceListFilter = {}): Promise<Page<RentInvoice>> {
    return api.get<Page<RentInvoice>>("/rent-invoices", query(filter));
  },

  /** Idempotent per lease and period; leases whose issuer profile is incomplete are skipped. */
  generate(period: string): Promise<GenerateRentInvoicesResult> {
    return api.post<GenerateRentInvoicesResult>("/rent-invoices/generate", { period });
  },

  markReceived(id: string, input: MarkReceivedInput = {}): Promise<RentInvoice> {
    return api.post<RentInvoice>(`/rent-invoices/${id}/mark-received`, input);
  },
};

export const issuerProfileService = {
  get(): Promise<IssuerProfile> {
    return api.get<IssuerProfile>("/settings/issuer-profile");
  },

  save(input: IssuerProfileInput): Promise<IssuerProfile> {
    return api.put<IssuerProfile>("/settings/issuer-profile", input);
  },
};

export const tenantPortalService = {
  home(): Promise<TenantHome> {
    return api.get<TenantHome>("/tenant/home");
  },

  lease(): Promise<TenantLease> {
    return api.get<TenantLease>("/tenant/lease");
  },

  contract(): Promise<TenantContract> {
    return api.get<TenantContract>("/tenant/lease/contract");
  },

  rentInvoices(page = 1, pageSize: 10 | 25 | 50 = 25): Promise<Page<RentInvoice>> {
    return api.get<Page<RentInvoice>>("/tenant/rent-invoices", { page, pageSize });
  },
};
