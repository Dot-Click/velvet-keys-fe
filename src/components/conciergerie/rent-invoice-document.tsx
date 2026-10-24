import { useTranslation } from "react-i18next";
import type { RentInvoice } from "@/types/ltr";
import { formatDate, formatMonth } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { parseDay } from "@/lib/dates";
import { formatRib } from "@/lib/issuer";
import { cn } from "@/lib/utils";

/** The issuer details printed on an invoice. Conciergerie knows all of it; a tenant only the RIB. */
export interface InvoiceIssuer {
  name: string | null;
  address?: string | null;
  ice?: string | null;
  rib: string | null;
}

/** Name, address and ICE as printed at the top of a rent invoice. */
export function IssuerHeader({ issuer, className }: { issuer: InvoiceIssuer; className?: string }) {
  const { t } = useTranslation("conciergerie");
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <p
        dir="auto"
        className={cn(
          "rtl:text-right font-display text-2xl uppercase tracking-[0.08em] break-words",
          issuer.name ? "text-[#0B0B0B]" : "text-[#0B0B0B]/30",
        )}
      >
        {issuer.name || t("issuer.namePlaceholder")}
      </p>
      {issuer.address !== undefined && (
        <p
          dir="auto"
          className={cn(
            "rtl:text-right whitespace-pre-line text-xs leading-relaxed",
            issuer.address ? "text-[#0B0B0B]/70" : "text-[#0B0B0B]/30",
          )}
        >
          {issuer.address || t("issuer.addressPlaceholder")}
        </p>
      )}
      {issuer.ice && (
        <p className="text-[0.7rem] text-[#0B0B0B]/70">
          {t("invoiceDoc.ice")} <span className="font-mono">{issuer.ice}</span>
        </p>
      )}
    </div>
  );
}

/**
 * The rent invoice a manager sends a tenant, laid out as a printable page in the reader's
 * language. The backend does not snapshot the issuer profile per invoice (unlike the earlier
 * mock), so this always prints the issuer's *current* details, passed in by the caller.
 */
export function RentInvoiceDocument({
  invoice,
  issuer,
}: {
  invoice: RentInvoice;
  issuer: InvoiceIssuer;
}) {
  const { t, i18n } = useTranslation(["conciergerie", "common"]);
  const month = formatMonth(invoice.period, { style: "long", withYear: true });

  return (
    <article
      dir={i18n.dir()}
      lang={i18n.language}
      className="space-y-8 rounded-lg bg-[#F8F9FA] p-6 text-[#0B0B0B] shadow-2xl [print-color-adjust:exact] sm:p-10"
    >
      <header className="flex flex-col gap-6 border-b-2 border-[#D4AF37] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <IssuerHeader issuer={issuer} />
        <div className="shrink-0 space-y-1 sm:text-end">
          <p className="text-label-caps text-[#8C6B14]">{t("invoiceDoc.title")}</p>
          <p className="font-mono text-sm font-semibold">{invoice.number}</p>
          <p className="text-xs text-[#0B0B0B]/70">
            {t("invoiceDoc.dueOn", { date: formatDate(parseDay(invoice.dueDate)) })}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#0B0B0B]/50">
            {t("invoiceDoc.billedTo")}
          </p>
          <p dir="auto" className="rtl:text-right font-serif text-lg font-semibold">
            {invoice.tenantName}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#0B0B0B]/50">
            {t("invoiceDoc.property")}
          </p>
          <p dir="auto" className="rtl:text-right font-serif text-lg font-semibold">
            {invoice.propertyName} · {invoice.unitName}
          </p>
        </div>
      </section>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#0B0B0B]/15 text-[0.62rem] uppercase tracking-[0.18em] text-[#0B0B0B]/50">
            <th scope="col" className="py-2 text-start font-semibold">
              {t("invoiceDoc.description")}
            </th>
            <th scope="col" className="py-2 text-end font-semibold">
              {t("invoiceDoc.amount")}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[#0B0B0B]/10">
            <td className="py-3">
              {t("invoiceDoc.rentLine", { unit: invoice.unitName })}
              <span className="block text-xs text-[#0B0B0B]/60">{month}</span>
            </td>
            <td className="py-3 text-end font-mono">
              {formatMoney(invoice.amountMinor, invoice.currency)}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="pt-4 text-start text-sm font-semibold">
              {t("invoiceDoc.total")}
            </th>
            <td className="pt-4 text-end font-mono text-lg font-bold">
              {formatMoney(invoice.amountMinor, invoice.currency)}
            </td>
          </tr>
        </tfoot>
      </table>

      <section className="space-y-2 rounded-lg border border-[#D4AF37]/60 bg-[#D4AF37]/10 p-4 text-xs">
        <p className="font-semibold">{t("invoiceDoc.payBy")}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-[#0B0B0B]/60">{t("invoiceDoc.beneficiary")}</dt>
          <dd dir="auto" className="rtl:text-right">
            {issuer.name}
          </dd>
          <dt className="text-[#0B0B0B]/60">{t("invoiceDoc.rib")}</dt>
          <dd className="font-mono rtl:text-right" dir="ltr">
            {issuer.rib ? formatRib(issuer.rib) : "—"}
          </dd>
          <dt className="text-[#0B0B0B]/60">{t("invoiceDoc.reference")}</dt>
          <dd className="font-mono">{invoice.number}</dd>
        </dl>
      </section>

      <footer className="flex flex-wrap items-end justify-between gap-4">
        {invoice.status === "paid" ? (
          <p className="rounded-md border-2 border-[#A2E8DD] bg-[#A2E8DD]/30 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em]">
            {invoice.paidAt
              ? t("invoiceDoc.paidOn", { date: formatDate(parseDay(invoice.paidAt)) })
              : t("leases.rentStatus.paid")}
          </p>
        ) : invoice.status === "late" ? (
          <p className="rounded-md border-2 border-[#8B002B] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#8B002B]">
            {t("leases.rentStatus.late")}
          </p>
        ) : (
          <span />
        )}
        <p className="text-[0.62rem] text-[#0B0B0B]/45">
          {t("invoiceDoc.footer", { brand: t("common:brand.name") })}
        </p>
      </footer>
    </article>
  );
}
