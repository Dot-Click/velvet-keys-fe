import type { AppLanguage, UserRole } from "./auth";

export interface User {
  id: string;
  /** Billing account the user belongs to; "platform" for Velvet Keys staff. */
  accountId: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  language: AppLanguage;
  /** User id of whoever sent the invitation; absent for open signups. */
  invitedBy?: string;
}

export type OwnerInvitationStatus = "pending" | "accepted";

/** Invitation a Conciergerie sent to an Owner; the Owner exists as a user before accepting. */
export interface OwnerInvitation {
  id: string;
  token: string;
  accountId: string;
  /** The invited Owner */
  userId: string;
  invitedBy: string;
  status: OwnerInvitationStatus;
  /** ISO date-time */
  sentAt: string;
  lastSentAt: string;
}
