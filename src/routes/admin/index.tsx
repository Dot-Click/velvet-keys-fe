import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ActivityFeed } from "@/components/admin/overview/activity-feed";
import { AdminAlerts } from "@/components/admin/admin-alerts";
import { AdminPage, AdminSection } from "@/components/admin/admin-page";
import { CycleFunnel } from "@/components/admin/overview/cycle-funnel";
import { KpiRow } from "@/components/admin/overview/kpi-row";
import { MrrChart } from "@/components/admin/overview/mrr-chart";
import { UpcomingTimeline } from "@/components/admin/overview/upcoming-timeline";
import { QueryView } from "@/components/panel-states";
import { useAdminActivity, useAdminCommandCenter } from "@/hooks/use-admin-data";
import { formatDate } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import type { CommandCenter } from "@/types/admin-overview";

export const Route = createFileRoute("/admin/")({
  component: AdminOverviewPage,
});

/**
 * Every figure here is derived from the real admin endpoints, see
 * services/admin-overview-service.ts for which route feeds which panel.
 */
function AdminOverviewPage() {
  const query = useAdminCommandCenter();
  return (
    <QueryView query={query} skeleton="dashboard">
      {(data) => <OverviewContent data={data} />}
    </QueryView>
  );
}

const PANEL = "rounded-lg border border-border/80 bg-[#121212] p-4";

function OverviewContent({ data }: { data: CommandCenter }) {
  const { t } = useTranslation("admin-overview");
  const activity = useAdminActivity();
  return (
    <AdminPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      subtitle={t("asOf", { date: formatDate(parseDay(data.asOf)) })}
    >
      <AdminSection title={t("kpis")}>
        <KpiRow data={data} />
      </AdminSection>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <AdminSection title={t("mrrChart.title")} className="lg:col-span-8">
          <div className={PANEL}>
            <MrrChart history={data.mrr.history} />
          </div>
        </AdminSection>
        <AdminSection title={t("cycle.title")} className="lg:col-span-4">
          <div className={PANEL}>
            {data.cycle ? (
              <CycleFunnel cycle={data.cycle} />
            ) : (
              <p className="text-xs text-muted-foreground">{t("cycle.empty")}</p>
            )}
          </div>
        </AdminSection>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <AdminSection title={t("upcoming.title")} className="lg:col-span-8">
          <div className={PANEL}>
            <UpcomingTimeline events={data.upcoming} />
          </div>
        </AdminSection>
        <AdminSection title={t("alerts.title")} className="lg:col-span-4">
          <AdminAlerts items={data.attention} />
        </AdminSection>
      </div>

      <AdminSection title={t("activity.title")}>
        {/* Signups and price changes show at once; audit events from client details merge in */}
        <ActivityFeed entries={activity.data ?? data.activity} />
        {activity.isFetching && !activity.data && (
          <p className="mt-2 text-xs text-muted-foreground">{t("activity.loadingMore")}</p>
        )}
      </AdminSection>
    </AdminPage>
  );
}
