import { useAuth } from "@/components/auth-provider";
import { isSoloOwner } from "@/lib/roles";

/** True for an Owner without a Conciergerie, who runs their own operations. */
export function useIsSoloOwner(): boolean {
  const { session } = useAuth();
  return session ? isSoloOwner(session.profile) : false;
}
