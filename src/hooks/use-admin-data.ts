import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assertOnline } from "@/lib/pwa";
import { adminOverviewService } from "@/services/admin-overview-service";
import {
  adminAccountsService,
  adminBillingService,
  adminClientsService,
  adminPricingService,
  adminPropertiesService,
  adminRevenueService,
  adminSettingsService,
} from "@/services/platform-admin-service";
import type {
  AdminInvoiceFilter,
  AdminPropertyRow,
  ClientListFilter,
  CompanyLegal,
} from "@/types/platform-admin";
import type { BillingProduct } from "@/types/subscription";

/** Admin data sits under the panel root, so every write refreshes it with the rest. */
const ADMIN_KEY = ["panel-data", "admin"] as const;

/** An audit-logged write: the backend derives the acting Admin from the auth token. */
function useAdminMutation<TInput, TResult>(write: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TInput) => {
      assertOnline();
      return write(input);
    },
    // Fire-and-forget: returning the promise would keep the mutation pending until every
    // active query refetched, freezing the dialog "Saving..." state on slow refetches.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["panel-data"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Accounts (ban / unban)
// ---------------------------------------------------------------------------

export const useSetClientBanned = () =>
  useAdminMutation((input: { accountId: string; banned: boolean; reason: string }) =>
    input.banned
      ? adminAccountsService.ban(input.accountId, input.reason)
      : adminAccountsService.unban(input.accountId, input.reason),
  );

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

/** Not paginated: the backend returns every matching client for the given filter. */
export const useAdminClients = (filter: ClientListFilter = {}) =>
  useQuery({
    queryKey: [...ADMIN_KEY, "clients", filter],
    queryFn: () => adminClientsService.list(filter),
  });

export const useAdminClient = (accountId: string) =>
  useQuery({
    queryKey: [...ADMIN_KEY, "client", accountId],
    queryFn: () => adminClientsService.get(accountId),
    enabled: Boolean(accountId),
  });

export const useGrantManualOffer = () =>
  useAdminMutation(
    (input: {
      accountId: string;
      months: Partial<Record<BillingProduct, number>>;
      reason: string;
    }) => adminClientsService.grantOffer(input.accountId, input.months, input.reason),
  );

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

/** Not paginated: the backend returns every property. A single property's "detail" is looked
 * up from this same list (the backend has no per-property GET), so the list and the detail page
 * share one cache entry. */
export const useAdminProperties = () =>
  useQuery({
    queryKey: [...ADMIN_KEY, "properties"],
    queryFn: () => adminPropertiesService.list(),
  });

export const useAdminPropertyRow = (propertyId: string) => {
  const query = useAdminProperties();
  return {
    ...query,
    data: query.data?.find((row) => row.id === propertyId),
    // The underlying query resolves to the full list; QueryView only calls refetch() without
    // using its resolved value, so the list-shaped promise is cast to the single-row shape.
    refetch: query.refetch as unknown as () => Promise<
      import("@tanstack/react-query").QueryObserverResult<AdminPropertyRow>
    >,
  };
};

export const useSetPropertyListed = () =>
  useAdminMutation((input: { propertyId: string; listed: boolean; reason: string }) =>
    input.listed
      ? adminPropertiesService.relist(input.propertyId, input.reason)
      : adminPropertiesService.delist(input.propertyId, input.reason),
  );

// ---------------------------------------------------------------------------
// Pricing / launch offer / free sync
// ---------------------------------------------------------------------------

export const useAdminPricing = () =>
  useQuery({ queryKey: [...ADMIN_KEY, "pricing"], queryFn: () => adminPricingService.get() });

export const useSavePrices = () =>
  useAdminMutation((input: { prices: Partial<Record<BillingProduct, number>>; reason: string }) =>
    adminPricingService.patch(input.prices, input.reason),
  );

export const useSaveLaunchDeadline = () =>
  useAdminMutation((launchDeadline: string) =>
    adminPricingService.patchLaunchOffer(launchDeadline),
  );

export const useSaveFreeSyncTotal = () =>
  useAdminMutation((total: number) => adminPricingService.patchFreeSync(total));

// ---------------------------------------------------------------------------
// Company legal settings
// ---------------------------------------------------------------------------

export const useAdminSettings = () =>
  useQuery({ queryKey: [...ADMIN_KEY, "settings"], queryFn: () => adminSettingsService.get() });

export const useSaveCompanyLegal = () =>
  useAdminMutation((legal: Partial<CompanyLegal>) => adminSettingsService.save(legal));

// ---------------------------------------------------------------------------
// Revenue
// ---------------------------------------------------------------------------

export const useAdminRevenue = () =>
  useQuery({ queryKey: [...ADMIN_KEY, "revenue"], queryFn: () => adminRevenueService.get() });

// ---------------------------------------------------------------------------
// Billing / subscription invoices
// ---------------------------------------------------------------------------

export const useAdminInvoices = (filter: AdminInvoiceFilter = {}) =>
  useQuery({
    queryKey: [...ADMIN_KEY, "invoices", filter],
    queryFn: () => adminBillingService.listInvoices(filter),
    placeholderData: keepPreviousData,
  });

/** Platform-wide KPI aggregates (outstanding/overdue/due-this-week/paid-this-month + status counts). */
export const useAdminInvoiceSummary = () =>
  useQuery({
    queryKey: [...ADMIN_KEY, "invoices-summary"],
    queryFn: () => adminBillingService.invoiceSummary(),
  });

/** Not paginated: every matching invoice, for the admin screen's own client-side table. */
export const useAdminAllInvoices = (filter: Omit<AdminInvoiceFilter, "page" | "pageSize"> = {}) =>
  useQuery({
    queryKey: [...ADMIN_KEY, "invoices-all", filter],
    queryFn: () => adminBillingService.listAllInvoices(filter),
  });

export const useGenerateInvoices = () =>
  useAdminMutation((period: string) => adminBillingService.generate(period));

export const useMarkInvoicePaid = () =>
  useAdminMutation((input: { invoiceId: string; paidReference: string; paidAt?: string }) =>
    adminBillingService.markPaid(input.invoiceId, input.paidReference, input.paidAt),
  );

export const useVoidInvoice = () =>
  useAdminMutation((input: { invoiceId: string; reason: string }) =>
    adminBillingService.void(input.invoiceId, input.reason),
  );

export const useRemindInvoice = () =>
  useAdminMutation((invoiceId: string) => adminBillingService.remind(invoiceId));

// ---------------------------------------------------------------------------
// Overview (command center), derived from the endpoints above
// ---------------------------------------------------------------------------

export const useAdminCommandCenter = () =>
  useQuery({
    queryKey: [...ADMIN_KEY, "command-center"],
    queryFn: () => adminOverviewService.getCommandCenter(),
  });

/** Loads separately: it opens a few client details, which the backend serves slowly. */
export const useAdminActivity = () =>
  useQuery({
    queryKey: [...ADMIN_KEY, "activity"],
    queryFn: () => adminOverviewService.getActivity(),
    staleTime: 60_000,
  });
