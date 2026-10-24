import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { AlertTriangle, CheckCircle2, Download, Loader2, Mail, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogoHorizontal } from "@/components/brand";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomDateRangePicker } from "@/components/ui/custom-date-range-picker";
import { useAuth } from "@/components/auth-provider";
import { RevenueSplitBar } from "@/components/owner/portfolio-figures";
import { QueryView } from "@/components/panel-states";
import { useIsSoloOwner } from "@/hooks/use-is-solo-owner";
import {
  useOwnerCalendar,
  useOwnerKpis,
  useOwnerPropertyKpis,
  usePanelMutation,
  usePortfolioBreakdownAll,
  useProperties,
  useReportsPage,
  useReportStatus,
} from "@/hooks/use-portfolio-data";
import { today } from "@/lib/clock";
import { formatDate, formatList, formatPercent, formatMonth } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { toISODate } from "@/lib/dates";
import { strOccupancyPct, unitMixLabel } from "@/lib/owner-analytics";
import { ownerFinancialsService } from "@/services/owner-financials-service";
import type { CreateReportInput, ReportListItem, ReportStatus } from "@/types/owner-financials";
import type { Property } from "@/types/portfolio";
import { addDays, addMonths, endOfMonth, format, isSameDay, startOfMonth } from "date-fns";
import { TableCards } from "@/components/table-cards";

export const Route = createFileRoute("/owner/reports")({
  component: OwnerReportsPage,
});

const money = (minor: number) => formatMoney(minor, ACCOUNT_CURRENCY);

function OwnerReportsPage() {
  const properties = useProperties();

  return (
    <QueryView query={properties} skeleton="split">
      {(rows) => <OwnerReportsContent properties={rows} />}
    </QueryView>
  );
}

function statusBadgeClass(status: ReportStatus) {
  if (status === "ready") return "border-success/30 bg-success/10 text-success";
  if (status === "failed")
    return "border-destructive/40 bg-destructive/15 text-destructive-foreground";
  return "border-primary/30 bg-primary/10 text-primary";
}

/** "2026-09" or "2026-09-03..2026-09-17" (the backend's report period label) as display text. */
function reportPeriodLabel(period: string) {
  if (/^\d{4}-\d{2}$/.test(period)) return formatMonth(period, { style: "long", withYear: true });
  const [from, to] = period.split("..");
  return from && to ? `${formatDate(from)} – ${formatDate(to)}` : period;
}

function OwnerReportsContent({ properties }: { properties: Property[] }) {
  const { t } = useTranslation(["owner", "common"]);
  const { session } = useAuth();
  // Solo owners pay no conciergerie commission, so their statement leaves it out
  const solo = useIsSoloOwner();
  const lastMonth = startOfMonth(addMonths(today(), -1));
  const [selectedProperty, setSelectedProperty] = React.useState<string>("all");
  const [reportType, setReportType] = React.useState<"summary" | "detailed">("summary");
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>({
    from: lastMonth,
    to: endOfMonth(lastMonth),
  });
  const [activeReportId, setActiveReportId] = React.useState<string | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const from = toISODate(dateRange.from);
  const to = toISODate(dateRange.to);
  const propertyFilter = selectedProperty === "all" ? {} : { propertyId: selectedProperty };

  // Live statement preview, from the same real figures the PDF is rendered from
  const statementQuery = useOwnerKpis({ from, to, ...propertyFilter });
  const breakdownQuery = usePortfolioBreakdownAll({ from, to });
  const rowsInScope = (breakdownQuery.data ?? []).filter(
    (row) => selectedProperty === "all" || row.propertyId === selectedProperty,
  );
  const rowKpis = useOwnerPropertyKpis(
    rowsInScope.map((row) => row.propertyId),
    { from, to },
  );
  const calendar = useOwnerCalendar(
    from,
    toISODate(addDays(dateRange.to, 1)),
    propertyFilter.propertyId,
  );
  const statement = statementQuery.data;

  const reportsQuery = useReportsPage(1, 10);
  const statusQuery = useReportStatus(activeReportId);
  const createReport = usePanelMutation((input: CreateReportInput) =>
    ownerFinancialsService.createReport(input),
  );

  React.useEffect(() => {
    if (statusQuery.data?.status === "ready" || statusQuery.data?.status === "failed") {
      void reportsQuery.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusQuery.data?.status]);

  const propertyById = React.useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);
  const isFullMonth =
    isSameDay(dateRange.from, startOfMonth(dateRange.from)) &&
    isSameDay(dateRange.to, endOfMonth(dateRange.from));
  const periodLabel = isFullMonth
    ? formatMonth(dateRange.from, { style: "long", withYear: true })
    : `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}`;
  const commissionMinor = statement?.commissionMinor ?? 0;
  // Everything deducted from gross except commission: payroll, utilities, repairs (and other)
  const operatingCosts = statement
    ? statement.grossRevenueMinor - statement.netProfitMinor - commissionMinor
    : 0;
  const commissionShare =
    statement && statement.grossRevenueMinor > 0
      ? (commissionMinor / statement.grossRevenueMinor) * 100
      : 0;
  const detailed = reportType === "detailed";
  const netMargin =
    statement && statement.grossRevenueMinor > 0
      ? (statement.netProfitMinor / statement.grossRevenueMinor) * 100
      : 0;
  const cities = [
    ...new Set(
      rowsInScope
        .map((row) => propertyById.get(row.propertyId)?.city)
        .filter((c): c is string => Boolean(c)),
    ),
  ];

  const unitsByProperty = React.useMemo(() => {
    const map = new Map<string, NonNullable<typeof calendar.data>[number]["unit"][]>();
    for (const entry of calendar.data ?? []) {
      const list = map.get(entry.propertyId) ?? [];
      list.push(entry.unit);
      map.set(entry.propertyId, list);
    }
    return map;
  }, [calendar.data]);
  const rangeEnd = addDays(dateRange.to, 1);
  const strOccupancyFor = (propertyId: string | null) => {
    if (!calendar.data) return null;
    const units = propertyId
      ? (unitsByProperty.get(propertyId) ?? [])
      : calendar.data.map((entry) => entry.unit);
    return strOccupancyPct(units, dateRange.from, rangeEnd);
  };
  const totalStrOccupancy = strOccupancyFor(selectedProperty === "all" ? null : selectedProperty);

  const handleExportPDF = () => {
    const input: CreateReportInput = {
      period: isFullMonth ? format(dateRange.from, "yyyy-MM") : { from, to },
      propertyId: selectedProperty === "all" ? null : selectedProperty,
    };
    createReport.mutate(input, {
      onSuccess: (result) => {
        setActiveReportId(result.reportId);
        toast.success(t("owner:reports.downloading", { title: periodLabel }), {
          description: t("owner:reports.downloadingDesc"),
        });
      },
    });
  };

  const handleDownload = async (report: ReportListItem) => {
    setActiveReportId(report.id);
    if (report.status !== "ready") return;
    setDownloadingId(report.id);
    try {
      const detail = await ownerFinancialsService.reportStatus(report.id);
      if (detail.downloadUrl) {
        globalThis.open(detail.downloadUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error(t("common:states.errorBody"));
      }
    } catch {
      toast.error(t("common:states.errorBody"));
    } finally {
      setDownloadingId(null);
    }
  };

  const reportTitle = (report: ReportListItem) => {
    const scope = report.propertyId
      ? (propertyById.get(report.propertyId)?.name ?? t("owner:reports.fullPortfolio"))
      : t("owner:reports.fullPortfolio");
    return `${reportPeriodLabel(report.period)} · ${scope}`;
  };

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-10">
      {/* Top Header */}
      <div className="border-b border-border/80 pb-6 space-y-1">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" />
          <p className="text-label-caps text-primary">{t("owner:reports.certifiedTelemetry")}</p>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-[0.1em] text-[#F8F9FA]">
          {t("owner:reports.title")}
        </h1>
        <p className="text-xs text-muted-foreground">{t("owner:reports.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Report Builder & Past Reports - 4 cols */}
        <div className="lg:col-span-4 space-y-8">
          {/* Builder Card */}
          <div className="rounded-xl border border-primary/25 bg-[#141414] p-6 shadow-2xl space-y-5">
            <div className="border-b border-border/80 pb-3">
              <h2 className="font-display text-lg uppercase tracking-wider text-foreground">
                {t("owner:reports.configTitle")}
              </h2>
              <p className="text-xs text-muted-foreground">{t("owner:reports.configHint")}</p>
            </div>

            {/* Date Range Picker */}
            <div className="space-y-1.5">
              <label className="text-label-caps text-muted-foreground">
                {t("owner:reports.selectPeriod")}
              </label>
              <CustomDateRangePicker
                value={dateRange}
                onChange={(val) =>
                  val?.from && val.to && setDateRange({ from: val.from, to: val.to })
                }
              />
            </div>

            {/* Property Selector */}
            <div className="space-y-1.5">
              <label className="text-label-caps text-muted-foreground">
                {t("owner:reports.selectUnits")}
              </label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="h-10 border-border/80 bg-[#161616] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-[#141414]">
                  <SelectItem value="all" className="text-xs py-2 font-medium text-primary">
                    {t("owner:reports.fullPortfolio")}
                  </SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs py-2">
                      {p.name} · {p.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Granularity Toggle: Summary vs Detailed */}
            <div className="space-y-1.5">
              <label className="text-label-caps text-muted-foreground">
                {t("owner:reports.statementType")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportType("summary")}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                    reportType === "summary"
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/60 bg-[#161616] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("owner:reports.executiveSummary")}
                </button>
                <button
                  type="button"
                  onClick={() => setReportType("detailed")}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                    reportType === "detailed"
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/60 bg-[#161616] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("owner:reports.detailedStatement")}
                </button>
              </div>
            </div>

            {/* Export Actions */}
            <div className="pt-3 border-t border-border/60 space-y-2.5">
              <Button
                onClick={handleExportPDF}
                disabled={createReport.isPending}
                className="w-full btn-shimmer bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider h-11"
              >
                <Download className="size-4 me-2" />
                <span>
                  {createReport.isPending
                    ? t("owner:reports.generating")
                    : t("owner:reports.exportPdf")}
                </span>
              </Button>

              {/* The backend has no "email a report" endpoint yet: kept visible, disabled */}
              <Button
                variant="outline"
                disabled
                title={t("owner:reports.emailUnavailable", {
                  defaultValue: "Emailing reports is not available yet",
                })}
                className="w-full border-primary/30 text-primary hover:bg-primary/10 text-xs uppercase tracking-wider h-11"
              >
                <Mail className="size-4 me-2" />
                <span>{t("owner:reports.emailReport")}</span>
              </Button>
            </div>

            {activeReportId && (
              <div className="rounded-lg border border-primary/20 bg-[#161616] p-3 text-xs">
                {statusQuery.isPending ||
                !statusQuery.data ||
                statusQuery.data.status === "queued" ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    {t("owner:reports.generating")}
                  </span>
                ) : statusQuery.data.status === "ready" ? (
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="size-4" />
                      {t("owner:reports.statementBadge")}
                    </span>
                    {statusQuery.data.downloadUrl && (
                      <a
                        href={statusQuery.data.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                      >
                        <Download className="size-3.5" />
                        {t("owner:reports.download")}
                      </a>
                    )}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-destructive-foreground">
                    <AlertTriangle className="size-4" />
                    {statusQuery.data.errorMessage ?? t("common:states.errorBody")}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Past Reports List */}
          <div className="rounded-xl border border-primary/20 bg-[#141414] p-6 shadow-xl space-y-4">
            <div className="border-b border-border/80 pb-3">
              <h3 className="font-display text-base uppercase tracking-wider text-foreground">
                {t("owner:reports.pastTitle")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("owner:reports.pastHintReal", {
                  defaultValue: "Statements you have generated, newest first",
                })}
              </p>
            </div>

            <div className="space-y-3">
              {reportsQuery.isPending &&
                Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="gold-skeleton h-14 w-full" />
                ))}
              {reportsQuery.isError && (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive-foreground">
                  {t("common:states.errorBody")}
                </p>
              )}
              {reportsQuery.isSuccess && reportsQuery.data.items.length === 0 && (
                <p className="rounded-lg border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                  {t("owner:reports.noPastReports", {
                    defaultValue: "No statements generated yet. Export one above to see it here.",
                  })}
                </p>
              )}
              {(reportsQuery.data?.items ?? []).map((report) => (
                <div
                  key={report.id}
                  onClick={() => setActiveReportId(report.id)}
                  className={`cursor-pointer rounded-lg border bg-[#161616] p-3 space-y-1.5 hover:border-primary/40 transition-colors ${
                    activeReportId === report.id ? "border-primary/40" : "border-border/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#F8F9FA] truncate">
                      {reportTitle(report)}
                    </p>
                    <span
                      className={`ms-2 shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] uppercase font-mono ${statusBadgeClass(report.status)}`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground">
                    <span>{formatDate(report.createdAt)}</span>
                    <button
                      type="button"
                      disabled={report.status !== "ready" || downloadingId === report.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDownload(report);
                      }}
                      className="text-primary hover:underline flex items-center gap-1 font-mono disabled:opacity-40 disabled:no-underline"
                    >
                      {downloadingId === report.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Download className="size-3" />
                      )}
                      <span>{t("owner:reports.download")}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Branded Preview - 8 cols */}
        <div className="lg:col-span-8 rounded-2xl border border-primary/30 bg-[#121212] p-8 sm:p-12 shadow-[0_24px_70px_rgba(0,0,0,0.85)] space-y-8">
          {/* Statement Header with Velvet Keys Logo and Serif Headings */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/80 pb-6">
            <LogoHorizontal size="lg" subtitle={t("owner:reports.logoSubtitle")} />

            <div className="text-end font-mono text-xs text-muted-foreground">
              <p className="text-primary font-semibold">{t("owner:reports.confidentialAudit")}</p>
              <p>
                {t("owner:reports.reference", { ref: `VK-${format(dateRange.from, "yyyy-MM")}` })}
              </p>
              <p>{t("owner:reports.period", { period: periodLabel })}</p>
            </div>
          </div>

          <div className="gold-rule" />

          {/* Statement Title & Metadata */}
          <div className="space-y-2">
            <span className="text-label-caps text-primary">
              {t("owner:reports.statementBadge")}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#F8F9FA] tracking-wide font-light">
              {detailed ? t("owner:reports.detailedHeading") : t("owner:reports.summaryHeading")}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("owner:reports.statementIntro", {
                name: session?.profile.displayName ?? "",
                cities: formatList(cities),
              })}
            </p>
          </div>

          {/* Key figures: gross with its STR / LTR split, commission, operating costs, net */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-tabular">
            <div className="rounded-xl border border-primary/20 bg-[#161616] p-4 space-y-2">
              <p className="text-label-caps text-muted-foreground">
                {t("owner:overview.kpiGrossRevenue")}
              </p>
              <p className="font-serif text-2xl text-primary font-semibold">
                {statement ? (
                  money(statement.grossRevenueMinor)
                ) : (
                  <span className="gold-skeleton inline-block h-7 w-32" />
                )}
              </p>
              {statement && (
                <RevenueSplitBar
                  strRevenueMinor={statement.strRevenueMinor}
                  ltrRevenueMinor={statement.ltrRevenueMinor}
                />
              )}
              <p className="text-[0.65rem] text-muted-foreground font-mono">
                {t("owner:reports.activeEstates", { count: rowsInScope.length })}
              </p>
            </div>

            {!solo && (
              <div className="rounded-xl border border-border/80 bg-[#161616] p-4 space-y-1">
                <p className="text-label-caps text-muted-foreground">
                  {t("owner:overview.kpiCommission")}
                </p>
                <p className="font-serif text-2xl text-[#F8F9FA] font-semibold">
                  {statement ? (
                    money(commissionMinor)
                  ) : (
                    <span className="gold-skeleton inline-block h-7 w-32" />
                  )}
                </p>
                <p className="text-[0.65rem] text-muted-foreground font-mono">
                  {t("owner:overview.commissionShare", { share: formatPercent(commissionShare) })}
                </p>
                <p className="text-[0.65rem] text-muted-foreground">
                  {t("owner:overview.commissionTooltip")}
                </p>
              </div>
            )}

            <div className="rounded-xl border border-destructive/25 bg-[#161616] p-4 space-y-1">
              <p className="text-label-caps text-destructive-foreground">
                {t("owner:reports.operatingCosts")}
              </p>
              <p className="font-serif text-2xl text-[#F8F9FA] font-semibold">
                {statement ? (
                  money(operatingCosts)
                ) : (
                  <span className="gold-skeleton inline-block h-7 w-32" />
                )}
              </p>
              <p className="text-[0.65rem] text-muted-foreground font-mono">
                {t("owner:reports.operatingCostsNote")}
              </p>
            </div>

            <div className="rounded-xl border border-primary/40 bg-[#161616] p-4 space-y-1">
              <p className="text-label-caps text-primary">{t("owner:overview.kpiNetProfit")}</p>
              <p className="font-serif text-2xl text-[#A2E8DD] font-semibold">
                {statement ? (
                  money(statement.netProfitMinor)
                ) : (
                  <span className="gold-skeleton inline-block h-7 w-32" />
                )}
              </p>
              <p className="text-[0.65rem] text-muted-foreground font-mono">
                {t("owner:reports.netMargin", { margin: formatPercent(netMargin) })}
              </p>
            </div>
          </div>

          {/* Property breakdown with the commission line per property and totals */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl text-[#F8F9FA] tracking-wide">
              {t("owner:reports.breakdownTitle")}
            </h3>

            <TableCards className="relative rounded-xl border border-border/80 overflow-x-auto bg-[#161616]">
              <table className="w-full text-start text-xs font-mono">
                <thead className="border-b border-border/80 bg-[#111111] text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4 font-sans font-medium text-start">
                      {t("owner:reports.colProperty")}
                    </th>
                    {detailed && (
                      <>
                        <th className="py-3 px-4 font-sans font-medium text-end">
                          {t("owner:reports.colStr")}
                        </th>
                        <th className="py-3 px-4 font-sans font-medium text-end">
                          {t("owner:reports.colLtr")}
                        </th>
                      </>
                    )}
                    <th className="py-3 px-4 font-sans font-medium text-end">
                      {t("owner:reports.colGross")}
                    </th>
                    {!solo && (
                      <th className="py-3 px-4 font-sans font-medium text-end">
                        {t("owner:reports.colCommission")}
                      </th>
                    )}
                    {detailed && (
                      <th className="py-3 px-4 font-sans font-medium text-end">
                        {t("owner:reports.colOccupancy")}
                      </th>
                    )}
                    <th className="py-3 px-4 font-sans font-medium text-end">
                      {t("owner:reports.colNet")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {(statementQuery.isError || breakdownQuery.isError) && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-4 px-4 text-center font-sans text-destructive-foreground"
                      >
                        {t("common:states.errorBody")}
                      </td>
                    </tr>
                  )}
                  {breakdownQuery.isPending && (
                    <tr>
                      <td colSpan={7} className="p-4">
                        <div className="gold-skeleton h-10 w-full" />
                      </td>
                    </tr>
                  )}
                  {rowsInScope.map((row) => {
                    const property = propertyById.get(row.propertyId);
                    const kpis = rowKpis.data?.[row.propertyId];
                    const occupancy = strOccupancyFor(row.propertyId);
                    return (
                      <tr key={row.propertyId}>
                        <td className="py-3 px-4 font-sans font-medium text-foreground">
                          {row.propertyName}
                          <span className="block text-[0.62rem] font-normal text-muted-foreground">
                            {property ? unitMixLabel(property.unitCounts) : ""}
                          </span>
                        </td>
                        {detailed && (
                          <>
                            <td className="py-3 px-4 text-end text-muted-foreground whitespace-nowrap">
                              {kpis ? money(kpis.strRevenueMinor) : "…"}
                            </td>
                            <td className="py-3 px-4 text-end text-muted-foreground whitespace-nowrap">
                              {kpis ? money(kpis.ltrRevenueMinor) : "…"}
                            </td>
                          </>
                        )}
                        <td className="py-3 px-4 text-end text-foreground whitespace-nowrap">
                          {money(row.grossRevenueMinor)}
                        </td>
                        {!solo && (
                          <td className="py-3 px-4 text-end text-muted-foreground whitespace-nowrap">
                            − {kpis ? money(kpis.commissionMinor) : "…"}
                            <span className="block text-[0.62rem]">
                              {property?.commissionPct != null
                                ? formatPercent(property.commissionPct)
                                : "—"}
                            </span>
                          </td>
                        )}
                        {detailed && (
                          <td className="py-3 px-4 text-end text-[#A2E8DD] font-semibold whitespace-nowrap">
                            {property && property.unitCounts.str > 0
                              ? occupancy === null
                                ? "…"
                                : formatPercent(occupancy)
                              : "—"}
                          </td>
                        )}
                        <td className="py-3 px-4 text-end text-primary font-semibold whitespace-nowrap">
                          {money(row.netProfitMinor)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {statement && rowsInScope.length > 0 && (
                  <tfoot className="border-t border-primary/30 bg-[#111111] font-semibold">
                    <tr>
                      <th scope="row" className="py-3 px-4 font-sans text-start text-foreground">
                        {t("owner:reports.total")}
                      </th>
                      {detailed && (
                        <>
                          <td className="py-3 px-4 text-end text-foreground whitespace-nowrap">
                            {money(statement.strRevenueMinor)}
                          </td>
                          <td className="py-3 px-4 text-end text-foreground whitespace-nowrap">
                            {money(statement.ltrRevenueMinor)}
                          </td>
                        </>
                      )}
                      <td className="py-3 px-4 text-end text-foreground whitespace-nowrap">
                        {money(statement.grossRevenueMinor)}
                      </td>
                      {!solo && (
                        <td className="py-3 px-4 text-end text-foreground whitespace-nowrap">
                          − {money(statement.commissionMinor)}
                        </td>
                      )}
                      {detailed && (
                        <td className="py-3 px-4 text-end text-[#A2E8DD] whitespace-nowrap">
                          {totalStrOccupancy === null ? "…" : formatPercent(totalStrOccupancy)}
                        </td>
                      )}
                      <td className="py-3 px-4 text-end text-primary whitespace-nowrap">
                        {money(statement.netProfitMinor)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </TableCards>
          </div>

          <div className="gold-rule" />

          {/* Fiduciary Stamp */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 text-[0.68rem] text-muted-foreground font-mono">
            <div>
              <p className="text-foreground font-semibold font-sans">
                {t("owner:reports.fiduciaryTrust")}
              </p>
              <p>{t("owner:reports.cryptographicallyCertified")}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded border border-primary/30 bg-primary/5 px-3 py-1 text-primary">
              <Sparkles className="size-3" />
              <span>
                {t("owner:reports.stampId", { ref: `VK-${format(dateRange.from, "yyyyMM")}` })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
