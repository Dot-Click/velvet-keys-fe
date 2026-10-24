import { addDays } from "date-fns";
import type {
  InviteOwnerInput,
  ManagedProperty,
  OwnerDetail,
  OwnerSummary,
} from "@/types/management";
import type { OwnerInvitation, User } from "@/types/user";
import { managedProperty } from "./management-service";
import { withLatency } from "./mock-latency";
import { ServiceError, db, newId, snapshot, withWrite } from "./store";

function invitationOf(userId: string): OwnerInvitation | undefined {
  return db.invitations.find((invitation) => invitation.userId === userId);
}

function summarize(user: User): OwnerSummary {
  const invitation = invitationOf(user.id);
  return {
    user: snapshot(user),
    status: invitation?.status === "pending" ? "pending" : "active",
    propertyCount: db.properties.filter(
      (property) => property.ownerId === user.id && property.status === "active",
    ).length,
    ...(invitation ? { invitation: snapshot(invitation) } : {}),
  };
}

function ownersOf(accountId: string) {
  return db.users.filter((user) => user.accountId === accountId && user.role === "owner");
}

export const ownersService = {
  /** Owners of a Conciergerie account, with their invitation status and property count. */
  list(accountId: string): Promise<OwnerSummary[]> {
    return withLatency(() =>
      ownersOf(accountId)
        .map(summarize)
        .sort((a, b) => a.user.name.localeCompare(b.user.name)),
    );
  },

  get(accountId: string, ownerId: string): Promise<OwnerDetail> {
    return withLatency(() => {
      const user = ownersOf(accountId).find((item) => item.id === ownerId);
      if (!user) throw new ServiceError("not_found", ownerId);
      const properties: ManagedProperty[] = db.properties
        .filter((property) => property.ownerId === user.id && property.status === "active")
        .map((property) => managedProperty(property.id));
      return { ...summarize(user), properties };
    });
  },

  /**
   * Creates the Owner as a pending user, assigns the chosen properties to them and records the
   * invitation (the email itself is mocked).
   */
  invite(accountId: string, invitedBy: string, input: InviteOwnerInput): Promise<OwnerSummary> {
    return withWrite(() => {
      const email = input.email.trim().toLowerCase();
      if (db.users.some((user) => user.email.toLowerCase() === email)) {
        throw new ServiceError("email_taken");
      }
      const user: User = {
        id: newId("user"),
        accountId,
        role: "owner",
        name: input.name.trim(),
        email,
        language: input.language,
        invitedBy,
      };
      const now = new Date().toISOString();
      db.users.push(user);
      db.invitations.push({
        id: newId("invitation"),
        token: newId("vk-invite"),
        accountId,
        userId: user.id,
        invitedBy,
        status: "pending",
        sentAt: now,
        lastSentAt: now,
      });
      for (const property of db.properties) {
        if (property.accountId === accountId && input.propertyIds.includes(property.id)) {
          property.ownerId = user.id;
        }
      }
      return summarize(user);
    });
  },

  /** Sends the invitation email again; it stays valid for another 7 days. */
  resendInvite(ownerId: string): Promise<OwnerInvitation> {
    return withWrite(() => {
      const invitation = invitationOf(ownerId);
      if (!invitation) throw new ServiceError("not_found", ownerId);
      invitation.lastSentAt = new Date().toISOString();
      return snapshot(invitation);
    });
  },

  /** When a resent invitation expires: 7 days after it was last sent. */
  expiresOn(invitation: OwnerInvitation): Date {
    return addDays(new Date(invitation.lastSentAt), 7);
  },
};
