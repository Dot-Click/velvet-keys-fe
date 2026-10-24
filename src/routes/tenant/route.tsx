import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TenantShell } from "@/components/tenant/tenant-shell";
import { requireAccess } from "@/lib/route-guards";
import { hasCapability } from "@/lib/roles";

export const Route = createFileRoute("/tenant")({
  ssr: false,
  beforeLoad: () => {
    requireAccess((profile) => hasCapability(profile, "tenant_portal"));
  },
  component: () => (
    <TenantShell>
      <Outlet />
    </TenantShell>
  ),
});
