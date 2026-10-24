import type { AccountStatus, AppLanguage } from "./auth";
import type { ISODate, ISODateTime } from "./common";

export type AccountType = "owner" | "conciergerie";

/** Which launch offer the account qualified for, from the unit types it runs. */
export type LaunchOfferType = "none" | "str" | "ltr" | "str_ltr" | "str_sync_ltr";

export interface LaunchOffer {
  type: LaunchOfferType;
  /** STR units are free until this date (exclusive). */
  strFreeUntil?: ISODate;
  /** LTR units are free until this date (exclusive). */
  ltrFreeUntil?: ISODate;
  /** When the account first ran both unit types, which completes a bundle offer. */
  bundleCompletedAt?: ISODate;
  /** Extra free months granted by an Admin, oldest first. */
  manualOffers?: ManualOffer[];
}

/** The products a free period can cover. */
export type OfferProduct = "str" | "ltr" | "sync";

/** Extra free months an Admin granted on top of the launch offer. */
export interface ManualOffer {
  id: string;
  /** Free months granted per product */
  months: Partial<Record<OfferProduct, number>>;
  /** End (exclusive) of each granted product's free period once this grant applies */
  freeUntil: Partial<Record<OfferProduct, ISODate>>;
  /** Why it was granted; kept for the audit trail */
  reason: string;
  /** Name of the Admin who granted it */
  grantedBy: string;
  grantedAt: ISODateTime;
}

/** Name and bank details printed on rent invoices a manager issues to tenants. */
export interface IssuerProfile {
  name: string;
  address: string;
  ice?: string;
  rib: string;
}

/** A Velvet Keys client: the account holder pays the subscription for every unit in it. */
export interface Account {
  id: string;
  type: AccountType;
  holderUserId: string;
  /** Display name: the Conciergerie company or the Owner's name. */
  name: string;
  status: AccountStatus;
  signupDate: ISODateTime;
  language: AppLanguage;
  launchOffer: LaunchOffer;
  /** Free channel sync until this date (exclusive) for accounts among the first 200 synced units. */
  freeSyncUntil?: ISODate;
  issuerProfile?: IssuerProfile;
  /** Commission % suggested for new properties (Conciergerie accounts; 20 when not set). */
  defaultCommissionPct?: number;
}
