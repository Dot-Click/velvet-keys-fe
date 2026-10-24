import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Context,
  type ReactNode,
} from "react";
import { setSessionLostHandler } from "@/lib/apiClient";
import i18n, { setAppLanguage } from "@/lib/i18n";
import { authService } from "@/services/auth-service";
import type {
  AcceptInvitationInput,
  AppLanguage,
  AuthProfile,
  AuthSession,
  ChangePasswordInput,
  Invitation,
  MfaVerifyInput,
  PasswordResetReceipt,
  ProfileUpdate,
  ResetPasswordInput,
  SignInInput,
  SignInResult,
  SignUpInput,
} from "@/types/auth";

export type { AuthProfile, AuthSession, UserRole } from "@/types/auth";

type AuthContextValue = {
  session: AuthSession | null;
  /** False until the session has been restored from the refresh cookie (or found missing). */
  isReady: boolean;
  signIn: (input: SignInInput) => Promise<SignInResult>;
  verifyMfa: (input: MfaVerifyInput) => Promise<AuthProfile>;
  signUp: (input: SignUpInput) => Promise<AuthProfile>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<PasswordResetReceipt>;
  resetPassword: (input: ResetPasswordInput) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  getInvitation: (token: string) => Promise<Invitation>;
  acceptInvitation: (input: AcceptInvitationInput) => Promise<AuthProfile>;
  updateLanguage: (lang: AppLanguage) => void;
  updateProfile: (update: ProfileUpdate) => Promise<AuthProfile>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
};

const authGlobal = globalThis as typeof globalThis & {
  __velvetKeysAuthContext?: Context<AuthContextValue | null>;
};
const AuthContext =
  authGlobal.__velvetKeysAuthContext ?? createContext<AuthContextValue | null>(null);
authGlobal.__velvetKeysAuthContext = AuthContext;

/** Synchronous read of the cached profile, for route guards. */
export function getStoredSession(): AuthSession | null {
  return authService.readSession();
}

export function saveSession(session: AuthSession | null) {
  authService.writeSession(session);
}

/**
 * A language change that has not reached the backend yet (offline, or the request failed) is kept
 * with the user it belongs to, so the next sign-in applies and re-sends it instead of falling back
 * to the older language stored on the profile.
 */
const UNSYNCED_LANG_KEY = "i18n_lang_unsynced";

function readUnsyncedLanguage(userId: string): AppLanguage | null {
  try {
    const raw = window.localStorage.getItem(UNSYNCED_LANG_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { userId?: string; language?: string };
    if (saved.userId !== userId) return null;
    return saved.language === "en" || saved.language === "fr" || saved.language === "ar"
      ? saved.language
      : null;
  } catch {
    return null;
  }
}

function writeUnsyncedLanguage(value: { userId: string; language: AppLanguage } | null) {
  try {
    if (value) window.localStorage.setItem(UNSYNCED_LANG_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(UNSYNCED_LANG_KEY);
  } catch {
    // Storage is not available
  }
}

function sameIdentity(a: AuthProfile | undefined, b: AuthProfile | undefined) {
  return a?.id === b?.id && a?.accountId === b?.accountId && a?.role === b?.role;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  // The identity (user, account, role) the in-memory query cache belongs to.
  const identityRef = useRef<AuthProfile | undefined>(undefined);
  // A language picked on a signed-out screen (login page): the person's latest explicit choice.
  const signedOutChoiceRef = useRef<AppLanguage | null>(null);

  /** Drops in-flight and cached queries so one identity's data never serves another. */
  const resetQueryCache = useCallback(() => {
    void queryClient.cancelQueries();
    queryClient.clear();
  }, [queryClient]);

  const clearSession = useCallback(() => {
    saveSession(null);
    setSession(null);
    identityRef.current = undefined;
    signedOutChoiceRef.current = null;
    // Nothing the previous person loaded may stay in memory for the next one.
    resetQueryCache();
  }, [resetQueryCache]);

  /**
   * Applies the language a signed-in person should see: a choice not yet saved to the backend, then
   * one made on the login screen, then the one stored on their profile. Returns the profile with it.
   */
  const resolveLanguage = useCallback((profile: AuthProfile, fromSignIn: boolean): AuthProfile => {
    const unsynced = readUnsyncedLanguage(profile.id);
    const chosen = unsynced ?? (fromSignIn ? signedOutChoiceRef.current : null);
    signedOutChoiceRef.current = null;
    const language = chosen ?? profile.language;
    if (language && language !== i18n.language) void setAppLanguage(language);
    if (chosen && chosen !== profile.language) {
      writeUnsyncedLanguage({ userId: profile.id, language: chosen });
      void authService
        .saveLanguage(chosen)
        .then(() => writeUnsyncedLanguage(null))
        .catch(() => {
          // Kept in storage; retried on the next sign-in or app start.
        });
      return { ...profile, language: chosen };
    }
    if (unsynced) writeUnsyncedLanguage(null);
    return language ? { ...profile, language } : profile;
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Show the cached profile at once so guards and layouts do not flash, then confirm it
    // against the refresh cookie.
    const cached = getStoredSession();
    if (cached) {
      identityRef.current = cached.profile;
      setSession(cached);
    }

    authService
      .restore()
      .then((profile) => {
        if (cancelled) return;
        if (profile) {
          const resolved = resolveLanguage(profile, false);
          // The restored account is not the one the cache was filled for (e.g. a cached profile of
          // someone else): start from an empty cache.
          if (identityRef.current && !sameIdentity(identityRef.current, resolved)) resetQueryCache();
          identityRef.current = resolved;
          saveSession({ profile: resolved });
          setSession({ profile: resolved });
        } else {
          setSession(null);
        }
      })
      .catch(() => {
        // Server unreachable: keep the cached session so the app still opens offline.
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [resolveLanguage, resetQueryCache]);

  // A refresh that fails mid-session means the session is over: back to the login screen.
  useEffect(() => {
    setSessionLostHandler(() => {
      clearSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    });
    return () => setSessionLostHandler(null);
  }, [clearSession]);

  const establish = useCallback(
    (profile: AuthProfile) => {
      // Signing in as another person (or role/account) must not reuse what the last one loaded.
      if (!sameIdentity(identityRef.current, profile)) resetQueryCache();
      const resolved = resolveLanguage(profile, true);
      identityRef.current = resolved;
      saveSession({ profile: resolved });
      setSession({ profile: resolved });
      return resolved;
    },
    [resolveLanguage, resetQueryCache],
  );

  const signIn = useCallback(
    async (input: SignInInput): Promise<SignInResult> => {
      const result = await authService.signIn(input);
      if (result.status === "signed-in") establish(result.profile);
      return result;
    },
    [establish],
  );

  const verifyMfa = useCallback(
    async (input: MfaVerifyInput) => establish(await authService.verifyMfa(input)),
    [establish],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => establish(await authService.signUp(input)),
    [establish],
  );

  const acceptInvitation = useCallback(
    async (input: AcceptInvitationInput) => establish(await authService.acceptInvitation(input)),
    [establish],
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    clearSession();
  }, [clearSession]);

  const updateLanguage = useCallback(
    (language: AppLanguage) => {
      if (!session) {
        // Picked on the login screen: applied (and saved) once the person signs in.
        signedOutChoiceRef.current = language;
        return;
      }
      const userId = session.profile.id;
      const profile = { ...session.profile, language };
      identityRef.current = profile;
      setSession({ profile });
      saveSession({ profile });
      writeUnsyncedLanguage({ userId, language });
      void authService
        .saveLanguage(language)
        .then(() => {
          if (readUnsyncedLanguage(userId) === language) writeUnsyncedLanguage(null);
        })
        .catch(() => {
          // The choice still applies on this device and is re-sent on the next sign-in.
        });
    },
    [session],
  );

  const updateProfile = useCallback(
    async (update: ProfileUpdate) => {
      if (!session) throw new Error("Not signed in");
      return establish(await authService.updateProfile(update));
    },
    [session, establish],
  );

  const changePassword = useCallback(
    async (input: ChangePasswordInput) => {
      if (!session) throw new Error("Not signed in");
      await authService.changePassword(input);
    },
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isReady,
      signIn,
      verifyMfa,
      signUp,
      signOut,
      requestPasswordReset: authService.requestPasswordReset,
      resetPassword: authService.resetPassword,
      verifyEmail: authService.verifyEmail,
      getInvitation: authService.getInvitation,
      acceptInvitation,
      updateLanguage,
      updateProfile,
      changePassword,
    }),
    [
      session,
      isReady,
      signIn,
      verifyMfa,
      signUp,
      signOut,
      acceptInvitation,
      updateLanguage,
      updateProfile,
      changePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
