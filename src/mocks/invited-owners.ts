import type { OwnerInvitation, User } from "@/types/user";
import { ACCOUNT_IDS, USER_IDS } from "./ids";
import { hoursAgo } from "./seed";

/**
 * Owners the Conciergerie has invited who have not joined yet. They exist as users so
 * properties can be assigned to them, but they cannot sign in until they accept.
 */
export const MOCK_PENDING_OWNERS: readonly User[] = [
  {
    id: "user-owner-yasmine",
    accountId: ACCOUNT_IDS.atlas,
    role: "owner",
    name: "Yasmine Alaoui",
    email: "yasmine.alaoui@velvetkeys.demo",
    language: "fr",
    invitedBy: USER_IDS.conciergerie,
  },
];

export const MOCK_OWNER_INVITATIONS: readonly OwnerInvitation[] = [
  {
    id: "invitation-yasmine",
    token: "vk-invite-owner",
    accountId: ACCOUNT_IDS.atlas,
    userId: "user-owner-yasmine",
    invitedBy: USER_IDS.conciergerie,
    status: "pending",
    sentAt: hoursAgo(50),
    lastSentAt: hoursAgo(50),
  },
];
