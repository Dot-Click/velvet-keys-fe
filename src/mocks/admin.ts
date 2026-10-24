import type { AdminAction } from "@/types/admin";
import type { PriceChange } from "@/types/billing";
import { parseDay, toMonthKey } from "@/lib/dates";
import { ACCOUNT_IDS } from "./ids";
import { SUBSCRIPTION_PRICES } from "./platform";
import { atCasablancaTime, dayOfMonth } from "./seed";

/** Name of the demo Admin, as printed in the audit trail. */
const ADMIN_NAME = "Leila Mansouri";

/** Moderation decisions already on file: the banned demo account and its delisted building. */
export const MOCK_ADMIN_ACTIONS: readonly AdminAction[] = [
  {
    id: "admin-action-agdal-delist",
    kind: "delist",
    accountId: ACCOUNT_IDS.tazi,
    propertyId: "prop-agdal",
    reason: "Tenants reported fees not shown on the listing; the address could not be verified.",
    adminName: ADMIN_NAME,
    at: atCasablancaTime(dayOfMonth(-1, 18), "11:20"),
  },
  {
    id: "admin-action-tazi-ban",
    kind: "ban",
    accountId: ACCOUNT_IDS.tazi,
    reason:
      "Repeated tenant complaints about undisclosed fees, and three subscription invoices left unpaid.",
    adminName: ADMIN_NAME,
    at: atCasablancaTime(dayOfMonth(-1, 18), "11:32"),
  },
];

/** Before the first client signed up, the launch prices were set. */
const LAUNCH_PRICE_DAY = dayOfMonth(-14, 1);

/** Price history, oldest first: the launch prices, which are still the ones in force. */
export const MOCK_PRICE_HISTORY: readonly PriceChange[] = (["str", "ltr", "sync"] as const).map(
  (product) => ({
    id: `price-${product}-launch`,
    product,
    from: null,
    to: SUBSCRIPTION_PRICES[product],
    effectiveFrom: toMonthKey(parseDay(LAUNCH_PRICE_DAY)),
    changedAt: atCasablancaTime(LAUNCH_PRICE_DAY, "09:00"),
    changedBy: ADMIN_NAME,
  }),
);
