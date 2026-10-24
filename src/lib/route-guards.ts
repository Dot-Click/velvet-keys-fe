import { redirect } from "@tanstack/react-router";
import { getStoredSession, saveSession } from "@/components/auth-provider";
import { roleDestination } from "@/lib/roles";
import type { AuthProfile } from "@/types/auth";

/**
 * Use in a route tree's `beforeLoad`. Sends signed-out or banned visitors to /login
 * and anyone the tree does not allow to their own panel.
 */
export function requireAccess(allow: (profile: AuthProfile) => boolean) {
  const session = getStoredSession();
  if (!session) throw redirect({ to: "/login" });

  const { profile } = session;
  if (profile.accountStatus === "banned") {
    saveSession(null);
    throw redirect({ to: "/login" });
  }
  if (!allow(profile)) throw redirect({ to: roleDestination(profile.role) });
  return profile;
}
