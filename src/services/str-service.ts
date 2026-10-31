import { api, type Page } from "@/lib/apiClient";
import type {
  Booking,
  BookingDetail,
  BookingListFilter,
  Calendar,
  CalendarBlockRecord,
  CalendarQuery,
  CreateBlockInput,
  CreateBookingInput,
  Guest,
  GuestIdDetailsInput,
  HousekeepingFilter,
  HousekeepingStatus,
  HousekeepingTask,
  Today,
  UpdateBookingInput,
} from "@/types/str";

function query(filter: object) {
  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export const bookingsService = {
  list(filter: BookingListFilter = {}): Promise<Page<Booking>> {
    return api.get<Page<Booking>>("/bookings", query(filter));
  },

  get(id: string): Promise<BookingDetail> {
    return api.get<BookingDetail>(`/bookings/${id}`);
  },

  /** Fails with BOOKING_OVERLAP, UNIT_NOT_STR, INVALID_DATE_RANGE or STAY_TOO_LONG. */
  create(input: CreateBookingInput): Promise<Booking> {
    return api.post<Booking>("/bookings", input);
  },

  /** Synced bookings only accept notes (SYNCED_BOOKING_READ_ONLY otherwise). */
  update(id: string, patch: UpdateBookingInput): Promise<Booking> {
    return api.patch<Booking>(`/bookings/${id}`, patch);
  },

  cancel(id: string): Promise<Booking> {
    return api.post<Booking>(`/bookings/${id}/cancel`);
  },

  checkIn(id: string, guest?: GuestIdDetailsInput): Promise<Booking> {
    return api.post<Booking>(`/bookings/${id}/check-in`, guest ? { guest } : undefined);
  },

  checkOut(id: string): Promise<Booking> {
    return api.post<Booking>(`/bookings/${id}/check-out`);
  },

  /** Fills in police-declaration details outside of check-in -- works whether or not the
   * booking has been checked in yet. */
  updateGuestDetails(id: string, guest: GuestIdDetailsInput): Promise<Booking> {
    return api.patch<Booking>(`/bookings/${id}/guest-details`, { guest });
  },

  /** The Police Declaration Form PDF, matching the client's exact fiche de police template. */
  policeDeclarationPdf(id: string): Promise<Blob> {
    return api.getBlob(`/bookings/${id}/police-declaration`);
  },

  /** Guest search by name, email or phone (at least 2 characters). */
  searchGuests(q: string): Promise<Guest[]> {
    return api.get<Guest[]>("/guests", { q });
  },
};

export const calendarService = {
  get(input: CalendarQuery): Promise<Calendar> {
    return api.get<Calendar>("/calendar", query(input));
  },

  createBlock(input: CreateBlockInput): Promise<CalendarBlockRecord> {
    return api.post<CalendarBlockRecord>("/calendar/blocks", input);
  },

  deleteBlock(id: string): Promise<void> {
    return api.delete(`/calendar/blocks/${id}`);
  },
};

export const housekeepingService = {
  list(filter: HousekeepingFilter = {}): Promise<Page<HousekeepingTask>> {
    return api.get<Page<HousekeepingTask>>("/housekeeping", query(filter));
  },

  setStatus(id: string, status: HousekeepingStatus): Promise<HousekeepingTask> {
    return api.patch<HousekeepingTask>(`/housekeeping/${id}`, { status });
  },
};

export const todayService = {
  get(): Promise<Today> {
    return api.get<Today>("/today");
  },
};
