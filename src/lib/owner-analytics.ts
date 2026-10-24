/**
 * Client-side owner analytics built only from real backend data.
 *
 * The owner screens were designed (mock era) around figures the backend does not return as a
 * single field: a portfolio-wide monthly trend, per-property STR occupancy and ADR, leased LTR
 * units, the daily demand grid with ADR / booked units, and so on. Each of these is derived
 * here from endpoints the backend genuinely exposes to owners:
 *   - GET /owner/kpis?from&to          (called once per month for trends)
 *   - GET /calendar?from&to            (units + their bookings/leases, max 62 days per call)
 *   - GET /bookings, /maintenance/tickets, /rent-invoices, /expenses, /today
 * Nothing here invents numbers: every value is a sum, ratio or count of real rows.
 */
import { addDays, addMonths, differenceInCalendarDays, format, startOfMonth } from "date-fns";
import type { Page } from "@/lib/apiClient";
import { parseDay, toISODate } from "@/lib/dates";
import type { Booking, Calendar, CalendarUnit } from "@/types/str";
import type { OwnerKpis } from "@/types/owner-financials";

/**
 * Reads every page of a backend list. The API client cannot send `pageSize` (backend 422s on
 * it, see apiClient.ts), so pages are always 10 rows; this keeps loading until `total` is met.
 */
export async function loadAllPages<T>(load: (page: number) => Promise<Page<T>>, maxPages = 50): Promise<T[]> {
  const first = await load(1);
  const items = [...first.items];
  for (let page = 2; items.length < first.total && page <= maxPages; page += 1) {
    const next = await load(page);
    if (next.items.length === 0) break;
    items.push(...next.items);
  }
  return items;
}

/** "YYYY-MM" keys for the `count` months ending with the month of `last`, oldest first. */
export function monthKeysEnding(last: Date, count: number): string[] {
  const start = startOfMonth(last);
  return Array.from({ length: count }, (_, index) => format(addMonths(start, index - count + 1), "yyyy-MM"));
}

/** Inclusive first/last ISO day of a "YYYY-MM" month, the shape /owner/kpis expects. */
export function monthBounds(month: string): { from: string; to: string } {
  const start = parseDay(`${month}-01`);
  return { from: toISODate(start), to: toISODate(addDays(addMonths(start, 1), -1)) };
}

/** One month of the portfolio P&L, straight from /owner/kpis for that month. */
export interface MonthlyPnl {
  month: string;
  grossRevenueMinor: number;
  strRevenueMinor: number;
  ltrRevenueMinor: number;
  payrollMinor: number;
  utilitiesMinor: number;
  repairsMinor: number;
  commissionMinor: number;
  /** Expenses in the backend's "other" category: gross − net − the four named deductions. */
  otherMinor: number;
  /** Everything deducted from gross to reach net (named deductions + other). */
  totalOutflowMinor: number;
  netProfitMinor: number;
  occupancyPct: number;
}

export function toMonthlyPnl(month: string, kpis: OwnerKpis): MonthlyPnl {
  const named = kpis.payrollMinor + kpis.utilitiesMinor + kpis.repairsMinor + kpis.commissionMinor;
  const totalOutflowMinor = kpis.grossRevenueMinor - kpis.netProfitMinor;
  return {
    month,
    grossRevenueMinor: kpis.grossRevenueMinor,
    strRevenueMinor: kpis.strRevenueMinor,
    ltrRevenueMinor: kpis.ltrRevenueMinor,
    payrollMinor: kpis.payrollMinor,
    utilitiesMinor: kpis.utilitiesMinor,
    repairsMinor: kpis.repairsMinor,
    commissionMinor: kpis.commissionMinor,
    otherMinor: Math.max(0, totalOutflowMinor - named),
    totalOutflowMinor,
    netProfitMinor: kpis.netProfitMinor,
    occupancyPct: kpis.occupancyPct,
  };
}

/** Expenses deducted in a KPI block that are not one of the four named categories. */
export function otherExpensesMinor(kpis: OwnerKpis): number {
  const named = kpis.payrollMinor + kpis.utilitiesMinor + kpis.repairsMinor + kpis.commissionMinor;
  return Math.max(0, kpis.grossRevenueMinor - kpis.netProfitMinor - named);
}

/** Splits [from, to) into windows the /calendar endpoint accepts (it rejects > 62 days). */
export function calendarWindows(from: Date, to: Date, maxDays = 62): { from: string; to: string }[] {
  const windows: { from: string; to: string }[] = [];
  let cursor = from;
  while (cursor < to) {
    const end = addDays(cursor, maxDays) < to ? addDays(cursor, maxDays) : to;
    windows.push({ from: toISODate(cursor), to: toISODate(end) });
    cursor = end;
  }
  return windows;
}

/** Merges several /calendar responses into one unit list, de-duplicating bookings and leases. */
export function mergeCalendars(calendars: Calendar[]): { propertyId: string; propertyName: string; unit: CalendarUnit }[] {
  const byUnit = new Map<string, { propertyId: string; propertyName: string; unit: CalendarUnit }>();
  for (const calendar of calendars) {
    for (const property of calendar.properties) {
      for (const unit of property.units) {
        const existing = byUnit.get(unit.unitId);
        if (!existing) {
          byUnit.set(unit.unitId, {
            propertyId: property.propertyId,
            propertyName: property.propertyName,
            unit: { ...unit, bookings: [...unit.bookings], leases: [...unit.leases] },
          });
          continue;
        }
        const bookingIds = new Set(existing.unit.bookings.map((b) => b.id));
        for (const booking of unit.bookings) if (!bookingIds.has(booking.id)) existing.unit.bookings.push(booking);
        const leaseIds = new Set(existing.unit.leases.map((l) => l.leaseId));
        for (const lease of unit.leases) if (!leaseIds.has(lease.leaseId)) existing.unit.leases.push(lease);
      }
    }
  }
  return [...byUnit.values()];
}

const isLive = (booking: Booking) => booking.status !== "cancelled";

/** Nights of a booking that fall inside [from, to). */
export function nightsWithin(booking: Pick<Booking, "checkIn" | "checkOut">, from: Date, to: Date): number {
  const start = parseDay(booking.checkIn);
  const end = parseDay(booking.checkOut);
  const a = start > from ? start : from;
  const b = end < to ? end : to;
  return Math.max(0, differenceInCalendarDays(b, a));
}

export function bookingNightCount(booking: Pick<Booking, "checkIn" | "checkOut">): number {
  return Math.max(1, differenceInCalendarDays(parseDay(booking.checkOut), parseDay(booking.checkIn)));
}

/** STR occupancy % of a set of units over [from, to): booked unit-nights / available unit-nights. */
export function strOccupancyPct(units: CalendarUnit[], from: Date, to: Date): number {
  const strUnits = units.filter((unit) => unit.type === "STR");
  const days = Math.max(0, differenceInCalendarDays(to, from));
  const available = strUnits.length * days;
  if (available === 0) return 0;
  const booked = strUnits.reduce(
    (sum, unit) => sum + unit.bookings.filter(isLive).reduce((acc, b) => acc + nightsWithin(b, from, to), 0),
    0,
  );
  return Math.round((Math.min(booked, available) / available) * 1000) / 10;
}

/**
 * Average daily rate in minor units: revenue of STR stays that check in during [from, to)
 * divided by their nights (the same "check-in in period" rule the backend uses for STR revenue).
 * Null when no stay checked in during the period.
 */
export function adrMinor(units: CalendarUnit[], from: Date, to: Date): number | null {
  let revenue = 0;
  let nights = 0;
  for (const unit of units) {
    if (unit.type !== "STR") continue;
    for (const booking of unit.bookings) {
      if (!isLive(booking)) continue;
      const checkIn = parseDay(booking.checkIn);
      if (checkIn < from || checkIn >= to) continue;
      revenue += booking.amountMinor;
      nights += bookingNightCount(booking);
    }
  }
  return nights === 0 ? null : Math.round(revenue / nights);
}

/** LTR units with a lease covering `day`. */
export function leasedLtrUnits(units: CalendarUnit[], day: Date): number {
  const iso = toISODate(day);
  return units.filter(
    (unit) => unit.type === "LTR" && unit.leases.some((lease) => lease.startDate <= iso && lease.endDate >= iso),
  ).length;
}

/** Fixed-date Moroccan public holidays and festivals (reference calendar, i18n keys under owner:demand.events). */
export const MOROCCAN_EVENTS: Record<string, string> = {
  "01-01": "newYear",
  "01-11": "independenceManifesto",
  "05-01": "labourDay",
  "06-20": "mawazine",
  "07-30": "throneDay",
  "08-14": "ouedEddahab",
  "08-20": "revolution",
  "08-21": "youthDay",
  "11-06": "greenMarch",
  "11-18": "independenceDay",
  "11-28": "filmFestival",
  "12-31": "newYearsEve",
};

export interface DemandDay {
  date: string;
  /** Share of STR units booked that night, 0-100. */
  occupancy: number;
  bookedUnits: number;
  totalUnits: number;
  /** Average nightly rate (minor units) of the stays covering that night; null when none. */
  adrMinor: number | null;
  /**
   * A rate hint (minor units) from the same rule the original design used: the night's ADR
   * nudged up on high demand / events and down on low demand. Null when there is no ADR basis.
   */
  suggestedRateMinor: number | null;
  isWeekend: boolean;
  eventKey?: string;
}

/** Daily STR demand over [from, to) from real calendar units and bookings. */
export function demandDays(units: CalendarUnit[], from: Date, to: Date): DemandDay[] {
  const strUnits = units.filter((unit) => unit.type === "STR");
  const bookings = strUnits.flatMap((unit) => unit.bookings.filter(isLive));
  // Portfolio ADR over every loaded stay: the fallback basis for a night nobody booked.
  const totalNights = bookings.reduce((sum, b) => sum + bookingNightCount(b), 0);
  const baseAdr = totalNights === 0 ? null : bookings.reduce((sum, b) => sum + b.amountMinor, 0) / totalNights;
  const days: DemandDay[] = [];
  for (let day = from; day < to; day = addDays(day, 1)) {
    const iso = toISODate(day);
    let booked = 0;
    let revenue = 0;
    for (const unit of strUnits) {
      const stay = unit.bookings.find((b) => isLive(b) && b.checkIn <= iso && b.checkOut > iso);
      if (stay) {
        booked += 1;
        revenue += stay.amountMinor / bookingNightCount(stay);
      }
    }
    const total = strUnits.length;
    const occupancy = total === 0 ? 0 : Math.min(100, Math.round((booked / total) * 100));
    const weekday = day.getDay();
    const isWeekend = weekday === 5 || weekday === 6;
    const eventKey = MOROCCAN_EVENTS[format(day, "MM-dd")];
    const adr = booked > 0 ? Math.round(revenue / booked) : null;
    const basis = adr ?? (baseAdr === null ? null : baseAdr * (isWeekend ? 1.12 : 1));
    const multiplier = (occupancy >= 85 ? 1.12 : occupancy < 40 ? 0.92 : 1) * (eventKey ? 1.1 : 1);
    days.push({
      date: iso,
      occupancy,
      bookedUnits: Math.min(booked, total),
      totalUnits: total,
      adrMinor: adr,
      // Rounded to the nearest 50 MAD (5000 minor units), as the original design did.
      suggestedRateMinor: basis === null ? null : Math.round((basis * multiplier) / 5000) * 5000,
      isWeekend,
      ...(eventKey ? { eventKey } : {}),
    });
  }
  return days;
}

/** "3 STR · 1 LTR". STR and LTR are the same in every language. */
export function unitMixLabel(counts: { str: number; ltr: number }): string {
  return [counts.str ? `${counts.str} STR` : "", counts.ltr ? `${counts.ltr} LTR` : ""]
    .filter(Boolean)
    .join(" · ");
}
