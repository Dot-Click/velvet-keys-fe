import { addDays, differenceInCalendarDays } from "date-fns";
import type { ISODate, MAD, MonthKey } from "@/types/common";
import type { Lease, LeaseState, LeaseStatus, RentInvoice, RentInvoiceStatus } from "@/types/lease";
import { parseDay, toISODate } from "@/lib/dates";

/** Rent falls due on this day of the month unless the lease says otherwise. */
export const DEFAULT_RENT_DUE_DAY = 5;

/** Leases with this many days or fewer left are "ending soon" and prompt a renewal. */
export const ENDING_SOON_DAYS = 60;

/** Due days stop at 28 so every month has one. */
export const MAX_RENT_DUE_DAY = 28;

/** Due date of a rent period, e.g. ("2026-10", 5) → "2026-10-05". */
export function rentDueDate(period: MonthKey, dueDay: number): ISODate {
  return toISODate(addDays(parseDay(`${period}-01`), dueDay - 1));
}

/** Monthly rent for the period starting on `periodStart`, after any scheduled change. */
export function rentFor(
  lease: Pick<Lease, "monthlyRentMAD" | "rentChanges">,
  periodStart: ISODate,
): MAD {
  const change = lease.rentChanges?.filter((item) => item.from <= periodStart).pop();
  return change?.amountMAD ?? lease.monthlyRentMAD;
}

/** Days from `day` until the lease ends (its exclusive end date). */
export function leaseDaysLeft(lease: Pick<Lease, "endDate">, day: Date): number {
  return differenceInCalendarDays(parseDay(lease.endDate), day);
}

export function leaseState(
  lease: Pick<Lease, "startDate" | "endDate" | "status">,
  day: Date,
): LeaseState {
  const iso = toISODate(day);
  if (lease.status === "ended" || lease.endDate <= iso) return "ended";
  if (lease.startDate > iso) return "upcoming";
  return leaseDaysLeft(lease, day) <= ENDING_SOON_DAYS ? "ending" : "active";
}

/** Stored status matching the lease dates on `day`. */
export function leaseStatusOn(lease: Pick<Lease, "endDate">, day: Date): LeaseStatus {
  const left = leaseDaysLeft(lease, day);
  if (left <= 0) return "ended";
  return left <= ENDING_SOON_DAYS ? "ending" : "active";
}

/** An unpaid rent invoice turns late the day after its due date. */
export function rentInvoiceStatus(
  invoice: Pick<RentInvoice, "status" | "dueDate">,
  day: ISODate,
): RentInvoiceStatus {
  if (invoice.status === "paid") return "paid";
  return invoice.dueDate < day ? "late" : "unpaid";
}

/** Rent invoice number: one sequence per issuer and month, e.g. "R-202610-003". */
export function rentInvoiceNumber(period: MonthKey, sequence: number): string {
  return `R-${period.replace("-", "")}-${String(sequence).padStart(3, "0")}`;
}
