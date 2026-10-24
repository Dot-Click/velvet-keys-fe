import type { ISODate, ISODateTime } from "./common";

export type PropertyStatus = "active" | "delisted";

export interface Property {
  id: string;
  accountId: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  image: string;
  description?: string;
  /** Conciergerie commission on STR booking revenue and LTR rent; 0 for solo Owners. */
  commissionPct: number;
  /**
   * Commission changes. Each rate applies to bookings checking in, and rent periods starting,
   * on or after `from`; earlier figures keep the rate that applied then.
   */
  commissionHistory?: CommissionRate[];
  status: PropertyStatus;
}

export interface CommissionRate {
  pct: number;
  from: ISODate;
}

export type UnitType = "STR" | "LTR";

/** One stretch of time a unit ran as STR or LTR; the first entry starts when the unit was added. */
export interface UnitTypePeriod {
  type: UnitType;
  from: ISODate;
  /** Exclusive end; absent while current. A unit whose last period has ended was removed. */
  to?: ISODate;
}

export type ChannelStatus = "connected" | "pending" | "error" | "disconnected";

export interface ChannelListing {
  status: ChannelStatus;
  listingName?: string;
}

/** Airbnb / Booking.com link for an STR unit, through the Channex channel manager. */
export interface ChannelConnection {
  unitId: string;
  airbnb: ChannelListing;
  bookingCom: ChannelListing;
  lastSyncAt?: ISODateTime;
  /** First day the unit counted as synced (for sync billing and proration). */
  connectedSince: ISODate;
  /** Set when sync was switched off, e.g. when the unit became LTR (exclusive end of sync billing). */
  disconnectedAt?: ISODate;
}

export interface Unit {
  id: string;
  propertyId: string;
  name: string;
  type: UnitType;
  bedrooms: number;
  image: string;
  channelConnection?: ChannelConnection;
  typeHistory: UnitTypePeriod[];
}
