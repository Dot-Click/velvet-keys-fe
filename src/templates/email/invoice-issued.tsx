import { formatRib } from "@/lib/issuer";
import type { ISODate, MAD, MonthKey } from "@/types/common";
import { createTemplateLocale } from "../shared/locale";
import { EmailCallout, EmailDetails, EmailLayout, EmailText } from "./layout";
import type { EmailBaseProps } from "./shared";

export interface InvoiceIssuedEmailProps extends EmailBaseProps {
  name: string;
  /** e.g. "VK-2026-0135" */
  number: string;
  period: MonthKey;
  /** Total incl. VAT */
  total: MAD;
  dueDate: ISODate;
  /** Invoices stay pro-forma until the company legal details are on file */
  proForma: boolean;
  /** Where to send the transfer */
  bank: { beneficiary: string; rib: string };
  invoiceUrl: string;
}

/** A new subscription invoice, with how and when to pay it. */
export function InvoiceIssuedEmail(props: InvoiceIssuedEmailProps) {
  const locale = createTemplateLocale(props.lang);
  const { t, brand } = locale;
  const month = locale.formatMonth(props.period);
  const amount = locale.formatMAD(props.total);
  const date = locale.formatDate(props.dueDate);

  return (
    <EmailLayout
      locale={locale}
      assetBaseUrl={props.assetBaseUrl}
      legal={props.legal}
      preview={t("email.invoiceIssued.preview", { amount, date })}
      title={t("email.invoiceIssued.title", { month })}
      greeting={t("email.common.greeting", { name: props.name })}
      action={{ label: t("email.invoiceIssued.cta"), href: props.invoiceUrl }}
    >
      <EmailText locale={locale}>
        {t("email.invoiceIssued.intro", { brand, month, date })}
      </EmailText>
      <EmailDetails
        locale={locale}
        rows={[
          { label: t("email.common.invoice"), value: props.number, mono: true },
          { label: t("email.common.period"), value: month },
          { label: t("email.common.amountInclVat"), value: amount, strong: true },
          { label: t("email.common.dueDate"), value: date, strong: true },
        ]}
      />
      <EmailDetails
        locale={locale}
        title={t("email.common.bankTitle")}
        rows={[
          { label: t("email.common.beneficiary"), value: props.bank.beneficiary },
          { label: t("email.common.rib"), value: formatRib(props.bank.rib), mono: true },
          { label: t("email.common.reference"), value: props.number, mono: true },
        ]}
      />
      {props.proForma && (
        <EmailCallout locale={locale}>{t("email.invoiceIssued.proForma")}</EmailCallout>
      )}
      <EmailText locale={locale} muted>
        {t("email.invoiceIssued.terms")}
      </EmailText>
    </EmailLayout>
  );
}
