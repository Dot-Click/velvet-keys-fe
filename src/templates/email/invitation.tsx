import type { ISODateTime } from "@/types/common";
import { createTemplateLocale } from "../shared/locale";
import { EmailDetails, EmailLayout, EmailText } from "./layout";
import type { EmailBaseProps } from "./shared";

export type InvitedRole = "owner" | "conciergerie" | "tenant";

export interface InvitationEmailProps extends EmailBaseProps {
  /** The role the invited person will have: an owner, a conciergerie or a tenant */
  role: InvitedRole;
  inviteeName: string;
  inviterName: string;
  /** Shown instead of the person's name when the inviter is a company */
  inviterCompany?: string;
  property?: { name: string; city?: string; unitLabel?: string };
  acceptUrl: string;
  /** Invitations are valid for 7 days */
  expiresAt: ISODateTime;
}

/** An owner, a conciergerie or a tenant is invited to join Velvet Keys. */
export function InvitationEmail(props: InvitationEmailProps) {
  const locale = createTemplateLocale(props.lang);
  const { t, brand } = locale;
  const { property } = props;
  const inviter = props.inviterCompany ?? props.inviterName;
  const propertyLine = property
    ? `${[property.name, property.unitLabel].filter(Boolean).join(" · ")}${property.city ? `, ${property.city}` : ""}`
    : undefined;

  return (
    <EmailLayout
      locale={locale}
      assetBaseUrl={props.assetBaseUrl}
      legal={props.legal}
      preview={t("email.invitation.preview", { brand })}
      title={t("email.invitation.title")}
      greeting={t("email.common.greeting", { name: props.inviteeName })}
      action={{ label: t("email.invitation.cta"), href: props.acceptUrl }}
    >
      <EmailText locale={locale}>
        {t(`email.invitation.intro.${props.role}`, { inviter, brand })}
      </EmailText>
      <EmailDetails
        locale={locale}
        rows={[
          { label: t("email.invitation.role"), value: t(`common:roles.${props.role}`) },
          ...(propertyLine ? [{ label: t("email.invitation.property"), value: propertyLine }] : []),
        ]}
      />
      <EmailText locale={locale} muted>
        {t("email.invitation.expires", { date: locale.formatDate(props.expiresAt) })}
      </EmailText>
      <EmailText locale={locale} muted>
        {t("email.invitation.ignore")}
      </EmailText>
    </EmailLayout>
  );
}
