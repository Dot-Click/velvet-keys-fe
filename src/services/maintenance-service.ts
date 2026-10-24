import type { DataScope } from "@/types/common";
import type { MaintenanceTicket, TicketStatus } from "@/types/operations";
import { withLatency } from "./mock-latency";
import { scopedUnitIds } from "./scope";
import { db, findOrThrow, newId, patchItem, removeItem, snapshot, withWrite } from "./store";

export type TicketInput = Omit<MaintenanceTicket, "id" | "reportedAt" | "status"> &
  Partial<Pick<MaintenanceTicket, "reportedAt" | "status">>;

export const maintenanceService = {
  list(
    scope: DataScope,
    filter: { status?: TicketStatus; unitId?: string } = {},
  ): Promise<MaintenanceTicket[]> {
    return withLatency(() => {
      const unitIds = scopedUnitIds(scope);
      return snapshot(
        db.tickets.filter(
          (ticket) =>
            unitIds.has(ticket.unitId) &&
            (!filter.status || ticket.status === filter.status) &&
            (!filter.unitId || ticket.unitId === filter.unitId),
        ),
      );
    });
  },

  get(id: string): Promise<MaintenanceTicket> {
    return withLatency(() => snapshot(findOrThrow(db.tickets, id)));
  },

  create(input: TicketInput): Promise<MaintenanceTicket> {
    return withWrite(() => {
      const ticket: MaintenanceTicket = {
        status: "reported",
        reportedAt: new Date().toISOString(),
        ...input,
        id: newId("ticket"),
      };
      db.tickets.unshift(ticket);
      return snapshot(ticket);
    });
  },

  update(id: string, patch: Partial<Omit<MaintenanceTicket, "id">>): Promise<MaintenanceTicket> {
    return withWrite(() => snapshot(patchItem(db.tickets, id, patch)));
  },

  /** Moves a ticket along the board; resolving stamps the resolution time. */
  setStatus(id: string, status: TicketStatus): Promise<MaintenanceTicket> {
    return withWrite(() =>
      snapshot(
        patchItem(db.tickets, id, {
          status,
          ...(status === "resolved" ? { resolvedAt: new Date().toISOString() } : {}),
        }),
      ),
    );
  },

  remove(id: string): Promise<void> {
    return withWrite(() => removeItem(db.tickets, id));
  },
};
