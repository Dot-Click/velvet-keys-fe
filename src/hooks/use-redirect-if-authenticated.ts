import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/components/auth-provider";
import { roleDestination } from "@/lib/roles";

/**
 * Sends a visitor who arrives already signed in to their panel. Only checks the session
 * restored on load, so flows that sign in along the way (signup success) are not interrupted.
 */
export function useRedirectIfAuthenticated() {
  const { session, isReady } = useAuth();
  const navigate = useNavigate();
  const checked = useRef(false);

  useEffect(() => {
    if (!isReady || checked.current) return;
    checked.current = true;
    if (session) void navigate({ to: roleDestination(session.profile.role), replace: true });
  }, [isReady, navigate, session]);
}
