import { createTemplateLocale } from "../shared/locale";
import { EmailLayout, EmailText } from "./layout";
import type { EmailBaseProps } from "./shared";

export interface PasswordResetEmailProps extends EmailBaseProps {
  /** Greeted by name when known */
  name?: string;
  resetUrl: string;
  /** How long the link works, in minutes (60 in the app) */
  expiresInMinutes: number;
}

/** The link to choose a new password. */
export function PasswordResetEmail(props: PasswordResetEmailProps) {
  const locale = createTemplateLocale(props.lang);
  const { t, brand } = locale;
  return (
    <EmailLayout
      locale={locale}
      assetBaseUrl={props.assetBaseUrl}
      legal={props.legal}
      preview={t("email.passwordReset.preview")}
      title={t("email.passwordReset.title")}
      greeting={
        props.name
          ? t("email.common.greeting", { name: props.name })
          : t("email.common.greetingAnonymous")
      }
      action={{ label: t("email.passwordReset.cta"), href: props.resetUrl }}
    >
      <EmailText locale={locale}>{t("email.passwordReset.intro", { brand })}</EmailText>
      <EmailText locale={locale} muted>
        {t("email.passwordReset.expires", {
          duration: locale.formatDuration(props.expiresInMinutes),
        })}
      </EmailText>
      <EmailText locale={locale} muted>
        {t("email.passwordReset.ignore")}
      </EmailText>
    </EmailLayout>
  );
}
