import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { formatNumber } from "@/lib/currency";
import { formatMoney } from "@/lib/money";

/** Whole-dirham amount for dashboards, e.g. "6,062 MAD". */
export function money(minor: number): string {
  return formatMoney(minor, ACCOUNT_CURRENCY, { hideDecimals: true });
}

/** Amount with its decimals, e.g. "1,056.00 MAD". */
export function moneyExact(minor: number): string {
  return formatMoney(minor, ACCOUNT_CURRENCY);
}

/** "+1,200 MAD" / "−300 MAD" for a change in money (minor units). */
export function signedMoney(minor: number): string {
  const sign = minor > 0 ? "+" : minor < 0 ? "−" : "";
  return `${sign}${money(Math.abs(minor))}`;
}

/** "+3" / "−2" for a change in a count. */
export function signedNumber(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatNumber(Math.abs(value))}`;
}
