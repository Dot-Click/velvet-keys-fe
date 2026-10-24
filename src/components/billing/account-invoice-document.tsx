import { useTranslation } from "react-i18next";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { formatDate, formatMonth, formatPercent } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import { formatRib } from "@/lib/issuer";
import { formatMoney } from "@/lib/money";
import type { InvoiceDetail } from "@/types/subscription";
import { billingLineText } from "./billing-line-text";

/**
 * On-screen (and printed) invoice document for the real account Billing screen, built directly
 * from the real `InvoiceDetail`: the seller and billed-to snapshots taken when the invoice was
 * issued, its lines, and its totals. Deliberately separate from `SubscriptionInvoiceDocument`,
 * which the Admin screens still render from the old mock `SubscriptionInvoice` shape -- a plain,
 * print-friendly summary here rather than a pixel-exact reproduction of that shared A4 template.
 */
export function AccountInvoiceDocument({ invoice }: { invoice: InvoiceDetail }) {
  const { t } = useTranslation("billing");
  const { sellerSnapshot: seller, billedToSnapshot: billedTo } = invoice;
  const vatRate = invoice.subtotalMinor > 0 ? invoice.vatMinor / invoice.subtotalMinor : null;
  const identifiers = [
    { label: t("doc.legal.ice"), value: seller.ice },
    { label: t("doc.legal.if"), value: seller.if },
    { label: t("doc.legal.rc"), value: seller.rc },
    { label: t("doc.legal.patente"), value: seller.patente },
  ].filter((item) => item.value);

  return (
    <div className="space-y-6 rounded-xl border border-border/60 bg-white p-6 text-[#0B0B0B] print:border-0 print:p-0">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#D4AF37]/40 pb-4">
        <div className="space-y-0.5">
          <p className="text-[0.68rem] uppercase tracking-[0.15em] text-[#0B0B0B]/60">
            {invoice.proForma ? t("doc.proFormaTitle") : t("doc.title")}
          </p>
          <p className="font-mono text-sm font-semibold">{invoice.number}</p>
        </div>
        <div className="space-y-0.5 text-end text-xs text-[#0B0B0B]/70">
          <p>
            {t("doc.period", {
              month: formatMonth(invoice.periodStart, { style: "long", withYear: true }),
              from: formatDate(parseDay(invoice.periodStart)),
              to: formatDate(parseDay(invoice.periodEnd)),
            })}
          </p>
          {invoice.issuedAt && <p>{t("doc.issuedOn", { date: formatDate(invoice.issuedAt) })}</p>}
          {invoice.dueDate && (
            <p>{t("doc.dueOn", { date: formatDate(parseDay(invoice.dueDate)) })}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-0.5">
          <p className="text-[0.68rem] uppercase tracking-[0.15em] text-[#0B0B0B]/60">
            {t("doc.from")}
          </p>
          <p className="font-serif text-base font-semibold">{seller.name || "Velvet Keys"}</p>
          {seller.address && <p className="text-xs text-[#0B0B0B]/70">{seller.address}</p>}
        </div>
        <div className="space-y-0.5">
          <p className="text-[0.68rem] uppercase tracking-[0.15em] text-[#0B0B0B]/60">
            {t("doc.billedTo")}
          </p>
          <p className="font-serif text-base font-semibold">{billedTo.name || "—"}</p>
          {billedTo.address && <p className="text-xs text-[#0B0B0B]/70">{billedTo.address}</p>}
          {billedTo.ice && (
            <p className="text-xs text-[#0B0B0B]/70">
              {t("doc.legal.ice")} <span className="font-mono">{billedTo.ice}</span>
            </p>
          )}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#0B0B0B]/15 text-[0.68rem] uppercase tracking-[0.1em] text-[#0B0B0B]/60">
            <th scope="col" className="py-2 text-start font-medium">
              {t("doc.description")}
            </th>
            <th scope="col" className="py-2 text-end font-medium">
              {t("doc.amount")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#0B0B0B]/10">
          {invoice.lines.map((line, index) => {
            const text = billingLineText(t, line, ACCOUNT_CURRENCY);
            return (
              <tr key={index}>
                <td className="py-2.5">
                  <span className={line.type === "offer" ? "text-[#8C6B14]" : undefined}>
                    {text.label}
                  </span>
                  {text.detail && (
                    <span className="block text-xs text-[#0B0B0B]/60">{text.detail}</span>
                  )}
                </td>
                <td className="py-2.5 text-end tabular-nums">
                  {formatMoney(line.totalMinor, ACCOUNT_CURRENCY)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <dl className="ms-auto grid w-full max-w-xs grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm sm:max-w-sm">
        <dt className="text-[#0B0B0B]/70">{t("doc.subtotal")}</dt>
        <dd className="text-end tabular-nums">
          {formatMoney(invoice.subtotalMinor, ACCOUNT_CURRENCY)}
        </dd>
        <dt className="text-[#0B0B0B]/70">
          {vatRate !== null
            ? t("doc.vat", { rate: formatPercent(vatRate * 100, { decimals: 0 }) })
            : t("screen.vatGeneric")}
        </dt>
        <dd className="text-end tabular-nums">{formatMoney(invoice.vatMinor, ACCOUNT_CURRENCY)}</dd>
        <dt className="border-t border-[#D4AF37] pt-1.5 font-serif text-base font-semibold">
          {t("doc.total")}
        </dt>
        <dd className="border-t border-[#D4AF37] pt-1.5 text-end font-serif text-base font-bold">
          {formatMoney(invoice.totalMinor, ACCOUNT_CURRENCY)}
        </dd>
      </dl>

      {invoice.dueDate && (
        <div className="space-y-1.5 rounded-lg border border-[#D4AF37]/50 bg-[#D4AF37]/10 p-4 text-sm">
          <p className="font-semibold">
            {t("doc.payBy", { date: formatDate(parseDay(invoice.dueDate)) })}
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            <dt className="text-[#0B0B0B]/60">{t("doc.beneficiary")}</dt>
            <dd>{seller.name || "Velvet Keys"}</dd>
            <dt className="text-[#0B0B0B]/60">{t("doc.rib")}</dt>
            <dd dir="ltr" className="font-mono">
              {seller.rib ? formatRib(seller.rib) : t("doc.ribPending")}
            </dd>
            <dt className="text-[#0B0B0B]/60">{t("doc.reference")}</dt>
            <dd dir="ltr" className="font-mono">
              {invoice.number}
            </dd>
          </dl>
        </div>
      )}

      {identifiers.length > 0 && (
        <p className="text-[0.68rem] text-[#0B0B0B]/60">
          {seller.name}
          {seller.address ? ` · ${seller.address}` : ""} ·{" "}
          {identifiers.map((item) => `${item.label} ${item.value}`).join(" · ")}
        </p>
      )}
    </div>
  );
}
