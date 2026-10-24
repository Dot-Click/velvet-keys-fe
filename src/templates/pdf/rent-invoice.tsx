import { cn } from "@/lib/utils";
import { formatRib } from "@/lib/issuer";
import type { RentInvoiceRow } from "@/types/lease";
import { useTemplateLocale } from "../shared/locale";
import type { TemplateLang } from "../shared/locale";
import { usePdf } from "./context";
import {
  PdfDocument,
  PdfLabel,
  PdfLegalFooter,
  PdfPage,
  PdfPaymentBox,
  PdfSection,
  PdfStamp,
} from "./primitives";
import { PDF_TD, PDF_TH } from "./styles";

export interface RentInvoicePdfProps {
  row: RentInvoiceRow;
  /** Language of the document; the app's current language when left out */
  lang?: TemplateLang;
}

/**
 * The monthly rent invoice a manager sends a tenant. It prints the issuer details the invoice
 * was issued with, and the tenant pays by bank transfer to the issuer's RIB.
 */
export function RentInvoicePdf({ row, lang }: RentInvoicePdfProps) {
  const locale = useTemplateLocale(lang);
  const { t } = locale;
  const { invoice, status } = row;
  const issuer = invoice.issuerProfile;
  const iceLabel = t("conciergerie:invoiceDoc.ice");

  return (
    <PdfDocument locale={locale}>
      <PdfPage
        page={1}
        pages={1}
        title={t("conciergerie:invoiceDoc.title")}
        reference={invoice.number}
        details={
          <>
            <p>
              {t("conciergerie:invoiceDoc.issuedOn", { date: locale.formatDate(invoice.issuedAt) })}
            </p>
            <p>
              {t("conciergerie:invoiceDoc.dueOn", { date: locale.formatDate(invoice.dueDate) })}
            </p>
          </>
        }
        footer={
          <>
            <PdfLegalFooter
              name={issuer.name}
              address={issuer.address}
              identifiers={[
                { label: iceLabel, value: issuer.ice },
                { label: t("conciergerie:invoiceDoc.rib"), value: formatRib(issuer.rib) },
              ]}
            />
            <p>{t("conciergerie:invoiceDoc.footer", { brand: locale.brand })}</p>
          </>
        }
      >
        <Parties row={row} />

        <PdfSection>
          <table className="w-full text-[8.5pt]">
            <thead>
              <tr>
                <th scope="col" className={PDF_TH}>
                  {t("conciergerie:invoiceDoc.description")}
                </th>
                <th scope="col" className={cn(PDF_TH, "text-end")}>
                  {t("conciergerie:invoiceDoc.amount")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={PDF_TD}>
                  {t("conciergerie:invoiceDoc.rentLine", { unit: row.unitName })}
                  <span className="block text-[7.5pt] text-[#0B0B0B]/60">
                    {locale.formatMonth(invoice.period)}
                  </span>
                </td>
                <td className={cn(PDF_TD, "whitespace-nowrap text-end")}>
                  {locale.formatMAD(invoice.amountMAD)}
                </td>
              </tr>
            </tbody>
          </table>
          <TotalDue locale={locale} amount={invoice.amountMAD} />
        </PdfSection>

        <PdfPaymentBox
          title={t("conciergerie:invoiceDoc.payBy")}
          rows={[
            { label: t("conciergerie:invoiceDoc.beneficiary"), value: issuer.name },
            { label: t("conciergerie:invoiceDoc.rib"), value: formatRib(issuer.rib), mono: true },
            { label: t("conciergerie:invoiceDoc.reference"), value: invoice.number, mono: true },
          ]}
        />

        {status === "paid" ? (
          <PdfStamp tone="paid">
            {invoice.paidAt
              ? t("conciergerie:invoiceDoc.paidOn", { date: locale.formatDate(invoice.paidAt) })
              : t("conciergerie:leases.rentStatus.paid")}
          </PdfStamp>
        ) : status === "late" ? (
          <PdfStamp tone="overdue">{t("conciergerie:leases.rentStatus.late")}</PdfStamp>
        ) : null}
      </PdfPage>
    </PdfDocument>
  );
}

function Parties({ row }: { row: RentInvoiceRow }) {
  const { locale, serif } = usePdf();
  const { t } = locale;
  const { invoice, tenant } = row;
  const issuer = invoice.issuerProfile;
  const name = "text-[12pt] font-semibold rtl:text-right";
  const soft = "text-[#0B0B0B]/70 rtl:text-right";

  return (
    <PdfSection>
      <div className="grid grid-cols-2 gap-[8mm]">
        <div className="space-y-[0.8mm]">
          <PdfLabel>{t("billing:doc.from")}</PdfLabel>
          <p dir="auto" className={name} style={{ fontFamily: serif }}>
            {issuer.name}
          </p>
          <p dir="auto" className={cn("whitespace-pre-line", soft)}>
            {issuer.address}
          </p>
          {issuer.ice && (
            <p className={soft}>
              {t("conciergerie:invoiceDoc.ice")} <span className="font-mono">{issuer.ice}</span>
            </p>
          )}
        </div>
        <div className="space-y-[0.8mm]">
          <PdfLabel>{t("conciergerie:invoiceDoc.billedTo")}</PdfLabel>
          <p dir="auto" className={name} style={{ fontFamily: serif }}>
            {tenant?.name}
          </p>
          {tenant && (
            <>
              <p dir="ltr" className={soft}>
                {tenant.email}
              </p>
              <p dir="ltr" className={soft}>
                {tenant.phone}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="mt-[5mm] space-y-[0.8mm]">
        <PdfLabel>{t("conciergerie:invoiceDoc.property")}</PdfLabel>
        <p dir="auto" className={name} style={{ fontFamily: serif }}>
          {row.propertyName} · {row.unitName}
        </p>
        <p dir="auto" className={soft}>
          {row.propertyAddress}, {row.city}
        </p>
      </div>
    </PdfSection>
  );
}

function TotalDue({
  locale,
  amount,
}: {
  locale: ReturnType<typeof useTemplateLocale>;
  amount: number;
}) {
  const { serif } = usePdf();
  return (
    <dl className="ms-auto mt-[3mm] grid w-[78mm] grid-cols-[1fr_auto] gap-x-[6mm] border-t-[0.3mm] border-[#D4AF37] pt-[2mm]">
      <dt className="text-[11pt] font-semibold" style={{ fontFamily: serif }}>
        {locale.t("conciergerie:invoiceDoc.total")}
      </dt>
      <dd className="text-end text-[12pt] font-bold">{locale.formatMAD(amount)}</dd>
    </dl>
  );
}
