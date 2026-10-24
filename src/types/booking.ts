import type { ISODate, MAD } from "./common";

export type BookingSource = "airbnb" | "booking" | "direct";
export type DepositStatus = "pending" | "received" | "returned";
export type BookingPaymentStatus = "paid" | "partial" | "unpaid";

export interface GuestContact {
  email?: string;
  phone?: string;
}

/** A short-term stay. Synced bookings arrive from Channex; direct ones are entered manually. */
export interface Booking {
  id: string;
  unitId: string;
  source: BookingSource;
  synced: boolean;
  guestName: string;
  guestContact: GuestContact;
  guests?: number;
  /** Arrival day */
  checkIn: ISODate;
  /** Departure day (exclusive: the last night is the day before) */
  checkOut: ISODate;
  amountMAD: MAD;
  depositStatus: DepositStatus;
  paymentStatus: BookingPaymentStatus;
  notes?: string;
}
