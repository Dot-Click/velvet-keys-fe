import type { AuthProfile, Capability, UserRole } from "@/types/auth";

const ROLE_DESTINATIONS = {
  admin: "/admin",
  conciergerie: "/conciergerie/today",
  owner: "/owner/overview",
  tenant: "/tenant",
} as const satisfies Record<UserRole, string>;

export function roleDestination<R extends UserRole>(role: R): (typeof ROLE_DESTINATIONS)[R] {
  return ROLE_DESTINATIONS[role];
}

/** True when the backend granted `capability` to this user in the active account. */
export function hasCapability(profile: AuthProfile, capability: Capability) {
  return profile.capabilities.includes(capability);
}

/** An Owner without a Conciergerie runs their own operations. */
export function isSoloOwner(profile: AuthProfile) {
  return profile.role === "owner" && !profile.conciergerieId;
}

/** Who may open the Conciergerie tools under /conciergerie. */
export function canAccessOperations(profile: AuthProfile) {
  return hasCapability(profile, "operations");
}

/** i18n key (common namespace) for the role name shown in badges and menus. */
export function roleLabelKey(profile: AuthProfile) {
  return isSoloOwner(profile) ? "roles.soloOwner" : `roles.${profile.role}`;
}

export type RoleAccent = "gold" | "teal";

export function roleAccent(role: UserRole): RoleAccent {
  return role === "conciergerie" || role === "tenant" ? "teal" : "gold";
}
