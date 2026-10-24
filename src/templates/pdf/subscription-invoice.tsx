import { endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { monthRange } from "@/lib/dates";
import { formatRib } from "@/lib/issuer";
import type { InvoiceDocumentContext, InvoiceLine, SubscriptionInvoice } from "@/types/billing";
import { useTemplateLocale } from "../shared/locale";
import type { TemplateLang, TemplateLocale } from "../shared/locale";
import { usePdf } from "./context";
import { invoiceLineText } from "./invoice-lines";
import { paginate } from "./paginate";
import {
  PdfDocument,
  PdfLabel,
  PdfLegalFooter,
  PdfPage,
  PdfPaymentBox,
  PdfSection,
  PdfStamp,
} from "./primitives";
import { PDF_TD, PDF_TH, companyLegalIdentifiers } from "./styles";

/**
 * Rows per A4 page, measured on a 12.4 mm row with a little room to spare: page one has about 14
 * rows after the parties and period, later pages 18, and the totals, payment box and stamp
 * take the room of 6 rows on the last page.
 */
const CAPACITY = { firstPage: 13, nextPage: 18, closing: 6 } as const;

export interface SubscriptionInvoicePdfProps {
  invoice: SubscriptionInvoice;
  context: InvoiceDocumentContext;
  /** Language of the document; the app's current language when left out */
  lang?: TemplateLang;
}

/**
 * The subscription invoice Velvet Keys sends a client, on A4. Until the company legal details are
 * registered it is marked PRO-FORMA on every page. One implementation serves the print layout, the
 * on-screen previews in the Billing and Admin screens, and a future backend.
 */
export function SubscriptionInvoicePdf({ invoice, context, lang }: SubscriptionInvoicePdfProps) {
  const locale = useTemplateLocale(lang);
  return <SubscriptionInvoiceLayout locale={locale} invoice={invoice} context={context} />;
}

function SubscriptionInvoiceLayout({
  locale,
  invoice,
  context,
}: {
  locale: TemplateLocale;
  invoice: SubscriptionInvoice;
  context: InvoiceDocumentContext;
}) {
  const { t } = locale;
  const { companyLegal } = context;
  const pages = paginate(invoice.lines, CAPACITY);
  const sender = companyLegal.name || locale.brand;

  return (
    <PdfDocument locale={locale}>
      {pages.map((rows, index) => (
        <PdfPage
          key={index}
          page={index + 1}
          pages={pages.length}
          title={t(invoice.proForma ? "billing:doc.proFormaTitle" : "billing:doc.title")}
          reference={invoice.number}
          details={
            <>
              <p>{t("billing:doc.issuedOn", { date: locale.formatDate(invoice.issuedAt) })}</p>
              <p>{t("billing:doc.dueOn", { date: locale.formatDate(invoice.dueDate) })}</p>
            </>
          }
          watermark={invoice.proForma ? t("billing:doc.proFormaWatermark") : undefined}
          footer={
            <PdfLegalFooter
              name={sender}
              address={companyLegal.address}
              identifiers={companyLegalIdentifiers(locale, companyLegal)}
              note={invoice.proForma ? t("billing:doc.proFormaNote") : undefined}
            />
          }
        >
          {index === 0 && <Parties locale={locale} context={context} />}
          {index === 0 && (
            <p className="text-[8.5pt] text-[#0B0B0B]/70">
              {t("billing:doc.period", {
                month: locale.formatMonth(invoice.period),
                from: locale.formatDate(toDay(monthRange(invoice.period).from)),
                to: locale.formatDate(toDay(endOfMonth(monthRange(invoice.period).from))),
              })}
            </p>
          )}

          <LinesTable locale={locale} invoice={invoice} rows={rows} />

          {index === pages.length - 1 && (
            <>
              <Totals locale={locale} invoice={invoice} vatRate={context.vatRate} />
              <PdfPaymentBox
                title={t("billing:doc.payBy", { date: locale.formatDate(invoice.dueDate) })}
                rows={[
                  { label: t("billing:doc.beneficiary"), value: sender },
                  {
                    label: t("billing:doc.rib"),
                    value: companyLegal.rib
                      ? formatRib(companyLegal.rib)
                      : t("billing:doc.ribPending"),
                    mono: Boolean(companyLegal.rib),
                  },
                  { label: t("billing:doc.reference"), value: invoice.number, mono: true },
                ]}
              />
              {(invoice.status === "paid" || invoice.status === "overdue") && (
                <PdfStamp tone={invoice.status === "paid" ? "paid" : "overdue"}>
                  {invoice.status === "paid" && invoice.paidAt
                    ? t("billing:doc.paidOn", { date: locale.formatDate(invoice.paidAt) })
                    : t(`billing:invoiceStatus.${invoice.status}`)}
                </PdfStamp>
              )}
            </>
          )}
        </PdfPage>
      ))}
    </PdfDocument>
  );
}

/** A local date from date-fns as the calendar day the formatters expect. */
function toDay(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function Parties({ locale, context }: { locale: TemplateLocale; context: InvoiceDocumentContext }) {
  const { t } = locale;
  const { serif } = usePdf();
  const { companyLegal, account, holder } = context;
  const client = account.issuerProfile;
  const clientName = client?.name ?? account.name;
  const name = "text-[12pt] font-semibold rtl:text-right";
  const soft = "text-[#0B0B0B]/70 rtl:text-right";

  return (
    <PdfSection>
      <div className="grid grid-cols-2 gap-[8mm]">
        <div className="space-y-[0.8mm]">
          <PdfLabel>{t("billing:doc.from")}</PdfLabel>
          <p dir="auto" className={name} style={{ fontFamily: serif }}>
            {companyLegal.name || locale.brand}
          </p>
          {companyLegal.address && (
            <p dir="auto" className={soft}>
              {companyLegal.address}
            </p>
          )}
        </div>
        <div className="space-y-[0.8mm]">
          <PdfLabel>{t("billing:doc.billedTo")}</PdfLabel>
          <p dir="auto" className={name} style={{ fontFamily: serif }}>
            {clientName}
          </p>
          {holder.name !== clientName && (
            <p dir="auto" className={soft}>
              {holder.name}
            </p>
          )}
          {client?.address && (
            <p dir="auto" className={soft}>
              {client.address}
            </p>
          )}
          {client?.ice && (
            <p className={soft}>
              {t("billing:doc.legal.ice")} <span className="font-mono">{client.ice}</span>
            </p>
          )}
          <p dir="ltr" className={soft}>
            {holder.email}
          </p>
        </div>
      </div>
    </PdfSection>
  );
}

function LinesTable({
  locale,
  invoice,
  rows,
}: {
  locale: TemplateLocale;
  invoice: SubscriptionInvoice;
  rows: InvoiceLine[];
}) {
  const { t } = locale;
  return (
    <table className="w-full text-[8.5pt]">
      <thead>
        <tr>
          <th scope="col" className={PDF_TH}>
            {t("billing:doc.description")}
          </th>
          <th scope="col" className={cn(PDF_TH, "text-end")}>
            {t("billing:doc.amount")}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((line, index) => {
          const text = invoiceLineText(locale, line, invoice.period);
          return (
            <tr key={index}>
              <td className={PDF_TD}>
                <span className={cn(line.type === "offer" && "text-[#8C6B14]")}>{text.label}</span>
                <span className="block text-[7.5pt] text-[#0B0B0B]/60">{text.detail}</span>
              </td>
              <td className={cn(PDF_TD, "whitespace-nowrap text-end")}>
                {locale.formatMAD(line.total)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Totals({
  locale,
  invoice,
  vatRate,
}: {
  locale: TemplateLocale;
  invoice: SubscriptionInvoice;
  vatRate: number;
}) {
  const { t } = locale;
  const { serif } = usePdf();
  return (
    <dl className="ms-auto grid w-[78mm] grid-cols-[1fr_auto] gap-x-[6mm] gap-y-[1.2mm] text-[8.5pt]">
      <dt className="text-[#0B0B0B]/70">{t("billing:doc.subtotal")}</dt>
      <dd className="text-end">{locale.formatMAD(invoice.subtotal)}</dd>
      <dt className="text-[#0B0B0B]/70">
        {t("billing:doc.vat", { rate: locale.formatPercent(vatRate * 100, 0) })}
      </dt>
      <dd className="text-end">{locale.formatMAD(invoice.vat)}</dd>
      <dt
        className="mt-[1mm] border-t-[0.3mm] border-[#D4AF37] pt-[2mm] text-[11pt] font-semibold"
        style={{ fontFamily: serif }}
      >
        {t("billing:doc.total")}
      </dt>
      <dd className="mt-[1mm] border-t-[0.3mm] border-[#D4AF37] pt-[2mm] text-end text-[12pt] font-bold">
        {locale.formatMAD(invoice.total)}
      </dd>
    </dl>
  );
}
