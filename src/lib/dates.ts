import {
  addMonths,
  differenceInCalendarDays,
  format,
  getDaysInMonth,
  max as maxDate,
  min as minDate,
  parseISO,
  startOfMonth,
} from "date-fns";
import type { ISODate, MonthKey } from "@/types/common";

/** Half-open day range: `from` is included, `to` is not. */
export interface DayRange {
  from: Date;
  to: Date;
}

export function toISODate(date: Date): ISODate {
  return format(date, "yyyy-MM-dd");
}

export function toMonthKey(date: Date): MonthKey {
  return format(date, "yyyy-MM");
}

/** Local midnight for an ISO date (or date-time) string. */
export function parseDay(value: string): Date {
  return parseISO(value.length > 10 ? value.slice(0, 10) : value);
}

export function monthRange(month: MonthKey | Date): DayRange {
  const start = typeof month === "string" ? parseISO(`${month}-01`) : startOfMonth(month);
  return { from: start, to: addMonths(start, 1) };
}

export function daysInMonthKey(month: MonthKey): number {
  return getDaysInMonth(parseISO(`${month}-01`));
}

/** The `count` months ending with `last` (inclusive), oldest first. */
export function lastMonths(count: number, last: Date): MonthKey[] {
  return Array.from({ length: count }, (_, index) =>
    toMonthKey(addMonths(startOfMonth(last), index - count + 1)),
  );
}

/** Number of days two half-open ranges share. */
export function overlapDays(a: DayRange, b: DayRange): number {
  const from = maxDate([a.from, b.from]);
  const to = minDate([a.to, b.to]);
  return Math.max(0, differenceInCalendarDays(to, from));
}

export function rangeDays(range: DayRange): number {
  return Math.max(0, differenceInCalendarDays(range.to, range.from));
}

export function isWithin(day: Date, range: DayRange): boolean {
  return day >= range.from && day < range.to;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

const CASABLANCA = "Africa/Casablanca";

/** Casablanca's offset from UTC at an instant, in minutes (+60 most of the year, 0 in Ramadan). */
function casablancaOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CASABLANCA,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
  const wallAsUtc = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
  );
  return Math.round((wallAsUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

function formatOffset(minutes: number) {
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

/**
 * A wall-clock day and time in Casablanca as an ISO date-time carrying the zone's offset at that
 * moment, e.g. ("2027-01-31", "23:59") → "2027-01-31T23:59:00+01:00".
 */
export function casablancaDateTime(day: string, time: string): string {
  const wallAsUtc = Date.parse(`${day}T${time}:00Z`);
  let offset = casablancaOffsetMinutes(new Date(wallAsUtc - 60 * 60000));
  offset = casablancaOffsetMinutes(new Date(wallAsUtc - offset * 60000));
  return `${day}T${time}:00${formatOffset(offset)}`;
}

/** The day, time ("HH:mm") and offset ("GMT+1") an instant shows on a clock in Casablanca. */
export function casablancaParts(iso: string): { day: string; time: string; offset: string } {
  const at = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CASABLANCA,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(at);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  const minutes = casablancaOffsetMinutes(at);
  const hours = Math.floor(Math.abs(minutes) / 60);
  return {
    day: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
    offset: minutes === 0 ? "GMT" : `GMT${minutes < 0 ? "-" : "+"}${hours}`,
  };
}
