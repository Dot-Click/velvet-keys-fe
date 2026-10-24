import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/empty-state";
import { PayRentCard } from "@/components/tenant/pay-rent-card";
import { TenantInvoiceDialog } from "@/components/tenant/tenant-invoice-dialog";
import { TenantPortalView } from "@/components/tenant/tenant-page";
import { TenantRentPill } from "@/components/tenant/tenant-rent-pill";
import { Button } from "@/components/ui/button";
import { useTenantPortal, type TenantPortalTuple } from "@/hooks/use-tenant-portal";
import { formatDate, formatMonth } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { parseDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { RentInvoice } from "@/types/ltr";

export const Route = createFileRoute("/tenant/invoices")({
  component: TenantInvoicesPage,
});

function TenantInvoicesPage() {
  const { t } = useTranslation("tenant");
  const query = useTenantPortal();
  return (
    <TenantPortalView
      query={query}
      eyebrow={t("invoices.eyebrow")}
      title={t("invoices.title")}
      subtitle={t("invoices.subtitle")}
    >
      {(portal) => <InvoiceList portal={portal} />}
    </TenantPortalView>
  );
}

function InvoiceList({ portal }: { portal: TenantPortalTuple }) {
  const { t } = useTranslation("tenant");
  const [home, lease, invoicesPage] = portal;
  const [preview, setPreview] = React.useState<RentInvoice | null>(null);
  const invoices = invoicesPage.items;
  const outstanding = invoices.filter((row) => row.status !== "paid");
  const toPay = outstanding.reduce((sum, row) => sum + row.amountMinor, 0);

  if (invoices.length === 0) {
    return (
      <EmptyState
        illustration="ledger"
        title={t("invoices.emptyTitle")}
        description={t("invoices.emptyBody")}
        className="min-h-80"
      />
    );
  }

  return (
    <>
      <p
        className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          outstanding.length > 0
            ? "border-primary/30 bg-primary/5 text-foreground"
            : "border-[#A2E8DD]/30 bg-[#A2E8DD]/5 text-[#A2E8DD]",
        )}
      >
        {outstanding.length > 0
          ? t("invoices.outstanding", {
              count: outstanding.length,
              amount: formatMoney(toPay, invoices[0]?.currency ?? "MAD"),
            })
          : t("invoices.allPaid")}
      </p>

      <ul className="space-y-4">
        {invoices.map((row) => (
          <InvoiceCard
            key={row.id}
            row={row}
            payeeName={lease?.managerName}
            rib={home.issuerRib}
            onOpen={() => setPreview(row)}
          />
        ))}
      </ul>

      <TenantInvoiceDialog
        invoice={preview}
        managerName={lease?.managerName ?? ""}
        issuerRib={home.issuerRib}
        onClose={() => setPreview(null)}
      />
    </>
  );
}

function InvoiceCard({
  row,
  payeeName,
  rib,
  onOpen,
}: {
  row: RentInvoice;
  payeeName: string | undefined;
  rib: string | null;
  onOpen: () => void;
}) {
  const { t } = useTranslation("tenant");

  return (
    <li
      className={cn(
        "space-y-5 rounded-2xl border bg-[#141414] p-5 sm:p-6",
        row.status === "late"
          ? "border-destructive/60 shadow-[inset_3px_0_0_var(--destructive)] rtl:shadow-[inset_-3px_0_0_var(--destructive)]"
          : row.status === "unpaid"
            ? "border-primary/40"
            : "border-border/80",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-xl text-[#F8F9FA]">
            {formatMonth(row.period, { style: "long", withYear: true })}
          </p>
          <p className="font-mono text-[0.68rem] text-muted-foreground">{row.number}</p>
        </div>
        <TenantRentPill status={row.status} />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border/60 pt-4">
        <div className="space-y-0.5">
          <p className="font-mono text-lg font-semibold text-foreground">
            {formatMoney(row.amountMinor, row.currency)}
          </p>
          <p
            className={cn(
              "text-xs",
              row.status === "late" ? "text-[#FF85A1]" : "text-muted-foreground",
            )}
          >
            {row.status === "paid" && row.paidAt
              ? t("invoices.paidOn", { date: formatDate(parseDay(row.paidAt)) })
              : t("invoices.dueOn", { date: formatDate(parseDay(row.dueDate)) })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpen}
          className="h-9 text-[0.68rem] uppercase tracking-wider"
        >
          <FileText className="size-3.5" aria-hidden="true" />
          {t("invoices.viewPdf")}
        </Button>
      </div>

      {row.status !== "paid" && (
        <PayRentCard
          variant="inline"
          payeeName={payeeName}
          rib={rib}
          reference={row.number}
          amountMinor={row.amountMinor}
          currency={row.currency}
          dueDate={row.dueDate}
        />
      )}
    </li>
  );
}
