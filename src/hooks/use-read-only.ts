import { useAuth } from "@/components/auth-provider";
import { useOnlineStatus } from "@/hooks/use-online-status";

/**
 * Read-only applies to the account holder's team once an invoice is overdue (day 8).
 * Their Owners and Tenants keep their own status, so they never lose view access.
 *
 * Being offline blocks writes the same way, so `isReadOnly` is what add/edit controls check. Use
 * `isAccountReadOnly` for anything about the overdue invoice itself (banners, billing).
 */
export function useReadOnly() {
  const { session } = useAuth();
  const isOnline = useOnlineStatus();
  const accountStatus = session?.profile.accountStatus ?? "active";
  const isAccountReadOnly = accountStatus === "readonly";
  const isOffline = !isOnline;
  return {
    accountStatus,
    isReadOnly: isAccountReadOnly || isOffline,
    isAccountReadOnly,
    isOffline,
    accountId: session?.profile.accountId ?? null,
  };
}
