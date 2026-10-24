import type { Booking, HousekeepingTask, Today } from "@/types/str";

export type TodayItemKind = "check_in" | "check_out" | "housekeeping";

/** One thing to do today, derived from the backend Today payload. */
export interface TodayItem {
  /** Unique across kinds: `${kind}:${booking or task id}` */
  id: string;
  kind: TodayItemKind;
  unitId: string;
  unitName: string;
  propertyName: string;
  done: boolean;
  /** Set for arrivals and departures */
  booking: Booking | null;
  /** Set for housekeeping */
  task: HousekeepingTask | null;
  /** False while the backend would refuse the action (a departure that never checked in) */
  canAct: boolean;
}

/** Arrivals, then departures, then housekeeping; completion comes straight from the server fields. */
export function buildTodayItems(today: Today): TodayItem[] {
  const units = new Map(today.unitStatusBoard.map((unit) => [unit.unitId, unit]));
  const bookings = new Map([...today.arrivals, ...today.departures].map((b) => [b.id, b]));

  const arrivals = today.arrivals.map((booking): TodayItem => ({
    id: `check_in:${booking.id}`,
    kind: "check_in",
    unitId: booking.unitId,
    unitName: booking.unitName,
    propertyName: booking.propertyName,
    done: booking.checkedInAt !== null,
    booking,
    task: null,
    canAct: true,
  }));
  const departures = today.departures.map((booking): TodayItem => ({
    id: `check_out:${booking.id}`,
    kind: "check_out",
    unitId: booking.unitId,
    unitName: booking.unitName,
    propertyName: booking.propertyName,
    done: booking.checkedOutAt !== null,
    booking,
    task: null,
    canAct: booking.checkedInAt !== null,
  }));
  const housekeeping = today.housekeeping.map((task): TodayItem => {
    const unit = units.get(task.unitId);
    const booking = task.bookingId ? bookings.get(task.bookingId) : undefined;
    return {
      id: `housekeeping:${task.id}`,
      kind: "housekeeping",
      unitId: task.unitId,
      unitName: unit?.unitName ?? booking?.unitName ?? "",
      propertyName: unit?.propertyName ?? booking?.propertyName ?? "",
      done: task.status === "done",
      booking: null,
      task,
      canAct: true,
    };
  });
  return [...arrivals, ...departures, ...housekeeping];
}

export type AttentionReason = "unpaid_arrival" | "deposit_held";

export interface AttentionItem {
  /** Id of the TodayItem to jump to */
  itemId: string;
  reason: AttentionReason;
  booking: Booking;
}

/** Open arrivals not fully paid, and open departures still holding the guest's deposit. */
export function buildAttention(today: Today): AttentionItem[] {
  const unpaid = today.arrivals
    .filter((b) => b.checkedInAt === null && b.paymentStatus !== "paid")
    .map((booking): AttentionItem => ({
      itemId: `check_in:${booking.id}`,
      reason: "unpaid_arrival",
      booking,
    }));
  const held = today.departures
    .filter((b) => b.checkedOutAt === null && b.depositStatus === "received")
    .map((booking): AttentionItem => ({
      itemId: `check_out:${booking.id}`,
      reason: "deposit_held",
      booking,
    }));
  return [...unpaid, ...held];
}
