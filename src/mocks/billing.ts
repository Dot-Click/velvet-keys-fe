import { addDays, addMonths, startOfMonth } from "date-fns";
import type { PlatformSettings, SubscriptionInvoice } from "@/types/billing";
import { estimateNextInvoice, isCompanyLegalComplete } from "@/lib/billing";
import { parseDay, toISODate, toMonthKey } from "@/lib/dates";
import { MOCK_ACCOUNTS } from "./accounts";
import { ACCOUNT_IDS } from "./ids";
import { FREE_SYNC_SLOTS_TOTAL, LAUNCH_DEADLINE, SUBSCRIPTION_PRICES, VAT_RATE } from "./platform";
import { MOCK_PROPERTIES, MOCK_UNITS } from "./properties";
import { MOCK_TODAY } from "./seed";

function unitsOfAccount(accountId: string) {
  const propertyIds = new Set(
    MOCK_PROPERTIES.filter((property) => property.accountId === accountId).map((p) => p.id),
  );
  return MOCK_UNITS.filter((unit) => propertyIds.has(unit.propertyId));
}

const syncedUnitsWithFreeSync = MOCK_ACCOUNTS.filter((account) => account.freeSyncUntil).reduce(
  (count, account) =>
    count + unitsOfAccount(account.id).filter((unit) => unit.channelConnection).length,
  0,
);

export const MOCK_PLATFORM_SETTINGS: PlatformSettings = {
  prices: { ...SUBSCRIPTION_PRICES },
  vatRate: VAT_RATE,
  launchDeadline: LAUNCH_DEADLINE,
  freeSyncSlots: { total: FREE_SYNC_SLOTS_TOTAL, used: syncedUnitsWithFreeSync },
  // Bank details are on file, but ICE, IF, RC and Patente are not yet, so invoices are Pro-forma
  companyLegal: {
    name: "Velvet Keys SARL",
    address: "Casablanca Finance City, Tour B, 20190 Casablanca",
    ice: "",
    if: "",
    rc: "",
    patente: "",
    rib: "007 780 0001234500030123 45",
  },
};

/** The read-only account has not paid the invoice from two months ago. */
const UNPAID_INVOICES: Record<string, number> = { [ACCOUNT_IDS.alami]: 2 };

function generateInvoices(): SubscriptionInvoice[] {
  const drafts: Omit<SubscriptionInvoice, "id" | "number">[] = [];
  const proForma = !isCompanyLegalComplete(MOCK_PLATFORM_SETTINGS.companyLegal);
  const currentMonth = startOfMonth(MOCK_TODAY);

  for (const account of MOCK_ACCOUNTS) {
    const units = unitsOfAccount(account.id);
    let month = startOfMonth(parseDay(account.signupDate));
    // Invoices are issued on the 1st for the month just ended
    while (month < currentMonth) {
      const period = toMonthKey(month);
      const issued = addMonths(month, 1);
      const due = addDays(issued, 7);
      const monthsAgo = Math.round((currentMonth.getTime() - month.getTime()) / (30.44 * 864e5));
      const unpaidFrom = UNPAID_INVOICES[account.id];
      const unpaid = unpaidFrom !== undefined && monthsAgo <= unpaidFrom;
      const estimate = estimateNextInvoice(account, {
        units,
        settings: MOCK_PLATFORM_SETTINGS,
        period,
      });
      const isLatest = toMonthKey(addMonths(month, 1)) === toMonthKey(currentMonth);
      const status: SubscriptionInvoice["status"] =
        estimate.total === 0
          ? "free"
          : unpaid
            ? due < MOCK_TODAY
              ? "overdue"
              : "sent"
            : isLatest && due >= MOCK_TODAY
              ? "sent"
              : "paid";

      drafts.push({
        accountId: account.id,
        period,
        lines: estimate.lines,
        subtotal: estimate.subtotal,
        vat: estimate.vat,
        total: estimate.total,
        status,
        proForma,
        issuedAt: toISODate(issued),
        dueDate: toISODate(due),
        ...(status === "paid" ? { paidAt: toISODate(addDays(issued, 3)) } : {}),
      });
      month = addMonths(month, 1);
    }
  }

  return drafts
    .sort((a, b) => a.issuedAt.localeCompare(b.issuedAt) || a.accountId.localeCompare(b.accountId))
    .map((draft, index) => ({
      id: `sub-${draft.accountId}-${draft.period}`,
      number: `VK-${draft.issuedAt.slice(0, 4)}-${String(index + 101).padStart(4, "0")}`,
      ...draft,
    }));
}

export const MOCK_SUBSCRIPTION_INVOICES: readonly SubscriptionInvoice[] = generateInvoices();
