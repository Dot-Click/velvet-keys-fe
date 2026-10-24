import type { BookingSource } from "@/types/booking";
import type { ChannelPlatform } from "@/types/channel";

/** Booking sources that arrive through channel sync, keyed to their platform. */
export const SOURCE_PLATFORM: Partial<Record<BookingSource, ChannelPlatform>> = {
  airbnb: "airbnb",
  booking: "bookingCom",
};
