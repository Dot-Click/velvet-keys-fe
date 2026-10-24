import { api, type Page } from "@/lib/apiClient";
import type {
  AdminAccount,
  AdminInvoiceFilter,
  AdminInvoiceListItem,
  AdminInvoiceSummary,
  AdminPricing,
  AdminPropertyRow,
  AdminRevenue,
  AdminSettings,
  ClientDetail,
  ClientListFilter,
  ClientSummary,
  CompanyLegal,
  FreeSync,
  SaveCompanyLegalResult,
} from "@/types/platform-admin";
import type { BillingProduct, GenerateInvoicesResult } from "@/types/subscription";

function query(filter: object) {
  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined && value !== ""),
  );
}

/** Reasons for moderation and price changes must be at least 10 characters (backend rule). */
export const MIN_REASON_LENGTH = 10;

export const adminAccountsService = {
  ban(accountId: string, reason: string): Promise<AdminAccount> {
    return api.patch<AdminAccount>(`/admin/accounts/${accountId}/ban`, { reason });
  },

  unban(accountId: string, reason: string): Promise<AdminAccount> {
    return api.patch<AdminAccount>(`/admin/accounts/${accountId}/unban`, { reason });
  },
};

export const adminClientsService = {
  /** Not paginated: the backend returns every matching client. */
  list(filter: ClientListFilter = {}): Promise<ClientSummary[]> {
    return api.get<ClientSummary[]>("/admin/clients", query(filter));
  },

  get(accountId: string): Promise<ClientDetail> {
    return api.get<ClientDetail>(`/admin/clients/${accountId}`);
  },

  /** Grants whole free months per product (0-12 each). */
  grantOffer(
    accountId: string,
    months: Partial<Record<BillingProduct, number>>,
    reason: string,
  ): Promise<ClientSummary> {
    return api.post<ClientSummary>(`/admin/clients/${accountId}/manual-offer`, { months, reason });
  },
};

export const adminPropertiesService = {
  list(): Promise<AdminPropertyRow[]> {
    return api.get<AdminPropertyRow[]>("/admin/properties");
  },

  delist(propertyId: string, reason: string): Promise<AdminPropertyRow> {
    return api.patch<AdminPropertyRow>(`/admin/properties/${propertyId}/delist`, { reason });
  },

  relist(propertyId: string, reason: string): Promise<AdminPropertyRow> {
    return api.patch<AdminPropertyRow>(`/admin/properties/${propertyId}/relist`, { reason });
  },
};

export const adminPricingService = {
  get(): Promise<AdminPricing> {
    return api.get<AdminPricing>("/admin/pricing");
  },

  /** Prices are in minor units; a change applies from the next billing period. */
  patch(prices: Partial<Record<BillingProduct, number>>, reason: string): Promise<AdminPricing> {
    return api.patch<AdminPricing>("/admin/pricing", { prices, reason });
  },

  getLaunchOffer(): Promise<{ launchDeadline: string }> {
    return api.get("/admin/launch-offer");
  },

  patchLaunchOffer(launchDeadline: string): Promise<{ launchDeadline: string }> {
    return api.patch("/admin/launch-offer", { launchDeadline });
  },

  getFreeSync(): Promise<FreeSync> {
    return api.get<FreeSync>("/admin/free-sync");
  },

  patchFreeSync(total: number): Promise<FreeSync> {
    return api.patch<FreeSync>("/admin/free-sync", { total });
  },
};

export const adminSettingsService = {
  get(): Promise<AdminSettings> {
    return api.get<AdminSettings>("/admin/settings/company-legal");
  },

  save(companyLegal: Partial<CompanyLegal>): Promise<SaveCompanyLegalResult> {
    return api.patch<SaveCompanyLegalResult>("/admin/settings/company-legal", companyLegal);
  },
};

export const adminBillingService = {
  /** Idempotent per account and period ("YYYY-MM"). */
  generate(period: string): Promise<GenerateInvoicesResult> {
    return api.post<GenerateInvoicesResult>("/admin/billing/generate", { period });
  },

  listInvoices(filter: AdminInvoiceFilter = {}): Promise<Page<AdminInvoiceListItem>> {
    return api.get<Page<AdminInvoiceListItem>>("/admin/billing/invoices", query(filter));
  },

  /** Every matching invoice, unpaginated -- for the admin screen's own client-side table. */
  listAllInvoices(
    filter: Omit<AdminInvoiceFilter, "page" | "pageSize"> = {},
  ): Promise<AdminInvoiceListItem[]> {
    return api.get<AdminInvoiceListItem[]>("/admin/billing/invoices/all", query(filter));
  },

  /** Platform-wide KPI aggregates, independent of the current page/filter. */
  invoiceSummary(): Promise<AdminInvoiceSummary> {
    return api.get<AdminInvoiceSummary>("/admin/billing/invoices/summary");
  },

  markPaid(
    invoiceId: string,
    paidReference: string,
    paidAt?: string,
  ): Promise<AdminInvoiceListItem> {
    return api.post<AdminInvoiceListItem>(`/admin/billing/invoices/${invoiceId}/mark-paid`, {
      paidReference,
      ...(paidAt ? { paidAt } : {}),
    });
  },

  void(invoiceId: string, reason: string): Promise<AdminInvoiceListItem> {
    return api.post<AdminInvoiceListItem>(`/admin/billing/invoices/${invoiceId}/void`, { reason });
  },

  remind(invoiceId: string): Promise<AdminInvoiceListItem> {
    return api.post<AdminInvoiceListItem>(`/admin/billing/invoices/${invoiceId}/remind`);
  },

  revenue(): Promise<AdminRevenue> {
    return api.get<AdminRevenue>("/admin/billing/revenue");
  },
};

export const adminRevenueService = {
  get(): Promise<AdminRevenue> {
    return api.get<AdminRevenue>("/admin/revenue");
  },
};
