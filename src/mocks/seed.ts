import { addDays, addMonths, startOfMonth } from "date-fns";
import { today } from "@/lib/clock";
import { toISODate } from "@/lib/dates";

/** Every mock date is relative to this day, so the demo always has a live "today". */
export const MOCK_TODAY = today();

export function daysFromToday(days: number) {
  return toISODate(addDays(MOCK_TODAY, days));
}

/** The given day of the month `months` away from the current month. */
export function dayOfMonth(months: number, day: number) {
  return toISODate(addDays(startOfMonth(addMonths(MOCK_TODAY, months)), day - 1));
}

/** Casablanca local time (UTC+1) on a given ISO date. */
export function atCasablancaTime(date: string, time = "10:00") {
  return `${date}T${time}:00+01:00`;
}

/** Hours before now as an ISO timestamp, for "reported 2h ago" style events. */
export function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

/** Small deterministic PRNG (mulberry32) so generated data is identical on every load. */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    chance: (probability: number) => next() < probability,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
  };
}

/** Stable numeric seed from a string id. */
export function seedFrom(id: string) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
