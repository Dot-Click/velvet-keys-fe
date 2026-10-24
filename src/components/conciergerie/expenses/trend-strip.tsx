import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatMonth, formatPercent } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { LUXURY_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ExpenseSummary } from "@/types/ops";
import { LEDGER_CURRENCY } from "./expense-cards";

/** This month's total, the change against last month and six months of bars that grow in. */
export function TrendStrip({ summary, label }: { summary: ExpenseSummary; label: string }) {
  const { t } = useTranslation("conciergerie");
  const months = summary.sixMonthSeries;
  const peak = Math.max(1, ...months.map((month) => month.totalMinor));
  const change = summary.changePercent;
  const up = (change ?? 0) > 0;
  return (
    <section className="grid grid-cols-1 gap-4 rounded-2xl border border-border/70 bg-[#141414] p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-end">
      <div className="space-y-2">
        <p className="text-[0.7rem] text-muted-foreground">{label}</p>
        <p dir="ltr" className="figure-serif text-4xl leading-none text-[#F8F9FA] rtl:text-right">
          {formatMoney(summary.monthTotalMinor, LEDGER_CURRENCY)}
        </p>
        {change !== null ? (
          <p
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
              // More spending is the warning colour; less is jade
              up ? "border-[#FF85A1]/40 text-[#FF85A1]" : "border-[#A2E8DD]/40 text-[#A2E8DD]",
            )}
          >
            {up ? (
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="size-3.5" aria-hidden="true" />
            )}
            {t("expenses.deltaLine", {
              delta: formatPercent(change, { decimals: 1, signed: true }),
              amount: formatMoney(summary.lastMonthTotalMinor, LEDGER_CURRENCY),
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
                {formatMoney(month.totalMinor, LEDGER_CURRENCY)}
              </span>
              <motion.span
                aria-hidden="true"
                title={formatMoney(month.totalMinor, LEDGER_CURRENCY)}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: LUXURY_EASE, delay: index * 0.06 }}
                style={{ height: `${Math.max(4, (month.totalMinor / peak) * 100)}%`, originY: 1 }}
                className={cn(
                  "w-full max-w-10 rounded-t-md",
                  last ? "bg-gradient-to-t from-[#B89225] to-[#E8C65A]" : "bg-primary/25",
                )}
              />
              <span
                className={cn(
                  "text-[0.62rem] uppercase tracking-wider",
                  last ? "text-primary" : "text-muted-foreground",
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
