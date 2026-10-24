import { isApiError } from "@/lib/apiClient";

/** Backend error codes the maintenance screen explains in the user's language. */
const EXPLAINED_CODES = [
  "ACCOUNT_READ_ONLY",
  "TICKET_NOT_FOUND",
  "WORKER_NOT_FOUND",
  "UNIT_NOT_FOUND",
  "PROPERTY_DELISTED",
  "VALIDATION_FAILED",
  "FILE_NOT_FOUND",
  "FILE_TOO_LARGE",
  "FILE_TYPE_NOT_ALLOWED",
  "UPLOAD_NOT_FOUND",
  "R2_NOT_CONFIGURED",
] as const;

/** Locale key (conciergerie namespace) explaining a failed maintenance or worker request. */
export function maintenanceErrorKey(error: unknown): string {
  if (isApiError(error) && (EXPLAINED_CODES as readonly string[]).includes(error.code))
    return `conciergerie:maintenance.errors.${error.code}`;
  return "common:states.errorBody";
}
