import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { IllustrationName } from "@/assets/manifest";
import { EmptyState } from "@/components/empty-state";
import { ListPagination } from "@/components/list-pagination";
import { Button } from "@/components/ui/button";
import type { ServerPageControls } from "@/hooks/use-server-pagination";
import { useServerPagination } from "@/hooks/use-server-pagination";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import type { Page } from "@/lib/apiClient";
import { formatDate, formatMonth } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { InvoiceListItem } from "@/types/subscription";
import { InvoiceStatusPill } from "./invoice-status-pill";

/** Every subscription invoice, newest period first; overdue ones get a ruby edge. */
export function SubscriptionInvoicesTable({
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

  return (
    <section aria-labelledby="billing-invoices" className="space-y-4">
      <div>
        <p className="text-label-caps text-primary">{t("screen.invoicesBadge")}</p>
        <h2
          id="billing-invoices"
          className="font-display text-2xl uppercase tracking-[0.1em] text-[#F8F9FA]"
        >
          {t("screen.invoicesTitle")}
        </h2>
      </div>

      {page.total === 0 ? (
        <EmptyState
          illustration="ledger"
          {...(emptyIllustration ? { illustrationName: emptyIllustration } : {})}
          title={t("screen.noInvoicesTitle")}
          description={t("screen.noInvoicesBody")}
          className="min-h-64"
        />
      ) : (
        <>
          {/* Phones: one card per invoice */}
          <ul className="space-y-3 md:hidden">
            {pager.items.map((invoice) => (
              <li
                key={invoice.id}
                className={cn(
                  "space-y-3 rounded-xl border p-4",
                  invoice.status === "overdue"
                    ? "border-destructive/60 bg-destructive/10 shadow-[inset_3px_0_0_var(--destructive)] rtl:shadow-[inset_-3px_0_0_var(--destructive)]"
                    : "border-border/80 bg-[#141414]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-base font-semibold text-foreground">
                      {formatMonth(invoice.periodStart, { style: "long", withYear: true })}
                    </p>
                    <p className="font-mono text-[0.68rem] text-muted-foreground">
                      {invoice.number}
                    </p>
                  </div>
                  <InvoiceStatusPill status={invoice.status} />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-foreground">
                      {formatMoney(invoice.totalMinor, ACCOUNT_CURRENCY)}
                    </p>
                    {invoice.dueDate && (
                      <p className="text-[0.68rem] text-muted-foreground">
                        {t("screen.dueOn", { date: formatDate(parseDay(invoice.dueDate)) })}
                      </p>
                    )}
                  </div>
                  <PdfButton onClick={() => onOpen(invoice)} />
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="relative hidden overflow-x-auto rounded-xl border border-primary/20 bg-[#141414] shadow-2xl md:block">
            <table className="w-full whitespace-nowrap text-sm">
              <thead className="border-b border-border/80 bg-[#111111]/95 text-[0.68rem] uppercase tracking-[0.15em] text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-4 text-start font-medium">
                    {t("screen.colPeriod")}
                  </th>
                  <th scope="col" className="px-5 py-4 text-start font-medium">
                    {t("screen.colNumber")}
                  </th>
                  <th scope="col" className="px-5 py-4 text-end font-medium">
                    {t("screen.colTotal")}
                  </th>
                  <th scope="col" className="px-5 py-4 text-start font-medium">
                    {t("screen.colStatus")}
                  </th>
                  <th scope="col" className="px-5 py-4 text-start font-medium">
                    {t("screen.colDue")}
                  </th>
                  <th scope="col" className="px-5 py-4 text-end font-medium">
                    {t("screen.colPdf")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pager.items.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className={cn(
                      invoice.status === "overdue" &&
                        "bg-destructive/10 shadow-[inset_3px_0_0_var(--destructive)] rtl:shadow-[inset_-3px_0_0_var(--destructive)]",
                    )}
                  >
                    <td className="px-5 py-4 font-serif text-base text-foreground">
                      {formatMonth(invoice.periodStart, { style: "long", withYear: true })}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                      {invoice.number}
                    </td>
                    <td className="px-5 py-4 text-end font-mono text-foreground">
                      {formatMoney(invoice.totalMinor, ACCOUNT_CURRENCY)}
                    </td>
                    <td className="px-5 py-4">
                      <InvoiceStatusPill status={invoice.status} />
                    </td>
                    <td
                      className={cn(
                        "px-5 py-4 text-xs",
                        invoice.status === "overdue" ? "text-[#FF85A1]" : "text-muted-foreground",
                      )}
                    >
                      {invoice.dueDate ? formatDate(parseDay(invoice.dueDate)) : "—"}
                    </td>
                    <td className="px-5 py-4 text-end">
                      <PdfButton onClick={() => onOpen(invoice)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ListPagination pagination={pager} />
        </>
      )}
    </section>
  );
}

function PdfButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation("billing");
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-8 text-[0.68rem] uppercase tracking-wider"
    >
      <FileText className="size-3.5" aria-hidden="true" />
      {t("screen.pdf")}
    </Button>
  );
}
