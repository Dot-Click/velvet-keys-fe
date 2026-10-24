import { Droplets, Flame, Wifi, Zap, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MediaImage } from "@/components/media/media-image";
import { formatDate } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ExpenseStatus, OwnerExpenseKpis, UtilityRow, UtilityType } from "@/types/ops";

/** Currency of the totals the backend returns without one (summary, utilities, KPIs). */
export const LEDGER_CURRENCY = "MAD";

export const UTILITY_ICON: Record<UtilityType, LucideIcon> = {
  electricity: Zap,
  water: Droplets,
  internet: Wifi,
  gas: Flame,
};

const STATUS_STYLE: Record<ExpenseStatus, string> = {
  paid: "border-[#A2E8DD]/40 text-[#A2E8DD]",
  due: "border-primary/40 text-primary",
  overdue: "border-[#FF85A1]/40 text-[#FF85A1]",
};

/** Paid, due or overdue as a small pill. */
export function ExpenseStatusPill({ status }: { status: ExpenseStatus }) {
  const { t } = useTranslation("conciergerie");
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[0.68rem]",
        STATUS_STYLE[status],
      )}
    >
      {t(`expenses.status.${status}`)}
    </span>
  );
}

/** The latest bill of one utility at one unit. */
export function UtilityCard({ row }: { row: UtilityRow }) {
  const { t } = useTranslation("conciergerie");
  const Icon = UTILITY_ICON[row.utilityType];
  const overdue = row.status === "overdue";
  return (
    <article
      className={cn(
        "hover-lift relative flex h-full flex-col gap-3 rounded-2xl border bg-[#141414] p-4",
        overdue ? "border-[#FF85A1]/35 border-s-[3px] border-s-[#FF85A1]" : "border-border/70",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="relative">
          <MediaImage
            kind="unit"
            id={row.unitId}
            name={row.unitName}
            variant="thumb"
            className="size-11 rounded-lg"
          />
          <span className="absolute -bottom-1.5 -end-1.5 grid size-6 place-items-center rounded-full border border-primary/40 bg-[#17150F] text-primary">
            <Icon className="size-3.5" aria-hidden="true" />
          </span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">
            {t(`expenses.utility.${row.utilityType}`)}
          </p>
          <p className="truncate text-[0.7rem] text-muted-foreground">{row.unitName}</p>
        </div>
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/50 pt-3">
        <div>
          <p dir="ltr" className="figure-serif text-xl leading-tight text-[#F8F9FA] rtl:text-right">
            {formatMoney(row.lastBillAmountMinor, LEDGER_CURRENCY)}
          </p>
          <p className={cn("text-[0.7rem]", overdue ? "text-[#FF85A1]" : "text-muted-foreground")}>
            {row.status === "paid"
              ? t("expenses.paidOnDate", { date: formatDate(row.lastBillDate) })
              : row.dueDate
                ? t(overdue ? "expenses.overdueSince" : "expenses.dueOn", {
                    date: formatDate(row.dueDate),
                  })
                : t("expenses.pending")}
          </p>
        </div>
        <ExpenseStatusPill status={row.status} />
      </div>
    </article>
  );
}

const BREAKDOWN: { key: keyof Omit<OwnerExpenseKpis, "totalMinor">; label: string }[] = [
  { key: "workerPayMinor", label: "expenses.tabs.workers" },
  { key: "utilityMinor", label: "expenses.tabs.utilities" },
  { key: "repairMinor", label: "expenses.tabs.repairs" },
  { key: "otherMinor", label: "expenses.tabs.other" },
];

/** Spending split by category, from the backend's totals. */
export function CategoryBreakdown({ kpis }: { kpis: OwnerExpenseKpis }) {
  const { t } = useTranslation("conciergerie");
  return (
    <section aria-label={t("expenses.breakdownTitle")} className="space-y-3">
      <h2 className="font-serif text-xl tracking-normal text-[#F8F9FA]">
        {t("expenses.breakdownTitle")}
      </h2>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {BREAKDOWN.map(({ key, label }) => {
          const share = kpis.totalMinor > 0 ? Math.round((kpis[key] / kpis.totalMinor) * 100) : 0;
          return (
            <li
              key={key}
              className="space-y-2 rounded-2xl border border-border/70 bg-[#141414] p-4"
            >
              <p className="text-[0.7rem] text-muted-foreground">{t(label)}</p>
              <p
                dir="ltr"
                className="figure-serif text-xl leading-tight text-[#F8F9FA] rtl:text-right"
              >
                {formatMoney(kpis[key], LEDGER_CURRENCY)}
              </p>
              <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${share}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
