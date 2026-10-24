import * as React from "react";
import { addMonths, startOfMonth } from "date-fns";
import {
  useOwnerCalendar,
  useOwnerPropertyKpis,
  useOwnerStrOccupancy,
  usePortfolioBreakdownAll,
  useProperties,
} from "@/hooks/use-portfolio-data";
import { today } from "@/lib/clock";
import { toISODate } from "@/lib/dates";
import { adrMinor, leasedLtrUnits } from "@/lib/owner-analytics";
import type { OwnerKpis, PortfolioBreakdownRow } from "@/types/owner-financials";
import type { Property } from "@/types/portfolio";
import type { CalendarUnit } from "@/types/str";

/**
 * One property's figures for the current month, joined from several real endpoints:
 * properties (photo, address, unit mix, commission %), the portfolio breakdown (gross, net,
 * expenses, margin), per-property /owner/kpis (commission, payroll, utilities, repairs, STR/LTR
 * split), the STR demand heatmap / breakdown (STR occupancy) and /calendar (ADR, leased LTR
 * units). A null part is still loading.
 */
export interface OwnerPropertyPerformance {
  property: Property;
  strUnits: number;
  ltrUnits: number;
  breakdown: PortfolioBreakdownRow | null;
  kpis: OwnerKpis | null;
  strOccupancyPct: number | null;
  adrMinor: number | null;
  ltrLeased: number | null;
}

/** Current and previous calendar month bounds (the calendar call spans both, 62 days max). */
export function monthWindow() {
  const start = startOfMonth(today());
  return {
    previousStart: addMonths(start, -1),
    start,
    end: addMonths(start, 1),
  };
}

export function useOwnerPropertyPerformance() {
  const properties = useProperties();
  const breakdown = usePortfolioBreakdownAll({ period: "month" });
  const ids = React.useMemo(() => (properties.data ?? []).map((p) => p.id), [properties.data]);
  const kpis = useOwnerPropertyKpis(ids, { period: "month" });
  const window = monthWindow();
  const calendar = useOwnerCalendar(toISODate(window.previousStart), toISODate(window.end));
  // STR-only occupancy straight from the backend: the breakdown's occupancy is exactly that for an
  // all-STR property; a mixed STR+LTR property (and the portfolio) reads the STR demand heatmap.
  const heatmapIds = React.useMemo(
    () => [
      "all",
      ...(properties.data ?? [])
        .filter((p) => p.unitCounts.str > 0 && p.unitCounts.ltr > 0)
        .map((p) => p.id),
    ],
    [properties.data],
  );
  const strOccupancy = useOwnerStrOccupancy(heatmapIds);

  const rows = React.useMemo<OwnerPropertyPerformance[]>(() => {
    const breakdownById = new Map((breakdown.data ?? []).map((row) => [row.propertyId, row]));
    const unitsByProperty = new Map<string, CalendarUnit[]>();
    for (const entry of calendar.data ?? []) {
      const list = unitsByProperty.get(entry.propertyId) ?? [];
      list.push(entry.unit);
      unitsByProperty.set(entry.propertyId, list);
    }
    return (properties.data ?? []).map((property) => {
      const units = unitsByProperty.get(property.id) ?? [];
      const calendarReady = Boolean(calendar.data);
      return {
        property,
        strUnits: property.unitCounts.str,
        ltrUnits: property.unitCounts.ltr,
        breakdown: breakdownById.get(property.id) ?? null,
        kpis: kpis.data?.[property.id] ?? null,
        strOccupancyPct:
          property.unitCounts.str === 0
            ? null
            : property.unitCounts.ltr === 0
              ? (breakdownById.get(property.id)?.occupancyPct ?? null)
              : (strOccupancy.data?.[property.id] ?? null),
        adrMinor: calendarReady ? adrMinor(units, window.start, window.end) : null,
        ltrLeased: calendarReady ? leasedLtrUnits(units, today()) : null,
      };
    });
    // window is derived from today(); recompute with the data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.data, breakdown.data, kpis.data, calendar.data, strOccupancy.data]);

  return {
    properties,
    breakdown,
    kpis,
    calendar,
    rows,
    /** Portfolio STR occupancy this month (backend demand heatmap), null while loading. */
    portfolioStrOccupancy: strOccupancy.data?.["all"] ?? null,
  };
}
