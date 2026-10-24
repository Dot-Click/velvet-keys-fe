import type { Page } from "@/lib/apiClient";

/**
 * Portfolio shapes exactly as the backend returns them (see velvet-keys-be/app/schemas/portfolio.py).
 * Amounts are integer minor units; the currency is the account's (MAD unless stated).
 */

export type PropertyStatus = "active" | "delisted";

export type UnitType = "STR" | "LTR";

export type InviteStatus = "invited" | "active";

export interface UnitCounts {
  str: number;
  ltr: number;
  total: number;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  /** Uploaded cover image; resolve with GET /files/{id}/url. Null until one is uploaded. */
  imageFileId: string | null;
  /** Conciergerie commission %, null for solo Owners (who pay none). */
  commissionPct: number | null;
  status: PropertyStatus;
  ownerUserId: string | null;
  ownerName: string;
  unitCounts: UnitCounts;
}

export interface Unit {
  id: string;
  name: string;
  type: UnitType;
  bedrooms: number;
  imageFileId: string | null;
  nightlyRateMinor: number | null;
  /** Set when the unit was removed; it stays for history but is hidden from active lists. */
  archivedAt: string | null;
}

export interface PropertyQuickStats {
  revenueMinor: number;
  occupancyPct: number;
}

export interface PropertyDetail extends Property {
  units: Unit[];
  quickStats: PropertyQuickStats;
}

export interface UnitTypeChange {
  fromType: UnitType;
  toType: UnitType;
  /** ISO date the new type applies from */
  effectiveDate: string;
  /** Billed for the final, prorated month of the previous type; null when unavailable. */
  proratedAmountMinor: number | null;
}

export interface UnitWithHistory extends Unit {
  typeHistory: UnitTypeChange[];
}

export interface OwnerSummary {
  userId: string;
  name: string;
  email: string;
  propertyCount: number;
  inviteStatus: InviteStatus;
  lastLoginAt: string | null;
}

export interface OwnerDetail extends OwnerSummary {
  properties: Property[];
}

export interface CommissionRow {
  propertyId: string;
  propertyName: string;
  commissionPct: number;
}

export interface CommissionList extends Page<CommissionRow> {
  defaultCommissionPct: number;
}

export interface PropertyListFilter {
  page?: number;
  pageSize?: 10 | 25 | 50;
  q?: string;
  city?: string;
  ownerUserId?: string;
  status?: PropertyStatus;
}

export interface PropertyInput {
  name: string;
  address: string;
  city: string;
  ownerUserId?: string | null;
  commissionPct?: number | null;
  imageFileId?: string | null;
}

export type PropertyPatch = Partial<
  Pick<PropertyInput, "name" | "address" | "city" | "ownerUserId" | "imageFileId">
>;

export interface UnitInput {
  name: string;
  type: UnitType;
  bedrooms: number;
  nightlyRateMinor?: number | null;
  imageFileId?: string | null;
}

export type UnitPatch = Partial<
  Pick<UnitInput, "name" | "bedrooms" | "nightlyRateMinor" | "imageFileId">
>;

export interface InviteOwnerInput {
  name: string;
  email: string;
  language: "en" | "fr" | "ar";
  propertyIds: string[];
}

/** Created invite as returned by POST /owners/invites. */
export interface OwnerInvite {
  id: string;
  email: string;
  role: "owner";
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  /** Copyable accept link; null for ended invites and old invites whose link can't be recovered. */
  inviteUrl: string | null;
}

/** A not-yet-accepted invite sent by this account, as returned by GET /invites. */
export interface PendingInvite {
  id: string;
  email: string;
  role: "owner" | "conciergerie";
  expiresAt: string;
  inviteUrl: string | null;
}
