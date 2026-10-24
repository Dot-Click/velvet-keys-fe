import * as React from "react";
import { useTranslation } from "react-i18next";

/** Same locale choices as `lib/currency`, so figures and calendar labels read alike. */
const LOCALES = { en: "en-GB", fr: "fr-FR", ar: "ar-MA" } as const;

/** Monday to Sunday: 5 October 2026 is a Monday. */
function weekdayLabels(locale: string) {
  const format = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  return Array.from({ length: 7 }, (_, day) => format.format(new Date(Date.UTC(2026, 9, 5 + day))));
}

/** January to December, one letter each where the language has one. */
function monthLabels(locale: string) {
  const format = new Intl.DateTimeFormat(locale, { month: "narrow", timeZone: "UTC" });
  return Array.from({ length: 12 }, (_, month) =>
    format.format(new Date(Date.UTC(2026, month, 1))),
  );
}

/**
 * Reading direction and calendar labels for the landing page. `sign` flips motion that slides in
 * from a side, and the labels follow the active language. `dayOfMonth` formats a day of October
 * 2026 (the month the mockups show), and `monthYear` names that month.
 */
export function useLandingLocale() {
  const { i18n } = useTranslation();
  const lang = i18n.language.slice(0, 2) as keyof typeof LOCALES;
  return React.useMemo(() => {
    const locale = LOCALES[lang] ?? LOCALES.en;
    const rtl = lang === "ar";
    const dayFormat = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
    const monthYearFormat = new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    return {
      rtl,
      sign: rtl ? -1 : 1,
      locale,
      weekdays: weekdayLabels(locale),
      months: monthLabels(locale),
      dayOfMonth: (day: number) => dayFormat.format(new Date(Date.UTC(2026, 9, day))),
      monthYear: monthYearFormat.format(new Date(Date.UTC(2026, 9, 1))),
    };
  }, [lang]);
}
