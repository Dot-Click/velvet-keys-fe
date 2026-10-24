import { addDays } from "date-fns";
import type { Account } from "@/types/account";
import type { DataScope } from "@/types/common";
import type {
  CommissionSummary,
  ManagedProperty,
  ManagedUnit,
  PropertyManagementView,
  UnitDetailView,
  UnitStatus,
} from "@/types/management";
import type { Unit } from "@/types/property";
import { today } from "@/lib/clock";
import { monthRange, toISODate, toMonthKey } from "@/lib/dates";
import { propertyPL } from "@/lib/portfolio";
import { scopedData } from "./analytics-service";
import { withLatency } from "./mock-latency";
import { typeSwitchBlocker } from "./properties-service";
import { scopedProperties } from "./scope";
import { ServiceError, db, findOrThrow, patchItem, snapshot, withWrite } from "./store";

export const DEFAULT_COMMISSION_PCT = 20;

function ownerStatus(userId: string) {
  const invitation = db.invitations.find((item) => item.userId === userId);
  return invitation?.status === "pending" ? ("pending" as const) : ("active" as const);
}

/** Property with its owner, unit mix and any commission change starting tomorrow. */
export function managedProperty(propertyId: string): ManagedProperty {
  const property = findOrThrow(db.properties, propertyId);
  const owner = db.users.find((user) => user.id === property.ownerId);
  const units = db.units.filter((unit) => unit.propertyId === property.id);
  const day = toISODate(today());
  const scheduled = property.commissionHistory?.find((rate) => rate.from > day);
  return {
    property: snapshot(property),
    ...(owner ? { owner: snapshot(owner), ownerStatus: ownerStatus(owner.id) } : {}),
    unitCount: units.length,
    strUnits: units.filter((unit) => unit.type === "STR").length,
    ltrUnits: units.filter((unit) => unit.type === "LTR").length,
    ...(scheduled ? { scheduledCommission: { ...scheduled } } : {}),
  };
}

function unitStatus(unit: Unit): UnitStatus {
  const day = toISODate(today());
  const blocked = db.tickets.some(
    (ticket) =>
      ticket.unitId === unit.id &&
      ticket.blockedFrom &&
      ticket.blockedUntil &&
      ticket.blockedFrom <= day &&
      ticket.blockedUntil > day,
  );
  if (blocked) return "blocked";
  if (unit.type === "LTR") {
    const leased = db.leases.some(
      (lease) =>
        lease.unitId === unit.id &&
        lease.startDate <= day &&
        lease.endDate > day &&
        lease.status !== "ended",
    );
    return leased ? "leased" : "vacant";
  }
  const staying = db.bookings.some(
    (booking) => booking.unitId === unit.id && booking.checkIn <= day && booking.checkOut > day,
  );
  return staying ? "occupied" : "vacant";
}

function managedUnit(unit: Unit): ManagedUnit {
  const blocker = typeSwitchBlocker(unit.id);
  return {
    unit: snapshot(unit),
    status: unitStatus(unit),
    ...(blocker ? { switchBlocker: blocker } : {}),
  };
}

function assertInScope(scope: DataScope, propertyId: string) {
  if (!scopedProperties(scope).some((property) => property.id === propertyId)) {
    throw new ServiceError("not_found", propertyId);
  }
}

export const managementService = {
  listProperties(scope: DataScope): Promise<ManagedProperty[]> {
    return withLatency(() =>
      scopedProperties(scope)
        .map((property) => managedProperty(property.id))
        .sort((a, b) => a.property.name.localeCompare(b.property.name)),
    );
  },

  getProperty(scope: DataScope, propertyId: string): Promise<PropertyManagementView> {
    return withLatency(() => {
      assertInScope(scope, propertyId);
      const pl = propertyPL(scopedData(scope, propertyId), monthRange(today()));
      return {
        managed: managedProperty(propertyId),
        units: db.units
          .filter((unit) => unit.propertyId === propertyId)
          .map(managedUnit)
          .sort((a, b) => a.unit.name.localeCompare(b.unit.name)),
        revenueThisMonth: pl.grossRevenue,
        commissionThisMonth: pl.commission,
      };
    });
  },

  getUnit(scope: DataScope, unitId: string): Promise<UnitDetailView> {
    return withLatency(() => {
      const unit = findOrThrow(db.units, unitId);
      assertInScope(scope, unit.propertyId);
      const day = toISODate(today());
      const nextBooking = db.bookings
        .filter((booking) => booking.unitId === unit.id && booking.checkOut > day)
        .sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0];
      const lease = db.leases.find(
        (item) => item.unitId === unit.id && item.status !== "ended" && item.endDate > day,
      );
      const tenant = lease ? db.tenants.find((item) => item.id === lease.tenantId) : undefined;
      return {
        managed: managedProperty(unit.propertyId),
        unit: managedUnit(unit),
        ...(nextBooking ? { nextBooking: snapshot(nextBooking) } : {}),
        ...(lease ? { lease: snapshot(lease) } : {}),
        ...(tenant ? { tenantName: tenant.name } : {}),
      };
    });
  },

  /** Commission rate and this month's commission for every property, with the account default. */
  getCommissionSummary(scope: DataScope): Promise<CommissionSummary> {
    return withLatency(() => {
      const range = monthRange(today());
      const account = db.accounts.find((item) => item.id === scope.accountId);
      const rows = scopedProperties(scope)
        .map((property) => {
          const pl = propertyPL(scopedData(scope, property.id), range);
          return {
            managed: managedProperty(property.id),
            revenueThisMonth: pl.grossRevenue,
            commissionThisMonth: pl.commission,
          };
        })
        .sort((a, b) => a.managed.property.name.localeCompare(b.managed.property.name));
      return {
        month: toMonthKey(today()),
        defaultPct: account?.defaultCommissionPct ?? DEFAULT_COMMISSION_PCT,
        rows,
        totalRevenue: rows.reduce((sum, row) => sum + row.revenueThisMonth, 0),
        totalCommission: rows.reduce((sum, row) => sum + row.commissionThisMonth, 0),
      };
    });
  },

  /** Commission % suggested for properties added from now on. */
  setDefaultCommission(accountId: string, pct: number): Promise<Account> {
    return withWrite(() =>
      snapshot(patchItem(db.accounts, accountId, { defaultCommissionPct: pct })),
    );
  },

  /** First day a commission or unit type change takes effect. */
  effectiveFrom(): string {
    return toISODate(addDays(today(), 1));
  },
};
