import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { IllustrationName } from "@/assets/manifest";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import type { ServerPageControls } from "@/hooks/use-server-pagination";
import { useServerPagination } from "@/hooks/use-server-pagination";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import type { Page } from "@/lib/apiClient";
import { formatDate, formatMonth } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { InvoiceListItem } from "@/types/subscription";
import { InvoiceStatusPill } from "./invoice-status-pill";

/** Subscription invoices for the operations panel: server-paged, "Free" months, PDF preview. */
export function OperationsInvoicesTable({
  page,
  controls,
  onOpen,
  emptyIllustration,
}: {
  page: Page<InvoiceListItem>;
  controls: ServerPageControls;
  onOpen: (invoice: InvoiceListItem) => void;
  emptyIllustration?: IllustrationName | undefined;
}) {
  const { t } = useTranslation("billing");
  const pager = useServerPagination(page, controls);

  const columns: DataTableColumn<InvoiceListItem>[] = [
    {
      id: "period",
      header: t("screen.colPeriod"),
      cell: (invoice) => (
        <span className="text-foreground">
          {formatMonth(invoice.periodStart, { style: "long", withYear: true })}
        </span>
      ),
    },
    {
      id: "number",
      header: t("screen.colNumber"),
      cell: (invoice) => (
        <span className="text-xs tabular-nums text-muted-foreground">{invoice.number}</span>
      ),
    },
    {
      id: "total",
      header: t("screen.colTotal"),
      align: "end",
      cell: (invoice) =>
        invoice.totalMinor === 0 ? (
          <span className="rounded-full border border-[#A2E8DD]/40 bg-[#A2E8DD]/10 px-2.5 py-0.5 text-[0.68rem] text-[#A2E8DD]">
            {t("screen.freePill")}
          </span>
        ) : (
          <span dir="ltr" className="whitespace-nowrap tabular-nums text-foreground">
            {formatMoney(invoice.totalMinor, ACCOUNT_CURRENCY)}
          </span>
        ),
    },
    {
      id: "status",
      header: t("screen.colStatus"),
      cell: (invoice) => <InvoiceStatusPill status={invoice.status} />,
    },
    {
      id: "due",
      header: t("screen.colDue"),
      cell: (invoice) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {invoice.dueDate ? formatDate(parseDay(invoice.dueDate)) : "—"}
        </span>
      ),
    },
    {
      id: "pdf",
      header: <span className="sr-only">{t("screen.pdf")}</span>,
      align: "end",
      cell: (invoice) => (
        <Button
          variant="outlineGold"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(invoice);
          }}
          className="h-8 px-2.5 text-[0.7rem]"
        >
          <FileText className="size-3.5" aria-hidden="true" />
          {t("screen.pdf")}
        </Button>
      ),
    },
  ];

  return (
    <section aria-labelledby="billing-invoices" className="space-y-3">
      <h2 id="billing-invoices" className="font-serif text-xl tracking-normal text-[#F8F9FA]">
        {t("screen.invoicesTitle")}
      </h2>
      <DataTable
        label={t("screen.invoicesTitle")}
        columns={columns}
        pagination={pager}
        getRowId={(invoice) => invoice.id}
        onRowClick={onOpen}
        rowClassName={(invoice) =>
          invoice.status === "overdue"
            ? "[&>td:first-child]:shadow-[inset_3px_0_0_#FF85A1] rtl:[&>td:first-child]:shadow-[inset_-3px_0_0_#FF85A1] border-s-[3px] border-s-[#FF85A1] md:border-s-0"
            : undefined
        }
        empty={
          <EmptyState
            illustration="ledger"
            {...(emptyIllustration ? { illustrationName: emptyIllustration } : {})}
            title={t("screen.noInvoicesTitle")}
            description={t("screen.noInvoicesBody")}
            className="min-h-56"
          />
        }
      />
    </section>
  );
}
