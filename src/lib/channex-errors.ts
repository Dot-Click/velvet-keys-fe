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
  if (isApiError(error)) {
    if (error.code === "CHANNEX_API_ERROR") {
      // The toast stays generic (Channex's error shape isn't meant for end users),
      // but log the real message/details so this doesn't need a network tab dive.
      console.error("Channex API error:", error.message, error.details);
    }
    if ((EXPLAINED_CODES as readonly string[]).includes(error.code)) {
      return `conciergerie:channelErrors.${error.code}`;
    }
  }
  return "conciergerie:channelErrors.generic";
}
