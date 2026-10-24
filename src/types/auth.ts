export type AppLanguage = "en" | "fr" | "ar";

export type UserRole = "admin" | "conciergerie" | "owner" | "tenant";

/** Roles open to public signup. Tenants are invite-only and Admins are Velvet Keys staff. */
export type SignupRole = Extract<UserRole, "owner" | "conciergerie">;

/** Roles that can be invited into an existing account. */
export type InvitableRole = Exclude<UserRole, "admin">;

/**
 * - active: full access
 * - readonly: invoice overdue since day 8, can log in and view but not add or edit
 * - banned: blocked at login by an Admin
 */
export type AccountStatus = "active" | "readonly" | "banned";

/** Capability names exactly as the backend's /me returns them. */
export type Capability =
  | "operations"
  | "invite_owners"
  | "commission"
  | "billing"
  | "financials"
  | "tenant_portal"
  | "admin";

export interface AuthProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  /** Billing account this user is acting in. The account holder pays for every unit in it. */
  accountId: string;
  isAccountHolder: boolean;
  /** Set for Owners managed by a Conciergerie. Owners without one are solo and also get the Conciergerie tools. */
  conciergerieId?: string;
  companyName?: string;
  phone?: string;
  language?: AppLanguage;
  /** What the backend says this user may do in the active account. */
  capabilities: Capability[];
}

export interface AuthSession {
  profile: AuthProfile;
}

export interface SignInInput {
  email: string;
  password: string;
}

/** Returned by sign-in when the account has MFA on: the code is verified in a second step. */
export interface MfaChallenge {
  mfaToken: string;
}

export type SignInResult =
  { status: "signed-in"; profile: AuthProfile } | ({ status: "mfa" } & MfaChallenge);

export interface MfaVerifyInput {
  mfaToken: string;
  code: string;
}

/** Details a signed-in user can change on their profile. */
export interface ProfileUpdate {
  displayName: string;
  phone: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface SignUpInput {
  role: SignupRole;
  fullName: string;
  companyName?: string;
  email: string;
  phone: string;
  password: string;
  language: AppLanguage;
  acceptTerms: boolean;
}

export interface PasswordResetReceipt {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

/** What GET /invites/{token} returns. The invite is valid while this loads and an error otherwise. */
export interface Invitation {
  token: string;
  inviterName: string;
  accountName: string;
  role: InvitableRole;
  email: string;
  /** ISO date-time */
  expiresAt: string;
  /** Properties an Owner invite covers */
  properties?: { id: string; name: string }[];
}

export interface AcceptInvitationInput {
  token: string;
  name: string;
  password: string;
  language: AppLanguage;
}

export type AuthErrorCode =
  | "invalid_credentials"
  | "account_banned"
  | "email_taken"
  | "weak_password"
  | "rate_limited"
  | "mfa_invalid"
  | "reset_token_invalid"
  | "invitation_not_found"
  | "invitation_expired"
  | "invitation_accepted"
  | "network"
  | "unknown";
