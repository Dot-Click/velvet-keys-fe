import { createFileRoute } from "@tanstack/react-router";
import { BillingScreen } from "@/components/billing/billing-screen";
import { requireAccess } from "@/lib/route-guards";
import { hasCapability } from "@/lib/roles";

/** Subscription billing for the Conciergerie account holder. */
export const Route = createFileRoute("/conciergerie/billing")({
  beforeLoad: () => {
    requireAccess(
      (profile) => profile.role === "conciergerie" && hasCapability(profile, "billing"),
    );
  },
  component: ConciergerieBillingPage,
});

function ConciergerieBillingPage() {
  return <BillingScreen emptyIllustration="empty-billing" operations />;
}
