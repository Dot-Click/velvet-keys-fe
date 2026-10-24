import type { Booking } from "@/types/booking";
import type { DataScope } from "@/types/common";
import { parseDay } from "@/lib/dates";
import { unitTypeOn } from "@/lib/finance";
import { withLatency } from "./mock-latency";
import { scopedUnitIds } from "./scope";
import {
  ServiceError,
  db,
  findOrThrow,
  newId,
  patchItem,
  removeItem,
  snapshot,
  withWrite,
} from "./store";

export type BookingInput = Omit<Booking, "id">;

export interface BookingFilter {
  unitId?: string;
  /** Stays that end after this day (ISO date) */
  from?: string;
  /** Stays that start before this day (ISO date) */
  to?: string;
}

export interface ReturningGuest {
  name: string;
  email?: string;
  phone?: string;
  stays: number;
  lastStay: string;
}

function overlaps(
  a: Pick<Booking, "checkIn" | "checkOut">,
  b: Pick<Booking, "checkIn" | "checkOut">,
) {
  return a.checkIn < b.checkOut && b.checkIn < a.checkOut;
}

function filterBookings(scope: DataScope, filter: BookingFilter) {
  const unitIds = scopedUnitIds(scope);
  return db.bookings.filter(
    (booking) =>
      unitIds.has(booking.unitId) &&
      (!filter.unitId || booking.unitId === filter.unitId) &&
      (!filter.from || booking.checkOut > filter.from) &&
      (!filter.to || booking.checkIn < filter.to),
  );
}

export const bookingsService = {
  list(scope: DataScope, filter: BookingFilter = {}): Promise<Booking[]> {
    return withLatency(() => snapshot(filterBookings(scope, filter)));
  },

  get(id: string): Promise<Booking> {
    return withLatency(() => snapshot(findOrThrow(db.bookings, id)));
  },

  /** Bookings on the same unit that overlap the given stay. */
  findConflicts(
    stay: Pick<Booking, "unitId" | "checkIn" | "checkOut">,
    ignoreId?: string,
  ): Booking[] {
    return db.bookings.filter(
      (booking) =>
        booking.unitId === stay.unitId && booking.id !== ignoreId && overlaps(booking, stay),
    );
  },

  /** Records a stay; only units running as STR on the arrival day take bookings. */
  create(input: BookingInput): Promise<Booking> {
    return withWrite(() => {
      if (input.checkOut <= input.checkIn) throw new ServiceError("invalid_input");
      const unit = findOrThrow(db.units, input.unitId);
      if (unitTypeOn(unit, parseDay(input.checkIn)) !== "STR") {
        throw new ServiceError("invalid_input");
      }
      if (bookingsService.findConflicts(input).length > 0)
        throw new ServiceError("booking_conflict");
      const booking: Booking = { ...input, id: newId("bk") };
      db.bookings.push(booking);
      return snapshot(booking);
    });
  },

  /** Bookings synced from Airbnb / Booking.com belong to the platform: only notes can change. */
  update(id: string, patch: Partial<BookingInput>): Promise<Booking> {
    return withWrite(() => {
      const current = findOrThrow(db.bookings, id);
      if (current.synced && Object.keys(patch).some((field) => field !== "notes")) {
        throw new ServiceError("synced_read_only");
      }
      const next = { ...current, ...patch };
      if (bookingsService.findConflicts(next, id).length > 0)
        throw new ServiceError("booking_conflict");
      return snapshot(patchItem(db.bookings, id, patch));
    });
  },

  remove(id: string): Promise<void> {
    return withWrite(() => removeItem(db.bookings, id));
  },

  /** Guests with more than one stay in scope, most frequent first. */
  listReturningGuests(scope: DataScope): Promise<ReturningGuest[]> {
    return withLatency(() => {
      const byName = new Map<string, ReturningGuest>();
      for (const booking of filterBookings(scope, {})) {
        const entry = byName.get(booking.guestName);
        if (entry) {
          entry.stays += 1;
          if (booking.checkIn > entry.lastStay) entry.lastStay = booking.checkIn;
        } else {
          byName.set(booking.guestName, {
            name: booking.guestName,
            stays: 1,
            lastStay: booking.checkIn,
            ...(booking.guestContact.email ? { email: booking.guestContact.email } : {}),
            ...(booking.guestContact.phone ? { phone: booking.guestContact.phone } : {}),
          });
        }
      }
      return [...byName.values()]
        .filter((guest) => guest.stays > 1)
        .sort((a, b) => b.stays - a.stays || a.name.localeCompare(b.name));
    });
  },
};
