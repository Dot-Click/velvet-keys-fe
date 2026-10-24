import * as React from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useIssuerProfile } from "@/hooks/use-portfolio-data";
import { formatMonth } from "@/lib/currency";
import type { RentInvoice } from "@/types/ltr";
import { RentInvoiceDocument } from "./rent-invoice-document";

/** While printing, only the invoice is shown, so "Save as PDF" produces a clean page. */
const PRINT_ONLY_INVOICE = `@media print {
  body > *:not([data-rent-invoice-print]) { display: none !important; }
  body { background: #ffffff !important; }
  @page { margin: 12mm; }
}`;

/**
 * Invoice preview with a print / save-as-PDF action. The backend has no single
 * GET-invoice-by-id endpoint (and its PDF endpoint is not implemented yet -- 501
 * PDF_NOT_YET_AVAILABLE), so the caller passes the invoice it already loaded from a list, and
 * this renders it client-side using the account's current issuer profile.
 */
export function RentInvoicePreviewDialog({
  invoice,
  onClose,
}: {
  invoice: RentInvoice | null;
  onClose: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const issuer = useIssuerProfile();

  return (
    <Dialog open={Boolean(invoice)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border-primary/30 bg-[#141414] sm:rounded-2xl">
        <DialogHeader className="flex flex-col gap-3 pe-8 text-start rtl:ps-8 sm:flex-row sm:items-center sm:justify-between sm:text-start">
          <div className="space-y-1">
            <p className="text-label-caps text-primary">{t("rentInvoices.previewBadge")}</p>
            <DialogTitle className="font-display text-xl uppercase tracking-[0.12em] text-foreground">
              {invoice?.number ?? t("rentInvoices.previewTitle")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {invoice
                ? `${invoice.tenantName} · ${formatMonth(invoice.period, { style: "long", withYear: true })}`
                : t("common:states.loading")}
            </DialogDescription>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!invoice || issuer.isPending}
            onClick={() => window.print()}
            className="btn-shimmer shrink-0 bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground"
          >
            <Printer className="size-3.5" aria-hidden="true" />
            {t("rentInvoices.print")}
          </Button>
        </DialogHeader>

        {invoice && issuer.data ? (
          <>
            <RentInvoiceDocument invoice={invoice} issuer={issuer.data} />
            <p className="text-[0.68rem] text-muted-foreground">{t("rentInvoices.printHint")}</p>
            <PrintCopy>
              <RentInvoiceDocument invoice={invoice} issuer={issuer.data} />
            </PrintCopy>
          </>
        ) : (
          <div className="space-y-4 rounded-lg bg-[#F8F9FA]/5 p-6" aria-busy="true">
            <Skeleton className="h-16 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** A second copy outside the dialog, hidden on screen and the only thing printed. */
function PrintCopy({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div data-rent-invoice-print="" className="hidden print:block">
      <style>{PRINT_ONLY_INVOICE}</style>
      {children}
    </div>,
    document.body,
  );
}
