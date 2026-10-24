import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { requireAccess } from "@/lib/route-guards";

export const Route = createFileRoute("/owner")({
  ssr: false,
  beforeLoad: () => {
    requireAccess((profile) => profile.role === "owner");
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
