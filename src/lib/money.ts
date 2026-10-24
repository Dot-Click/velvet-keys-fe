import i18n from "./i18n";

/**
 * Money is always an integer in minor units plus a currency code, exactly as the backend
 * sends it (amountMinor: 20000, currency: "MAD" is 200.00 MAD). Never store or compute
 * with decimal amounts in the frontend.
 */
export type CurrencyCode = "MAD" | "EUR" | "XOF";

/** Number of minor-unit decimals per currency; mirrors the backend's CURRENCY_EXPONENT. */
export const CURRENCY_EXPONENT: Record<CurrencyCode, number> = {
  MAD: 2,
  EUR: 2,
  XOF: 0,
};

function exponentOf(currency: string): number {
  return CURRENCY_EXPONENT[currency as CurrencyCode] ?? 2;
}

function intlLocale(override?: string): string {
  if (override) return override;
  const lang = typeof i18n !== "undefined" && i18n.language ? i18n.language : "en";
  if (lang === "fr") return "fr-MA";
  if (lang === "ar") return "ar-MA";
  return "en-GB";
}

export interface FormatMoneyOptions {
  /** Hide the minor-unit decimals (dashboards). Default shows the currency's own decimals. */
  hideDecimals?: boolean;
  locale?: string;
}

/**
 * Formats an integer minor-unit amount as a display string, e.g.
 * formatMoney(20000, "MAD") -> "200.00 MAD". The only supported way to show an amount.
 */
export function formatMoney(
  amountMinor: number | null | undefined,
  currency: string,
  options: FormatMoneyOptions = {},
): string {
  const minor = Number.isFinite(amountMinor) ? Math.trunc(Number(amountMinor)) : 0;
  const exponent = exponentOf(currency);
  const negative = minor < 0;
  const abs = Math.abs(minor);

  // Split in integer arithmetic so no float ever carries the amount.
  const base = 10 ** exponent;
  const whole = Math.floor(abs / base);
  const fraction = abs % base;

  const locale = intlLocale(options.locale);
  const wholeText = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(whole);
  const decimalSeparator =
    new Intl.NumberFormat(locale, { minimumFractionDigits: 1 })
      .formatToParts(1.1)
      .find((part) => part.type === "decimal")?.value ?? ".";

  const showDecimals = exponent > 0 && !options.hideDecimals;
  const fractionText = showDecimals
    ? `${decimalSeparator}${String(fraction).padStart(exponent, "0")}`
    : "";
  return `${negative ? "-" : ""}${wholeText}${fractionText} ${currency}`;
}

/**
 * Converts what a user typed ("200", "200.5", "1 200,50") into integer minor units for a
 * request body. Returns null for input that is not a valid amount.
 */
export function parseMoneyInput(input: string, currency: string): number | null {
  const cleaned = input.replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const exponent = exponentOf(currency);
  const [whole = "0", fraction = ""] = cleaned.replace("-", "").split(".");
  if (fraction.length > exponent) return null;
  const minor = Number(whole) * 10 ** exponent + Number(fraction.padEnd(exponent, "0") || "0");
  return cleaned.startsWith("-") ? -minor : minor;
}
