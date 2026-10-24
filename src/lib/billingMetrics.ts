import type { MonthKey } from "@/types/common";
import type { SubscriptionInvoice } from "@/types/billing";
import { round2 } from "@/lib/dates";

/**
 * The only place money figures for the Admin panel are computed, so the Overview, Revenue,
 * Invoices and Client pages always agree.
 *
 * Conventions:
 * - MRR is the recurring subscription excluding VAT, after free months are deducted.
 * - Billed, collected and outstanding are invoice totals including VAT.
 * - A "period" is the month an invoice was issued in (the same grouping the Revenue page uses).
 * - Drafts are not issued yet, and "free" (0 MAD) invoices carry nothing to collect, so neither
 *   counts as outstanding.
 */

type MetricInvoice = Pick<SubscriptionInvoice, "status" | "total" | "issuedAt">;

const issuedIn = (invoice: Pick<SubscriptionInvoice, "issuedAt">, period?: MonthKey) =>
  !period || invoice.issuedAt.startsWith(period);

/** Monthly recurring revenue excl. VAT: what each account's next invoice bills before VAT. */
export function calcMRR(estimates: readonly { subtotal: number }[]): number {
  return round2(estimates.reduce((sum, estimate) => sum + estimate.subtotal, 0));
}

/** Everything issued (drafts excluded), incl. VAT, in one period or in total. */
export function calcBilled(invoices: readonly MetricInvoice[], period?: MonthKey): number {
  return round2(
    invoices
      .filter((invoice) => invoice.status !== "draft" && issuedIn(invoice, period))
      .reduce((sum, invoice) => sum + invoice.total, 0),
  );
}

/** The part of what was issued that has been paid. */
export function calcCollected(invoices: readonly MetricInvoice[], period?: MonthKey): number {
  return round2(
    invoices
      .filter((invoice) => invoice.status === "paid" && issuedIn(invoice, period))
      .reduce((sum, invoice) => sum + invoice.total, 0),
  );
}

/** Sent and overdue invoices still waiting for a transfer. Free invoices never count. */
export function calcOutstanding(invoices: readonly MetricInvoice[], period?: MonthKey): number {
  return round2(
    invoices
      .filter(
        (invoice) =>
          (invoice.status === "sent" || invoice.status === "overdue") && issuedIn(invoice, period),
      )
      .reduce((sum, invoice) => sum + invoice.total, 0),
  );
}

/** The overdue part of the outstanding amount. */
export function calcOverdue(invoices: readonly MetricInvoice[]): { count: number; amount: number } {
  const overdue = invoices.filter((invoice) => invoice.status === "overdue");
  return {
    count: overdue.length,
    amount: round2(overdue.reduce((sum, invoice) => sum + invoice.total, 0)),
  };
}

/** Share of billed money that has been collected, 0–1 (1 when nothing was billed). */
export function calcCollectionRate(invoices: readonly MetricInvoice[], period?: MonthKey): number {
  const billed = calcBilled(invoices, period);
  return billed === 0 ? 1 : calcCollected(invoices, period) / billed;
}
