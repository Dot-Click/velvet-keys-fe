import { createTemplateLocale } from "../shared/locale";
import type { InvitationEmailProps } from "./invitation";
import type { PasswordResetEmailProps } from "./password-reset";
import type { InvoiceIssuedEmailProps } from "./invoice-issued";
import type { PaymentReminderEmailProps } from "./payment-reminder";
import type { AccountReadOnlyEmailProps } from "./account-read-only";
import type { PaymentConfirmedEmailProps } from "./payment-confirmed";
import type { LeaseRenewalEmailProps } from "./lease-renewal";
import type { RentInvoiceEmailProps } from "./rent-invoice";

/**
 * The subject line of each email, in the email's language. A backend sends these with the HTML
 * that the matching template renders.
 */

const inviterOf = (props: InvitationEmailProps) => props.inviterCompany ?? props.inviterName;

export function invitationEmailSubject(props: InvitationEmailProps) {
  const locale = createTemplateLocale(props.lang);
  return locale.t("email.invitation.subject", { inviter: inviterOf(props), brand: locale.brand });
}

export function passwordResetEmailSubject(props: PasswordResetEmailProps) {
  const locale = createTemplateLocale(props.lang);
  return locale.t("email.passwordReset.subject", { brand: locale.brand });
}

export function invoiceIssuedEmailSubject(props: InvoiceIssuedEmailProps) {
  const locale = createTemplateLocale(props.lang);
  return locale.t(
    props.proForma ? "email.invoiceIssued.subjectProForma" : "email.invoiceIssued.subject",
    {
      number: props.number,
      brand: locale.brand,
    },
  );
}

export function paymentReminderEmailSubject(props: PaymentReminderEmailProps) {
  const locale = createTemplateLocale(props.lang);
  return locale.t("email.paymentReminder.subject", {
    number: props.number,
    date: locale.formatDate(props.dueDate),
  });
}

export function accountReadOnlyEmailSubject(props: AccountReadOnlyEmailProps) {
  const locale = createTemplateLocale(props.lang);
  return locale.t("email.accountReadOnly.subject", { brand: locale.brand });
}

export function paymentConfirmedEmailSubject(props: PaymentConfirmedEmailProps) {
  const locale = createTemplateLocale(props.lang);
  return locale.t(
    props.accessRestored
      ? "email.paymentConfirmed.subjectRestored"
      : "email.paymentConfirmed.subject",
    { number: props.number, brand: locale.brand },
  );
}

export function leaseRenewalEmailSubject(props: LeaseRenewalEmailProps) {
  const locale = createTemplateLocale(props.lang);
  return locale.t("email.leaseRenewal.subject", { tenant: props.tenantName, unit: props.unitName });
}

export function rentInvoiceEmailSubject(props: RentInvoiceEmailProps) {
  const locale = createTemplateLocale(props.lang);
  return locale.t("email.rentInvoice.subject", {
    number: props.number,
    month: locale.formatMonth(props.period),
  });
}
