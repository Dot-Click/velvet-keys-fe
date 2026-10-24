import { isApiError } from "@/lib/apiClient";

/** Backend error codes the properties and units screens explain in the user's language. */
const EXPLAINED_CODES = [
  "ACCOUNT_READ_ONLY",
  "UNIT_HAS_FUTURE_BOOKINGS",
  "UNIT_HAS_ACTIVE_LEASE",
  "UNIT_ALREADY_THAT_TYPE",
  "COMMISSION_NOT_APPLICABLE",
  "COMMISSION_OUT_OF_RANGE",
  "OWNER_NOT_MEMBER",
  "PROPERTY_NOT_FOUND",
  "UNIT_NOT_FOUND",
] as const;

/**
 * Locale key (conciergerie namespace) explaining a failed property or unit request, or null
 * when the code has no specific message and the caller should show its generic one.
 */
export function portfolioErrorKey(error: unknown): string | null {
  if (!isApiError(error)) return null;
  return (EXPLAINED_CODES as readonly string[]).includes(error.code)
    ? `conciergerie:portfolioErrors.${error.code}`
    : null;
}
