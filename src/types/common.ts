/** Calendar date without time, e.g. "2026-10-03". */
export type ISODate = string;

/** Date and time with offset, e.g. "2026-10-03T14:15:00+01:00". */
export type ISODateTime = string;

/** Calendar month, e.g. "2026-09". */
export type MonthKey = string;

/** Amount in Moroccan dirham, excluding VAT unless stated otherwise. */
export type MAD = number;

/**
 * Which slice of the portfolio a panel may see. A Conciergerie (or solo Owner) sees its whole
 * account; an Owner managed by a Conciergerie also carries `ownerId` and sees only their properties.
 */
export interface DataScope {
  accountId: string;
  ownerId?: string;
  /** The signed-in user, so cached data is never shared between people on one account. */
  userId?: string;
}
