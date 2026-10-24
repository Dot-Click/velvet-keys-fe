import { isApiError } from "@/lib/apiClient";

/** Backend error codes the Channex connect/disconnect flow explains in the user's language. */
const EXPLAINED_CODES = [
  "CHANNEX_NOT_CONFIGURED",
  "CHANNEX_API_ERROR",
  "CONNECTION_NOT_FOUND",
  "UNIT_NOT_FOUND",
  "UNIT_NOT_STR",
  "PROPERTY_DELISTED",
  "ALREADY_CONNECTED_OR_CONNECTING",
  "ACCOUNT_READ_ONLY",
] as const;

/** Locale key (conciergerie namespace) explaining a failed channel-connection request. */
export function channexErrorKey(error: unknown): string {
  if (isApiError(error) && (EXPLAINED_CODES as readonly string[]).includes(error.code)) {
    return `conciergerie:channelErrors.${error.code}`;
  }
  return "conciergerie:channelErrors.generic";
}
