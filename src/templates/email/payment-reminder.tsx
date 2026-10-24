import { formatRib } from "@/lib/issuer";
import type { ISODate, MAD, MonthKey } from "@/types/common";
import { createTemplateLocale } from "../shared/locale";
import { EmailCallout, EmailDetails, EmailLayout, EmailText } from "./layout";
import type { EmailBaseProps } from "./shared";

export interface PaymentReminderEmailProps extends EmailBaseProps {
  name: string;
  number: string;
  period: MonthKey;
  total: MAD;
  dueDate: ISODate;
  /** Day 8: when the account becomes read-only if the invoice is still unpaid */
  readOnlyDate: ISODate;
  bank?: { beneficiary: string; rib: string };
  invoiceUrl: string;
}

/** Sent on day 5 of an unpaid invoice, before the account goes read-only. */
export function PaymentReminderEmail(props: PaymentReminderEmailProps) {
  const locale = createTemplateLocale(props.lang);
  const { t } = locale;
  const amount = locale.formatMAD(props.total);
  const due = locale.formatDate(props.dueDate);

  return (
    <EmailLayout
      locale={locale}
      assetBaseUrl={props.assetBaseUrl}
      legal={props.legal}
      preview={t("email.paymentReminder.preview", { number: props.number })}
      title={t("email.paymentReminder.title")}
      greeting={t("email.common.greeting", { name: props.name })}
      action={{ label: t("email.paymentReminder.cta"), href: props.invoiceUrl }}
    >
      <EmailText locale={locale}>
        {t("email.paymentReminder.intro", {
          number: props.number,
          month: locale.formatMonth(props.period),
          amount,
          date: due,
        })}
      </EmailText>
      <EmailDetails
        locale={locale}
        rows={[
          { label: t("email.common.invoice"), value: props.number, mono: true },
          { label: t("email.common.amountInclVat"), value: amount, strong: true },
          { label: t("email.common.dueDate"), value: due, strong: true },
        ]}
      />
      {props.bank && (
        <EmailDetails
          locale={locale}
          title={t("email.common.bankTitle")}
          rows={[
            { label: t("email.common.beneficiary"), value: props.bank.beneficiary },
            { label: t("email.common.rib"), value: formatRib(props.bank.rib), mono: true },
            { label: t("email.common.reference"), value: props.number, mono: true },
          ]}
        />
      )}
      <EmailCallout locale={locale}>
        {t("email.paymentReminder.warning", { date: locale.formatDate(props.readOnlyDate) })}
      </EmailCallout>
      <EmailText locale={locale} muted>
        {t("email.paymentReminder.alreadyPaid")}
      </EmailText>
    </EmailLayout>
  );
}
