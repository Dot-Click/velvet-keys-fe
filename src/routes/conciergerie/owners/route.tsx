import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAccess } from "@/lib/route-guards";
import { hasCapability } from "@/lib/roles";

/** Portfolio management belongs to the Conciergerie; solo owners manage theirs from /owner. */
export const Route = createFileRoute("/conciergerie/owners")({
  beforeLoad: () => {
    requireAccess((profile) => hasCapability(profile, "invite_owners"));
  },
  component: Outlet,
});
