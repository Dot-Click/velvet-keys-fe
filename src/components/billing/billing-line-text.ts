import type { TFunction } from "i18next";
import { formatMoney } from "@/lib/money";
import type { BillingLine } from "@/types/subscription";

/**
 * Label and detail text for one real `BillingLine` (`labelKey` + `labelParams`, as the backend
 * sends it). Mirrors `templates/pdf/invoice-lines.ts`'s mapping of the old mock `InvoiceLine`
 * shape onto the same `billing:lines.*` translation keys, which already fit this shape:
 * `*_full_month` -> `lines.fullMonth`, `*_partial_month` -> `lines.prorated`,
 * `launch_offer_free_month` -> `lines.offer`.
 */
export function billingLineText(t: TFunction, line: BillingLine, currency: string) {
  const params = line.labelParams as Record<string, unknown>;
  const price = formatMoney(line.unitPriceMinor, currency);

  if (line.labelKey === "launch_offer_free_month") {
    return {
      label: t("billing:lines.offer", { month: params["month"], of: params["of"] }),
      detail: null,
    };
  }
  if (line.labelKey.endsWith("_full_month")) {
    return {
      label: t(`billing:lines.${line.type}`),
      detail: t("billing:lines.fullMonth", { count: line.units, price }),
    };
  }
  if (line.labelKey.endsWith("_partial_month")) {
    return {
      label: t(`billing:lines.${line.type}`),
      detail: t("billing:lines.prorated", {
        count: line.units,
        days: line.days ?? 0,
        price,
        periodDays: line.periodDays ?? 0,
      }),
    };
  }
  // Unknown line type (e.g. a manual adjustment) -- show the raw key rather than hide the line.
  return { label: line.labelKey, detail: null };
}
