import { useAuth } from "@/components/auth-provider";
import type { DataScope } from "@/types/common";

/**
 * What the signed-in user may see: an Owner managed by a Conciergerie sees only their own
 * properties; everyone else sees their whole account.
 */
export function useDataScope(): DataScope {
  const { session } = useAuth();
  const profile = session?.profile;
  if (!profile) return { accountId: "" };
  if (profile.role === "owner" && profile.conciergerieId) {
    return { accountId: profile.accountId, ownerId: profile.id, userId: profile.id };
  }
  return { accountId: profile.accountId, userId: profile.id };
}
