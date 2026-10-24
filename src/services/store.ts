import { MOCK_ACCOUNTS } from "@/mocks/accounts";
import { MOCK_ADMIN_ACTIONS, MOCK_PRICE_HISTORY } from "@/mocks/admin";
import { MOCK_PLATFORM_SETTINGS, MOCK_SUBSCRIPTION_INVOICES } from "@/mocks/billing";
import { MOCK_BOOKINGS } from "@/mocks/bookings";
import { MOCK_LEASES, MOCK_RENT_INVOICES, MOCK_TENANTS } from "@/mocks/leases";
import { MOCK_EXPENSES, MOCK_TICKETS, MOCK_WORKERS } from "@/mocks/operations";
import { MOCK_PROPERTIES, MOCK_UNITS } from "@/mocks/properties";
import { MOCK_OWNER_INVITATIONS, MOCK_PENDING_OWNERS } from "@/mocks/invited-owners";
import { MOCK_USERS_DATA } from "@/mocks/users";
import type { TicketStatus } from "@/types/operations";

import { toISODate } from "@/lib/dates";
import { MOCK_TODAY } from "@/mocks/seed";
import { withLatency } from "./mock-latency";

function copy<T>(items: readonly T[]): T[] {
  return structuredClone(items) as T[];
}

function seed() {
  return {
    accounts: copy(MOCK_ACCOUNTS),
    users: copy([...MOCK_USERS_DATA, ...MOCK_PENDING_OWNERS]),
    invitations: copy(MOCK_OWNER_INVITATIONS),
    properties: copy(MOCK_PROPERTIES),
    units: copy(MOCK_UNITS),
    bookings: copy(MOCK_BOOKINGS),
    tenants: copy(MOCK_TENANTS),
    leases: copy(MOCK_LEASES),
    rentInvoices: copy(MOCK_RENT_INVOICES),
    tickets: copy(MOCK_TICKETS),
    expenses: copy(MOCK_EXPENSES),
    workers: copy(MOCK_WORKERS),
    subscriptionInvoices: copy(MOCK_SUBSCRIPTION_INVOICES),
    settings: structuredClone(MOCK_PLATFORM_SETTINGS),
    /** Moderation and offer decisions made in the Admin panel, oldest first */
    adminActions: copy(MOCK_ADMIN_ACTIONS),
    /** Internal Admin notes and mock reminders per client, oldest first */
    adminNotes: [] as {
      id: string;
      accountId: string;
      kind: "note" | "reminder";
      body: string;
      author: string;
      at: string;
    }[],
    /** Every unit price change, oldest first; changes apply from their `effectiveFrom` period */
    priceHistory: copy(MOCK_PRICE_HISTORY),
    /**
     * Operational tasks (arrivals, departures, turnovers, repairs) marked done on the Today screen.
     * For repairs the value keeps the ticket status to restore on undo.
     */
    completedTasks: new Map<string, TicketStatus | null>(),
  };
}

type Database = ReturnType<typeof seed>;
type Snapshot = Omit<Database, "completedTasks"> & {
  completedTasks: [string, TicketStatus | null][];
};

const SNAPSHOT_KEY = "velvet-keys.demo-db";
const SNAPSHOT_VERSION = 8;
/** Mock data is dated from today, so a snapshot from another day no longer lines up. */
const SEEDED_FOR = toISODate(MOCK_TODAY);

function restore(): Database | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version: number; seededFor: string; data: Snapshot };
    if (parsed.version !== SNAPSHOT_VERSION || parsed.seededFor !== SEEDED_FOR) return null;
    return { ...parsed.data, completedTasks: new Map(parsed.data.completedTasks) };
  } catch {
    return null;
  }
}

/**
 * In-memory database behind the mock services. Writes change it in place and are mirrored to
 * sessionStorage, so edits survive reloads until the browser tab is closed.
 */
export const db: Database = restore() ?? seed();

export function persist() {
  if (typeof window === "undefined") return;
  try {
    const data: Snapshot = { ...db, completedTasks: [...db.completedTasks.entries()] };
    window.sessionStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({ version: SNAPSHOT_VERSION, seededFor: SEEDED_FOR, data }),
    );
  } catch {
    // Storage full or blocked: changes still last until the page reloads.
  }
}

/** Like withLatency, for writes: saves the store once the change is applied. */
export function withWrite<T>(apply: () => T): Promise<T> {
  return withLatency(() => {
    const result = apply();
    persist();
    return result;
  });
}

/** Drops every change made during the session and returns to the generated mock data. */
export function resetStore() {
  Object.assign(db, seed());
  if (typeof window !== "undefined") window.sessionStorage.removeItem(SNAPSHOT_KEY);
}

export type ServiceErrorCode =
  | "not_found"
  | "booking_conflict"
  | "unit_type_locked"
  | "invalid_input"
  | "email_taken"
  | "synced_read_only"
  | "unit_leased"
  | "issuer_incomplete";

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;

  constructor(code: ServiceErrorCode, message?: string) {
    super(message ?? code);
    this.name = "ServiceError";
    this.code = code;
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function findOrThrow<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find((entry) => entry.id === id);
  if (!item) throw new ServiceError("not_found", id);
  return item;
}

/** Replaces an item with a patched copy and returns it. */
export function patchItem<T extends { id: string }>(
  items: T[],
  id: string,
  patch: NoInfer<Partial<T>>,
): T {
  const index = items.findIndex((entry) => entry.id === id);
  if (index === -1) throw new ServiceError("not_found", id);
  const updated = { ...(items[index] as T), ...patch };
  items[index] = updated;
  return updated;
}

export function removeItem<T extends { id: string }>(items: T[], id: string) {
  const index = items.findIndex((entry) => entry.id === id);
  if (index === -1) throw new ServiceError("not_found", id);
  items.splice(index, 1);
}

/** Copies data on the way out so callers cannot mutate the store by accident. */
export function snapshot<T>(value: T): T {
  return structuredClone(value);
}
