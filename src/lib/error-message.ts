import { isApiError } from "@/lib/apiClient";

/**
 * The backend's own message for a failed request (e.g. "No clients are billable for 2026-10"),
 * or `fallback` when the failure is not an ApiError or carries no usable message.
 */
export function backendErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error) && error.code !== "NETWORK_ERROR") {
    const message = error.message?.trim();
    if (message && message !== error.code) return message;
  }
  return fallback;
}
