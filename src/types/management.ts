import type { Booking } from "./booking";
import type { MonthKey } from "./common";
import type { Lease } from "./lease";
import type { CommissionRate, Property, Unit } from "./property";
import type { OwnerInvitation, User } from "./user";

export type OwnerStatus = "pending" | "active";

export interface OwnerSummary {
  user: User;
  status: OwnerStatus;
  propertyCount: number;
  invitation?: OwnerInvitation;
}

/** A property as the Conciergerie manages it. */
export interface ManagedProperty {
  property: Property;
  owner?: User;
  ownerStatus?: OwnerStatus;
  unitCount: number;
  strUnits: number;
  ltrUnits: number;
  /** A commission change that starts tomorrow */
  scheduledCommission?: CommissionRate;
}

export interface OwnerDetail extends OwnerSummary {
  properties: ManagedProperty[];
}

export type UnitStatus = "occupied" | "vacant" | "leased" | "blocked";

/** Why the unit cannot switch STR ↔ LTR right now. */
export type UnitSwitchBlocker = "future_bookings" | "active_lease";

export interface ManagedUnit {
  unit: Unit;
  status: UnitStatus;
  switchBlocker?: UnitSwitchBlocker;
}

export interface PropertyManagementView {
  managed: ManagedProperty;
  units: ManagedUnit[];
  revenueThisMonth: number;
  commissionThisMonth: number;
}

export interface UnitDetailView {
  managed: ManagedProperty;
  unit: ManagedUnit;
  nextBooking?: Booking;
  lease?: Lease;
  tenantName?: string;
}

export interface CommissionRow {
  managed: ManagedProperty;
  revenueThisMonth: number;
  commissionThisMonth: number;
}

export interface CommissionSummary {
  month: MonthKey;
  defaultPct: number;
  rows: CommissionRow[];
  totalRevenue: number;
  totalCommission: number;
}

export interface InviteOwnerInput {
  name: string;
  email: string;
  language: User["language"];
  propertyIds: string[];
}
