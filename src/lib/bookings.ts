import type { Booking } from "@/types/booking";
import { toISODate } from "@/lib/dates";

export type BookingStage = "upcoming" | "in_house" | "past";
export type BookingListStatus = BookingStage | "unpaid";

/** Where a stay sits relative to `day`: not yet arrived, staying tonight, or departed. */
export function bookingStage(
  booking: Pick<Booking, "checkIn" | "checkOut">,
  day: Date,
): BookingStage {
  const iso = toISODate(day);
  if (booking.checkOut <= iso) return "past";
  if (booking.checkIn <= iso) return "in_house";
  return "upcoming";
}

/** Status used by the bookings list: an outstanding balance on a current or future stay wins. */
export function bookingListStatus(booking: Booking, day: Date): BookingListStatus {
  const stage = bookingStage(booking, day);
  return stage !== "past" && booking.paymentStatus === "unpaid" ? "unpaid" : stage;
}
