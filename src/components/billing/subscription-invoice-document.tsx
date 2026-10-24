import { PdfPreview } from "@/templates/pdf/pdf-preview";
import { SubscriptionInvoicePdf } from "@/templates/pdf/subscription-invoice";
import type { InvoiceDocumentContext, SubscriptionInvoice } from "@/types/billing";

/**
 * Subscription invoice on screen: the A4 template, scaled to fit the space it is in and printed at
 * full size. The layout itself lives in `templates/pdf/subscription-invoice`, shared with the
 * documents a backend generates.
 *
 * Still used by the Admin screens (invoice-header-preview.tsx, routes/admin/invoices/$invoiceId)
 * on the old mock `SubscriptionInvoice`/`InvoiceDocumentContext` shape -- the real account Billing
 * screen renders its own `AccountInvoiceDocument` from the real `InvoiceDetail` instead.
 */
export function SubscriptionInvoiceDocument({
  invoice,
  overview,
}: {
  invoice: SubscriptionInvoice;
  overview: InvoiceDocumentContext;
}) {
  return (
    <PdfPreview>
      <SubscriptionInvoicePdf invoice={invoice} context={overview} />
    </PdfPreview>
  );
}
