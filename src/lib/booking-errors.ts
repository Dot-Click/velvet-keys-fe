import { isApiError } from "@/lib/apiClient";

/** Backend error codes the booking screens explain in the user's language. */
const EXPLAINED_CODES = [
  "BOOKING_OVERLAP",
  "UNIT_NOT_STR",
  "UNIT_NOT_FOUND",
  "INVALID_DATE_RANGE",
  "STAY_TOO_LONG",
  "SYNCED_BOOKING_READ_ONLY",
  "ACCOUNT_READ_ONLY",
  "VALIDATION_FAILED",
  "PROPERTY_DELISTED",
  "GUEST_NOT_FOUND",
  "BOOKING_NOT_FOUND",
] as const;

/** Codes caused by the stay's dates or unit, so the form sends the user back to that step. */
const STAY_CODES = ["BOOKING_OVERLAP", "UNIT_NOT_STR", "INVALID_DATE_RANGE", "STAY_TOO_LONG"];

/** Locale key (conciergerie namespace) explaining a failed booking request. */
export function bookingErrorKey(error: unknown): string {
  if (isApiError(error) && (EXPLAINED_CODES as readonly string[]).includes(error.code)) {
    return `conciergerie:bookingErrors.${error.code}`;
  }
  return "conciergerie:bookingErrors.generic";
}

/** True when the error is about the stay's dates or unit rather than the guest or payment. */
export function isStayError(error: unknown): boolean {
  return isApiError(error) && STAY_CODES.includes(error.code);
}
