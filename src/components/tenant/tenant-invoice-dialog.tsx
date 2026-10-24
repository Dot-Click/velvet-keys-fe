import * as React from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RentInvoiceDocument } from "@/components/conciergerie/rent-invoice-document";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMonth } from "@/lib/currency";
import type { RentInvoice } from "@/types/ltr";
import { TenantRentPill } from "./tenant-rent-pill";

/** While printing, only the invoice is shown, so "Save as PDF" produces a clean page. */
const PRINT_ONLY_INVOICE = `@media print {
  body > *:not([data-tenant-invoice-print]) { display: none !important; }
  body { background: #ffffff !important; }
  @page { margin: 12mm; }
}`;

/**
 * The rent invoice the manager issued, on the same template as the conciergerie preview. A
 * tenant only ever sees the manager's current RIB (`issuerRib` from GET /tenant/home), not a
 * full issuer profile, so the printed beneficiary name falls back to the manager's name.
 */
export function TenantInvoiceDialog({
  invoice,
  managerName,
  issuerRib,
  onClose,
}: {
  invoice: RentInvoice | null;
  managerName: string;
  issuerRib: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation("tenant");
  return (
    <Dialog open={Boolean(invoice)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border-primary/30 bg-[#141414] sm:rounded-2xl">
        {invoice && (
          <>
            <DialogHeader className="flex flex-col gap-3 pe-8 text-start rtl:ps-8 sm:flex-row sm:items-center sm:justify-between sm:text-start">
              <div className="space-y-1">
                <p className="text-label-caps text-primary">{t("invoices.previewBadge")}</p>
                <DialogTitle className="font-display text-xl uppercase tracking-[0.12em] text-foreground">
                  {invoice.number}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {formatMonth(invoice.period, { style: "long", withYear: true })}
                  <TenantRentPill status={invoice.status} />
                </DialogDescription>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => window.print()}
                className="btn-shimmer shrink-0 bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground"
              >
                <Printer className="size-3.5" aria-hidden="true" />
                {t("invoices.print")}
              </Button>
            </DialogHeader>
            <RentInvoiceDocument
              invoice={invoice}
              issuer={{ name: managerName, rib: issuerRib }}
            />
            <p className="text-[0.68rem] text-muted-foreground">{t("invoices.printHint")}</p>
            <PrintCopy>
              <RentInvoiceDocument
                invoice={invoice}
                issuer={{ name: managerName, rib: issuerRib }}
              />
            </PrintCopy>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** A second copy outside the dialog, hidden on screen and the only thing printed. */
function PrintCopy({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div data-tenant-invoice-print="" className="hidden print:block">
      <style>{PRINT_ONLY_INVOICE}</style>
      {children}
    </div>,
    document.body,
  );
}
