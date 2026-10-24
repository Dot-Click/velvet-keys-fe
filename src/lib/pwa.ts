/** Helpers for the installable app: how it is running, and what the install prompt remembers. */

/** Set on <html> by a script in the page head while the installed app's splash screen is due. */
export const SPLASH_ATTRIBUTE = "data-pwa-splash";

const STORAGE_KEY = "velvet-keys.pwa";
/** Marks that this browser session has already been counted as a visit. */
const VISIT_SESSION_KEY = "velvet-keys.pwa.visit-counted";

/** The install prompt appears from the second visit on. */
export const INSTALL_PROMPT_MIN_VISITS = 2;
/** After "Not now" the prompt stays away for two weeks. */
export const INSTALL_PROMPT_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

export interface PwaState {
  /** Browser sessions in which the app was opened */
  visits: number;
  /** When the person last chose "Not now" */
  dismissedAt: number | null;
  /** The browser reported that the app was installed */
  installed: boolean;
}

const DEFAULT_STATE: PwaState = { visits: 0, dismissedAt: null, installed: false };

export function readPwaState(): PwaState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PwaState>;
    return {
      visits: typeof parsed.visits === "number" ? parsed.visits : 0,
      dismissedAt: typeof parsed.dismissedAt === "number" ? parsed.dismissedAt : null,
      installed: parsed.installed === true,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function writePwaState(patch: Partial<PwaState>): PwaState {
  const next = { ...readPwaState(), ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or a full disk: the prompt just forgets
  }
  return next;
}

/** Counts this browser session as a visit, once, and returns the state including it. */
export function registerVisit(): PwaState {
  try {
    if (window.sessionStorage.getItem(VISIT_SESSION_KEY)) return readPwaState();
    window.sessionStorage.setItem(VISIT_SESSION_KEY, "1");
  } catch {
    return readPwaState();
  }
  return writePwaState({ visits: readPwaState().visits + 1 });
}

/** True when the app runs from the home screen rather than in a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

/** iPhone, iPad and iPod, where installing means Share → Add to Home Screen. */
export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  // iPadOS 13 and later report themselves as a Mac, with a touch screen
  const ipadOnMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || ipadOnMac;
}

/** Browsers announce the install prompt with this event; it is not in the DOM typings yet. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Thrown by a write that was attempted without a connection. */
export class OfflineError extends Error {
  constructor() {
    super("Writes are unavailable while offline");
    this.name = "OfflineError";
  }
}

/**
 * Guards the shared write hooks. The add and edit controls are already disabled offline (see
 * ReadOnlyGuard); this stops anything that slips past from looking saved when it was not.
 */
export function assertOnline() {
  if (typeof navigator !== "undefined" && !navigator.onLine) throw new OfflineError();
}
