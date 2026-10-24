import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AdminPage, AdminSection } from "@/components/admin/admin-page";
import { FreeSyncSettings } from "@/components/admin/free-sync-settings";
import { LaunchOfferSettings } from "@/components/admin/launch-offer-settings";
import { PriceCards } from "@/components/admin/price-cards";
import { PriceHistory } from "@/components/admin/price-history";
import { QueryView } from "@/components/panel-states";
import { useAdminPricing } from "@/hooks/use-admin-data";
import type { AdminPricing } from "@/types/platform-admin";

export const Route = createFileRoute("/admin/pricing")({
  component: AdminPricingPage,
});

function AdminPricingPage() {
  const query = useAdminPricing();
  return (
    <QueryView query={query} skeleton="table">
      {(pricing) => <PricingContent pricing={pricing} />}
    </QueryView>
  );
}

function PricingContent({ pricing }: { pricing: AdminPricing }) {
  const { t } = useTranslation("admin");
  const { t: tp } = useTranslation("admin-pricing");
  return (
    <AdminPage
      breadcrumb={[{ label: tp("breadcrumb.admin"), to: "/admin" }, { label: t("pricing.title") }]}
      title={t("pricing.title")}
      subtitle={t("pricing.subtitle")}
    >
      <AdminSection title={t("pricing.prices.title")}>
        <PriceCards pricing={pricing} />
      </AdminSection>

      <AdminSection title={t("pricing.history.title")}>
        <PriceHistory pricing={pricing} />
      </AdminSection>

      <AdminSection title={t("pricing.launch.title")}>
        <LaunchOfferSettings
          deadline={pricing.launchDeadline}
          freeSyncTotal={pricing.freeSync.total}
        />
      </AdminSection>

      <AdminSection title={t("pricing.freeSync.title")}>
        <FreeSyncSettings freeSync={pricing.freeSync} />
      </AdminSection>
    </AdminPage>
  );
}
