import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { hasErrorCode } from "@/lib/apiClient";
import { combineQueries } from "@/lib/queries";
import { assertOnline } from "@/lib/pwa";
import { tenantPortalService } from "@/services/ltr-service";
import type { ProfileUpdate } from "@/types/auth";
import type { Page } from "@/lib/apiClient";
import type { RentInvoice, TenantHome, TenantLease } from "@/types/ltr";

/** The backend exposes the tenant portal as 4 separate endpoints (home/lease/contract/
 *  rent-invoices) rather than one combined object like the old mock. This combines the three
 *  screens actually need (home, lease, invoices) into one query via `combineQueries`, so the
 *  existing `TenantPortalView` loading/error/no-lease plumbing still works with one query. */
export type TenantPortalTuple = [TenantHome, TenantLease | null, Page<RentInvoice>];

function useTenantHomeQuery() {
  const { session } = useAuth();
  const profile = session?.profile;
  return useQuery({
    queryKey: ["panel-data", profile?.accountId ?? "", "tenant-home", profile?.id ?? ""],
    queryFn: () => tenantPortalService.home(),
    enabled: profile?.role === "tenant",
  });
}

/** The tenant's lease, or null once the backend says there is none (LEASE_NOT_FOUND) rather
 *  than treating that as a query error. */
function useTenantLeaseOrNull() {
  const { session } = useAuth();
  const profile = session?.profile;
  return useQuery({
    queryKey: ["panel-data", profile?.accountId ?? "", "tenant-lease-or-null", profile?.id ?? ""],
    queryFn: async (): Promise<TenantLease | null> => {
      try {
        return await tenantPortalService.lease();
      } catch (error) {
        if (hasErrorCode(error, "LEASE_NOT_FOUND")) return null;
        throw error;
      }
    },
    enabled: profile?.role === "tenant",
  });
}

function useTenantInvoicesQuery() {
  const { session } = useAuth();
  const profile = session?.profile;
  return useQuery({
    queryKey: ["panel-data", profile?.accountId ?? "", "tenant-invoices", profile?.id ?? ""],
    queryFn: () => tenantPortalService.rentInvoices(1, 25),
    enabled: profile?.role === "tenant",
  });
}

/** The signed-in tenant's home, lease and rent invoices, combined into one query. */
export function useTenantPortal() {
  const home = useTenantHomeQuery();
  const lease = useTenantLeaseOrNull();
  const invoices = useTenantInvoicesQuery();
  return combineQueries(home, lease, invoices);
}

/**
 * Saves the tenant's name and phone through the regular profile update. The old mock also
 * pushed the change into the manager's tenant record (`tenantPortalService.updateContact`);
 * the real backend has no such endpoint, so the manager's tenant record stays as it was
 * (name/email/phone captured when the lease was created).
 */
export function useUpdateTenantProfile() {
  const { updateProfile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (update: ProfileUpdate) => {
      assertOnline();
      return updateProfile(update);
    },
    // Fire-and-forget: returning the promise would keep the mutation pending until every
    // active query refetched, freezing the dialog "Saving..." state on slow refetches.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["panel-data"] });
    },
  });
}
