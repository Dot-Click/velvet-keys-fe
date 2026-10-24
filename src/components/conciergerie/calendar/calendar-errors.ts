import { isApiError } from "@/lib/apiClient";

/** Backend error codes the calendar explains in the user's language. */
const EXPLAINED_CODES = [
  "BOOKING_OVERLAP",
  "UNIT_NOT_STR",
  "UNIT_NOT_FOUND",
  "INVALID_DATE_RANGE",
  "STAY_TOO_LONG",
  "SYNCED_BOOKING_READ_ONLY",
  "RANGE_TOO_LARGE",
  "ACCOUNT_READ_ONLY",
  "VALIDATION_FAILED",
  "PROPERTY_DELISTED",
] as const;

/** Locale key (conciergerie namespace) explaining a failed calendar request. */
export function calendarErrorKey(error: unknown): string {
  if (isApiError(error) && (EXPLAINED_CODES as readonly string[]).includes(error.code))
    return `conciergerie:calendar.errors.${error.code}`;
  return "common:states.errorBody";
}
