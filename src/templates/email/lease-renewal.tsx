import type { ISODate, MAD } from "@/types/common";
import { createTemplateLocale } from "../shared/locale";
import { EmailDetails, EmailLayout, EmailText } from "./layout";
import type { EmailBaseProps } from "./shared";

export interface LeaseRenewalEmailProps extends EmailBaseProps {
  /** The manager the alert is for */
  managerName: string;
  tenantName: string;
  propertyName: string;
  unitName: string;
  /** Exclusive end of the lease */
  leaseEndDate: ISODate;
  daysLeft: number;
  monthlyRent: MAD;
  leaseUrl: string;
}

/** Tells a manager that a lease is about to end, so they can renew it. */
export function LeaseRenewalEmail(props: LeaseRenewalEmailProps) {
  const locale = createTemplateLocale(props.lang);
  const { t } = locale;
  const date = locale.formatDate(props.leaseEndDate);

  return (
    <EmailLayout
      locale={locale}
      assetBaseUrl={props.assetBaseUrl}
      legal={props.legal}
      preview={t("email.leaseRenewal.preview", { tenant: props.tenantName, date })}
      title={t("email.leaseRenewal.title")}
      greeting={t("email.common.greeting", { name: props.managerName })}
      action={{ label: t("email.leaseRenewal.cta"), href: props.leaseUrl }}
    >
      <EmailText locale={locale}>
        {t("email.leaseRenewal.intro", {
          tenant: props.tenantName,
          unit: props.unitName,
          property: props.propertyName,
          date,
          relative: locale.formatRelativeDays(props.daysLeft),
        })}
      </EmailText>
      <EmailDetails
        locale={locale}
        rows={[
          { label: t("email.leaseRenewal.tenant"), value: props.tenantName },
          {
            label: t("email.leaseRenewal.unit"),
            value: `${props.unitName} · ${props.propertyName}`,
          },
          { label: t("email.leaseRenewal.endDate"), value: date, strong: true },
          { label: t("email.leaseRenewal.rent"), value: locale.formatMAD(props.monthlyRent) },
        ]}
      />
      <EmailText locale={locale} muted>
        {t("email.leaseRenewal.hint")}
      </EmailText>
    </EmailLayout>
  );
}
