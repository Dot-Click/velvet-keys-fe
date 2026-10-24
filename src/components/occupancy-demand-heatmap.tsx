import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  getYear,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  ArrowUpRight,
  Building2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerCalendar, useProperties } from "@/hooks/use-portfolio-data";
import { today } from "@/lib/clock";
import { formatDate, formatMonth, formatPercent } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { demandDays, type DemandDay } from "@/lib/owner-analytics";
import { toISODate } from "@/lib/dates";
import { AlertTriangle, Info, RotateCcw } from "lucide-react";

export type ZoomView = "month" | "quarter" | "year";

interface PropertyOption {
  id: string;
  name: string;
}

type IntensityLevel = 0 | 1 | 2 | 3 | 4;

/** Five shading buckets; holidays and festivals always glow. */
function intensityOf(day: DemandDay): IntensityLevel {
  if (day.occupancy >= 95 || day.eventKey) return 4;
  if (day.occupancy >= 82) return 3;
  if (day.occupancy >= 65) return 2;
  if (day.occupancy >= 50) return 1;
  return 0;
}

export function OccupancyDemandHeatmap() {
  const { t } = useTranslation(["owner", "common"]);
  const [selectedProperty, setSelectedProperty] = useState<string>("all");
  const [zoomView, setZoomView] = useState<ZoomView>("month");
  const [cursorDate, setCursorDate] = useState<Date>(() => startOfMonth(today()));
  const performance = useProperties();

  const properties: PropertyOption[] = useMemo(
    () => [
      { id: "all", name: t("owner:demand.allProperties") },
      ...(performance.data ?? [])
        .filter((property) => property.unitCounts.str > 0)
        .map((property) => ({ id: property.id, name: property.name })),
    ],
    [t, performance.data],
  );

  function handlePrev() {
    if (zoomView === "month") {
      setCursorDate((prev) => subMonths(prev, 1));
    } else if (zoomView === "quarter") {
      setCursorDate((prev) => subMonths(prev, 3));
    } else {
      setCursorDate((prev) => subMonths(prev, 12));
    }
  }

  function handleNext() {
    if (zoomView === "month") {
      setCursorDate((prev) => addMonths(prev, 1));
    } else if (zoomView === "quarter") {
      setCursorDate((prev) => addMonths(prev, 3));
    } else {
      setCursorDate((prev) => addMonths(prev, 12));
    }
  }

  function handleToday() {
    setCursorDate(startOfMonth(today()));
  }

  const monthsToDisplay = useMemo(() => {
    if (zoomView === "month") {
      return [cursorDate];
    }
    if (zoomView === "quarter") {
      const currentMonth = cursorDate.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      const year = getYear(cursorDate);
      return [
        new Date(year, quarterStartMonth, 1),
        new Date(year, quarterStartMonth + 1, 1),
        new Date(year, quarterStartMonth + 2, 1),
      ];
    }
    const year = getYear(cursorDate);
    return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  }, [cursorDate, zoomView]);

  const viewHeading = useMemo(() => {
    if (zoomView === "month") {
      return formatMonth(cursorDate, { style: "long", withYear: true });
    }
    if (zoomView === "quarter") {
      const first = monthsToDisplay[0];
      const last = monthsToDisplay[2];
      return t("owner:demand.quarterHeading", {
        quarter: Math.floor(cursorDate.getMonth() / 3) + 1,
        year: getYear(cursorDate),
        from: first ? formatMonth(first) : "",
        to: last ? formatMonth(last) : "",
      });
    }
    return String(getYear(cursorDate));
  }, [cursorDate, zoomView, monthsToDisplay, t]);

  const first = monthsToDisplay[0] ?? cursorDate;
  const last = monthsToDisplay[monthsToDisplay.length - 1] ?? cursorDate;
  // Real units and stays from /calendar; occupancy, ADR and booked units are counted from them
  const rangeFrom = startOfWeek(startOfMonth(first), { weekStartsOn: 1 });
  const rangeTo = addDays(endOfWeek(endOfMonth(last), { weekStartsOn: 1 }), 1);
  const calendar = useOwnerCalendar(
    toISODate(rangeFrom),
    toISODate(rangeTo),
    selectedProperty === "all" ? undefined : selectedProperty,
  );
  const demand = useMemo(() => {
    if (!calendar.data) return undefined;
    const units = calendar.data.map((entry) => entry.unit);
    return {
      days: demandDays(units, rangeFrom, rangeTo),
      totalUnits: units.filter((unit) => unit.type === "STR").length,
    };
    // rangeFrom/rangeTo derive from the same inputs as the calendar query key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendar.data]);
  const daysByDate = useMemo(
    () => new Map((demand?.days ?? []).map((day) => [day.date, day])),
    [demand],
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-8">
        {/* Top Control Bar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <p className="text-label-caps text-primary">{t("owner:demand.predictiveRate")}</p>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-[0.1em] text-[#F8F9FA]">
              {t("owner:demand.title")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t("owner:demand.subtitle")}
            </p>
            <p className="flex items-center gap-1.5 pt-1 text-[0.7rem] text-[#A2E8DD]">
              <Info className="size-3.5 shrink-0" aria-hidden="true" />
              {t("owner:demand.ltrExcluded")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Property Selector */}
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="h-10 w-64 max-w-full border-border/80 bg-[#141414] text-xs [&>span]:truncate">
                <Building2 className="me-2 size-3.5 text-primary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-[#141414]">
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs py-2">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Toggle: Month / Quarter / Year */}
            <ToggleGroup
              type="single"
              value={zoomView}
              onValueChange={(val) => val && setZoomView(val as ZoomView)}
              className="border border-border/80 bg-[#141414] p-0.5 rounded-lg"
            >
              <ToggleGroupItem
                value="month"
                className="text-xs px-3 py-1 data-[state=on]:bg-primary/20 data-[state=on]:text-primary"
              >
                {t("owner:demand.month")}
              </ToggleGroupItem>
              <ToggleGroupItem
                value="quarter"
                className="text-xs px-3 py-1 data-[state=on]:bg-primary/20 data-[state=on]:text-primary"
              >
                {t("owner:demand.quarter")}
              </ToggleGroupItem>
              <ToggleGroupItem
                value="year"
                className="text-xs px-3 py-1 data-[state=on]:bg-primary/20 data-[state=on]:text-primary"
              >
                {t("owner:demand.year")}
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Date Nav Controls */}
            <div className="flex items-center gap-1 border border-border/80 bg-[#141414] p-1 rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={handlePrev}
                aria-label={t("owner:demand.previousPeriod")}
              >
                <ChevronLeft className="size-4 rtl-flip" aria-hidden="true" />
              </Button>
              <span className="px-3 text-xs font-serif font-medium text-foreground whitespace-nowrap">
                {viewHeading}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={handleNext}
                aria-label={t("owner:demand.nextPeriod")}
              >
                <ChevronRight className="size-4 rtl-flip" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>

        {/* Heatmap Legend */}
        <HeatmapLegend />

        {/* Main Grid View */}
        {calendar.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-8 text-center"
          >
            <AlertTriangle className="size-6 text-destructive-foreground" />
            <p className="text-sm text-muted-foreground">{t("common:states.errorBody")}</p>
            <Button variant="outline" size="sm" onClick={() => void calendar.refetch()}>
              <RotateCcw className="size-3.5" />
              {t("common:states.retry")}
            </Button>
          </div>
        ) : !demand ? (
          <div className="space-y-12" aria-busy="true" aria-label={t("common:states.loading")}>
            {monthsToDisplay.map((mDate) => (
              <div key={mDate.toISOString()} className="rounded-xl border border-primary/20 bg-[#111111] p-6 space-y-4">
                <Skeleton className="h-7 w-48" />
                <div className="grid grid-cols-[repeat(7,1fr)_90px] gap-[6px]">
                  {Array.from({ length: 40 }, (_, index) => (
                    <Skeleton key={index} className="h-24 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : demand.totalUnits === 0 ? (
          <EmptyState
            illustration="doorway"
            title={t("common:states.noUnitsTitle")}
            description={t("common:states.noUnitsBody")}
          />
        ) : (
          <div className="space-y-12">
            {monthsToDisplay.map((mDate) => (
              <MonthHeatmapGrid
                key={mDate.toISOString()}
                monthDate={mDate}
                days={daysByDate}
                isSingleMonth={monthsToDisplay.length === 1}
              />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function HeatmapLegend() {
  const { t } = useTranslation(["owner"]);
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/20 bg-[#141414] p-4 text-xs">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-label-caps text-muted-foreground">{t("owner:demand.occupancyIntensity")}</span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-1.5">
            <span className="size-4 rounded border border-border/50 bg-[#141414]" />
            <span className="text-[0.68rem] text-muted-foreground">{t("owner:demand.lowest")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-4 rounded border border-primary/30 bg-[#D4AF37]/[0.12]" />
            <span className="text-[0.68rem] text-muted-foreground">50-64% (12%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-4 rounded border border-primary/50 bg-[#D4AF37]/[0.28]" />
            <span className="text-[0.68rem] text-muted-foreground">65-81% (28%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-4 rounded border border-primary/70 bg-[#D4AF37]/[0.50]" />
            <span className="text-[0.68rem] text-[#FFF1BE]">82-94% (50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-4 rounded border border-primary bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
            <span className="text-[0.68rem] text-primary font-bold">{t("owner:demand.peakGlow")}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.72rem] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-[#D4AF37]" />
          <span>{t("owner:demand.weekendBorder")}</span>
        </span>
        <span className="flex items-center gap-1 text-primary">
          <span>✦</span>
          <span>{t("owner:demand.moroccanGala")}</span>
        </span>
      </div>
    </div>
  );
}

function MonthHeatmapGrid({
  monthDate,
  days,
  isSingleMonth,
}: {
  monthDate: Date;
  days: Map<string, DemandDay>;
  isSingleMonth: boolean;
}) {
  const { t } = useTranslation(["owner", "common"]);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Group days into weeks of 7
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  let dayCursor = calendarStart;

  while (dayCursor <= calendarEnd) {
    currentWeek.push(dayCursor);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    dayCursor = addDays(dayCursor, 1);
  }

  // Monday to Sunday in the reader's language (1 January 2024 was a Monday)
  const weekHeaders = Array.from({ length: 7 }, (_, index) =>
    formatDate(addDays(new Date(2024, 0, 1), index), {
      weekday: "short",
      day: undefined,
      month: undefined,
      year: undefined,
    }),
  );

  return (
    <div className="rounded-xl border border-primary/20 bg-[#111111] p-4 shadow-2xl space-y-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
        <h3 className="font-serif text-xl sm:text-2xl text-[#F8F9FA] tracking-wide">
          {formatMonth(monthDate, { style: "long", withYear: true })}
        </h3>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {t("owner:demand.weeklyYieldOverview")}
        </span>
      </div>

      {/* Phones scroll the calendar sideways inside its card rather than squeezing the days */}
      <div className="relative -mx-1 overflow-x-auto px-1 pb-1">
        <div className="min-w-[600px] space-y-4">
          {/* Week Headers */}
          <div className="grid grid-cols-[repeat(7,minmax(0,1fr))_90px] gap-[6px] text-center text-label-caps text-muted-foreground">
            {weekHeaders.map((header) => (
              <div key={header} className="py-1">
                {header}
              </div>
            ))}
            <div className="py-1 text-primary">{t("owner:demand.avgChip")}</div>
          </div>

          {/* Rows of Weeks with Weekly Average Chip at end of row */}
          <div className="space-y-[6px]">
            {weeks.map((week, weekIdx) => {
              // Calculate weekly average
              const telemetries = week
                .map((d) => days.get(toISODate(d)))
                .filter((day): day is DemandDay => Boolean(day));
              const avgOcc =
                telemetries.length === 0
                  ? 0
                  : Math.round(telemetries.reduce((acc, day) => acc + day.occupancy, 0) / telemetries.length);

              return (
                <div
                  key={weekIdx}
                  className="grid grid-cols-[repeat(7,minmax(0,1fr))_90px] gap-[6px] items-stretch"
                >
                  {week.map((day) => {
                    const data = days.get(toISODate(day));
                    if (!data) return <div key={day.toISOString()} className="h-24" />;
                    const telemetry = {
                      ...data,
                      intensityLevel: intensityOf(data),
                      holidayName: data.eventKey ? t(`owner:demand.events.${data.eventKey}`) : undefined,
                    };
                    const outsideMonth = !isSameMonth(day, monthDate);

                    // Styling buckets
                    let cellClass = "bg-[#141414] border-border/40 text-foreground";
                    if (telemetry.intensityLevel === 1) {
                      cellClass = "bg-[#D4AF37]/[0.12] border-[#D4AF37]/30 text-foreground";
                    } else if (telemetry.intensityLevel === 2) {
                      cellClass = "bg-[#D4AF37]/[0.28] border-[#D4AF37]/50 text-foreground";
                    } else if (telemetry.intensityLevel === 3) {
                      cellClass = "bg-[#D4AF37]/[0.50] border-[#D4AF37]/70 text-[#FFF1BE]";
                    } else if (telemetry.intensityLevel === 4) {
                      cellClass =
                        "bg-[#D4AF37] border-primary text-[#0B0B0B] font-bold shadow-[0_0_20px_rgba(212,175,55,0.6)]";
                    }

                    return (
                      <Tooltip key={day.toISOString()}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "group relative h-24 rounded-lg border p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none",
                              cellClass,
                              outsideMonth && "opacity-20 pointer-events-none",
                              telemetry.isWeekend && "border-t-2 border-t-[#D4AF37]",
                              "hover:scale-[1.03] hover:z-20 hover:border-primary",
                            )}
                          >
                            {/* Top: Date small & Event Glyph */}
                            <div className="flex items-center justify-between">
                              <span className="text-[0.7rem] font-mono opacity-80">
                                {format(day, "d")}
                              </span>
                              {telemetry.holidayName && (
                                <span
                                  className="text-xs leading-none text-primary"
                                  title={telemetry.holidayName}
                                >
                                  ✦
                                </span>
                              )}
                            </div>

                            {/* Middle: Occupancy % Large */}
                            <div className="my-auto text-center font-tabular">
                              <span
                                className={cn(
                                  "text-xl sm:text-2xl font-bold tracking-tight",
                                  telemetry.intensityLevel === 4 ? "text-[#0B0B0B]" : "text-[#F8F9FA]",
                                )}
                              >
                                {formatPercent(telemetry.occupancy, { decimals: 0 })}
                              </span>
                            </div>

                            {/* Bottom: Nightly Rate Muted */}
                            <div className="flex items-baseline justify-between text-[0.66rem] font-mono">
                              <span
                                className={cn(
                                  "truncate",
                                  telemetry.intensityLevel === 4
                                    ? "text-[#0B0B0B]/80 font-semibold"
                                    : "text-muted-foreground",
                                )}
                              >
                                {telemetry.adrMinor === null ? "—" : formatMoney(telemetry.adrMinor, ACCOUNT_CURRENCY, { hideDecimals: true })}
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>

                        {/* Hover Tooltip: Occupancy, ADR, Units booked, Suggested Rate */}
                        <TooltipContent className="w-68 border border-primary/40 bg-[#141414] p-3 text-foreground shadow-2xl space-y-2">
                          <div className="flex items-center justify-between border-b border-border/80 pb-1.5">
                            <span className="font-serif text-sm font-semibold text-primary">
                              {formatDate(day, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            {telemetry.holidayName && (
                              <span className="text-[0.62rem] text-primary uppercase font-mono">
                                ✦ {t("owner:demand.event")}
                              </span>
                            )}
                          </div>

                          {telemetry.holidayName && (
                            <p className="text-xs text-primary font-medium">{telemetry.holidayName}</p>
                          )}

                          <div className="space-y-1.5 text-xs font-mono">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t("owner:demand.occupancy")}</span>
                              <span className="text-foreground font-semibold">
                                {formatPercent(telemetry.occupancy, { decimals: 0 })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t("owner:demand.currentAdr")}</span>
                              <span className="text-primary font-semibold">
                                {telemetry.adrMinor === null ? "—" : formatMoney(telemetry.adrMinor, ACCOUNT_CURRENCY)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t("owner:demand.estUnitsBooked")}</span>
                              <span className="text-foreground">
                                {t("owner:demand.ofUnits", { booked: telemetry.bookedUnits, total: telemetry.totalUnits })}
                              </span>
                            </div>
                            <div className="flex justify-between border-t border-border/60 pt-1 text-[#A2E8DD]">
                              <span>{t("owner:demand.suggestedRate")}</span>
                              <span className="font-semibold">
                                {telemetry.suggestedRateMinor === null ? "—" : formatMoney(telemetry.suggestedRateMinor, ACCOUNT_CURRENCY)}
                              </span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}

                  {/* Weekly Average Chip at end of row */}
                  <div className="h-24 rounded-lg border border-primary/30 bg-[#161616] p-2 flex flex-col justify-center items-center text-center">
                    <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                      {t("owner:demand.wkAvg")}
                    </span>
                    <span className="font-mono text-base font-bold text-primary mt-1">
                      {formatPercent(avgOcc, { decimals: 0 })}
                    </span>
                    <span className="text-[0.6rem] text-[#A2E8DD] font-mono mt-0.5">
                      {avgOcc >= 80 ? t("owner:demand.optimal") : t("owner:demand.yielding")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
