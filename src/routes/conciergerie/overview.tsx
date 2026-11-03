import { createFileRoute } from "@tanstack/react-router";
import { requireAccess } from "@/lib/route-guards";
import { hasCapability } from "@/lib/roles";
import { OwnerOverviewPage } from "@/routes/owner/overview";

export const Route = createFileRoute("/conciergerie/overview")({
  beforeLoad: () => {
    requireAccess((profile) => hasCapability(profile, "financials"));
  },
  component: OwnerOverviewPage,
});
