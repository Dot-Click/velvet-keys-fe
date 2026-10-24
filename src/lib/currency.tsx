import React from "react";
import i18n from "./i18n";

export interface FormatMADOptions {
  decimals?: number;
  compact?: boolean;
  locale?: string;
}

function resolveIntlLocale(localeOverride?: string): string {
  if (localeOverride) return localeOverride;
  const currentLang = typeof i18n !== "undefined" && i18n.language ? i18n.language : "en";
  if (currentLang === "fr") return "fr-MA";
  if (currentLang === "ar") return "ar-MA";
  return "en-GB";
}

/** The number in front of a "k" or "M" suffix, with the reader's decimal separator. */
function compactPart(value: number, decimals: number, locale: string): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format an amount in Moroccan Dirham (MAD).
 * Standard format: "350,800 MAD" (EN), "350 800 MAD" (FR), "350.800 MAD" / "350,800 MAD" (AR)
 * Always maintains the required "MAD" currency code across all three languages.
 * Dashboards show no decimals; forms and invoices show 2 decimals.
 */
export function formatMAD(
  amount: number | string | null | undefined,
  options?: FormatMADOptions,
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount ?? 0);
  if (isNaN(num)) return "0 MAD";

  const decimals = options?.decimals ?? 0;
  const locale = resolveIntlLocale(options?.locale);

  if (options?.compact && Math.abs(num) >= 1_000_000) {
    return `${compactPart(num / 1_000_000, 1, locale)}M MAD`;
  }
  if (options?.compact && Math.abs(num) >= 10_000) {
    return `${compactPart(num / 1_000, 0, locale)}k MAD`;
  }

  const formatted = num.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${formatted} MAD`;
}

/**
 * Formats just the numerical part of the MAD amount with appropriate decimals and active locale.
 */
export function formatMADNumber(
  amount: number | string | null | undefined,
  decimals = 0,
  localeOverride?: string,
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount ?? 0);
  if (isNaN(num)) return "0";
  const locale = resolveIntlLocale(localeOverride);
  return num.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Locale-aware date formatter matching Phase 2 specifications:
 * English: 15 Jan 2026
 * French: 15 janv. 2026
 * Arabic: 15 يناير 2026
 */
export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
  langOverride?: string,
): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const currentLang = langOverride || (typeof i18n !== "undefined" && i18n.language ? i18n.language : "en");
  const locale = currentLang === "fr" ? "fr-FR" : currentLang === "ar" ? "ar-MA" : "en-GB";
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  };
  return d.toLocaleDateString(locale, defaultOptions);
}

/**
 * Keeps a figure such as "8,800 MAD" in left-to-right order when it is interpolated into an
 * Arabic sentence (Unicode LTR isolate).
 */
export function ltrIsolate(text: string): string {
  return `\u2066${text}\u2069`;
}

/** Like formatDate, with exactly the fields given: no default day, month or year is added. */
export function formatDateFields(date: Date, options: Intl.DateTimeFormatOptions): string {
  if (isNaN(date.getTime())) return "";
  const currentLang = typeof i18n !== "undefined" && i18n.language ? i18n.language : "en";
  const locale = currentLang === "fr" ? "fr-FR" : currentLang === "ar" ? "ar-MA" : "en-GB";
  return date.toLocaleDateString(locale, options);
}

/**
 * React Component for rendering Moroccan Dirham with a smaller, muted "MAD" currency code
 * and tabular numeric alignment for senior luxury aesthetics.
 */
export function MADValue({
  amount,
  decimals = 0,
  compact = false,
  className = "",
  madClassName = "",
}: {
  amount: number | string | null | undefined;
  decimals?: number;
  compact?: boolean;
  className?: string;
  madClassName?: string;
}) {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount ?? 0);
  if (isNaN(num)) return <span className={className}>{formatMAD(0)}</span>;

  let displayNum = "";
  let displaySuffix = "";
  const locale = resolveIntlLocale();

  if (compact && Math.abs(num) >= 1_000_000) {
    displayNum = compactPart(num / 1_000_000, 1, locale);
    displaySuffix = "M";
  } else if (compact && Math.abs(num) >= 10_000) {
    displayNum = compactPart(num / 1_000, 0, locale);
    displaySuffix = "k";
  } else {
    displayNum = num.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return (
    <span className={`inline-flex items-baseline font-mono tabular-nums ${className}`}>
      <span>
        {displayNum}
        {displaySuffix}
      </span>
      <span
        className={`ms-1 font-sans text-[0.72em] font-medium tracking-widest text-muted-foreground uppercase ${madClassName}`}
      >
        MAD
      </span>
    </span>
  );
}

/** Locale-aware percentage, e.g. "94.6%" (EN), "94,6 %" (FR); `signed` adds "+" to gains. */
export function formatPercent(
  value: number,
  options: { decimals?: number; signed?: boolean } = {},
): string {
  const decimals = options.decimals ?? 1;
  return new Intl.NumberFormat(resolveIntlLocale(), {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    ...(options.signed ? { signDisplay: "exceptZero" as const } : {}),
  }).format(value / 100);
}

/** Locale-aware plain number. */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString(resolveIntlLocale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/** Duration in hours with the locale's unit, e.g. "3.8 hr" / "3,8 h". */
export function formatHours(hours: number): string {
  return new Intl.NumberFormat(resolveIntlLocale(), {
    style: "unit",
    unit: "hour",
    unitDisplay: "short",
    maximumFractionDigits: 1,
  }).format(hours);
}

/** "2 hours ago", "yesterday", "in 3 days" in the active language. */
export function formatRelativeTime(date: Date | string, now: Date = new Date()): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.round((target.getTime() - now.getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(resolveIntlLocale(), { numeric: "auto" });
  const abs = Math.abs(seconds);
  if (abs < 3600) return formatter.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return formatter.format(Math.round(seconds / 3600), "hour");
  if (abs < 86400 * 30) return formatter.format(Math.round(seconds / 86400), "day");
  return formatter.format(Math.round(seconds / (86400 * 30)), "month");
}

/** Clock time in Casablanca, e.g. "14:15". */
export function formatCasablancaTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat(resolveIntlLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Casablanca",
  }).format(date);
}

/** File size from kilobytes, e.g. "2.4 MB". */
export function formatFileSize(kilobytes: number): string {
  const megabytes = kilobytes >= 1024;
  return new Intl.NumberFormat(resolveIntlLocale(), {
    style: "unit",
    unit: megabytes ? "megabyte" : "kilobyte",
    unitDisplay: "short",
    maximumFractionDigits: 1,
  }).format(megabytes ? kilobytes / 1024 : kilobytes);
}

/** "Casablanca, Marrakech and Rabat" in the active language. */
export function formatList(items: string[]): string {
  return new Intl.ListFormat(resolveIntlLocale(), { style: "long", type: "conjunction" }).format(items);
}

/** Month name for a "yyyy-MM" key or date, e.g. "Sep" / "September 2026" in the active language. */
export function formatMonth(
  month: string | Date,
  options: { style?: "short" | "long"; withYear?: boolean } = {},
): string {
  const date = typeof month === "string" ? new Date(`${month.slice(0, 7)}-01T00:00:00`) : month;
  const currentLang = typeof i18n !== "undefined" && i18n.language ? i18n.language : "en";
  const locale = currentLang === "fr" ? "fr-FR" : currentLang === "ar" ? "ar-MA" : "en-GB";
  return date.toLocaleDateString(locale, {
    month: options.style ?? "short",
    ...(options.withYear ? { year: "numeric" as const } : {}),
  });
}
