import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { requireAccess } from "@/lib/route-guards";
import { hasCapability } from "@/lib/roles";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: () => {
    requireAccess((profile) => hasCapability(profile, "admin"));
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
