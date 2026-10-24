import { createFileRoute, Outlet } from "@tanstack/react-router";
import { canAccessOperations } from "@/lib/roles";
import { requireAccess } from "@/lib/route-guards";

/** Property and unit management: the Conciergerie, and solo owners who run their own. */
export const Route = createFileRoute("/conciergerie/properties")({
  beforeLoad: () => {
    requireAccess(canAccessOperations);
  },
  component: Outlet,
});
