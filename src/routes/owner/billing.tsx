import { createFileRoute } from "@tanstack/react-router";
import { BillingScreen } from "@/components/billing/billing-screen";
import { requireAccess } from "@/lib/route-guards";
import { hasCapability } from "@/lib/roles";

/** Subscription billing for an Owner who holds their own account (solo owners). */
export const Route = createFileRoute("/owner/billing")({
  beforeLoad: () => {
    requireAccess((profile) => profile.role === "owner" && hasCapability(profile, "billing"));
  },
  component: BillingScreen,
});
