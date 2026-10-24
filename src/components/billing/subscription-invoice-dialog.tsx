import * as React from "react";
import { createPortal } from "react-dom";
import { Download, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscriptionInvoice } from "@/hooks/use-portfolio-data";
import { hasErrorCode } from "@/lib/apiClient";
import { formatDate, formatMonth } from "@/lib/currency";
import { subscriptionService } from "@/services/subscription-service";
import { AccountInvoiceDocument } from "./account-invoice-document";
import { InvoiceStatusPill } from "./invoice-status-pill";

/** While printing, only the invoice is shown, so "Save as PDF" produces a clean page. */
const PRINT_ONLY_INVOICE = `@media print {
  body > *:not([data-subscription-invoice-print]) { display: none !important; }
  body { background: #ffffff !important; }
}`;

/**
 * Subscription invoice preview: fetches the full `InvoiceDetail` (lines, snapshots, status
 * history) lazily, only once a row is opened -- the list only ever carries `InvoiceListItem`.
 */
export function SubscriptionInvoiceDialog({
  invoiceId,
  onClose,
}: {
  invoiceId: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation(["billing", "common"]);
  const query = useSubscriptionInvoice(invoiceId);
  const invoice = query.data;

  const downloadPdf = async () => {
    if (!invoiceId) return;
    try {
      await subscriptionService.getInvoicePdf(invoiceId);
    } catch (error) {
      if (hasErrorCode(error, "PDF_NOT_YET_AVAILABLE")) {
        toast.info(t("screen.pdfComingSoonTitle"), { description: t("screen.pdfComingSoonBody") });
      } else {
        toast.error(t("common:states.errorBody"));
      }
    }
  };

  return (
    <Dialog open={Boolean(invoiceId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border-primary/30 bg-[#141414] sm:rounded-2xl">
        {invoiceId && (
          <>
            <DialogHeader className="flex flex-col gap-3 pe-8 text-start rtl:ps-8 sm:flex-row sm:items-center sm:justify-between sm:text-start">
              <div className="space-y-1">
                <p className="text-label-caps text-primary">{t("screen.previewBadge")}</p>
                <DialogTitle className="font-display text-xl uppercase tracking-[0.12em] text-foreground">
                  {invoice?.number ?? "…"}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {invoice && (
                    <>
                      {formatMonth(invoice.periodStart, { style: "long", withYear: true })}
                      <InvoiceStatusPill status={invoice.status} />
                    </>
                  )}
                </DialogDescription>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outlineGold"
                  onClick={() => void downloadPdf()}
                  className="text-xs font-semibold uppercase tracking-wider"
                >
                  <Download className="size-3.5" aria-hidden="true" />
                  {t("screen.downloadPdf")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => window.print()}
                  disabled={!invoice}
                  className="btn-shimmer bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground"
                >
                  <Printer className="size-3.5" aria-hidden="true" />
                  {t("screen.print")}
                </Button>
              </div>
            </DialogHeader>

            {query.isPending ? (
              <div className="space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : query.isError || !invoice ? (
              <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive-foreground">
                {t("common:states.errorBody")}
              </p>
            ) : (
              <>
                <AccountInvoiceDocument invoice={invoice} />
                <StatusTimeline invoice={invoice} />
                <p className="text-[0.68rem] text-muted-foreground">{t("screen.printHint")}</p>
                <PrintCopy>
                  <AccountInvoiceDocument invoice={invoice} />
                </PrintCopy>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatusTimeline({
  invoice,
}: {
  invoice: NonNullable<ReturnType<typeof useSubscriptionInvoice>["data"]>;
}) {
  const { t } = useTranslation("billing");
  if (invoice.statusTimeline.length === 0) return null;
  return (
    <section aria-labelledby="invoice-status-history" className="space-y-3">
      <h3 id="invoice-status-history" className="text-label-caps text-muted-foreground">
        {t("screen.statusHistory")}
      </h3>
      <ol className="relative space-y-3 border-s border-border/70 ps-5">
        {invoice.statusTimeline.map((step, index) => (
          <li key={`${step.step}-${index}`} className="relative space-y-0.5">
            <span className="absolute -start-[1.4rem] top-1 size-2.5 rounded-full border-2 border-primary bg-[#141414]" />
            <p className="text-sm text-foreground">{t(`invoiceTimelineStep.${step.step}`)}</p>
            <p className="text-[0.7rem] text-muted-foreground">{formatDate(step.at)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** A second copy outside the dialog, hidden on screen and the only thing printed. */
export function PrintCopy({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div data-subscription-invoice-print="" className="hidden print:block">
      <style>{PRINT_ONLY_INVOICE}</style>
      {children}
    </div>,
    document.body,
  );
}
