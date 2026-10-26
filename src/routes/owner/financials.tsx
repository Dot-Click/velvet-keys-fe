import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Download } from "lucide-react";
import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RevenueSplitBar } from "@/components/owner/portfolio-figures";
import { QueryView } from "@/components/panel-states";
import {
  useOwnerKpis,
  useOwnerMonthlyTrend,
  usePanelMutation,
  usePortfolioBreakdownAll,
  useProperties,
} from "@/hooks/use-portfolio-data";
import { today } from "@/lib/clock";
import { formatNumber, formatPercent, formatMonth } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { toISODate } from "@/lib/dates";
import { otherExpensesMinor, unitMixLabel } from "@/lib/owner-analytics";
import { ownerFinancialsService } from "@/services/owner-financials-service";
import type { FinancialQuery, OwnerKpis } from "@/types/owner-financials";
import type { Property } from "@/types/portfolio";
import { TableCards } from "@/components/table-cards";

export const Route = createFileRoute("/owner/financials")({
  component: OwnerFinancialsPage,
});

type FinancialPeriod = "this_month" | "last_month" | "this_quarter" | "full_year";

const monthLabel = (month: string) => formatMonth(month, { withYear: true });
const money = (minor: number, hideDecimals = false) =>
  formatMoney(minor, ACCOUNT_CURRENCY, { hideDecimals });

/** The backend filter for each period tab: named periods, or explicit dates for last month. */
function periodFilter(period: FinancialPeriod): Omit<FinancialQuery, "propertyId"> {
  if (period === "this_month") return { period: "month" };
  if (period === "this_quarter") return { period: "quarter" };
  if (period === "full_year") return { period: "year" };
  const lastMonth = startOfMonth(addMonths(today(), -1));
  return { from: toISODate(lastMonth), to: toISODate(endOfMonth(lastMonth)) };
}

function OwnerFinancialsPage() {
  const [period, setPeriod] = React.useState<FinancialPeriod>("this_month");
  const properties = useProperties();
  const query = useOwnerKpis(periodFilter(period));

  return (
    <QueryView query={properties} skeleton="table">
      {(propertyList) => (
        <QueryView query={query} skeleton="table">
          {(kpis) => (
            <OwnerFinancialsContent
              kpis={kpis}
              properties={propertyList}
              period={period}
              onPeriodChange={setPeriod}
            />
          )}
        </QueryView>
      )}
    </QueryView>
  );
}

function OwnerFinancialsContent({
  kpis,
  properties,
  period,
  onPeriodChange: setPeriod,
}: {
  kpis: OwnerKpis;
  properties: Property[];
  period: FinancialPeriod;
  onPeriodChange: (period: FinancialPeriod) => void;
}) {
  const { t } = useTranslation(["owner", "common"]);
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});
  const now = today();
  const grossDelta = kpis.trend.grossRevenueChangePct;
  const margin =
    kpis.grossRevenueMinor === 0 ? 0 : (kpis.netProfitMinor / kpis.grossRevenueMinor) * 100;

  // Month-by-month: 6 months, or every month of the year so far for the full-year tab
  const monthCount = period === "full_year" ? now.getMonth() + 1 : 6;
  const trend = useOwnerMonthlyTrend(monthCount);
  const breakdown = usePortfolioBreakdownAll(periodFilter(period));
  const exportMonth = usePanelMutation((month: string) =>
    ownerFinancialsService.createReport({ period: month }),
  );
  const monthly = trend.data ?? [];

  const toggleRow = (month: string) => {
    setExpandedRows((prev) => ({ ...prev, [month]: !prev[month] }));
  };

  const chartData = React.useMemo(
    () =>
      monthly.map((item) => ({
        month: item.month,
        label: formatMonth(item.month),
        revenue: item.grossRevenueMinor / 100,
        expenses: item.totalOutflowMinor / 100,
        revenueMinor: item.grossRevenueMinor,
        expensesMinor: item.totalOutflowMinor,
        netProfitMinor: item.netProfitMinor,
      })),
    [monthly],
  );

  // Deductions from gross revenue: payroll / utilities / repairs / conciergerie commission (+ other)
  const otherMinor = otherExpensesMinor(kpis);
  const donutData = React.useMemo(() => {
    const slices = [
      { name: t("owner:financials.staffPayroll"), value: kpis.payrollMinor, color: "#D4AF37" },
      {
        name: t("owner:financials.utilitiesInfrastructure"),
        value: kpis.utilitiesMinor,
        color: "#A2E8DD",
      },
      {
        name: t("owner:financials.repairsMaintenance"),
        value: kpis.repairsMinor,
        color: "#8B002B",
      },
      { name: t("owner:financials.commission"), value: kpis.commissionMinor, color: "#777777" },
    ];
    if (otherMinor > 0) {
      slices.push({
        name: t("owner:overview.other", { defaultValue: "Other" }),
        value: otherMinor,
        color: "#4A4A4A",
      });
    }
    return slices;
  }, [t, kpis, otherMinor]);

  const totalExpenseSum = donutData.reduce((acc, d) => acc + d.value, 0);
  const propertyById = React.useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);
  const rankedProperties = [...(breakdown.data ?? [])].sort((a, b) => b.marginPct - a.marginPct);

  const handleExportMonth = (month: string) => {
    exportMonth.mutate(month, {
      onSuccess: () =>
        toast.success(t("owner:reports.downloading", { title: monthLabel(month) }), {
          description: t("owner:reports.downloadingDesc"),
        }),
    });
  };

  const tabClass = (value: FinancialPeriod) =>
    `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
      period === value
        ? "bg-primary/20 text-primary border border-primary/40 font-semibold"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-10">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary" />
            <p className="text-label-caps text-primary">
              {t("owner:financials.executiveAccounting")}
            </p>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-[0.1em] text-[#F8F9FA]">
            {t("owner:financials.title")}
          </h1>
          <p className="text-xs text-muted-foreground">{t("owner:financials.subtitle")}</p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl border border-primary/25 bg-[#141414] p-1.5">
          <button
            type="button"
            onClick={() => setPeriod("this_month")}
            className={tabClass("this_month")}
          >
            {t("owner:financials.thisMonth")}
          </button>
          <button
            type="button"
            onClick={() => setPeriod("last_month")}
            className={tabClass("last_month")}
          >
            {t("owner:financials.lastMonth")}
          </button>
          <button
            type="button"
            onClick={() => setPeriod("this_quarter")}
            className={tabClass("this_quarter")}
          >
            {t("owner:financials.q3", {
              quarter: Math.floor(now.getMonth() / 3) + 1,
              year: now.getFullYear(),
            })}
          </button>
          <button
            type="button"
            onClick={() => setPeriod("full_year")}
            className={tabClass("full_year")}
          >
            {t("owner:financials.fullYear", { year: now.getFullYear() })}
          </button>
        </div>
      </div>

      {/* Top 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-xl border border-primary/25 bg-[#141414] p-6 shadow-xl space-y-2">
          <p className="text-label-caps text-muted-foreground">
            {t("owner:financials.portfolioGrossRevenue")}
          </p>
          <p className="font-serif text-3xl sm:text-4xl text-foreground font-light font-tabular">
            {money(kpis.grossRevenueMinor)}
          </p>
          <RevenueSplitBar
            strRevenueMinor={kpis.strRevenueMinor}
            ltrRevenueMinor={kpis.ltrRevenueMinor}
          />
          <p
            className={`text-xs font-mono flex items-center gap-1 ${
              (grossDelta ?? 0) < 0 ? "text-destructive-foreground" : "text-[#A2E8DD]"
            }`}
          >
            {(grossDelta ?? 0) < 0 ? (
              <ArrowDownRight className="size-3.5 rtl-flip" />
            ) : (
              <ArrowUpRight className="size-3.5 rtl-flip" />
            )}{" "}
            {grossDelta === null
              ? t("owner:financials.noPreviousPeriod", {
                  defaultValue: "No revenue in the previous period to compare",
                })
              : t("owner:financials.vsPreviousCycle", {
                  delta: formatPercent(grossDelta, { signed: true }),
                })}
          </p>
        </div>

        <div className="rounded-xl border border-destructive/30 bg-[#141414] p-6 shadow-xl space-y-2">
          <p className="text-label-caps text-destructive-foreground">
            {t("owner:financials.totalOperationalOutflow")}
          </p>
          <p className="font-serif text-3xl sm:text-4xl text-[#F8F9FA] font-light font-tabular">
            {money(totalExpenseSum)}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {t("owner:financials.outflowBreakdown")}
          </p>
        </div>

        <div className="rounded-xl border border-primary/40 bg-[#171510] p-6 shadow-xl space-y-2">
          <p className="text-label-caps text-primary">
            {t("owner:financials.consolidatedNetProfit")}
          </p>
          <p className="font-serif text-3xl sm:text-4xl text-primary font-light font-tabular">
            {money(kpis.netProfitMinor)}
          </p>
          <p className="text-xs text-primary/80 font-mono">
            {t("owner:financials.profitMarginBenchmark", { margin: formatPercent(margin) })}
          </p>
        </div>
      </div>

      {/* Dual Column: Dual-Line Chart (Gold vs Ruby) + Donut Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Revenue vs Expenses Dual-Line Chart (Gold vs Ruby) - 7 cols */}
        <div className="lg:col-span-7 rounded-xl border border-primary/20 bg-[#141414] p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <div>
              <p className="text-label-caps text-primary">
                {t("owner:financials.dualStreamTelemetry")}
              </p>
              <h2 className="font-display text-xl uppercase tracking-[0.1em] text-[#F8F9FA]">
                {t("owner:financials.revenueVsExpenses")}
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-primary">
                <span className="size-2 rounded-full bg-[#D4AF37]" />{" "}
                {t("owner:financials.revenue")}
              </span>
              <span className="flex items-center gap-1.5 text-destructive-foreground">
                <span className="size-2 rounded-full bg-[#8B002B]" />{" "}
                {t("owner:financials.expenses")}
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {trend.isPending ? (
              <div className="gold-skeleton size-full" />
            ) : trend.isError ? (
              <p className="grid size-full place-items-center text-xs text-destructive-foreground">
                {t("common:states.errorBody")}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
                    stroke="#666"
                    textAnchor="middle"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#666"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val: number) => `${formatNumber(Math.round(val / 1000))}k`}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0]?.payload as (typeof chartData)[number];
                        return (
                          <div className="rounded-xl border border-primary/40 bg-[#141414] p-3 text-xs font-mono shadow-2xl space-y-1">
                            <p className="text-muted-foreground font-sans font-semibold">
                              {monthLabel(d.month)}
                            </p>
                            <p className="text-primary">
                              {t("owner:financials.revenue")}: {money(d.revenueMinor)}
                            </p>
                            <p className="text-destructive-foreground">
                              {t("owner:financials.expenses")}: {money(d.expensesMinor)}
                            </p>
                            <p className="text-[#A2E8DD] border-t border-border/60 pt-1">
                              {t("owner:financials.colNetProfit")}: {money(d.netProfitMinor)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#D4AF37"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#D4AF37" }}
                    activeDot={{ r: 6, fill: "#FFF1BE" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#8B002B"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#8B002B" }}
                    activeDot={{ r: 6, fill: "#FF4D6D" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense Breakdown Donut (payroll / utilities / repairs / other) - 5 cols */}
        <div className="lg:col-span-5 rounded-xl border border-primary/20 bg-[#141414] p-6 shadow-2xl space-y-6">
          <div className="border-b border-border/80 pb-4">
            <p className="text-label-caps text-primary">{t("owner:financials.costAllocation")}</p>
            <h2 className="font-display text-xl uppercase tracking-[0.1em] text-[#F8F9FA]">
              {t("owner:financials.expenseBreakdownDonut")}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="relative size-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      totalExpenseSum === 0
                        ? [{ name: "none", value: 1, color: "#202020" }]
                        : donutData
                    }
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={totalExpenseSum === 0 ? 0 : 3}
                  >
                    {(totalExpenseSum === 0 ? [{ color: "#202020" }] : donutData).map(
                      (entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ),
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                  {t("owner:financials.totalOut")}
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  {money(totalExpenseSum, true)}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-3 w-full min-w-0">
              {donutData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground font-sans truncate">{item.name}</span>
                  </div>
                  <span className="shrink-0 whitespace-nowrap font-semibold text-foreground">
                    {money(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Per-Property Profit Margin Horizontal Bar Ranking */}
      <section className="rounded-xl border border-primary/20 bg-[#141414] p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div>
            <p className="text-label-caps text-primary">{t("owner:financials.yieldLeaderboard")}</p>
            <h2 className="font-display text-2xl uppercase tracking-[0.1em] text-[#F8F9FA]">
              {t("owner:financials.marginRanking")}
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {t("owner:financials.rankedByMargin")}
          </span>
        </div>

        <div className="space-y-4">
          {breakdown.isPending &&
            Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="gold-skeleton h-20 w-full" />
            ))}
          {breakdown.isError && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive-foreground">
              {t("common:states.errorBody")}
            </p>
          )}
          {rankedProperties.map((prop, idx) => {
            const property = propertyById.get(prop.propertyId);
            return (
              <div
                key={prop.propertyId}
                className="space-y-2 rounded-lg border border-border/60 bg-[#161616] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-lg font-semibold text-primary w-6">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-serif text-base text-[#F8F9FA]">{prop.propertyName}</p>
                      <p className="text-xs text-muted-foreground">
                        {property ? `${unitMixLabel(property.unitCounts)} · ${property.city}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs font-mono">
                    <div>
                      <span className="text-muted-foreground me-1.5 font-sans">
                        {t("owner:financials.monthlyRevenue")}
                      </span>
                      <span className="text-primary font-semibold">
                        {money(prop.grossRevenueMinor)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground me-1.5 font-sans">
                        {t("owner:financials.netProfit")}
                      </span>
                      <span className="text-[#A2E8DD] font-semibold">
                        {money(prop.netProfitMinor)}
                      </span>
                    </div>
                    <div className="text-end min-w-[70px]">
                      <span className="text-lg font-bold text-primary font-mono">
                        {formatPercent(prop.marginPct)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Horizontal margin bar */}
                <div className="h-2 w-full rounded-full bg-[#202020] overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.max(0, prop.marginPct))}%` }}
                    className="h-full bg-gradient-to-r from-[#D4AF37] via-[#FFF1BE] to-[#D4AF37]"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Month-by-Month P&L Table with Expandable Rows */}
      <section className="rounded-xl border border-primary/20 bg-[#141414] overflow-hidden shadow-2xl space-y-4">
        <div className="p-6 border-b border-border/80 flex items-center justify-between">
          <div>
            <p className="text-label-caps text-primary">{t("owner:financials.ledgerBreakdown")}</p>
            <h2 className="font-display text-2xl uppercase tracking-[0.1em] text-[#F8F9FA]">
              {t("owner:financials.monthByMonthLedger")}
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {t("owner:financials.clickRowAudit")}
          </span>
        </div>

        <TableCards className="relative overflow-x-auto">
          <table className="w-full text-start text-sm font-sans">
            <thead className="border-b border-border/80 bg-[#111111]/95 text-[0.68rem] uppercase tracking-[0.15em] text-muted-foreground">
              <tr>
                <th className="py-4 px-6 font-medium text-start">
                  {t("owner:financials.colPeriod")}
                </th>
                <th className="py-4 px-6 font-medium text-start">
                  {t("owner:financials.colGrossRevenue")}
                </th>
                <th className="py-4 px-6 font-medium text-start">
                  {t("owner:financials.colStaffPayroll")}
                </th>
                <th className="py-4 px-6 font-medium text-start">
                  {t("owner:financials.colUtilities")}
                </th>
                <th className="py-4 px-6 font-medium text-start">
                  {t("owner:financials.colMaintenance")}
                </th>
                <th className="py-4 px-6 font-medium text-start">
                  {t("owner:financials.colNetProfit")}
                </th>
                <th className="py-4 px-6 font-medium text-end">
                  {t("owner:financials.colOccupancy")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {trend.isPending && (
                <tr>
                  <td colSpan={7} className="p-6">
                    <div className="gold-skeleton h-24 w-full" />
                  </td>
                </tr>
              )}
              {monthly.map((item) => {
                const isExpanded = Boolean(expandedRows[item.month]);
                return (
                  <React.Fragment key={item.month}>
                    <tr
                      onClick={() => toggleRow(item.month)}
                      className="group cursor-pointer hover:bg-[#1A1814] transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <ChevronRight
                            className={`size-4 text-primary transition-transform duration-200 rtl-flip ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                          <span className="font-serif font-semibold text-[#F8F9FA]">
                            {monthLabel(item.month)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-primary font-semibold">
                        {money(item.grossRevenueMinor)}
                      </td>
                      <td className="py-4 px-6 font-mono text-muted-foreground">
                        {money(item.payrollMinor)}
                      </td>
                      <td className="py-4 px-6 font-mono text-muted-foreground">
                        {money(item.utilitiesMinor)}
                      </td>
                      <td className="py-4 px-6 font-mono text-destructive-foreground">
                        {money(item.repairsMinor)}
                      </td>
                      <td className="py-4 px-6 font-mono text-[#A2E8DD] font-semibold">
                        {money(item.netProfitMinor)}
                      </td>
                      <td className="py-4 px-6 text-end font-mono text-foreground font-medium">
                        {formatPercent(item.occupancyPct)}
                      </td>
                    </tr>

                    {/* Expandable row detail */}
                    {isExpanded && (
                      <tr className="bg-[#111111]/80">
                        <td colSpan={7} className="px-8 py-5 border-t border-border/40">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                            <div className="rounded border border-border/60 bg-[#161616] p-3 space-y-1">
                              <p className="text-[0.62rem] text-muted-foreground uppercase font-sans">
                                {t("owner:financials.revenueSurplus")}
                              </p>
                              <p className="text-base text-primary font-bold">
                                {money(item.grossRevenueMinor)}
                              </p>
                              <p className="text-[0.68rem] text-muted-foreground font-sans">
                                {t("owner:financials.yieldRateBooked", {
                                  percent: formatNumber(item.occupancyPct, 1),
                                })}
                              </p>
                            </div>
                            <div className="rounded border border-border/60 bg-[#161616] p-3 space-y-1">
                              <p className="text-[0.62rem] text-muted-foreground uppercase font-sans">
                                {t("owner:financials.operationalOpex")}
                              </p>
                              <p className="text-base text-destructive-foreground font-bold">
                                {money(item.totalOutflowMinor)}
                              </p>
                              <p className="text-[0.68rem] text-muted-foreground font-sans">
                                {t("owner:financials.directCostOps")}
                              </p>
                            </div>
                            <div className="rounded border border-border/60 bg-[#161616] p-3 space-y-1">
                              <p className="text-[0.62rem] text-muted-foreground uppercase font-sans">
                                {t("owner:financials.netMargin")}
                              </p>
                              <p className="text-base text-[#A2E8DD] font-bold">
                                {formatPercent(
                                  item.grossRevenueMinor === 0
                                    ? 0
                                    : (item.netProfitMinor / item.grossRevenueMinor) * 100,
                                )}
                              </p>
                              <p className="text-[0.68rem] text-muted-foreground font-sans">
                                {t("owner:financials.netPostTaxCashflow")}
                              </p>
                            </div>
                            <div className="rounded border border-border/60 bg-[#161616] p-3 flex flex-col justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={exportMonth.isPending}
                                onClick={() => handleExportMonth(item.month)}
                                className="text-xs uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/10"
                              >
                                <Download className="size-3.5 me-1.5 rtl-flip" />
                                {t("owner:financials.exportMonthPdf", {
                                  month: monthLabel(item.month),
                                })}
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </TableCards>
      </section>
    </div>
  );
}
