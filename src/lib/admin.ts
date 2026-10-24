import { addDays } from "date-fns";
import type { SubscriptionInvoice } from "@/types/billing";
import type { CompanyLegal } from "@/types/platform-admin";
import type { InvoiceStep } from "@/types/admin";
import { PAYMENT_REMINDER_DAY, READ_ONLY_DAY } from "@/lib/billing";
import { formatMAD } from "@/lib/currency";
import { parseDay, toISODate } from "@/lib/dates";
import { digitsOnly, formatRib, isValidIce, isValidRib } from "@/lib/issuer";

/** Most free months an Admin can grant per product at once. */
export const MAX_GRANT_MONTHS = 12;

/** Shortest reason accepted for a moderation or offer decision. */
export const MIN_REASON_LENGTH = 10;

/** Shortest and longest bank reference accepted when recording a payment. */
export const MIN_PAYMENT_REFERENCE_LENGTH = 3;
export const MAX_PAYMENT_REFERENCE_LENGTH = 60;
export const MAX_PAYMENT_NOTE_LENGTH = 500;

/** Highest monthly price per unit an Admin can set, in MAD. */
export const MAX_UNIT_PRICE = 10_000;

/** Highest number of free channel sync slots an Admin can set. */
export const MAX_FREE_SYNC_SLOTS = 10_000;

/** A price is a positive amount with at most two decimals, up to the maximum. */
export function isValidPrice(value: number) {
  return (
    Number.isFinite(value) &&
    value > 0 &&
    value <= MAX_UNIT_PRICE &&
    Math.round(value * 100) / 100 === value
  );
}

/** Whole prices print without decimals, the others with two. */
export function formatPrice(value: number) {
  return formatMAD(value, { decimals: Number.isInteger(value) ? 0 : 2 });
}

/** Reads a typed price ("220", "220.5", "220,50"); null when the field is empty or not a number. */
export function parsePrice(text: string): number | null {
  const normalized = text.trim().replace(",", ".");
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Whether a payment date falls between the invoice's issue date and today. */
export function isValidPaymentDate(paidOn: string, issuedAt: string, now: Date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) return false;
  return paidOn >= issuedAt && paidOn <= toISODate(now);
}

/**
 * Where an invoice stands on the payment schedule: issued on day 0, a reminder on day 5,
 * the team read-only on day 8, and paid whenever the transfer arrives. Steps a prompt payment
 * made unnecessary are skipped.
 */
export function invoiceSteps(
  invoice: Pick<SubscriptionInvoice, "issuedAt" | "dueDate" | "status" | "paidAt">,
  now: Date,
): InvoiceStep[] {
  const issued = parseDay(invoice.issuedAt);
  const reminderDay = toISODate(addDays(issued, PAYMENT_REMINDER_DAY));
  const readOnlyDay = toISODate(addDays(issued, READ_ONLY_DAY));
  const today = toISODate(now);
  const paid = invoice.status === "paid" && Boolean(invoice.paidAt);
  const paidAt = invoice.paidAt ?? "";

  // A free (0 MAD) invoice only ever gets issued: no reminder, no read-only, nothing to pay
  if (invoice.status === "free") {
    return [
      { key: "issued", state: "done", date: invoice.issuedAt },
      { key: "reminder", state: "skipped", date: reminderDay },
      { key: "readonly", state: "skipped", date: readOnlyDay },
      { key: "paid", state: "skipped", date: invoice.issuedAt },
    ];
  }

  return [
    {
      key: "issued",
      state: invoice.status === "draft" ? "pending" : "done",
      date: invoice.issuedAt,
    },
    {
      key: "reminder",
      state: paid
        ? paidAt > reminderDay
          ? "done"
          : "skipped"
        : today >= reminderDay
          ? "done"
          : "pending",
      date: reminderDay,
    },
    {
      key: "readonly",
      state: paid
        ? paidAt >= readOnlyDay
          ? "done"
          : "skipped"
        : today >= readOnlyDay
          ? "done"
          : "pending",
      date: readOnlyDay,
    },
    {
      key: "paid",
      state: paid ? "done" : "pending",
      date: paid ? paidAt : invoice.dueDate,
    },
  ];
}

/** Invoices an Admin can still record a payment for. */
export function isPayable(invoice: Pick<SubscriptionInvoice, "status">) {
  return invoice.status === "sent" || invoice.status === "overdue";
}

/**
 * Whether paying this invoice takes the client's team from read-only back to active:
 * only when the account is read-only and this is its last overdue invoice.
 */
export function restoresAccess(row: {
  invoice: Pick<SubscriptionInvoice, "status">;
  client: { status: string };
  clientOverdueCount: number;
}) {
  const remaining = row.clientOverdueCount - (row.invoice.status === "overdue" ? 1 : 0);
  return row.client.status === "readonly" && remaining === 0;
}

export const COMPANY_LEGAL_FIELDS = [
  "name",
  "address",
  "ice",
  "if",
  "rc",
  "patente",
  "rib",
] as const satisfies readonly (keyof CompanyLegal)[];

export type LegalIssue = "missing" | "invalid";

/** IF, RC and Patente numbers are short registry codes, digits only (2 to 24 digits). */
const REGISTRY_CODE = /^\d{2,24}$/;

/**
 * What is wrong with each company legal field: empty (invoices stay Pro-forma) or filled in
 * wrongly (cannot be saved). Fields that are fine are left out.
 */
export function checkCompanyLegal(
  legal: CompanyLegal,
): Partial<Record<keyof CompanyLegal, LegalIssue>> {
  const issues: Partial<Record<keyof CompanyLegal, LegalIssue>> = {};
  for (const field of COMPANY_LEGAL_FIELDS) {
    const value = legal[field].trim();
    if (!value) {
      issues[field] = "missing";
    } else if (field === "ice" && !isValidIce(value)) {
      issues[field] = "invalid";
    } else if (field === "rib" && !isValidRib(value)) {
      issues[field] = "invalid";
    } else if (
      (field === "if" || field === "rc" || field === "patente") &&
      !REGISTRY_CODE.test(value)
    ) {
      issues[field] = "invalid";
    }
  }
  return issues;
}

/** Trims every field and prints the ICE and RIB the way they are stored. */
export function normalizeCompanyLegal(legal: CompanyLegal): CompanyLegal {
  const value = (field: keyof CompanyLegal) => legal[field].trim();
  return {
    name: value("name"),
    address: value("address"),
    ice: value("ice") ? digitsOnly(value("ice")) : "",
    if: value("if"),
    rc: value("rc"),
    patente: value("patente"),
    rib: value("rib") ? formatRib(value("rib")) : "",
  };
}
