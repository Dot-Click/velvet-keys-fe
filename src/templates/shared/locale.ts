import * as React from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import i18n from "@/lib/i18n";
import type { AppLanguage } from "@/types/auth";
import type { ISODate, ISODateTime, MonthKey } from "@/types/common";

/** Templates come in the app's three languages. */
export type TemplateLang = AppLanguage;

export const TEMPLATE_LANGS: readonly TemplateLang[] = ["en", "fr", "ar"];

const CASABLANCA = "Africa/Casablanca";

/** Same locale choices as `lib/currency`, so a template reads like the app does. */
const INTL: Record<TemplateLang, { numbers: string; dates: string }> = {
  en: { numbers: "en-GB", dates: "en-GB" },
  fr: { numbers: "fr-MA", dates: "fr-FR" },
  ar: { numbers: "ar-MA", dates: "ar-MA" },
};

/** Everything a template needs to speak one language, independent of the app's current one. */
export interface TemplateLocale {
  lang: TemplateLang;
  dir: "ltr" | "rtl";
  /** Translates in this language. Keys live in the `templates` namespace; others take a prefix. */
  t: TFunction;
  /** The brand name, as written in this language */
  brand: string;
  /** "Absolute Control", in this language */
  brandTagline: string;
  formatMAD: (amount: number, decimals?: number) => string;
  formatNumber: (value: number, decimals?: number) => string;
  formatPercent: (percent: number, decimals?: number) => string;
  /** "15 Jan 2026". Calendar days (ISODate) never shift with the server's time zone. */
  formatDate: (value: ISODate | ISODateTime | Date) => string;
  /** "September 2026" */
  formatMonth: (period: MonthKey) => string;
  /** "in 45 days" */
  formatRelativeDays: (days: number) => string;
  /** "1 hour", "45 minutes" */
  formatDuration: (minutes: number) => string;
  formatList: (items: string[]) => string;
}

function normalizeLang(value: string | undefined): TemplateLang {
  return value === "fr" || value === "ar" ? value : "en";
}

/** A date as the formatters need it: calendar days read as UTC, instants as Casablanca time. */
function resolveDate(value: ISODate | ISODateTime | Date): { date: Date; timeZone: string } {
  if (value instanceof Date) return { date: value, timeZone: CASABLANCA };
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (day) {
    return {
      date: new Date(Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3]))),
      timeZone: "UTC",
    };
  }
  return { date: new Date(value), timeZone: CASABLANCA };
}

export function createTemplateLocale(language: TemplateLang): TemplateLocale {
  const lang = normalizeLang(language);
  const { numbers, dates } = INTL[lang];
  const decimalsOptions = (decimals: number) => ({
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    t: i18n.getFixedT(lang, "templates"),
    brand: i18n.getFixedT(lang, "common")("brand.name"),
    brandTagline: i18n.getFixedT(lang, "common")("brand.tagline"),
    formatMAD: (amount, decimals = 2) =>
      `${amount.toLocaleString(numbers, decimalsOptions(decimals))} MAD`,
    formatNumber: (value, decimals = 0) =>
      value.toLocaleString(numbers, { minimumFractionDigits: 0, maximumFractionDigits: decimals }),
    formatPercent: (percent, decimals = 1) =>
      new Intl.NumberFormat(numbers, {
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      }).format(percent / 100),
    formatDate: (value) => {
      const { date, timeZone } = resolveDate(value);
      if (Number.isNaN(date.getTime())) return "";
      return date.toLocaleDateString(dates, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone,
      });
    },
    formatMonth: (period) => {
      const [year, month] = period.split("-").map(Number);
      return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, 1)).toLocaleDateString(dates, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    },
    formatRelativeDays: (days) =>
      new Intl.RelativeTimeFormat(numbers, { numeric: "always" }).format(days, "day"),
    formatDuration: (minutes) => {
      const hours = minutes % 60 === 0;
      return new Intl.NumberFormat(numbers, {
        style: "unit",
        unit: hours ? "hour" : "minute",
        unitDisplay: "long",
      }).format(hours ? minutes / 60 : minutes);
    },
    formatList: (items) =>
      new Intl.ListFormat(numbers, { style: "long", type: "conjunction" }).format(items),
  };
}

/**
 * The locale of a template on screen. With no language given it follows the app's, so a screen
 * that embeds a template changes language with the rest of the app; a language given pins it.
 */
export function useTemplateLocale(lang?: TemplateLang): TemplateLocale {
  const { i18n: app } = useTranslation();
  const resolved = lang ?? normalizeLang(app.language);
  return React.useMemo(() => createTemplateLocale(resolved), [resolved]);
}
