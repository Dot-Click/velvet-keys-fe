import { addDays } from "date-fns";
import type { DataScope } from "@/types/common";
import type { Property, Unit, UnitType } from "@/types/property";
import { today } from "@/lib/clock";
import { toISODate } from "@/lib/dates";
import { withLatency } from "./mock-latency";
import { scopedProperties, scopedUnits } from "./scope";
import { ServiceError, db, findOrThrow, newId, patchItem, snapshot, withWrite } from "./store";

export type PropertyInput = Omit<Property, "id" | "status"> & { status?: Property["status"] };
export type UnitInput = Omit<Unit, "id" | "typeHistory"> & { typeHistory?: Unit["typeHistory"] };

/** A unit cannot change type while it has future bookings or an active lease. */
export function typeSwitchBlocker(unitId: string): "future_bookings" | "active_lease" | null {
  const day = toISODate(today());
  if (db.bookings.some((booking) => booking.unitId === unitId && booking.checkOut > day)) {
    return "future_bookings";
  }
  if (
    db.leases.some(
      (lease) => lease.unitId === unitId && lease.status !== "ended" && lease.endDate > day,
    )
  ) {
    return "active_lease";
  }
  return null;
}

export const propertiesService = {
  list(scope: DataScope, options: { includeDelisted?: boolean } = {}): Promise<Property[]> {
    return withLatency(() => snapshot(scopedProperties(scope, options)));
  },

  get(id: string): Promise<Property> {
    return withLatency(() => snapshot(findOrThrow(db.properties, id)));
  },

  create(input: PropertyInput): Promise<Property> {
    return withWrite(() => {
      const property: Property = { status: "active", ...input, id: newId("prop") };
      db.properties.push(property);
      return snapshot(property);
    });
  },

  update(id: string, patch: Partial<Omit<Property, "id">>): Promise<Property> {
    return withWrite(() => snapshot(patchItem(db.properties, id, patch)));
  },

  /**
   * Changes the commission rate from tomorrow: it applies to the next bookings and rent periods,
   * and figures already earned keep the previous rate.
   */
  setCommission(id: string, pct: number): Promise<Property> {
    return withWrite(() => {
      const property = findOrThrow(db.properties, id);
      const effective = toISODate(addDays(today(), 1));
      const history = property.commissionHistory?.length
        ? property.commissionHistory.filter((rate) => rate.from < effective)
        : [{ pct: property.commissionPct, from: "0001-01-01" }];
      return snapshot(
        patchItem(db.properties, id, {
          commissionPct: pct,
          commissionHistory: [...history, { pct, from: effective }],
        }),
      );
    });
  },

  /** Admin moderation: hides the property from its account without deleting history. */
  delist(id: string): Promise<Property> {
    return withWrite(() => snapshot(patchItem(db.properties, id, { status: "delisted" })));
  },
};

export const unitsService = {
  list(scope: DataScope, filter: { propertyId?: string; type?: UnitType } = {}): Promise<Unit[]> {
    return withLatency(() =>
      snapshot(
        scopedUnits(scope).filter(
          (unit) =>
            (!filter.propertyId || unit.propertyId === filter.propertyId) &&
            (!filter.type || unit.type === filter.type),
        ),
      ),
    );
  },

  get(id: string): Promise<Unit> {
    return withLatency(() => snapshot(findOrThrow(db.units, id)));
  },

  create(input: UnitInput): Promise<Unit> {
    return withWrite(() => {
      const unit: Unit = {
        typeHistory: [{ type: input.type, from: toISODate(today()) }],
        ...input,
        id: newId("unit"),
      };
      db.units.push(unit);
      return snapshot(unit);
    });
  },

  update(id: string, patch: Partial<Omit<Unit, "id" | "type" | "typeHistory">>): Promise<Unit> {
    return withWrite(() => snapshot(patchItem(db.units, id, patch)));
  },

  /** Why a type switch is blocked right now, or null when it is allowed. */
  getTypeSwitchBlocker(id: string): Promise<"future_bookings" | "active_lease" | null> {
    return withLatency(() => typeSwitchBlocker(id));
  },

  /**
   * Switches STR ↔ LTR from tomorrow: the current period in the type history ends tonight and
   * billing is prorated by day. Going to LTR switches off channel sync.
   */
  switchType(id: string, type: UnitType): Promise<Unit> {
    return withWrite(() => {
      const unit = findOrThrow(db.units, id);
      if (unit.type === type) return snapshot(unit);
      if (typeSwitchBlocker(id)) throw new ServiceError("unit_type_locked");
      const effective = toISODate(addDays(today(), 1));
      // A switch scheduled earlier today is cancelled rather than stacked on top of.
      const started = unit.typeHistory.filter((period) => period.from < effective);
      const last = started[started.length - 1];
      const revert = last?.type === type && last.to === effective;
      const typeHistory = revert
        ? [...started.slice(0, -1), { type, from: last.from }]
        : [
            ...started.map((period) => (period.to ? period : { ...period, to: effective })),
            { type, from: effective },
          ];
      const connection = unit.channelConnection;
      let channelConnection = connection;
      if (connection && type === "LTR") {
        channelConnection = {
          ...connection,
          airbnb: { ...connection.airbnb, status: "disconnected" },
          bookingCom: { ...connection.bookingCom, status: "disconnected" },
          disconnectedAt: effective,
        };
      } else if (connection && revert && connection.disconnectedAt === effective) {
        const { disconnectedAt: _cancelled, ...rest } = connection;
        channelConnection = {
          ...rest,
          airbnb: { ...connection.airbnb, status: "connected" },
          bookingCom: { ...connection.bookingCom, status: "connected" },
        };
      }
      return snapshot(
        patchItem(db.units, id, {
          type,
          typeHistory,
          ...(channelConnection ? { channelConnection } : {}),
        }),
      );
    });
  },

  /** Removes the unit from billing from today; its history stays for reporting. */
  remove(id: string): Promise<Unit> {
    return withWrite(() => {
      const unit = findOrThrow(db.units, id);
      const day = toISODate(today());
      return snapshot(
        patchItem(db.units, id, {
          typeHistory: unit.typeHistory.map((period) =>
            period.to ? period : { ...period, to: day },
          ),
        }),
      );
    });
  },
};
