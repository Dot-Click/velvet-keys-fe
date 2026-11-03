import { createFileRoute } from "@tanstack/react-router";
import { requireAccess } from "@/lib/route-guards";
import { hasCapability } from "@/lib/roles";
import { OwnerReportsPage } from "@/routes/owner/reports";

export const Route = createFileRoute("/conciergerie/reports")({
  beforeLoad: () => {
    requireAccess((profile) => hasCapability(profile, "financials"));
  },
  component: OwnerReportsPage,
});
