import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { addMonths, startOfMonth } from "date-fns";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type DataColumn } from "@/components/admin/data-table";
import { DeltaBadge, KpiCard } from "@/components/admin/kpi-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { EmptyState } from "@/components/empty-state";
import { QueryView } from "@/components/panel-states";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { useAdminRevenue } from "@/hooks/use-admin-data";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { today } from "@/lib/clock";
import { formatMonth, formatPercent } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { toMonthKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { AdminRevenue, RevenueMonth } from "@/types/platform-admin";

export const Route = createFileRoute("/admin/revenue")({
  component: AdminRevenuePage,
});

function AdminRevenuePage() {
  const query = useAdminRevenue();
  return (
    <QueryView query={query} skeleton="table">
      {(revenue) => <RevenueContent revenue={revenue} />}
    </QueryView>
  );
}

type RangeKey = "3" | "6" | "12" | "ytd" | "custom";
const RANGES: RangeKey[] = ["3", "6", "12", "ytd", "custom"];

const SUM_KEYS = [
  "strMinor",
  "ltrMinor",
  "syncMinor",
  "vatMinor",
  "billedMinor",
  "collectedMinor",
  "invoices",
] as const;

function sum(months: RevenueMonth[]) {
  const total = {
    strMinor: 0,
    ltrMinor: 0,
    syncMinor: 0,
    vatMinor: 0,
    billedMinor: 0,
    collectedMinor: 0,
    invoices: 0,
  };
  for (const month of months) for (const key of SUM_KEYS) total[key] += month[key];
  return total;
}

const rateOf = (billed: number, collected: number) => (billed === 0 ? 1 : collected / billed);

function RevenueContent({ revenue }: { revenue: AdminRevenue }) {
  const { t } = useTranslation("admin-overview");
  const navigate = useNavigate();
  const now = today();
  const [range, setRange] = React.useState<RangeKey>("12");
  const [from, setFrom] = React.useState<Date | undefined>(() => addMonths(startOfMonth(now), -5));
  const [to, setTo] = React.useState<Date | undefined>(now);

  const keys = revenue.months.map((month) => month.month);
  // The real `AdminRevenue` has no explicit "current month" marker; the month list is assumed to
  // run up to and including the current billing period, so the last entry is "current".
  const currentMonthKey = keys.at(-1) ?? toMonthKey(now);
  const bounds = React.useMemo(() => {
    const current = keys.length - 1;
    if (range === "custom") {
      const a = from ? keys.indexOf(toMonthKey(from)) : -1;
      const b = to ? keys.indexOf(toMonthKey(to)) : -1;
      const start = Math.max(0, a < 0 ? 0 : a);
      const end = b < 0 ? current : b;
      return { start: Math.min(start, end), end: Math.max(start, end) };
    }
    if (range === "ytd") {
      const jan = keys.indexOf(`${currentMonthKey.slice(0, 4)}-01`);
      return { start: Math.max(0, jan), end: current };
    }
    return { start: Math.max(0, current - Number(range) + 1), end: current };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, from, to, revenue]);

  const months = revenue.months.slice(bounds.start, bounds.end + 1);
  const count = months.length;
  const previous = revenue.months.slice(Math.max(0, bounds.start - count), bounds.start);
  const totals = sum(months);
  const before = sum(previous);
  const hasPrevious = previous.length === count && before.billedMinor > 0;

  const pct = (now: number, prev: number) =>
    hasPrevious && prev !== 0 ? ((now - prev) / prev) * 100 : null;
  const outstandingMinor = totals.billedMinor - totals.collectedMinor;
  const prevOutstandingMinor = before.billedMinor - before.collectedMinor;
  const rate = rateOf(totals.billedMinor, totals.collectedMinor) * 100;
  const prevRate = rateOf(before.billedMinor, before.collectedMinor) * 100;
  const vs = t("kpi.vsPrevious");

  function signedMoney(valueMinor: number) {
    const sign = valueMinor > 0 ? "+" : valueMinor < 0 ? "−" : "";
    return `${sign}${formatMoney(Math.abs(valueMinor), ACCOUNT_CURRENCY)}`;
  }

  const goToPeriod = (period: string) =>
    void navigate({ to: "/admin/invoices", search: { period } as never });

  const columns: DataColumn<RevenueMonth>[] = [
    {
      id: "month",
      header: t("table.month"),
      locked: true,
      cell: (m) => (
        <span className={m.invoices === 0 ? "text-muted-foreground" : "font-medium"}>
          {formatMonth(m.month, { style: "long", withYear: true })}
        </span>
      ),
      sort: (a, b) => a.month.localeCompare(b.month),
      csv: (m) => m.month,
    },
    ...(["strMinor", "ltrMinor", "syncMinor", "vatMinor"] as const).map(
      (key): DataColumn<RevenueMonth> => ({
        id: key,
        header: t(`table.${key.replace("Minor", "")}`),
        align: "end",
        cell: (m) => <Amount value={m[key]} muted={key === "vatMinor"} />,
        sort: (a, b) => a[key] - b[key],
        csv: (m) => m[key],
      }),
    ),
    {
      id: "billed",
      header: t("table.billed"),
      align: "end",
      cell: (m) => <Amount value={m.billedMinor} className="text-primary" />,
      sort: (a, b) => a.billedMinor - b.billedMinor,
      csv: (m) => m.billedMinor,
    },
    {
      id: "collected",
      header: t("table.collected"),
      align: "end",
      cell: (m) => <Amount value={m.collectedMinor} className="text-[#A2E8DD]" />,
      sort: (a, b) => a.collectedMinor - b.collectedMinor,
      csv: (m) => m.collectedMinor,
    },
    {
      id: "rate",
      header: t("table.rate"),
      align: "end",
      cell: (m) =>
        m.billedMinor === 0 ? (
          <span className="text-muted-foreground/80">—</span>
        ) : (
          <span className="tabular-nums">
            {formatPercent((m.collectedMinor / m.billedMinor) * 100, { decimals: 0 })}
          </span>
        ),
      sort: (a, b) => rateOf(a.billedMinor, a.collectedMinor) - rateOf(b.billedMinor, b.collectedMinor),
      csv: (m) => (m.billedMinor === 0 ? "" : Math.round((m.collectedMinor / m.billedMinor) * 100)),
    },
  ];

  const nothing = revenue.months.every((month) => month.invoices === 0);

  return (
    <AdminPage
      eyebrow={t("revenue.eyebrow")}
      title={t("revenue.title")}
      subtitle={t("revenue.subtitle")}
    >
      {nothing ? (
        <EmptyState
          illustration="ledger"
          title={t("revenue.emptyTitle")}
          description={t("revenue.emptyBody")}
          className="min-h-72"
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label={t("range.label")} className="flex flex-wrap gap-1.5">
              {RANGES.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={range === key}
                  onClick={() => setRange(key)}
                  className={cn(
                    "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    range === key
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border/80 bg-[#121212] text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {t(`range.${key}`)}
                </button>
              ))}
            </div>
            {range === "custom" && (
              <div className="flex flex-wrap items-center gap-2">
                <CustomDatePicker
                  {...(from ? { value: from } : {})}
                  onChange={setFrom}
                  maxDate={to ?? now}
                  placeholder={t("range.from")}
                  className="h-8 w-44 text-xs"
                />
                <span className="text-xs text-muted-foreground">–</span>
                <CustomDatePicker
                  {...(to ? { value: to } : {})}
                  onChange={setTo}
                  {...(from ? { minDate: from } : {})}
                  maxDate={now}
                  placeholder={t("range.to")}
                  className="h-8 w-44 text-xs"
                />
              </div>
            )}
            <span className="ms-auto text-xs text-muted-foreground">
              {t("range.summary", {
                from: formatMonth(months[0]?.month ?? currentMonthKey, { withYear: true }),
                to: formatMonth(months.at(-1)?.month ?? currentMonthKey, { withYear: true }),
              })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <KpiCard
              label={t("revenue.kpiBilled")}
              value={formatMoney(totals.billedMinor, ACCOUNT_CURRENCY)}
              detail={t("revenue.kpiBilledDetail")}
              highlight
              delta={
                <DeltaBadge
                  value={pct(totals.billedMinor, before.billedMinor)}
                  text={formatPercent(pct(totals.billedMinor, before.billedMinor) ?? 0, {
                    signed: true,
                  })}
                  suffix={vs}
                />
              }
            />
            <KpiCard
              label={t("revenue.kpiCollected")}
              value={formatMoney(totals.collectedMinor, ACCOUNT_CURRENCY)}
              delta={
                <DeltaBadge
                  value={pct(totals.collectedMinor, before.collectedMinor)}
                  text={formatPercent(pct(totals.collectedMinor, before.collectedMinor) ?? 0, {
                    signed: true,
                  })}
                  suffix={vs}
                />
              }
            />
            <KpiCard
              label={t("revenue.kpiOutstanding")}
              value={formatMoney(outstandingMinor, ACCOUNT_CURRENCY)}
              delta={
                <DeltaBadge
                  value={hasPrevious ? outstandingMinor - prevOutstandingMinor : null}
                  text={signedMoney(outstandingMinor - prevOutstandingMinor)}
                  goodWhen="down"
                  suffix={vs}
                />
              }
            />
            <KpiCard
              label={t("revenue.kpiRate")}
              value={formatPercent(rate, { decimals: 1 })}
              delta={
                <DeltaBadge
                  value={hasPrevious ? rate - prevRate : null}
                  text={t("kpi.points", {
                    value: `${rate - prevRate > 0 ? "+" : rate - prevRate < 0 ? "−" : ""}${Math.abs(rate - prevRate).toFixed(1)}`,
                  })}
                  suffix={vs}
                />
              }
            />
          </div>

          <RevenueChart months={months} />

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-label-caps text-muted-foreground">{t("table.title")}</h2>
              <span className="text-xs text-muted-foreground">{t("table.note")}</span>
            </div>
            <DataTable
              columns={columns}
              rows={[...months].reverse()}
              rowKey={(m) => m.month}
              onRowClick={(m) => goToPeriod(m.month)}
              csvName={`revenue-${months[0]?.month}-${months.at(-1)?.month}`}
              rowClassName={(m) => (m.invoices === 0 ? "opacity-70" : undefined)}
              footer={({ visibleColumns }) => (
                <tr className="bg-[#0F0F0F] text-[13px] font-semibold text-foreground">
                  {visibleColumns.map((col) => {
                    if (col.id === "month") {
                      return (
                        <td
                          key={col.id}
                          className="px-2.5 py-2.5 text-start text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {t("table.total")}
                        </td>
                      );
                    }
                    if (col.id === "strMinor") {
                      return (
                        <td key={col.id} className="px-2.5 py-2.5 text-end tabular-nums">
                          <Amount value={totals.strMinor} />
                        </td>
                      );
                    }
                    if (col.id === "ltrMinor") {
                      return (
                        <td key={col.id} className="px-2.5 py-2.5 text-end tabular-nums">
                          <Amount value={totals.ltrMinor} />
                        </td>
                      );
                    }
                    if (col.id === "syncMinor") {
                      return (
                        <td key={col.id} className="px-2.5 py-2.5 text-end tabular-nums">
                          <Amount value={totals.syncMinor} />
                        </td>
                      );
                    }
                    if (col.id === "vatMinor") {
                      return (
                        <td key={col.id} className="px-2.5 py-2.5 text-end tabular-nums">
                          <Amount value={totals.vatMinor} muted />
                        </td>
                      );
                    }
                    if (col.id === "billed") {
                      return (
                        <td key={col.id} className="px-2.5 py-2.5 text-end tabular-nums">
                          <Amount value={totals.billedMinor} className="font-bold text-primary" />
                        </td>
                      );
                    }
                    if (col.id === "collected") {
                      return (
                        <td key={col.id} className="px-2.5 py-2.5 text-end tabular-nums">
                          <Amount
                            value={totals.collectedMinor}
                            className="font-bold text-[#A2E8DD]"
                          />
                        </td>
                      );
                    }
                    if (col.id === "rate") {
                      return (
                        <td
                          key={col.id}
                          className="px-2.5 py-2.5 text-end tabular-nums font-semibold"
                        >
                          {formatPercent(rate, { decimals: 1 })}
                        </td>
                      );
                    }
                    return <td key={col.id} />;
                  })}
                  <td className="w-7" />
                </tr>
              )}
            />
          </section>
        </>
      )}
    </AdminPage>
  );
}

function Amount({
  value,
  muted,
  className,
}: {
  value: number;
  muted?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "tabular-nums",
        value === 0 ? "text-muted-foreground/80" : muted ? "text-muted-foreground" : className,
      )}
    >
      {value === 0 ? "—" : formatMoney(value, ACCOUNT_CURRENCY)}
    </span>
  );
}
