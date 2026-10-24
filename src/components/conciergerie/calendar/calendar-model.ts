import { addDays, differenceInCalendarDays } from "date-fns";
import { parseDay, toISODate } from "@/lib/dates";
import type { ISODate } from "@/types/common";
import type {
  Booking,
  CalendarBlock,
  CalendarLease,
  CalendarProperty,
  CalendarUnit,
  HousekeepingStatus,
} from "@/types/str";

export type CalendarViewMode = "timeline" | "month" | "agenda";
export type CalendarZoom = "1w" | "2w" | "1m";
export type TypeFilter = "all" | "STR" | "LTR";

export const VIEW_MODES: CalendarViewMode[] = ["timeline", "month", "agenda"];
export const ZOOMS: CalendarZoom[] = ["1w", "2w", "1m"];
export const TYPE_FILTERS: TypeFilter[] = ["all", "STR", "LTR"];

export const ZOOM_DAYS: Record<CalendarZoom, number> = { "1w": 7, "2w": 14, "1m": 30 };
/** Day-column width per zoom, animated through the registered --cal-col property */
export const ZOOM_COLUMN: Record<CalendarZoom, number> = { "1w": 132, "2w": 84, "1m": 48 };
/** How many days before today a range opens on, so today sits near the start */
export const ZOOM_LEAD: Record<CalendarZoom, number> = { "1w": 1, "2w": 3, "1m": 7 };

export const ROW_HEIGHT = 56;
export const GROUP_HEIGHT = 40;
export const BAR_HEIGHT = 36;
/** Rows beyond this many units are virtualised */
export const VIRTUALIZE_AFTER = 30;

/**
 * What a unit's row draws, normalised from the server's nested calendar. Every item spans
 * `start` (first day) up to `end` (exclusive), whatever the source shape: bookings and blocks
 * already end exclusively, a lease's last day is inclusive and a turnover is a single day.
 */
interface ItemBase {
  id: string;
  unitId: string;
  start: ISODate;
  /** First day after the item */
  end: ISODate;
}

export interface StayItem extends ItemBase {
  kind: "stay";
  booking: Booking;
}

export interface LeaseItem extends ItemBase {
  kind: "lease";
  lease: CalendarLease;
}

export interface BlockItem extends ItemBase {
  kind: "block";
  block: CalendarBlock;
}

export interface TurnoverItem extends ItemBase {
  kind: "turnover";
  status: HousekeepingStatus;
}

export type CalendarItem = StayItem | LeaseItem | BlockItem | TurnoverItem;

/** A unit together with the property it belongs to. */
export interface CalendarRow {
  property: CalendarProperty;
  unit: CalendarUnit;
}

/** One property with the units that are shown. */
export interface PropertyGroup {
  propertyId: string;
  propertyName: string;
  occupancyPct: number;
  units: CalendarUnit[];
}

export const addIsoDays = (iso: ISODate, days: number): ISODate =>
  toISODate(addDays(parseDay(iso), days));

/** Non-cancelled stays, leases, blocks and turnovers of one unit, as drawable items. */
export function itemsOfUnit(unit: CalendarUnit): CalendarItem[] {
  const items: CalendarItem[] = [];
  for (const booking of unit.bookings) {
    if (booking.status === "cancelled") continue;
    items.push({
      kind: "stay",
      id: booking.id,
      unitId: unit.unitId,
      start: booking.checkIn,
      end: booking.checkOut,
      booking,
    });
  }
  for (const lease of unit.leases) {
    items.push({
      kind: "lease",
      id: lease.leaseId,
      unitId: unit.unitId,
      start: lease.startDate,
      end: addIsoDays(lease.endDate, 1),
      lease,
    });
  }
  for (const block of unit.blocks) {
    items.push({
      kind: "block",
      id: block.id,
      unitId: unit.unitId,
      start: block.startDate,
      end: block.endDate,
      block,
    });
  }
  for (const task of unit.housekeeping) {
    items.push({
      kind: "turnover",
      id: `hk-${unit.unitId}-${task.date}`,
      unitId: unit.unitId,
      start: task.date,
      end: addIsoDays(task.date, 1),
      status: task.status,
    });
  }
  return items;
}

/** Items of every unit, keyed by unit id. */
export function itemsByUnit(properties: CalendarProperty[]) {
  const map = new Map<string, CalendarItem[]>();
  for (const property of properties)
    for (const unit of property.units) map.set(unit.unitId, itemsOfUnit(unit));
  return map;
}

/** Days from the range start to `day` (may be negative or past the end). */
export function dayIndex(start: Date, day: ISODate | Date) {
  return differenceInCalendarDays(typeof day === "string" ? parseDay(day) : day, start);
}

/**
 * Where an item sits in day units. Stays run from the middle of the check-in day to the middle
 * of the check-out day (hotel convention), so same-day turnovers meet edge to edge; leases and
 * blocks cover whole days. Clipped ends are flagged so they render square.
 */
export function itemSpan(item: CalendarItem, start: Date, days: number) {
  const offset = item.kind === "stay" ? 0.5 : 0;
  const from = dayIndex(start, item.start) + offset;
  const to = dayIndex(start, item.end) + offset;
  const x0 = Math.max(0, from);
  const x1 = Math.min(days, to);
  return { x0, x1, clippedStart: from < 0, clippedEnd: to > days, visible: x1 > x0 };
}

/** Nights of a stay (check-out is exclusive). */
export function nightsOf(item: { start: ISODate; end: ISODate }) {
  return differenceInCalendarDays(parseDay(item.end), parseDay(item.start));
}

export function initialsOfGuest(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Another stay, lease or block on the unit overlapping the nights checkIn … checkOut - 1. */
export function findConflict(
  items: CalendarItem[],
  stay: { id: string; checkIn: ISODate; checkOut: ISODate },
) {
  return items.find(
    (item) =>
      item.kind !== "turnover" &&
      item.id !== stay.id &&
      item.start < stay.checkOut &&
      item.end > stay.checkIn,
  );
}

/** Stretches of the range with no lease on an LTR unit, as whole-day spans. */
export function availableSpans(items: CalendarItem[], start: Date, days: number) {
  const covered = new Array<boolean>(days).fill(false);
  for (const item of items) {
    if (item.kind !== "lease") continue;
    const from = Math.max(0, dayIndex(start, item.start));
    const to = Math.min(days, dayIndex(start, item.end));
    for (let index = from; index < to; index += 1) covered[index] = true;
  }
  const spans: { x0: number; x1: number }[] = [];
  let open: number | null = null;
  covered.forEach((taken, index) => {
    if (!taken && open === null) open = index;
    if (taken && open !== null) {
      spans.push({ x0: open, x1: index });
      open = null;
    }
  });
  if (open !== null) spans.push({ x0: open, x1: days });
  return spans;
}

/** Display name of what an item represents, for labels. */
export function itemTitle(item: CalendarItem) {
  switch (item.kind) {
    case "stay":
      return item.booking.guest.name;
    case "lease":
      return item.lease.tenantName;
    default:
      return "";
  }
}
