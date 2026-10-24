import { startOfDay } from "date-fns";

let override: Date | null = null;

/** Start of the current day. Mock data and every "today" view read the time from here. */
export function today(): Date {
  return startOfDay(override ?? new Date());
}

/** Pins "today" to a fixed date (tests and demos); pass null to follow the real clock again. */
export function setToday(date: Date | null) {
  override = date ? startOfDay(date) : null;
}

/** Current Casablanca wall-clock time as "HH:mm" (Latin digits), for comparing with task times. */
export function casablancaClock(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Casablanca",
  }).format(date);
}
