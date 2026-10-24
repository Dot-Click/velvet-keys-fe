import type { ISODate, MAD } from "@/types/common";
import { createTemplateLocale } from "../shared/locale";
import { EmailCallout, EmailDetails, EmailLayout, EmailText } from "./layout";
import type { EmailBaseProps } from "./shared";

export interface PaymentConfirmedEmailProps extends EmailBaseProps {
  name: string;
  number: string;
  total: MAD;
  /** Day the transfer arrived */
  paidOn: ISODate;
  /** True when this payment took the account out of read-only mode */
  accessRestored: boolean;
  /** Where the button leads, usually the app's home */
  appUrl: string;
}

/** Thanks for a payment; when it ended read-only mode, says access is back. */
export function PaymentConfirmedEmail(props: PaymentConfirmedEmailProps) {
  const locale = createTemplateLocale(props.lang);
  const { t, brand } = locale;
  const amount = locale.formatMAD(props.total);

  return (
    <EmailLayout
      locale={locale}
      assetBaseUrl={props.assetBaseUrl}
      legal={props.legal}
      preview={t("email.paymentConfirmed.preview", { amount })}
      title={t(
        props.accessRestored
          ? "email.paymentConfirmed.titleRestored"
          : "email.paymentConfirmed.title",
      )}
      greeting={t("email.common.greeting", { name: props.name })}
      action={{ label: t("email.paymentConfirmed.cta", { brand }), href: props.appUrl }}
    >
      <EmailText locale={locale}>
        {t("email.paymentConfirmed.intro", { amount, number: props.number })}
      </EmailText>
      <EmailDetails
        locale={locale}
        rows={[
          { label: t("email.common.invoice"), value: props.number, mono: true },
          { label: t("email.common.amountInclVat"), value: amount, strong: true },
          { label: t("email.common.paidOn"), value: locale.formatDate(props.paidOn) },
        ]}
      />
      {props.accessRestored && (
        <EmailCallout locale={locale}>{t("email.paymentConfirmed.restored")}</EmailCallout>
      )}
    </EmailLayout>
  );
}
