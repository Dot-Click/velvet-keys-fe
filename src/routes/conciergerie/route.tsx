import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { requireAccess } from "@/lib/route-guards";
import { canAccessOperations } from "@/lib/roles";

export const Route = createFileRoute("/conciergerie")({
  ssr: false,
  beforeLoad: () => {
    requireAccess(canAccessOperations);
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
