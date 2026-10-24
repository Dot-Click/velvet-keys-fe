import { addDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { SubscriptionInvoiceDocument } from "@/components/billing/subscription-invoice-document";
import { checkCompanyLegal } from "@/lib/admin";
import { INVOICE_DUE_DAYS } from "@/lib/billing";
import { today } from "@/lib/clock";
import { toISODate, toMonthKey } from "@/lib/dates";
import type { InvoiceDocumentContext, SubscriptionInvoice } from "@/types/billing";
import type { CompanyLegal } from "@/types/platform-admin";

/**
 * The top of a subscription invoice, drawn with the company details as typed: the same document
 * clients receive, cropped after the sender and client blocks. It carries the PRO-FORMA marks
 * until every field is filled in correctly.
 */
export function InvoiceHeaderPreview({ legal }: { legal: CompanyLegal }) {
  const { t } = useTranslation("admin");
  const now = today();
  const proForma = Object.keys(checkCompanyLegal(legal)).length > 0;

  const invoice: SubscriptionInvoice = {
    id: "preview",
    number: `VK-${now.getFullYear()}-0001`,
    accountId: "preview",
    period: toMonthKey(now),
    lines: [],
    subtotal: 0,
    vat: 0,
    total: 0,
    status: "sent",
    proForma,
    issuedAt: toISODate(now),
    dueDate: toISODate(addDays(now, INVOICE_DUE_DAYS)),
  };
  const context: InvoiceDocumentContext = {
    account: { name: t("settings.preview.sampleClient") },
    holder: { name: t("settings.preview.sampleHolder"), email: "client@example.com" },
    companyLegal: legal,
    vatRate: 0.2,
  };

  return (
    // The top 74 mm of the A4 page, whatever size the preview is scaled to
    <div className="relative aspect-[210/74] overflow-hidden rounded-lg">
      <SubscriptionInvoiceDocument invoice={invoice} overview={context} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[18%] bg-gradient-to-t from-[#121212] to-transparent"
      />
    </div>
  );
}
