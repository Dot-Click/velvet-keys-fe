import { differenceInCalendarDays } from "date-fns";
import type { Booking } from "@/types/booking";
import type { Lease } from "@/types/lease";
import type { Property, Unit, UnitType } from "@/types/property";
import { overlapDays, parseDay, rangeDays, round1, round2, type DayRange } from "@/lib/dates";

export interface NetProfitInput {
  /** STR booking revenue + LTR rent */
  grossRevenue: number;
  commission: number;
  payroll: number;
  utilities: number;
  repairs: number;
}

/** Net profit = gross revenue (STR + LTR) − commission − payroll − utilities − repairs. */
export function calcNetProfit({
  grossRevenue,
  commission,
  payroll,
  utilities,
  repairs,
}: NetProfitInput): number {
  return round2(grossRevenue - commission - payroll - utilities - repairs);
}

/** Conciergerie commission: a percentage of STR booking revenue and LTR rent. */
export function calcCommission(revenue: number, commissionPct: number): number {
  return round2((revenue * commissionPct) / 100);
}

/**
 * Commission rate that applied on a given day (ISO date). A change only affects bookings that
 * check in, and rent periods that start, on or after the day it takes effect.
 */
export function commissionPctOn(
  property: Pick<Property, "commissionPct" | "commissionHistory">,
  day: string,
): number {
  const history = [...(property.commissionHistory ?? [])].sort((a, b) =>
    a.from.localeCompare(b.from),
  );
  let pct = history[0] && history[0].from > day ? history[0].pct : property.commissionPct;
  for (const rate of history) {
    if (rate.from <= day) pct = rate.pct;
  }
  return pct;
}

/** Nights of a booking, as a half-open range from check-in to check-out. */
export function bookingNights(booking: Pick<Booking, "checkIn" | "checkOut">): DayRange {
  return { from: parseDay(booking.checkIn), to: parseDay(booking.checkOut) };
}

export function nightCount(booking: Pick<Booking, "checkIn" | "checkOut">): number {
  return Math.max(
    1,
    differenceInCalendarDays(parseDay(booking.checkOut), parseDay(booking.checkIn)),
  );
}

/** Booking revenue earned on the nights that fall inside `range` (spread evenly per night). */
export function bookingRevenueIn(booking: Booking, range: DayRange): number {
  const nights = overlapDays(bookingNights(booking), range);
  return nights === 0 ? 0 : (booking.amountMAD * nights) / nightCount(booking);
}

/** Average daily rate: booking revenue per booked night inside `range`; 0 without bookings. */
export function calcAdr(bookings: Booking[], range: DayRange): number {
  let revenue = 0;
  let nights = 0;
  for (const booking of bookings) {
    const inRange = overlapDays(bookingNights(booking), range);
    if (inRange === 0) continue;
    nights += inRange;
    revenue += (booking.amountMAD * inRange) / nightCount(booking);
  }
  return nights === 0 ? 0 : Math.round(revenue / nights);
}

/** The stretches of `range` during which the unit existed with the given type. */
export function unitTypeSegments(unit: Unit, type: UnitType, range: DayRange): DayRange[] {
  const segments: DayRange[] = [];
  for (const period of unit.typeHistory) {
    if (period.type !== type) continue;
    const from = parseDay(period.from);
    const to = period.to ? parseDay(period.to) : range.to;
    const segment = {
      from: from > range.from ? from : range.from,
      to: to < range.to ? to : range.to,
    };
    if (rangeDays(segment) > 0) segments.push(segment);
  }
  return segments;
}

/** The unit's type on a given day, or null when the unit did not exist that day. */
export function unitTypeOn(unit: Unit, day: Date): UnitType | null {
  for (const period of unit.typeHistory) {
    const from = parseDay(period.from);
    const to = period.to ? parseDay(period.to) : null;
    if (day >= from && (!to || day < to)) return period.type;
  }
  return null;
}

export interface OccupancyInput {
  units: Unit[];
  bookings: Booking[];
  leases: Lease[];
  range: DayRange;
  /** Only count nights when units ran as this type (e.g. STR occupancy) */
  type?: UnitType;
}

export interface OccupancyResult {
  occupiedNights: number;
  availableNights: number;
  /** Percentage with one decimal, 0 when nothing was available */
  rate: number;
}

/**
 * Share of unit-nights that were occupied in `range`. STR nights count as occupied when a
 * booking covers them; LTR nights when a lease covers them. Units only count while they exist.
 */
export function calcOccupancy({
  units,
  bookings,
  leases,
  range,
  type,
}: OccupancyInput): OccupancyResult {
  let occupiedNights = 0;
  let availableNights = 0;

  for (const unit of units) {
    for (const segment of type === "LTR" ? [] : unitTypeSegments(unit, "STR", range)) {
      availableNights += rangeDays(segment);
      for (const booking of bookings) {
        if (booking.unitId === unit.id)
          occupiedNights += overlapDays(bookingNights(booking), segment);
      }
    }
    for (const segment of type === "STR" ? [] : unitTypeSegments(unit, "LTR", range)) {
      availableNights += rangeDays(segment);
      for (const lease of leases) {
        if (lease.unitId !== unit.id) continue;
        occupiedNights += overlapDays(
          { from: parseDay(lease.startDate), to: parseDay(lease.endDate) },
          segment,
        );
      }
    }
  }

  occupiedNights = Math.min(occupiedNights, availableNights);
  return {
    occupiedNights,
    availableNights,
    rate: availableNights === 0 ? 0 : round1((occupiedNights / availableNights) * 100),
  };
}

/** Percentage change from `previous` to `current`, one decimal; null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return round1(((current - previous) / Math.abs(previous)) * 100);
}
