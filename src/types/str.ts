import type { Page } from "@/lib/apiClient";
import type { UnitType } from "./portfolio";

/**
 * Short-term rental shapes exactly as the backend returns them
 * (velvet-keys-be/app/schemas/bookings.py). Amounts are integer minor units + currency.
 */

export type BookingSource = "airbnb" | "booking" | "direct";
export type BookingStatus = "confirmed" | "modified" | "cancelled";
export type DepositStatus = "pending" | "received" | "returned";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export type HousekeepingStatus = "scheduled" | "done";
export type CalendarBlockReason = "maintenance" | "owner" | "other";
export type GuestIdType = "cin" | "passport";
export type PurposeOfVisit = "tourism" | "business" | "family" | "official_mission" | "other";

/** Server-side bookings tabs. */
export type BookingStatusFilter = "upcoming" | "inhouse" | "past" | "unpaid";

export interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  // Police declaration (fiche de police) fields -- all optional, captured at
  // check-in or filled in later. See GuestIdDetailsInput.
  nationality: string | null;
  idType: GuestIdType | null;
  idNumber: string | null;
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  residenceAddress: string | null;
  maidenName: string | null;
  countryOfResidence: string | null;
  occupation: string | null;
  documentPlaceOfIssue: string | null;
  documentDateOfIssue: string | null;
  arrivingFrom: string | null;
  nextDestination: string | null;
  purposeOfVisit: PurposeOfVisit | null;
  accompanyingMinors: string | null;
}

export interface GuestInput {
  name: string;
  email?: string;
  phone?: string;
}

/** Every field optional: a manager may not have them on hand yet. */
export interface GuestIdDetailsInput {
  nationality?: string;
  idType?: GuestIdType;
  idNumber?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  residenceAddress?: string;
  maidenName?: string;
  countryOfResidence?: string;
  occupation?: string;
  documentPlaceOfIssue?: string;
  documentDateOfIssue?: string;
  arrivingFrom?: string;
  nextDestination?: string;
  purposeOfVisit?: PurposeOfVisit;
  accompanyingMinors?: string;
}

export interface Booking {
  id: string;
  unitId: string;
  unitName: string;
  propertyName: string;
  guest: Guest;
  source: BookingSource;
  /** True for bookings that arrived from Airbnb/Booking.com through Channex: read-only except notes. */
  synced: boolean;
  /** ISO date of arrival */
  checkIn: string;
  /** ISO date of departure (exclusive: the last night is the day before) */
  checkOut: string;
  guestsCount: number;
  amountMinor: number;
  currency: string;
  depositStatus: DepositStatus;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  notes: string | null;
  createdAt: string;
}

export type StayEvent = "booked" | "checkedIn" | "checkedOut" | "cancelled";

export interface StayTimelineEvent {
  event: StayEvent;
  at: string;
}

export interface BookingDetail extends Booking {
  stayTimeline: StayTimelineEvent[];
}

export interface BookingListFilter {
  page?: number;
  pageSize?: 10 | 25 | 50;
  status?: BookingStatusFilter;
  source?: BookingSource;
  unitId?: string;
  propertyId?: string;
  /** Stays ending after this ISO date */
  from?: string;
  /** Stays starting before this ISO date */
  to?: string;
  q?: string;
}

export interface CreateBookingInput {
  unitId: string;
  /** Exactly one of guestId (returning guest) or guest (new guest) */
  guestId?: string;
  guest?: GuestInput;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  amountMinor: number;
  currency?: string;
  depositStatus?: DepositStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
}

export interface UpdateBookingInput {
  checkIn?: string;
  checkOut?: string;
  guestsCount?: number;
  amountMinor?: number;
  currency?: string;
  depositStatus?: DepositStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
}

export interface CalendarLease {
  leaseId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
}

export interface CalendarHousekeeping {
  date: string;
  status: HousekeepingStatus;
}

export interface CalendarBlock {
  id: string;
  startDate: string;
  endDate: string;
  reason: CalendarBlockReason;
}

export interface CalendarUnit {
  unitId: string;
  unitName: string;
  type: UnitType;
  bookings: Booking[];
  leases: CalendarLease[];
  housekeeping: CalendarHousekeeping[];
  blocks: CalendarBlock[];
  occupancyPct: number;
}

export interface CalendarProperty {
  propertyId: string;
  propertyName: string;
  units: CalendarUnit[];
  propertyOccupancyPct: number;
}

export interface Calendar {
  properties: CalendarProperty[];
}

export interface CalendarQuery {
  from: string;
  to: string;
  propertyId?: string;
  type?: "all" | "STR" | "LTR";
}

export interface CreateBlockInput {
  unitId: string;
  startDate: string;
  endDate: string;
  reason: CalendarBlockReason;
}

export interface CalendarBlockRecord {
  id: string;
  unitId: string;
  startDate: string;
  endDate: string;
  reason: CalendarBlockReason;
}

export interface HousekeepingTask {
  id: string;
  unitId: string;
  bookingId: string | null;
  date: string;
  status: HousekeepingStatus;
  doneAt: string | null;
  doneByUserId: string | null;
}

export interface HousekeepingFilter {
  page?: number;
  pageSize?: 10 | 25 | 50;
  unitId?: string;
  status?: HousekeepingStatus;
  from?: string;
  to?: string;
}

export type UnitBoardStatus = "occupied" | "vacant_clean" | "vacant_dirty" | "blocked";

export interface UnitBoardItem {
  unitId: string;
  unitName: string;
  propertyName: string;
  status: UnitBoardStatus;
}

export interface Today {
  date: string;
  arrivals: Booking[];
  departures: Booking[];
  housekeeping: HousekeepingTask[];
  unitStatusBoard: UnitBoardItem[];
  syncIssueCount: number;
}

export type BookingPage = Page<Booking>;
