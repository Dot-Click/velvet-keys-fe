/* eslint-disable react-refresh/only-export-components -- a list of templates, not a component module */
import type { ReactElement } from "react";
import { MOCK_ACCOUNTS } from "@/mocks/accounts";
import { ACCOUNT_IDS } from "@/mocks/ids";
import type { IssuerProfile } from "@/types/account";
import type { SubscriptionInvoice } from "@/types/billing";
import type { RentInvoiceStatus } from "@/types/lease";
import { AccountReadOnlyEmail } from "./email/account-read-only";
import { InvitationEmail } from "./email/invitation";
import { InvoiceIssuedEmail } from "./email/invoice-issued";
import { LeaseRenewalEmail } from "./email/lease-renewal";
import { PasswordResetEmail } from "./email/password-reset";
import { PaymentConfirmedEmail } from "./email/payment-confirmed";
import { PaymentReminderEmail } from "./email/payment-reminder";
import { RentInvoiceEmail } from "./email/rent-invoice";
import type { EmailBaseProps } from "./email/shared";
import {
  accountReadOnlyEmailSubject,
  invitationEmailSubject,
  invoiceIssuedEmailSubject,
  leaseRenewalEmailSubject,
  passwordResetEmailSubject,
  paymentConfirmedEmailSubject,
  paymentReminderEmailSubject,
  rentInvoiceEmailSubject,
} from "./email/subjects";
import { OwnerReportPdf } from "./pdf/owner-report";
import { RentInvoicePdf } from "./pdf/rent-invoice";
import { SubscriptionInvoicePdf } from "./pdf/subscription-invoice";
import {
  SAMPLE_BANK,
  SAMPLE_LEGAL,
  repeatStatementRows,
  sampleDay,
  sampleInstant,
  sampleMonth,
} from "./samples";
import type { TemplateSamples } from "./samples";
import type { TemplateLang } from "./shared/locale";

export interface PreviewVariant {
  id: string;
  label: string;
}

interface EntryBase {
  id: string;
  label: string;
  description: string;
  variants: PreviewVariant[];
}

export interface PdfTemplateEntry extends EntryBase {
  kind: "pdf";
  render: (lang: TemplateLang, variant: string, samples: TemplateSamples) => ReactElement;
}

export interface EmailTemplateEntry extends EntryBase {
  kind: "email";
  render: (lang: TemplateLang, variant: string, assetBaseUrl: string) => ReactElement;
  subject: (lang: TemplateLang, variant: string, assetBaseUrl: string) => string;
}

const ATLAS_ISSUER = MOCK_ACCOUNTS.find((account) => account.id === ACCOUNT_IDS.atlas)
  ?.issuerProfile as IssuerProfile;

/** Every PDF template, with the variants the preview offers for it. */
export const PDF_TEMPLATES: PdfTemplateEntry[] = [
  {
    kind: "pdf",
    id: "pdf-subscription-invoice",
    label: "Subscription invoice",
    description: "Velvet Keys → client. Shared with the Billing and Admin invoice previews.",
    variants: [
      { id: "final", label: "Paid, final" },
      { id: "proforma", label: "Sent, pro-forma" },
      { id: "overdue", label: "Overdue" },
      { id: "long", label: "Long (several pages)" },
    ],
    render: (lang, variant, samples) => {
      const base = samples.invoice;
      const pick = (patch: Partial<SubscriptionInvoice>): SubscriptionInvoice => ({
        ...base,
        ...patch,
      });
      const invoice =
        variant === "proforma"
          ? pick({ status: "sent", proForma: true })
          : variant === "overdue"
            ? pick({ status: "overdue", proForma: false })
            : variant === "long"
              ? pick({
                  status: "paid",
                  proForma: false,
                  lines: Array.from({ length: 8 }, () => base.lines).flat(),
                })
              : pick({ status: "paid", proForma: false, paidAt: base.issuedAt });
      const context = invoice.proForma ? samples.proFormaContext : samples.finalContext;
      return <SubscriptionInvoicePdf lang={lang} invoice={invoice} context={context} />;
    },
  },
  {
    kind: "pdf",
    id: "pdf-rent-invoice",
    label: "Rent invoice",
    description: "Manager's issuer profile → tenant, paid by transfer to the issuer's RIB.",
    variants: [
      { id: "unpaid", label: "Unpaid" },
      { id: "late", label: "Late" },
      { id: "paid", label: "Paid" },
    ],
    render: (lang, variant, samples) => {
      const { rentRow } = samples;
      const status: RentInvoiceStatus =
        variant === "paid" ? "paid" : variant === "late" ? "late" : "unpaid";
      const row = {
        ...rentRow,
        status,
        invoice: {
          ...rentRow.invoice,
          status,
          ...(status === "paid" ? { paidAt: rentRow.invoice.issuedAt } : {}),
        },
      };
      return <RentInvoicePdf lang={lang} row={row} />;
    },
  },
  {
    kind: "pdf",
    id: "pdf-owner-report",
    label: "Owner financial report",
    description: "Summary, profit and loss, and the breakdown by property for an owner.",
    variants: [
      { id: "summary", label: "Summary" },
      { id: "detailed", label: "Detailed" },
      { id: "solo", label: "Detailed, self-managed owner" },
      { id: "long", label: "Detailed, long (several pages)" },
    ],
    render: (lang, variant, samples) => {
      const solo = variant === "solo";
      const statement = solo ? samples.soloStatement : samples.managedStatement;
      return (
        <OwnerReportPdf
          lang={lang}
          data={{
            owner: { name: solo ? samples.soloOwner : samples.managedOwner },
            statement: variant === "long" ? repeatStatementRows(statement, 10) : statement,
            solo,
            detailed: variant !== "summary",
            reference: `VK-${statement.from.slice(0, 7).replace("-", "")}`,
            issuedAt: sampleDay(0),
            legal: SAMPLE_LEGAL,
          }}
        />
      );
    },
  },
];

function emailProps(lang: TemplateLang, assetBaseUrl: string): EmailBaseProps {
  return { lang, assetBaseUrl, legal: SAMPLE_LEGAL };
}

const SINGLE: PreviewVariant[] = [{ id: "default", label: "Default" }];

/** Every email template, with the variants the preview offers for it. */
export const EMAIL_TEMPLATES: EmailTemplateEntry[] = (() => {
  const invitation = (variant: string, lang: TemplateLang, base: string) => {
    const shared = {
      ...emailProps(lang, base),
      acceptUrl: `${base}/invite/inv-demo`,
      expiresAt: sampleInstant(7),
    };
    if (variant === "conciergerie") {
      return {
        ...shared,
        role: "conciergerie" as const,
        inviteeName: "Noah Bennett",
        inviterName: "Amelia Avery",
        property: { name: "Marina House", city: "Casablanca" },
      };
    }
    if (variant === "tenant") {
      return {
        ...shared,
        role: "tenant" as const,
        inviteeName: "Imane Tahiri",
        inviterName: "Noah Bennett",
        inviterCompany: "Atlas Conciergerie",
        property: { name: "Résidence Anfa", city: "Casablanca", unitLabel: "Apartment 12" },
      };
    }
    return {
      ...shared,
      role: "owner" as const,
      inviteeName: "Yasmine Alaoui",
      inviterName: "Noah Bennett",
      inviterCompany: "Atlas Conciergerie",
      property: { name: "Villa Malabata", city: "Tangier" },
    };
  };

  const invoiceIssued = (variant: string, lang: TemplateLang, base: string) => ({
    ...emailProps(lang, base),
    name: "Noah Bennett",
    number: "VK-2026-0135",
    period: sampleMonth(-1),
    total: 4776,
    dueDate: sampleDay(7),
    proForma: variant === "proforma",
    bank: SAMPLE_BANK,
    invoiceUrl: `${base}/conciergerie/billing`,
  });

  const reminder = (lang: TemplateLang, base: string) => ({
    ...emailProps(lang, base),
    name: "Noah Bennett",
    number: "VK-2026-0135",
    period: sampleMonth(-1),
    total: 4776,
    dueDate: sampleDay(2),
    readOnlyDate: sampleDay(3),
    bank: SAMPLE_BANK,
    invoiceUrl: `${base}/conciergerie/billing`,
  });

  const readOnly = (lang: TemplateLang, base: string) => ({
    ...emailProps(lang, base),
    name: "Noah Bennett",
    number: "VK-2026-0135",
    total: 4776,
    dueDate: sampleDay(-1),
    bank: SAMPLE_BANK,
    invoiceUrl: `${base}/conciergerie/billing`,
  });

  const confirmed = (variant: string, lang: TemplateLang, base: string) => ({
    ...emailProps(lang, base),
    name: "Noah Bennett",
    number: "VK-2026-0135",
    total: 4776,
    paidOn: sampleDay(0),
    accessRestored: variant === "restored",
    appUrl: `${base}/conciergerie`,
  });

  const renewal = (lang: TemplateLang, base: string) => ({
    ...emailProps(lang, base),
    managerName: "Noah Bennett",
    tenantName: "Youssef Bennani",
    propertyName: "Marina House",
    unitName: "Residence 12",
    leaseEndDate: sampleDay(45),
    daysLeft: 45,
    monthlyRent: 7500,
    leaseUrl: `${base}/conciergerie/leases`,
  });

  const rentInvoice = (lang: TemplateLang, base: string) => ({
    ...emailProps(lang, base),
    tenantName: "Youssef Bennani",
    issuer: ATLAS_ISSUER,
    number: "R-202610-003",
    period: sampleMonth(0),
    amount: 7500,
    dueDate: sampleDay(5),
    propertyName: "Marina House",
    unitName: "Residence 12",
    invoiceUrl: `${base}/tenant/invoices`,
  });

  return [
    {
      kind: "email",
      id: "email-invitation",
      label: "Invitation",
      description: "Owner, conciergerie or tenant invited to join.",
      variants: [
        { id: "owner", label: "Owner" },
        { id: "conciergerie", label: "Conciergerie" },
        { id: "tenant", label: "Tenant" },
      ],
      render: (lang, variant, base) => <InvitationEmail {...invitation(variant, lang, base)} />,
      subject: (lang, variant, base) => invitationEmailSubject(invitation(variant, lang, base)),
    },
    {
      kind: "email",
      id: "email-password-reset",
      label: "Password reset",
      description: "The link to choose a new password, valid for an hour.",
      variants: SINGLE,
      render: (lang, _variant, base) => {
        const props = {
          ...emailProps(lang, base),
          name: "Noah Bennett",
          resetUrl: `${base}/reset-password?token=rst-demo`,
          expiresInMinutes: 60,
        };
        return <PasswordResetEmail {...props} />;
      },
      subject: (lang, _variant, base) =>
        passwordResetEmailSubject({
          ...emailProps(lang, base),
          resetUrl: "",
          expiresInMinutes: 60,
        }),
    },
    {
      kind: "email",
      id: "email-invoice-issued",
      label: "Invoice issued",
      description: "A new subscription invoice and how to pay it.",
      variants: [
        { id: "final", label: "Final invoice" },
        { id: "proforma", label: "Pro-forma invoice" },
      ],
      render: (lang, variant, base) => (
        <InvoiceIssuedEmail {...invoiceIssued(variant, lang, base)} />
      ),
      subject: (lang, variant, base) =>
        invoiceIssuedEmailSubject(invoiceIssued(variant, lang, base)),
    },
    {
      kind: "email",
      id: "email-payment-reminder",
      label: "Payment reminder (day 5)",
      description: "Sent five days after issue, before the account goes read-only.",
      variants: SINGLE,
      render: (lang, _variant, base) => <PaymentReminderEmail {...reminder(lang, base)} />,
      subject: (lang, _variant, base) => paymentReminderEmailSubject(reminder(lang, base)),
    },
    {
      kind: "email",
      id: "email-account-read-only",
      label: "Account read-only (day 8)",
      description: "The account's team can view but not edit until the invoice is paid.",
      variants: SINGLE,
      render: (lang, _variant, base) => <AccountReadOnlyEmail {...readOnly(lang, base)} />,
      subject: (lang, _variant, base) => accountReadOnlyEmailSubject(readOnly(lang, base)),
    },
    {
      kind: "email",
      id: "email-payment-confirmed",
      label: "Payment confirmed",
      description: "Thanks for a payment; says access is back when it ended read-only mode.",
      variants: [
        { id: "restored", label: "Access restored" },
        { id: "plain", label: "Payment only" },
      ],
      render: (lang, variant, base) => (
        <PaymentConfirmedEmail {...confirmed(variant, lang, base)} />
      ),
      subject: (lang, variant, base) =>
        paymentConfirmedEmailSubject(confirmed(variant, lang, base)),
    },
    {
      kind: "email",
      id: "email-lease-renewal",
      label: "Lease renewal alert",
      description: "To the manager, when a lease is about to end.",
      variants: SINGLE,
      render: (lang, _variant, base) => <LeaseRenewalEmail {...renewal(lang, base)} />,
      subject: (lang, _variant, base) => leaseRenewalEmailSubject(renewal(lang, base)),
    },
    {
      kind: "email",
      id: "email-rent-invoice",
      label: "Rent invoice",
      description: "To the tenant, from their manager.",
      variants: SINGLE,
      render: (lang, _variant, base) => <RentInvoiceEmail {...rentInvoice(lang, base)} />,
      subject: (lang, _variant, base) => rentInvoiceEmailSubject(rentInvoice(lang, base)),
    },
  ];
})();
