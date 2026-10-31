import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useTranslation, Trans } from "react-i18next";
import { AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ArrowUpRight, ArrowDownRight, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatPercent, formatRelativeTime, formatMonth } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { CountUp } from "@/components/motion/count-up";
import { TiltCard } from "@/components/motion/tilt-card";
import { DetailDrawer } from "@/components/detail-drawer";
import { MediaImage } from "@/components/media/media-image";
import { QueryView } from "@/components/panel-states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import {
  CommissionInfo,
  PropertyOccupancy,
  RevenueSplitBar,
  UnitMixChips,
} from "@/components/owner/portfolio-figures";
import { useIsSoloOwner } from "@/hooks/use-is-solo-owner";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import {
  useOwnerAttention,
  useOwnerKpis,
  useOwnerMonthlyTrend,
  useOwnerPayrollTeam,
  usePanelMutation,
  type OwnerAttentionItem,
} from "@/hooks/use-portfolio-data";
import {
  monthWindow,
  useOwnerPropertyPerformance,
  type OwnerPropertyPerformance,
} from "@/hooks/use-owner-performance";
import { ownerFinancialsService } from "@/services/owner-financials-service";
import { percentChange } from "@/lib/finance";
import { toISODate, toMonthKey } from "@/lib/dates";
import {
  adrMinor,
  nightsWithin,
  otherExpensesMinor,
  strOccupancyPct,
  unitMixLabel,
} from "@/lib/owner-analytics";
import type { OwnerKpis } from "@/types/owner-financials";
import { TableCards } from "@/components/table-cards";
import { addDays } from "date-fns";

export const Route = createFileRoute("/owner/overview")({
  component: OwnerOverviewPage,
});

type SortKey = "grossRevenue" | "commission" | "payroll" | "adr";

const money = (minor: number | null | undefined, hideDecimals = false) =>
  minor === null || minor === undefined
    ? "—"
    : formatMoney(minor, ACCOUNT_CURRENCY, { hideDecimals });

function OwnerOverviewPage() {
  const performance = useOwnerPropertyPerformance();
  const kpisQuery = useOwnerKpis({ period: "month" });

  return (
    <QueryView query={performance.properties} skeleton="dashboard">
      {() => (
        <QueryView query={kpisQuery} skeleton="dashboard">
          {(kpis) => <OwnerOverviewContent kpis={kpis} performance={performance} />}
        </QueryView>
      )}
    </QueryView>
  );
}

/** Signed change with the matching arrow and colour. */
function Delta({ value, className = "" }: { value: number | null; className?: string }) {
  if (value === null) return null;
  const Icon = value < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono ${
        value < 0 ? "text-destructive-foreground" : "text-[#A2E8DD]"
      } ${className}`}
    >
      <Icon className="size-3.5 rtl-flip" />
      {formatPercent(value, { signed: true })}
    </span>
  );
}

function attentionTiming(item: OwnerAttentionItem) {
  if (item.amountMinor !== undefined) return formatMoney(item.amountMinor, ACCOUNT_CURRENCY);
  if (!item.at) return "";
  return item.kind === "arrival" ? formatDate(item.at) : formatRelativeTime(item.at);
}

const sortValue = (row: OwnerPropertyPerformance, key: SortKey) => {
  switch (key) {
    case "grossRevenue":
      return row.breakdown?.grossRevenueMinor ?? 0;
    case "commission":
      return row.kpis?.commissionMinor ?? 0;
    case "payroll":
      return row.kpis?.payrollMinor ?? 0;
    case "adr":
      return row.adrMinor ?? 0;
  }
};

function OwnerOverviewContent({
  kpis,
  performance,
}: {
  kpis: OwnerKpis;
  performance: ReturnType<typeof useOwnerPropertyPerformance>;
}) {
  const { t } = useTranslation(["owner", "common"]);
  const { session } = useAuth();
  // Solo owners have no conciergerie, so there is no commission to show
  const solo = useIsSoloOwner();
  const [selectedProperty, setSelectedProperty] = React.useState<OwnerPropertyPerformance | null>(
    null,
  );
  const [sortKey, setSortKey] = React.useState<SortKey>("grossRevenue");
  const [sortAsc, setSortAsc] = React.useState(false);
  const showcaseScrollRef = useHorizontalScroll<HTMLDivElement>();
  const [dismissed, setDismissed] = React.useState<Set<string>>(() => new Set());

  const window = monthWindow();
  const trend = useOwnerMonthlyTrend(6);
  const team = useOwnerPayrollTeam(toISODate(window.start), toISODate(addDays(window.end, -1)));
  const attention = useOwnerAttention();
  const exportStatement = usePanelMutation((propertyId: string) =>
    ownerFinancialsService.createReport({ period: toMonthKey(window.start), propertyId }),
  );

  const rows = performance.rows;
  const allUnits = React.useMemo(
    () => (performance.calendar.data ?? []).map((entry) => entry.unit),
    [performance.calendar.data],
  );
  const calendarReady = Boolean(performance.calendar.data);

  const otherMinor = otherExpensesMinor(kpis);
  const share = (value: number) =>
    kpis.grossRevenueMinor === 0 ? 0 : (value / kpis.grossRevenueMinor) * 100;
  const netMargin = Math.round(share(kpis.netProfitMinor));
  const firstName = (session?.profile.displayName ?? "").split(" ")[0]?.toUpperCase() ?? "";
  const heroProperty = [...rows].sort(
    (a, b) => (b.breakdown?.grossRevenueMinor ?? 0) - (a.breakdown?.grossRevenueMinor ?? 0),
  )[0];
  const totalUnits = rows.reduce((sum, row) => sum + row.property.unitCounts.total, 0);
  const strUnitTotal = rows.reduce((sum, row) => sum + row.strUnits, 0);
  const ltrUnitTotal = rows.reduce((sum, row) => sum + row.ltrUnits, 0);
  const ltrLeased = rows.reduce((sum, row) => sum + (row.ltrLeased ?? 0), 0);
  const hasStr = strUnitTotal > 0;
  const showCommission = !solo;
  const deductions =
    kpis.commissionMinor + kpis.payrollMinor + kpis.utilitiesMinor + kpis.repairsMinor + otherMinor;

  // Portfolio STR occupancy and ADR for this month and last, from the real calendar
  const strUnitsAll = allUnits.filter((unit) => unit.type === "STR");
  // All-STR portfolio: the backend KPI occupancy is exactly STR occupancy. Mixed: STR demand heatmap.
  const strOccupancy = ltrUnitTotal === 0 ? kpis.occupancyPct : performance.portfolioStrOccupancy;
  // Month-over-month STR occupancy change, both months counted the same way from /calendar
  const strOccupancyChange = calendarReady
    ? percentChange(
        strOccupancyPct(strUnitsAll, window.start, window.end),
        strOccupancyPct(strUnitsAll, window.previousStart, window.start),
      )
    : null;
  const portfolioAdr = calendarReady ? adrMinor(allUnits, window.start, window.end) : null;
  const activeUnits = calendarReady
    ? strUnitsAll.filter((unit) =>
        unit.bookings.some(
          (b) => b.status !== "cancelled" && nightsWithin(b, window.start, window.end) > 0,
        ),
      ).length + ltrLeased
    : null;

  const monthly = trend.data ?? [];
  const previousMonth = monthly.length >= 2 ? monthly[monthly.length - 2] : undefined;
  // Prior-month gross revenue: from the monthly series once it has loaded, else backed out of
  // this month's KPI change percentage (available as soon as the KPIs are), else unknown.
  const changePct = kpis.trend.grossRevenueChangePct;
  const previousGrossMinor: number | null = previousMonth
    ? previousMonth.grossRevenueMinor
    : changePct !== null && changePct > -100
      ? Math.round(kpis.grossRevenueMinor / (1 + changePct / 100))
      : null;
  const sparkline = monthly.map((point) => ({
    month: point.month,
    netProfit: point.netProfitMinor / 100,
    grossRevenue: point.grossRevenueMinor / 100,
    netProfitMinor: point.netProfitMinor,
  }));

  const sortedProperties = React.useMemo(() => {
    return [...rows].sort((a, b) =>
      sortAsc
        ? sortValue(a, sortKey) - sortValue(b, sortKey)
        : sortValue(b, sortKey) - sortValue(a, sortKey),
    );
  }, [rows, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const attentionItems = (attention.data ?? []).filter((item) => !dismissed.has(item.id));

  const handleExport = (propertyId: string) => {
    exportStatement.mutate(propertyId, {
      onSuccess: () =>
        toast.success(
          t("owner:overview.statementQueued", { defaultValue: "Statement requested" }),
          {
            description: t("owner:overview.statementQueuedDesc", {
              defaultValue:
                "Your PDF is being generated. Download it from Reports when it is ready.",
            }),
          },
        ),
    });
  };

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-12">
      {/* 1. Greeting Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-[#141414] via-[#121212] to-[#181612] p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Subtle gold hairline motif & ambient glow */}
        <div className="absolute inset-0 texture-vein opacity-50 pointer-events-none" />
        <div className="absolute -top-32 -start-32 size-96 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[0.68rem] uppercase tracking-[0.2em] text-primary">
              <Sparkles className="size-3" />
              <span>{t("owner:overview.portfolioTag")}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-[56px] font-light tracking-[0.06em] text-[#F8F9FA] leading-[1.12]">
              {t("owner:overview.greeting")} <br />
              <span className="font-normal italic gold-gradient-text tracking-normal">
                {firstName}
              </span>
            </h1>

            <p className="max-w-2xl text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
              <Trans
                i18nKey="owner:overview.portfolioSummary"
                values={{
                  occupancy: formatPercent(
                    hasStr ? (strOccupancy ?? kpis.occupancyPct) : kpis.occupancyPct,
                  ),
                  revenue: formatMoney(kpis.grossRevenueMinor, ACCOUNT_CURRENCY),
                  delta:
                    kpis.trend.grossRevenueChangePct === null
                      ? "—"
                      : formatPercent(kpis.trend.grossRevenueChangePct, { signed: true }),
                }}
                components={{
                  1: <span className="text-primary font-medium" />,
                  3: <span className="text-foreground font-medium" />,
                }}
              />
            </p>
          </div>

          {/* Arch-masked interior image bleeding off the right edge */}
          <div className="lg:col-span-4 relative flex justify-end">
            <div className="relative w-64 sm:w-76 h-56 sm:h-64 overflow-hidden rounded-t-full border border-primary/40 shadow-2xl">
              {heroProperty && (
                <MediaImage
                  kind="property"
                  id={heroProperty.property.id}
                  variant="hero"
                  fileId={heroProperty.property.imageFileId}
                  name={heroProperty.property.name}
                  className="size-full transition-transform duration-700 hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/20" />
              <div className="absolute bottom-3 inset-x-0 text-center">
                <span className="text-[0.62rem] uppercase tracking-[0.2em] text-primary/90 font-medium">
                  {heroProperty
                    ? `${heroProperty.property.name} · ${heroProperty.property.city}`
                    : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main KPI Bento & Right Rail Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-16 gap-8">
        {/* Bento KPI Grid (12 cols on lg, 12 of 16 on xl) */}
        <div className="lg:col-span-12 xl:col-span-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Net Profit Hero Card (6 cols × 2 rows on md+) */}
            <div className={`md:col-span-6 ${showCommission ? "md:row-span-3" : "md:row-span-2"}`}>
              <TiltCard
                className="h-full rounded-xl border border-primary/30 bg-[#141414] p-6 sm:p-8 flex flex-col justify-between shadow-[0_16px_40px_rgba(0,0,0,0.7)] group"
                maxTilt={4}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <span className="text-label-caps text-primary">
                      {t("owner:overview.monthlyNetProfit")}
                    </span>
                    <Delta value={kpis.trend.netProfitChangePct} />
                  </div>

                  {/* 72px gold figure */}
                  <div className="mt-5">
                    <div className="font-serif text-5xl sm:text-6xl lg:text-[72px] leading-none tracking-tight font-light text-[#D4AF37] font-tabular">
                      <CountUp value={Math.round(kpis.netProfitMinor / 100)} />
                      <span className="font-sans text-lg sm:text-xl font-normal text-muted-foreground ms-2">
                        MAD
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 tracking-wide">
                      {t(
                        showCommission
                          ? "owner:overview.netAfterAll"
                          : "owner:overview.netAfterOps",
                      )}
                    </p>
                  </div>
                </div>

                {/* Monthly Gold Area Sparkline (one real /owner/kpis call per month) */}
                <div className="my-6 h-36 w-full">
                  {trend.isPending ? (
                    <div className="gold-skeleton size-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={sparkline}
                        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const point = payload[0]?.payload as (typeof sparkline)[number];
                              return (
                                <div className="rounded-lg border border-primary/40 bg-[#141414] p-2 text-xs shadow-xl font-mono">
                                  <p className="text-muted-foreground">
                                    {formatMonth(point.month, { withYear: true })}
                                  </p>
                                  <p className="text-primary font-semibold">
                                    {formatMoney(point.netProfitMinor, ACCOUNT_CURRENCY)}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="netProfit"
                          stroke="#D4AF37"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#goldAreaGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Bottom stats: Margin Ring Gauge & Stacked Bar */}
                <div className="pt-4 border-t border-border/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Margin ring gauge SVG */}
                      <div className="relative size-12 shrink-0">
                        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            stroke="#222"
                            strokeWidth="3"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            stroke="#D4AF37"
                            strokeWidth="3"
                            strokeDasharray="100"
                            strokeDashoffset={100 - Math.max(0, Math.min(100, netMargin))}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 grid place-items-center text-[0.68rem] font-bold text-primary font-mono">
                          {netMargin}%
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {t("owner:overview.operatingMargin")}
                        </p>
                        <p className="text-[0.68rem] text-muted-foreground">
                          {t("owner:overview.yieldEfficiency")}
                        </p>
                      </div>
                    </div>

                    <div className="text-end">
                      <p className="text-xs text-muted-foreground">
                        {t("owner:overview.adrAverage")}
                      </p>
                      <p className="text-sm font-semibold text-primary font-mono">
                        {portfolioAdr === null
                          ? "—"
                          : `${money(portfolioAdr)} ${t("owner:overview.perNight")}`}
                      </p>
                    </div>
                  </div>

                  {/* Stacked bar showing Revenue minus Payroll / Utilities / Repairs */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[0.68rem] text-muted-foreground">
                      <span>{t("owner:overview.expenseOutflowBreakdown")}</span>
                      <span className="font-mono">
                        {money(deductions)} {t("owner:overview.total")}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#202020] overflow-hidden flex">
                      {showCommission && kpis.commissionMinor > 0 && (
                        <div
                          style={{ width: `${share(kpis.commissionMinor)}%` }}
                          className="bg-muted-foreground/80 h-full"
                          title={t("owner:overview.kpiCommission")}
                        />
                      )}
                      <div
                        style={{ width: `${share(kpis.payrollMinor)}%` }}
                        className="bg-[#D4AF37]/90 h-full"
                        title={t("owner:overview.payroll")}
                      />
                      <div
                        style={{ width: `${share(kpis.utilitiesMinor)}%` }}
                        className="bg-[#A2E8DD]/90 h-full"
                        title={t("owner:overview.utilities")}
                      />
                      <div
                        style={{ width: `${share(kpis.repairsMinor)}%` }}
                        className="bg-[#8B002B]/90 h-full"
                        title={t("owner:overview.repairs")}
                      />
                      {otherMinor > 0 && (
                        <div
                          style={{ width: `${share(otherMinor)}%` }}
                          className="bg-[#5A5A5A] h-full"
                          title={t("owner:overview.other", { defaultValue: "Other" })}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.62rem] text-muted-foreground pt-1">
                      {showCommission && kpis.commissionMinor > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="size-2 rounded-full bg-muted-foreground/80" />{" "}
                          {t("owner:overview.commissionShort")} (
                          {formatPercent(share(kpis.commissionMinor))})
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-[#D4AF37]" />{" "}
                        {t("owner:overview.payroll")} ({formatPercent(share(kpis.payrollMinor))})
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-[#A2E8DD]" />{" "}
                        {t("owner:overview.utilities")} ({formatPercent(share(kpis.utilitiesMinor))}
                        )
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-[#8B002B]" />{" "}
                        {t("owner:overview.repairs")} ({formatPercent(share(kpis.repairsMinor))})
                      </span>
                      {otherMinor > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="size-2 rounded-full bg-[#5A5A5A]" />{" "}
                          {t("owner:overview.other", { defaultValue: "Other" })} (
                          {formatPercent(share(otherMinor))})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </TiltCard>
            </div>

            {/* Beside it: Gross Revenue Card (6 cols) */}
            <div className="md:col-span-6">
              <TiltCard
                className="h-full rounded-xl border border-primary/20 bg-[#141414] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
                maxTilt={3}
              >
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="text-label-caps text-muted-foreground">
                    {t("owner:overview.grossRevenue")}
                  </span>
                  <Delta value={kpis.trend.grossRevenueChangePct} />
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div className="font-serif text-3xl sm:text-4xl text-[#F8F9FA] font-light">
                    <CountUp value={Math.round(kpis.grossRevenueMinor / 100)} />
                    <span className="text-xs text-muted-foreground ms-1.5 font-sans">MAD</span>
                  </div>
                  <div className="w-28 h-10">
                    {sparkline.length > 0 && (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparkline.slice(-6)}>
                          <Area
                            type="monotone"
                            dataKey="grossRevenue"
                            stroke="#D4AF37"
                            fill="#D4AF37"
                            fillOpacity={0.15}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
                <RevenueSplitBar
                  strRevenueMinor={kpis.strRevenueMinor}
                  ltrRevenueMinor={kpis.ltrRevenueMinor}
                  className="mt-4"
                />
                <p
                  className={cn(
                    "text-[0.72rem] text-muted-foreground mt-3",
                    previousGrossMinor === null && trend.isPending && "animate-pulse",
                  )}
                  aria-busy={previousGrossMinor === null && trend.isPending}
                >
                  {t("owner:overview.directBookingsUp", {
                    amount: previousGrossMinor !== null ? money(previousGrossMinor) : "—",
                  })}
                </p>
              </TiltCard>
            </div>

            {/* Conciergerie commission: read-only, set per property by the Conciergerie */}
            {showCommission && (
              <div className="md:col-span-3">
                <TiltCard
                  className="h-full rounded-xl border border-primary/20 bg-[#141414] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
                  maxTilt={3}
                >
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/60">
                    <span className="text-[0.64rem] uppercase tracking-wider text-muted-foreground font-semibold">
                      {t("owner:overview.kpiCommission")}
                    </span>
                    <CommissionInfo />
                  </div>
                  <div className="mt-3">
                    <p className="font-serif text-2xl text-foreground font-light font-tabular">
                      <CountUp value={Math.round(kpis.commissionMinor / 100)} />
                      <span className="text-[0.68rem] text-muted-foreground ms-1 font-sans">
                        MAD
                      </span>
                    </p>
                    <p className="text-[0.68rem] text-muted-foreground mt-1">
                      {t("owner:overview.commissionShare", {
                        share: formatPercent(share(kpis.commissionMinor)),
                      })}
                    </p>
                  </div>
                </TiltCard>
              </div>
            )}

            {/* Beside it: Payroll Card */}
            <div className="md:col-span-3">
              <TiltCard
                className="h-full rounded-xl border border-primary/20 bg-[#141414] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
                maxTilt={3}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                  <span className="text-[0.64rem] uppercase tracking-wider text-muted-foreground font-semibold">
                    {t("owner:overview.staffPayroll")}
                  </span>
                  <span className="text-[0.68rem] text-muted-foreground font-mono">
                    {previousMonth &&
                    percentChange(kpis.payrollMinor, previousMonth.payrollMinor) !== null
                      ? formatPercent(
                          percentChange(kpis.payrollMinor, previousMonth.payrollMinor) ?? 0,
                          { signed: true },
                        )
                      : "—"}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="font-serif text-2xl text-foreground font-light font-tabular">
                    <CountUp value={Math.round(kpis.payrollMinor / 100)} />
                    <span className="text-[0.68rem] text-muted-foreground ms-1 font-sans">MAD</span>
                  </p>
                  <p className="text-[0.68rem] text-muted-foreground mt-1">
                    {t("owner:overview.estateArtisans", { count: team.data ?? 0 })}
                  </p>
                </div>
              </TiltCard>
            </div>

            {/* STR occupancy, plus how many long-term units are leased */}
            <div className={showCommission ? "md:col-span-6" : "md:col-span-3"}>
              <TiltCard
                className="h-full rounded-xl border border-primary/20 bg-[#141414] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
                maxTilt={3}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                  <span className="text-[0.64rem] uppercase tracking-wider text-[#A2E8DD] font-semibold">
                    {t("owner:overview.strOccupancy")}
                  </span>
                  <span className="text-[0.68rem] text-[#A2E8DD] font-mono">
                    {strOccupancyChange === null
                      ? "—"
                      : formatPercent(strOccupancyChange, { signed: true })}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  <p className="font-serif text-2xl text-[#A2E8DD] font-light font-tabular">
                    {hasStr && strOccupancy !== null ? (
                      <CountUp value={strOccupancy} decimals={1} suffix="%" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </p>
                  {ltrUnitTotal > 0 ? (
                    <div className="space-y-1">
                      <p className="text-[0.68rem] text-muted-foreground">
                        {t("owner:overview.ltrLeased", {
                          leased: calendarReady ? ltrLeased : "…",
                          total: ltrUnitTotal,
                        })}
                      </p>
                      <div className="h-1 w-full rounded-full bg-[#202020] overflow-hidden">
                        <div
                          style={{ width: `${(ltrLeased / ltrUnitTotal) * 100}%` }}
                          className="h-full bg-[#A2E8DD]"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[0.68rem] text-muted-foreground">
                      {t("owner:overview.estatesActive", {
                        active: activeUnits ?? "…",
                        total: totalUnits,
                      })}
                    </p>
                  )}
                </div>
              </TiltCard>
            </div>
          </div>

          {/* 3. Property Showcase: Horizontally scrolling 320×400 cards */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label-caps text-primary">{t("owner:overview.estateShowcase")}</p>
                <h2 className="font-display text-2xl uppercase tracking-[0.1em] text-[#F8F9FA]">
                  {t("owner:overview.featuredResidences")}
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {t("owner:overview.swipeOrScroll")}
              </span>
            </div>

            <div
              ref={showcaseScrollRef}
              className="relative flex gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory cursor-grab active:cursor-grabbing"
            >
              {rows.map((row) => (
                <div
                  key={row.property.id}
                  onClick={() => setSelectedProperty(row)}
                  className="w-[320px] h-[400px] shrink-0 snap-start cursor-pointer rounded-xl border border-primary/20 bg-[#141414] overflow-hidden flex flex-col justify-between shadow-[0_18px_45px_rgba(0,0,0,0.7)] group hover:border-primary/50 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Top 60% Image with dark gradient overlay */}
                  <div className="relative h-[60%] w-full overflow-hidden">
                    <MediaImage
                      kind="property"
                      id={row.property.id}
                      variant="card"
                      fileId={row.property.imageFileId}
                      name={row.property.name}
                      className="size-full transition-transform duration-700 group-hover:scale-108"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/30 to-transparent" />
                    <div className="absolute top-3 start-3">
                      <span className="rounded-full border border-primary/40 bg-black/60 px-2.5 py-0.5 text-[0.62rem] uppercase tracking-wider text-primary font-medium backdrop-blur-md">
                        {unitMixLabel(row.property.unitCounts)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom 40% Metadata & 3 Micro Stats */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-xl text-[#F8F9FA] group-hover:text-primary transition-colors">
                        {row.property.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {row.property.address} · {row.property.city}
                      </p>
                    </div>

                    {/* 3 Micro Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/60 text-center font-tabular">
                      <div>
                        <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                          {t("owner:properties.monthly")}
                        </p>
                        <p className="text-xs font-semibold text-primary">
                          {row.breakdown ? money(row.breakdown.grossRevenueMinor, true) : "…"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                          {t("owner:properties.adr")}
                        </p>
                        <p className="text-xs font-semibold text-foreground">
                          {row.strUnits > 0 ? money(row.adrMinor, true) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                          {t("owner:properties.occupancy")}
                        </p>
                        <div className="text-xs">
                          <PropertyOccupancy row={row} compact />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Ledger Table: row thumbnails, inline gold occupancy bars, hairline separators, sticky header, sortable columns */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label-caps text-primary">
                  {t("owner:overview.estateTelemetry")}
                </p>
                <h2 className="font-display text-2xl uppercase tracking-[0.1em] text-[#F8F9FA]">
                  {t("owner:overview.portfolioLedger")}
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">
                {t("owner:overview.clickRowDrawer")}
              </span>
            </div>

            <TableCards className="rounded-xl border border-primary/20 bg-[#141414] overflow-hidden shadow-2xl">
              <div className="relative overflow-x-auto">
                <table className="w-full text-start text-sm font-sans">
                  <thead className="sticky top-0 z-10 border-b border-border/80 bg-[#111111]/95 backdrop-blur-md text-[0.68rem] uppercase tracking-[0.15em] text-muted-foreground">
                    <tr>
                      <th className="py-4 px-6 font-medium text-start">
                        {t("owner:overview.colProperty")}
                      </th>
                      <th className="py-4 px-6 font-medium text-start">
                        {t("owner:overview.colTypeMix")}
                      </th>
                      <th
                        onClick={() => handleSort("grossRevenue")}
                        className="py-4 px-6 font-medium cursor-pointer hover:text-primary text-start"
                      >
                        {t("owner:overview.colGrossMonthly")}{" "}
                        {sortKey === "grossRevenue" && (sortAsc ? "↑" : "↓")}
                      </th>
                      {showCommission && (
                        <>
                          <th className="py-4 px-6 font-medium text-start">
                            {t("owner:overview.colCommissionPct")}
                          </th>
                          <th
                            onClick={() => handleSort("commission")}
                            className="py-4 px-6 font-medium cursor-pointer hover:text-primary text-start"
                          >
                            {t("owner:overview.colCommission")}{" "}
                            {sortKey === "commission" && (sortAsc ? "↑" : "↓")}
                          </th>
                        </>
                      )}
                      <th
                        onClick={() => handleSort("payroll")}
                        className="py-4 px-6 font-medium cursor-pointer hover:text-primary text-start"
                      >
                        {t("owner:overview.colPayroll")}{" "}
                        {sortKey === "payroll" && (sortAsc ? "↑" : "↓")}
                      </th>
                      <th className="py-4 px-6 font-medium text-start">
                        {t("owner:overview.colOccupancy")}
                      </th>
                      <th
                        onClick={() => handleSort("adr")}
                        className="py-4 px-6 font-medium cursor-pointer hover:text-primary text-start"
                      >
                        {t("owner:overview.colAdr")} {sortKey === "adr" && (sortAsc ? "↑" : "↓")}
                      </th>
                      <th className="py-4 px-6 font-medium text-end">
                        {t("owner:overview.colAction")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {sortedProperties.map((row) => (
                      <tr
                        key={row.property.id}
                        onClick={() => setSelectedProperty(row)}
                        className="group cursor-pointer hover:bg-[#1A1814] transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5">
                            <MediaImage
                              kind="property"
                              id={row.property.id}
                              variant="thumb"
                              fileId={row.property.imageFileId}
                              name={row.property.name}
                              className="size-10 rounded-lg border border-primary/30 shrink-0"
                            />
                            <div>
                              <p className="font-serif text-base text-[#F8F9FA] group-hover:text-primary transition-colors">
                                {row.property.name}
                              </p>
                              <p className="text-xs text-muted-foreground">{row.property.city}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <UnitMixChips strUnits={row.strUnits} ltrUnits={row.ltrUnits} />
                        </td>
                        <td className="py-4 px-6 font-mono text-primary font-semibold whitespace-nowrap">
                          {row.breakdown ? money(row.breakdown.grossRevenueMinor) : "…"}
                        </td>
                        {showCommission && (
                          <>
                            <td className="py-4 px-6 font-mono text-muted-foreground">
                              {row.property.commissionPct === null
                                ? "—"
                                : formatPercent(row.property.commissionPct)}
                            </td>
                            <td className="py-4 px-6 font-mono text-foreground whitespace-nowrap">
                              {row.kpis ? money(row.kpis.commissionMinor) : "…"}
                            </td>
                          </>
                        )}
                        <td className="py-4 px-6 font-mono text-muted-foreground">
                          {row.kpis ? money(row.kpis.payrollMinor) : "…"}
                        </td>
                        <td className="py-4 px-6">
                          {/* STR occupancy bar, plus leased long-term units */}
                          <div className="space-y-1.5 w-36 text-xs">
                            <PropertyOccupancy row={row} />
                            {row.strUnits > 0 && (
                              <div className="h-1.5 w-full rounded-full bg-[#202020] overflow-hidden">
                                <div
                                  style={{ width: `${row.strOccupancyPct ?? 0}%` }}
                                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#A2E8DD]"
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-foreground whitespace-nowrap">
                          {row.strUnits > 0 && row.adrMinor !== null
                            ? `${money(row.adrMinor)} ${t("owner:overview.perNight")}`
                            : "—"}
                        </td>
                        <td className="py-4 px-6 text-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-primary group-hover:bg-primary/10"
                          >
                            <span>{t("owner:overview.inspect")}</span>
                            <ChevronRight className="size-3.5 ms-1 rtl-flip" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TableCards>
          </section>
        </div>

        {/* 5. Right Rail (≥1440px only): "Attention" Feed */}
        <aside className="hidden xl:block xl:col-span-4 space-y-6">
          <div className="sticky top-28 rounded-xl border border-primary/25 bg-[#141414] p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <p className="text-label-caps text-primary">
                  {t("owner:overview.telemetryPriority")}
                </p>
                <h3 className="font-display text-lg uppercase tracking-[0.1em] text-foreground">
                  {t("owner:overview.attentionRequired")}
                </h3>
              </div>
              <span className="size-2 rounded-full bg-primary animate-ping" />
            </div>

            <div className="space-y-4">
              {attention.isPending &&
                Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="gold-skeleton h-20 w-full" />
                ))}
              {attention.isError && (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive-foreground">
                  {t("common:states.errorBody")}
                </p>
              )}
              {attention.isSuccess && attentionItems.length === 0 && (
                <p className="rounded-lg border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                  {t("owner:overview.attention.empty")}
                </p>
              )}
              {attentionItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/70 bg-[#161616] p-4 space-y-2 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[0.62rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        item.urgency === "critical"
                          ? "bg-destructive/15 text-destructive-foreground border border-destructive/30"
                          : item.urgency === "warning"
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "bg-[#A2E8DD]/15 text-[#A2E8DD] border border-[#A2E8DD]/30"
                      }`}
                    >
                      {t(`owner:overview.attention.${item.kind}`)}
                    </span>
                    <span className="text-[0.68rem] text-muted-foreground font-mono">
                      {attentionTiming(item)}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-foreground">
                    {item.kind === "critical_repair"
                      ? item.subject
                      : t(`owner:overview.attention.${item.kind}Title`, { name: item.subject })}
                  </p>
                  <p className="text-[0.72rem] text-muted-foreground">
                    {item.propertyName} · {item.unitName}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                disabled={attentionItems.length === 0}
                onClick={() =>
                  setDismissed(
                    (prev) => new Set([...prev, ...attentionItems.map((item) => item.id)]),
                  )
                }
                className="w-full text-xs uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/10"
              >
                {t("owner:overview.clearHandledAlerts")}
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* 6. 480px Right-Side Detail Drawer */}
      <DetailDrawer
        open={Boolean(selectedProperty)}
        onClose={() => setSelectedProperty(null)}
        title={selectedProperty?.property.name ?? ""}
        subtitle={
          selectedProperty
            ? `${selectedProperty.property.address} · ${selectedProperty.property.city}`
            : ""
        }
        badge={
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[0.62rem] uppercase tracking-wider text-primary font-medium">
            {selectedProperty ? unitMixLabel(selectedProperty.property.unitCounts) : ""}
          </span>
        }
        footer={
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedProperty(null)}
              className="text-xs"
            >
              {t("owner:overview.close")}
            </Button>
            <Button
              size="sm"
              disabled={!selectedProperty || exportStatement.isPending}
              onClick={() => selectedProperty && handleExport(selectedProperty.property.id)}
              className="btn-shimmer bg-primary text-primary-foreground text-xs uppercase tracking-wider font-semibold"
            >
              {t("owner:overview.exportStatement")}
            </Button>
          </div>
        }
      >
        {selectedProperty && (
          <div className="space-y-6">
            <div className="relative h-52 w-full overflow-hidden rounded-xl border border-primary/30">
              <MediaImage
                kind="property"
                id={selectedProperty.property.id}
                variant="hero"
                fileId={selectedProperty.property.imageFileId}
                name={selectedProperty.property.name}
                className="size-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
            </div>

            {/* The backend stores no property description; show the real facts it does have */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {[
                selectedProperty.property.address,
                selectedProperty.property.city,
                unitMixLabel(selectedProperty.property.unitCounts),
                selectedProperty.property.ownerName,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>

            {/* KPI Matrix */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg border border-border/80 bg-[#161616] p-3">
                <p className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                  {t("owner:overview.monthlyRevenue")}
                </p>
                <p className="text-base font-semibold text-primary font-mono mt-1">
                  {selectedProperty.breakdown
                    ? money(selectedProperty.breakdown.grossRevenueMinor)
                    : "…"}
                </p>
              </div>
              <div className="rounded-lg border border-border/80 bg-[#161616] p-3">
                <p className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                  {t("owner:overview.averageNightlyRate")}
                </p>
                <p className="text-base font-semibold text-foreground font-mono mt-1">
                  {money(selectedProperty.adrMinor)}
                </p>
              </div>
              <div className="rounded-lg border border-border/80 bg-[#161616] p-3">
                <p className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                  {t("owner:overview.staffPayroll")}
                </p>
                <p className="text-base font-semibold text-muted-foreground font-mono mt-1">
                  {selectedProperty.kpis ? money(selectedProperty.kpis.payrollMinor) : "…"}
                </p>
              </div>
              <div className="rounded-lg border border-border/80 bg-[#161616] p-3">
                <p className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                  {t("owner:overview.occupancyRate")}
                </p>
                <div className="text-base mt-1">
                  <PropertyOccupancy row={selectedProperty} />
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="rounded-lg border border-border/80 bg-[#161616] p-4 space-y-3">
              <p className="text-label-caps text-muted-foreground">
                {t("owner:overview.costBreakdown")}
              </p>
              {selectedProperty.kpis ? (
                <div className="space-y-2 text-xs font-mono">
                  {showCommission && selectedProperty.kpis.commissionMinor > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("owner:overview.kpiCommission")}
                        {selectedProperty.property.commissionPct !== null
                          ? ` (${formatPercent(selectedProperty.property.commissionPct)})`
                          : ""}
                        :
                      </span>
                      <span>{money(selectedProperty.kpis.commissionMinor)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("owner:overview.staffPayroll")}:
                    </span>
                    <span>{money(selectedProperty.kpis.payrollMinor)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("owner:overview.utilitiesInfrastructure")}:
                    </span>
                    <span>{money(selectedProperty.kpis.utilitiesMinor)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("owner:overview.maintenanceRepairs")}:
                    </span>
                    <span>{money(selectedProperty.kpis.repairsMinor)}</span>
                  </div>
                  {otherExpensesMinor(selectedProperty.kpis) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("owner:overview.other", { defaultValue: "Other" })}:
                      </span>
                      <span>{money(otherExpensesMinor(selectedProperty.kpis))}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border/60 pt-2 text-primary font-semibold">
                    <span>{t("owner:overview.netEstimatedProfit")}:</span>
                    <span>{money(selectedProperty.kpis.netProfitMinor)}</span>
                  </div>
                </div>
              ) : (
                <div className="gold-skeleton h-24 w-full" />
              )}
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
