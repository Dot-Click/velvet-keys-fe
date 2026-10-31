import {
  api,
  getAccessToken,
  isApiError,
  restoreSession,
  setAccessToken,
  setActiveAccountId,
} from "@/lib/apiClient";
import type {
  AcceptInvitationInput,
  AccountStatus,
  AppLanguage,
  AuthErrorCode,
  AuthProfile,
  AuthSession,
  Capability,
  ChangePasswordInput,
  Invitation,
  MfaVerifyInput,
  PasswordResetReceipt,
  ProfileUpdate,
  ResetPasswordInput,
  SignInInput,
  SignInResult,
  SignUpInput,
  UserRole,
} from "@/types/auth";

/**
 * Authentication against the real backend. The access token lives in memory only (see
 * apiClient); the refresh token is an httpOnly cookie. The only thing kept in localStorage is
 * a copy of the signed-in profile, so route guards can decide synchronously on first paint.
 * It carries no secrets and is replaced as soon as the session is restored from the cookie.
 */

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode) {
    super(code);
    this.name = "AuthError";
    this.code = code;
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

const BACKEND_CODES: Record<string, AuthErrorCode> = {
  INVALID_CREDENTIALS: "invalid_credentials",
  ACCOUNT_BANNED: "account_banned",
  EMAIL_TAKEN: "email_taken",
  WEAK_PASSWORD: "weak_password",
  RATE_LIMITED: "rate_limited",
  MFA_INVALID: "mfa_invalid",
  TOKEN_INVALID: "reset_token_invalid",
  TOKEN_EXPIRED: "reset_token_invalid",
  TOKEN_REUSED: "reset_token_invalid",
  NETWORK_ERROR: "network",
};

/** Maps a backend error to an AuthError; `fallback` covers codes this flow gives no special meaning. */
function toAuthError(error: unknown, overrides: Record<string, AuthErrorCode> = {}): AuthError {
  if (isAuthError(error)) return error;
  if (isApiError(error)) {
    return new AuthError(overrides[error.code] ?? BACKEND_CODES[error.code] ?? "unknown");
  }
  return new AuthError("unknown");
}

// -------------------------------------------------------------------------------------
// Backend shapes (see velvet-keys-be/app/schemas/auth.py)
// -------------------------------------------------------------------------------------

interface UserOut {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  language: AppLanguage;
  isAdmin: boolean;
}

interface MembershipOut {
  accountId: string;
  accountName: string;
  accountType: "owner" | "conciergerie";
  accountStatus: AccountStatus;
  role: "conciergerie" | "owner" | "tenant";
  isHolder: boolean;
}

interface LoginResponse {
  accessToken: string;
  user: UserOut;
  memberships: MembershipOut[];
  capabilities: Capability[];
}

interface MeResponse {
  user: UserOut;
  memberships: MembershipOut[];
  activeAccount: {
    id: string;
    name: string;
    type: "owner" | "conciergerie";
    status: AccountStatus;
    isHolder: boolean;
  };
  capabilities: Capability[];
}

interface MfaChallengeResponse {
  mfaRequired: true;
  mfaToken: string;
}

// -------------------------------------------------------------------------------------
// Profile cache
// -------------------------------------------------------------------------------------

const SESSION_KEY = "velvet-keys.session";
const ACTIVE_ACCOUNT_KEY = "velvet-keys.active-account";

const ROLES: readonly UserRole[] = ["admin", "conciergerie", "owner", "tenant"];
const STATUSES: readonly AccountStatus[] = ["active", "readonly", "banned"];

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the session still works for this page view.
  }
}

function isValidProfile(value: unknown): value is AuthProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<AuthProfile>;
  return (
    typeof profile.id === "string" &&
    typeof profile.email === "string" &&
    typeof profile.displayName === "string" &&
    typeof profile.accountId === "string" &&
    typeof profile.isAccountHolder === "boolean" &&
    Array.isArray(profile.capabilities) &&
    ROLES.includes(profile.role as UserRole) &&
    STATUSES.includes(profile.accountStatus as AccountStatus)
  );
}

// -------------------------------------------------------------------------------------
// Backend -> frontend profile
// -------------------------------------------------------------------------------------

function pickMembership(memberships: MembershipOut[]): MembershipOut | undefined {
  const preferred = readStorage(ACTIVE_ACCOUNT_KEY);
  return memberships.find((m) => m.accountId === preferred) ?? memberships[0];
}

/**
 * Builds the frontend profile. The role is derived from the real membership and capabilities;
 * a platform admin has no membership at all, so it comes from the `admin` capability.
 */
function buildProfile(
  user: UserOut,
  membership: MembershipOut | undefined,
  capabilities: Capability[],
): AuthProfile {
  const isAdmin = capabilities.includes("admin");
  const role: UserRole = isAdmin && !membership ? "admin" : (membership?.role ?? "admin");
  // An owner inside a Conciergerie's account is managed by it and has no operations tools.
  const managedBy =
    membership?.role === "owner" &&
    membership.accountType === "conciergerie" &&
    !capabilities.includes("operations")
      ? membership.accountId
      : undefined;

  return {
    id: user.id,
    email: user.email,
    displayName: user.name,
    role,
    accountStatus: membership?.accountStatus ?? "active",
    accountId: membership?.accountId ?? "platform",
    isAccountHolder: membership?.isHolder ?? false,
    ...(managedBy ? { conciergerieId: managedBy } : {}),
    ...(membership?.accountType === "conciergerie" && membership.isHolder
      ? { companyName: membership.accountName }
      : {}),
    ...(user.phone ? { phone: user.phone } : {}),
    language: user.language,
    capabilities,
  };
}

/**
 * Takes a login/refresh payload to a ready session: sets the active account for requests,
 * then asks /me for the capabilities of that account (login's list is not account-specific).
 */
async function establishFrom(payload: LoginResponse): Promise<AuthProfile> {
  setAccessToken(payload.accessToken);
  const membership = pickMembership(payload.memberships);
  setActiveAccountId(membership?.accountId ?? null);

  let capabilities = payload.capabilities;
  let user = payload.user;
  let resolved = membership;
  // Platform admins have no membership, and /me needs one, so they use the login payload.
  if (membership) {
    const me = await api.get<MeResponse>("/me");
    capabilities = me.capabilities;
    user = me.user;
    resolved = me.memberships.find((m) => m.accountId === me.activeAccount.id) ?? membership;
    resolved = { ...resolved, accountStatus: me.activeAccount.status };
  }
  const profile = buildProfile(user, resolved, capabilities);
  authService.writeSession({ profile });
  writeStorage(ACTIVE_ACCOUNT_KEY, resolved?.accountId ?? null);
  return profile;
}

async function refreshProfile(): Promise<AuthProfile> {
  const stored = authService.readSession()?.profile;
  const memberships: MembershipOut[] = [];
  // /me is the one call that returns the user, memberships and active account together.
  if (stored && stored.accountId !== "platform") {
    const me = await api.get<MeResponse>("/me");
    memberships.push(...me.memberships);
    const membership = me.memberships.find((m) => m.accountId === me.activeAccount.id);
    const profile = buildProfile(
      me.user,
      membership ? { ...membership, accountStatus: me.activeAccount.status } : undefined,
      me.capabilities,
    );
    authService.writeSession({ profile });
    return profile;
  }
  if (!stored) throw new AuthError("unknown");
  return stored;
}

// -------------------------------------------------------------------------------------
// Service
// -------------------------------------------------------------------------------------

let restoring: Promise<AuthProfile | null> | null = null;

export const authService = {
  /** Synchronous read of the cached profile, for route guards. */
  readSession(): AuthSession | null {
    const raw = readStorage(SESSION_KEY);
    if (!raw) return null;
    try {
      const stored = JSON.parse(raw) as Partial<AuthSession>;
      return isValidProfile(stored.profile) ? { profile: stored.profile } : null;
    } catch {
      return null;
    }
  },

  writeSession(session: AuthSession | null) {
    writeStorage(SESSION_KEY, session ? JSON.stringify(session) : null);
  },

  /**
   * Brings the session back from the refresh cookie on app load; null when there is none.
   * Overlapping calls (React dev double-mount) share one run.
   */
  restore(): Promise<AuthProfile | null> {
    restoring ??= this.restoreOnce().finally(() => {
      restoring = null;
    });
    return restoring;
  },

  async restoreOnce(): Promise<AuthProfile | null> {
    const payload = await restoreSession<LoginResponse>();
    if (!payload) {
      // This call is sent on app load before any cookie may exist. If a real sign-in completed
      // while it was in flight, there is now a live access token; this stale "no session" answer
      // must not erase the session that sign-in just established.
      if (getAccessToken() !== null) return null;
      this.writeSession(null);
      setActiveAccountId(null);
      return null;
    }
    try {
      return await establishFrom(payload);
    } catch {
      this.writeSession(null);
      setAccessToken(null);
      setActiveAccountId(null);
      return null;
    }
  },

  async signIn({ email, password }: SignInInput): Promise<SignInResult> {
    try {
      const result = await api.post<LoginResponse | MfaChallengeResponse>("/auth/login", {
        email: email.trim(),
        password,
      });
      if ("mfaRequired" in result) return { status: "mfa", mfaToken: result.mfaToken };
      return { status: "signed-in", profile: await establishFrom(result) };
    } catch (error) {
      throw toAuthError(error);
    }
  },

  async verifyMfa({ mfaToken, code }: MfaVerifyInput): Promise<AuthProfile> {
    try {
      const result = await api.post<LoginResponse>("/auth/mfa/verify", { mfaToken, code });
      return await establishFrom(result);
    } catch (error) {
      throw toAuthError(error);
    }
  },

  async signUp(input: SignUpInput): Promise<AuthProfile> {
    try {
      const result = await api.post<LoginResponse>("/auth/signup", {
        accountType: input.role,
        name: input.fullName.trim(),
        ...(input.role === "conciergerie" && input.companyName?.trim()
          ? { companyName: input.companyName.trim() }
          : {}),
        email: input.email.trim(),
        phone: input.phone.trim(),
        password: input.password,
        language: input.language,
        acceptTerms: input.acceptTerms,
      });
      return await establishFrom(result);
    } catch (error) {
      throw toAuthError(error);
    }
  },

  /** Ends the session on the server (revokes the refresh token) and forgets it locally. */
  async signOut(): Promise<void> {
    try {
      if (getAccessToken()) await api.post("/auth/logout");
    } catch {
      // The local session is cleared either way.
    }
    setAccessToken(null);
    setActiveAccountId(null);
    this.writeSession(null);
    writeStorage(ACTIVE_ACCOUNT_KEY, null);
  },

  /** Always resolves, so the response never reveals whether an email has an account. */
  async requestPasswordReset(email: string): Promise<PasswordResetReceipt> {
    const normalized = email.trim().toLowerCase();
    try {
      await api.post("/auth/forgot-password", { email: normalized });
    } catch (error) {
      if (isApiError(error) && error.code === "RATE_LIMITED") throw toAuthError(error);
      // Any other failure is hidden on purpose.
    }
    return { email: normalized };
  },

  async resetPassword({ token, password }: ResetPasswordInput): Promise<void> {
    try {
      await api.post("/auth/reset-password", { token, password });
    } catch (error) {
      throw toAuthError(error);
    }
  },

  async verifyEmail(token: string): Promise<void> {
    try {
      await api.post("/auth/verify-email", { token });
    } catch (error) {
      throw toAuthError(error);
    }
  },

  async getInvitation(token: string): Promise<Invitation> {
    try {
      const preview = await api.get<Omit<Invitation, "token">>(`/invites/${token}`);
      return { token, ...preview };
    } catch (error) {
      throw toAuthError(error, {
        NOT_FOUND: "invitation_not_found",
        TOKEN_INVALID: "invitation_not_found",
        TOKEN_EXPIRED: "invitation_expired",
        INVITE_ALREADY_USED: "invitation_accepted",
      });
    }
  },

  async acceptInvitation({
    token,
    name,
    password,
    language,
  }: AcceptInvitationInput): Promise<AuthProfile> {
    try {
      const result = await api.post<LoginResponse>(`/invites/${token}/accept`, {
        name: name.trim(),
        password,
        language,
      });
      return await establishFrom(result);
    } catch (error) {
      throw toAuthError(error, {
        NOT_FOUND: "invitation_not_found",
        TOKEN_INVALID: "invitation_not_found",
        TOKEN_EXPIRED: "invitation_expired",
        INVITE_ALREADY_USED: "invitation_accepted",
      });
    }
  },

  async saveLanguage(language: AppLanguage): Promise<void> {
    await api.patch("/me", { language });
  },

  async updateProfile(update: ProfileUpdate): Promise<AuthProfile> {
    await api.patch("/me", { name: update.displayName.trim(), phone: update.phone.trim() });
    return refreshProfile();
  },

  async changePassword(input: ChangePasswordInput): Promise<void> {
    try {
      await api.post("/me/password", {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      });
    } catch (error) {
      throw toAuthError(error);
    }
  },
};
