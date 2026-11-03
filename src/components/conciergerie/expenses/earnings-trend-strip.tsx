import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatMonth, formatPercent } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { LUXURY_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { percentChange } from "@/lib/finance";
import type { MonthlyPnl } from "@/lib/owner-analytics";
import { LEDGER_CURRENCY } from "./expense-cards";

/**
 * This month's commission earned, the change against last month and six months of bars.
 * Mirrors TrendStrip's layout, but "up" is good here (more commission earned), not a warning.
 */
export function EarningsTrendStrip({ months, label }: { months: MonthlyPnl[]; label: string }) {
  const { t } = useTranslation("conciergerie");
  const current = months.at(-1);
  const previous = months.length >= 2 ? months.at(-2) : undefined;
  const monthTotalMinor = current?.commissionMinor ?? 0;
  const change = previous ? percentChange(monthTotalMinor, previous.commissionMinor) : null;
  const up = (change ?? 0) > 0;
  const peak = Math.max(1, ...months.map((month) => month.commissionMinor));

  return (
    <section className="grid grid-cols-1 gap-4 rounded-2xl border border-primary/25 bg-[#141414] p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-end">
      <div className="space-y-2">
        <p className="text-[0.7rem] text-muted-foreground">{label}</p>
        <p dir="ltr" className="figure-serif text-4xl leading-none text-primary rtl:text-right">
          {formatMoney(monthTotalMinor, LEDGER_CURRENCY)}
        </p>
        {change !== null ? (
          <p
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
              // More commission earned is the positive colour; less is the warning colour
              up ? "border-[#A2E8DD]/40 text-[#A2E8DD]" : "border-[#FF85A1]/40 text-[#FF85A1]",
            )}
          >
            {up ? (
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="size-3.5" aria-hidden="true" />
            )}
            {t("expenses.deltaLine", {
              delta: formatPercent(change, { decimals: 1, signed: true }),
              amount: formatMoney(previous?.commissionMinor ?? 0, LEDGER_CURRENCY),
            })}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("expenses.noPreviousMonth")}</p>
        )}
      </div>
      <ol className="flex h-28 items-end gap-2" aria-label={t("expenses.sixMonths")}>
        {months.map((month, index) => {
          const last = index === months.length - 1;
          return (
            <li
              key={month.month}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
            >
              <span className="sr-only">
                {formatMonth(month.month, { style: "long", withYear: true })}:{" "}
                {formatMoney(month.commissionMinor, LEDGER_CURRENCY)}
              </span>
              <motion.span
                aria-hidden="true"
                title={formatMoney(month.commissionMinor, LEDGER_CURRENCY)}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: LUXURY_EASE, delay: index * 0.06 }}
                style={{ height: `${Math.max(4, (month.commissionMinor / peak) * 100)}%`, originY: 1 }}
                className={cn(
                  "w-full max-w-10 rounded-t-md",
                  last ? "bg-gradient-to-t from-[#1F7A6C] to-[#A2E8DD]" : "bg-[#A2E8DD]/25",
                )}
              />
              <span
                className={cn(
                  "text-[0.62rem] uppercase tracking-wider",
                  last ? "text-[#A2E8DD]" : "text-muted-foreground",
                )}
              >
                {formatMonth(month.month, { style: "short" })}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
