import { formatRib } from "@/lib/issuer";
import type { ISODate, MAD } from "@/types/common";
import { createTemplateLocale } from "../shared/locale";
import { EmailCallout, EmailDetails, EmailLayout, EmailText } from "./layout";
import type { EmailBaseProps } from "./shared";

export interface AccountReadOnlyEmailProps extends EmailBaseProps {
  name: string;
  number: string;
  total: MAD;
  dueDate: ISODate;
  bank?: { beneficiary: string; rib: string };
  invoiceUrl: string;
}

/** Sent on day 8 of an unpaid invoice, when the account's team goes read-only. */
export function AccountReadOnlyEmail(props: AccountReadOnlyEmailProps) {
  const locale = createTemplateLocale(props.lang);
  const { t } = locale;
  const amount = locale.formatMAD(props.total);
  const due = locale.formatDate(props.dueDate);

  return (
    <EmailLayout
      locale={locale}
      assetBaseUrl={props.assetBaseUrl}
      legal={props.legal}
      preview={t("email.accountReadOnly.preview", { number: props.number })}
      title={t("email.accountReadOnly.title")}
      greeting={t("email.common.greeting", { name: props.name })}
      action={{ label: t("email.accountReadOnly.cta"), href: props.invoiceUrl }}
    >
      <EmailText locale={locale}>
        {t("email.accountReadOnly.intro", { number: props.number, amount, date: due })}
      </EmailText>
      <EmailCallout locale={locale} tone="ruby">
        {t("email.accountReadOnly.effect")}
      </EmailCallout>
      <EmailDetails
        locale={locale}
        rows={[
          { label: t("email.common.invoice"), value: props.number, mono: true },
          { label: t("email.common.amountInclVat"), value: amount, strong: true },
          { label: t("email.common.dueDate"), value: due },
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
      <EmailText locale={locale}>{t("email.accountReadOnly.how")}</EmailText>
    </EmailLayout>
  );
}
