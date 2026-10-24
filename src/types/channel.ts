import type { ISODate } from "./common";
import type { Property, Unit } from "./property";

/** Booking platforms an STR unit can sync with (keys of ChannelConnection). */
export type ChannelPlatform = "airbnb" | "bookingCom";

/** A listing on the manager's Airbnb / Booking.com account that can feed one unit. */
export interface ExternalListing {
  id: string;
  platform: ChannelPlatform;
  name: string;
  city: string;
  bedrooms: number;
  /** Unit this listing already syncs with */
  mappedUnitId?: string;
  mappedUnitLabel?: string;
}

/** An STR unit with its channel links, as listed on the Channels screen. */
export interface ChannelUnitRow {
  unit: Unit;
  property: Property;
  /** Last day of free channel sync (inclusive) while the account's free period runs */
  freeSyncLastDay?: ISODate;
  /** The unit becomes LTR on this day, so it can no longer be connected */
  switchesToLtrOn?: ISODate;
}
