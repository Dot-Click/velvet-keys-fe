import { Text } from "@react-email/components";
import { formatRib } from "@/lib/issuer";
import type { IssuerProfile } from "@/types/account";
import type { ISODate, MAD, MonthKey } from "@/types/common";
import { createTemplateLocale } from "../shared/locale";
import { EmailDetails, EmailLayout, EmailText } from "./layout";
import { sides, small } from "./shared";
import type { EmailBaseProps } from "./shared";

export interface RentInvoiceEmailProps extends EmailBaseProps {
  tenantName: string;
  /** The manager who issues the invoice; the tenant pays to this RIB */
  issuer: IssuerProfile;
  /** e.g. "R-202610-003" */
  number: string;
  period: MonthKey;
  amount: MAD;
  dueDate: ISODate;
  propertyName: string;
  unitName: string;
  invoiceUrl: string;
}

/** A tenant's monthly rent invoice, from their manager. */
export function RentInvoiceEmail(props: RentInvoiceEmailProps) {
  const locale = createTemplateLocale(props.lang);
  const { t, brand } = locale;
  const { issuer } = props;
  const month = locale.formatMonth(props.period);
  const amount = locale.formatMAD(props.amount);
  const date = locale.formatDate(props.dueDate);
  const { start } = sides(locale.dir);

  return (
    <EmailLayout
      locale={locale}
      assetBaseUrl={props.assetBaseUrl}
      preview={t("email.rentInvoice.preview", { amount, date })}
      title={t("email.rentInvoice.title", { month })}
      greeting={t("email.common.greeting", { name: props.tenantName })}
      action={{ label: t("email.rentInvoice.cta"), href: props.invoiceUrl }}
      footerNote={
        <>
          <Text style={{ ...small, textAlign: start }}>
            {t("email.common.sentVia", { issuer: issuer.name, brand })}
          </Text>
          <Text style={{ ...small, margin: 0, textAlign: start }}>
            {issuer.name} · {issuer.address}
            {issuer.ice ? ` · ${t("conciergerie:invoiceDoc.ice")} ${issuer.ice}` : ""}
          </Text>
        </>
      }
    >
      <EmailText locale={locale}>
        {t("email.rentInvoice.intro", { issuer: issuer.name, unit: props.unitName, date })}
      </EmailText>
      <EmailDetails
        locale={locale}
        rows={[
          { label: t("email.common.invoice"), value: props.number, mono: true },
          {
            label: t("email.rentInvoice.property"),
            value: `${props.propertyName} · ${props.unitName}`,
          },
          { label: t("email.common.period"), value: month },
          { label: t("email.common.amount"), value: amount, strong: true },
          { label: t("email.common.dueDate"), value: date, strong: true },
        ]}
      />
      <EmailDetails
        locale={locale}
        title={t("email.common.bankTitle")}
        rows={[
          { label: t("email.common.beneficiary"), value: issuer.name },
          { label: t("email.common.rib"), value: formatRib(issuer.rib), mono: true },
          { label: t("email.common.reference"), value: props.number, mono: true },
        ]}
      />
    </EmailLayout>
  );
}
