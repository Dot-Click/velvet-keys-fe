import { createFileRoute } from "@tanstack/react-router";
import { CircleCheck, FileWarning } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { AdminPage, AdminSection } from "@/components/admin/admin-page";
import { BillingRules } from "@/components/admin/billing-rules";
import { CompanyLegalForm } from "@/components/admin/company-legal-form";
import { InvoiceHeaderPreview } from "@/components/admin/invoice-header-preview";
import { QueryView } from "@/components/panel-states";
import { useAdminSettings } from "@/hooks/use-admin-data";
import { checkCompanyLegal, normalizeCompanyLegal } from "@/lib/admin";
import { formatList } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { AdminSettings, CompanyLegal } from "@/types/platform-admin";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const query = useAdminSettings();
  return (
    <QueryView query={query} skeleton="split">
      {(settings) => <SettingsContent settings={settings} />}
    </QueryView>
  );
}

function SettingsContent({ settings }: { settings: AdminSettings }) {
  const { t } = useTranslation("admin");
  const { t: tp } = useTranslation("admin-pricing");
  const [draft, setDraft] = React.useState<CompanyLegal>(settings.companyLegal);
  const issues = checkCompanyLegal(draft);
  const complete = Object.keys(issues).length === 0;
  const missing = (Object.keys(issues) as (keyof CompanyLegal)[]).filter(
    (field) => issues[field] === "missing",
  );
  const dirty =
    JSON.stringify(normalizeCompanyLegal(draft)) !== JSON.stringify(settings.companyLegal);

  return (
    <AdminPage
      breadcrumb={[{ label: tp("breadcrumb.admin"), to: "/admin" }, { label: t("settings.title") }]}
      title={t("settings.title")}
      subtitle={t("settings.subtitle")}
    >
      <p
        role="status"
        className={cn(
          "flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[13px] leading-relaxed",
          complete
            ? "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]"
            : "border-primary/40 bg-primary/10 text-primary",
        )}
      >
        {complete ? (
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        ) : (
          <FileWarning className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        )}
        <span>
          {complete ? t("settings.banner.complete") : t("settings.banner.proforma")}
          {missing.length > 0 &&
            ` ${t("settings.banner.missing", {
              fields: formatList(missing.map((field) => t(`settings.form.fields.${field}`))),
            })}`}
          {complete && dirty && ` ${t("settings.banner.unsaved")}`}
        </span>
      </p>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
        <AdminSection title={t("settings.form.title")} className="xl:col-span-6">
          <CompanyLegalForm value={draft} onChange={setDraft} saved={settings.companyLegal} />
        </AdminSection>

        <div className="space-y-6 xl:col-span-6">
          <AdminSection title={t("settings.preview.title")}>
            <div className="space-y-2">
              <InvoiceHeaderPreview legal={normalizeCompanyLegal(draft)} />
              <p className="text-xs text-muted-foreground">{t("settings.preview.caption")}</p>
            </div>
          </AdminSection>

          <AdminSection
            title={t("settings.rules.title")}
            aside={
              <span className="text-xs text-muted-foreground">{t("settings.rules.note")}</span>
            }
          >
            <BillingRules />
          </AdminSection>
        </div>
      </div>
    </AdminPage>
  );
}
