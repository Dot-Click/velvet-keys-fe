import * as React from "react";
import { useTranslation } from "react-i18next";
import type { IllustrationName } from "@/assets/manifest";
import { PageHeader } from "@/components/page-header";
import { QueryView } from "@/components/panel-states";
import { useBillingSummary, useSubscriptionInvoices } from "@/hooks/use-portfolio-data";
import { useServerPageControls, useServerPagination } from "@/hooks/use-server-pagination";
import type { Page } from "@/lib/apiClient";
import type { BillingSummary, InvoiceListItem } from "@/types/subscription";
import { HowToPayCard } from "./how-to-pay-card";
import { LaunchOfferCard } from "./launch-offer-card";
import { OperationsInvoicesTable } from "./operations-invoices-table";
import { PlanSummary } from "./plan-summary";
import { SubscriptionInvoiceDialog } from "./subscription-invoice-dialog";
import { SubscriptionInvoicesTable } from "./subscription-invoices-table";

/**
 * Subscription billing for the account holder, shared by the Conciergerie and Owner panels.
 * `emptyIllustration` lets a panel use its media manifest illustration for the empty list.
 */
export function BillingScreen({
  emptyIllustration,
  operations = false,
}: {
  emptyIllustration?: IllustrationName;
  /** The operations panel layout: page header, serif figures, paged invoices, animated rings */
  operations?: boolean;
}) {
  const summaryQuery = useBillingSummary();
  const controls = useServerPageControls();
  const invoicesQuery = useSubscriptionInvoices({
    page: controls.page,
    pageSize: controls.pageSize,
  });

  return (
    <QueryView query={summaryQuery} skeleton="table">
      {(summary) => (
        <QueryView query={invoicesQuery} skeleton="table">
          {(invoicesPage) =>
            operations ? (
              <OperationsBilling
                summary={summary}
                invoicesPage={invoicesPage}
                controls={controls}
                emptyIllustration={emptyIllustration}
              />
            ) : (
              <BillingContent
                summary={summary}
                invoicesPage={invoicesPage}
                controls={controls}
                emptyIllustration={emptyIllustration}
              />
            )
          }
        </QueryView>
      )}
    </QueryView>
  );
}

interface BillingBodyProps {
  summary: BillingSummary;
  invoicesPage: Page<InvoiceListItem>;
  controls: ReturnType<typeof useServerPageControls>;
  emptyIllustration: IllustrationName | undefined;
}

function OperationsBilling({
  summary,
  invoicesPage,
  controls,
  emptyIllustration,
}: BillingBodyProps) {
  const { t } = useTranslation(["billing", "common"]);
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  return (
    <div className="mx-auto max-w-[1720px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumb={[{ label: t("common:nav.group.finance") }, { label: t("common:nav.billing") }]}
        title={t("screen.pageTitle")}
        description={t("screen.subtitle", { brand: t("common:brand.name") })}
      />
      <PlanSummary summary={summary} operations />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <LaunchOfferCard summary={summary} animated />
        </div>
        <div className="lg:col-span-5">
          <HowToPayCard invoices={invoicesPage.items} animatedCopy />
        </div>
      </div>
      <OperationsInvoicesTable
        page={invoicesPage}
        controls={controls}
        onOpen={(invoice) => setPreviewId(invoice.id)}
        emptyIllustration={emptyIllustration}
      />
      <SubscriptionInvoiceDialog invoiceId={previewId} onClose={() => setPreviewId(null)} />
    </div>
  );
}

function BillingContent({ summary, invoicesPage, controls, emptyIllustration }: BillingBodyProps) {
  const { t } = useTranslation(["billing", "common"]);
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  return (
    <div className="relative mx-auto min-h-screen max-w-[1720px] space-y-10 px-4 py-8 sm:px-8 lg:px-12">
      <div className="space-y-1 border-b border-border/80 pb-6">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" />
          <p className="text-label-caps text-primary">{t("screen.badge")}</p>
        </div>
        <h1 className="font-display text-3xl uppercase tracking-[0.1em] text-[#F8F9FA] sm:text-4xl">
          {t("screen.title")}
        </h1>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {t("screen.subtitle", { brand: t("common:brand.name") })}
        </p>
      </div>

      <PlanSummary summary={summary} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <LaunchOfferCard summary={summary} />
        </div>
        <div className="lg:col-span-5">
          <HowToPayCard invoices={invoicesPage.items} />
        </div>
      </div>

      <SubscriptionInvoicesTable
        page={invoicesPage}
        controls={controls}
        onOpen={(invoice) => setPreviewId(invoice.id)}
        emptyIllustration={emptyIllustration}
      />

      <SubscriptionInvoiceDialog invoiceId={previewId} onClose={() => setPreviewId(null)} />
    </div>
  );
}
