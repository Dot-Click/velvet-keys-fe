import { useTranslation } from "react-i18next";
import { formatDate, formatMonth, formatNumber } from "@/lib/currency";
import { money } from "./format";
import { parseDay } from "@/lib/dates";
import type { BillingCycle } from "@/types/admin-overview";

/** Issued -> Paid -> Due this week -> Overdue for the latest billing cycle. */
export function CycleFunnel({ cycle }: { cycle: BillingCycle }) {
  const { t } = useTranslation("admin-overview");
  const steps = [
    { key: "issued", step: cycle.issued, bar: "#D4AF37", text: "text-primary" },
    { key: "paid", step: cycle.paid, bar: "#A2E8DD", text: "text-[#A2E8DD]" },
    { key: "dueThisWeek", step: cycle.dueThisWeek, bar: "#8F8F8F", text: "text-[#F8F9FA]" },
    { key: "overdue", step: cycle.overdue, bar: "#8B002B", text: "text-[#FF85A1]" },
  ] as const;
  const max = Math.max(1, cycle.issued.count);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {t("cycle.caption", {
          period: formatMonth(cycle.period, { style: "long" }),
          date: formatDate(parseDay(cycle.issuedOn), { year: undefined }),
        })}
      </p>
      <ol className="space-y-2.5">
        {steps.map(({ key, step, bar, text }) => (
          <li key={key} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-muted-foreground">{t(`cycle.${key}`)}</span>
              <span className={`tabular-nums text-sm font-semibold ${text}`}>
                {formatNumber(step.count)}
                <span className="ms-2 text-xs font-normal text-muted-foreground">
                  {money(step.amountMinor)}
                </span>
              </span>
            </div>
            <div dir="ltr" className="h-2 rounded-full bg-[#1C1C1C]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${step.count === 0 ? 0 : Math.max(4, (step.count / max) * 100)}%`,
                  backgroundColor: bar,
                }}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
