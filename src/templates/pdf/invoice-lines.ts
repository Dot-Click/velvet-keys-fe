import { daysInMonthKey } from "@/lib/dates";
import type { InvoiceLine } from "@/types/billing";
import type { TemplateLocale } from "../shared/locale";

/** Left-to-right isolate marks: keep "200 MAD / 30" in order inside a right-to-left sentence. */
const LRI = "\u2066";
const PDI = "\u2069";

/** The description and quantity printed for one invoice line, e.g. "2 units · 12 days × 200 MAD / 30". */
export function invoiceLineText(locale: TemplateLocale, line: InvoiceLine, period: string) {
  const { t } = locale;
  const rtl = locale.dir === "rtl";
  const price = locale.formatMAD(line.unitPrice, 0);
  if (line.type === "offer" && line.offer) {
    return {
      label: t("billing:lines.offer", { month: line.offer.month, of: line.offer.of }),
      detail: t("billing:lines.freeDetail", {
        count: line.units,
        days: line.days,
        covers: t(`billing:lines.${line.offer.covers}`),
      }),
    };
  }
  const periodDays = daysInMonthKey(period);
  return {
    label: t(`billing:lines.${line.type}`),
    detail:
      line.days >= periodDays
        ? t("billing:lines.fullMonth", {
            count: line.units,
            price: rtl ? `${LRI}${price}${PDI}` : price,
          })
        : t("billing:lines.prorated", {
            count: line.units,
            days: line.days,
            // The price and the month's length sit side by side in the string, so one pair of
            // marks around them keeps "200 MAD / 30" together
            price: rtl ? `${LRI}${price}` : price,
            periodDays: rtl ? `${periodDays}${PDI}` : periodDays,
          }),
  };
}
