import { useCallback, useEffect, useState } from "react";
import {
  INSTALL_PROMPT_COOLDOWN_MS,
  INSTALL_PROMPT_MIN_VISITS,
  isIosDevice,
  isStandalone,
  registerVisit,
  writePwaState,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa";

export type InstallMode = "native" | "ios";

/**
 * Decides whether to offer the install prompt, and how. It is offered from the second visit on,
 * never inside the installed app, and not for two weeks after "Not now".
 *  - native: the browser can install the app itself (Chrome, Edge, Android)
 *  - ios: the person has to use Share → Add to Home Screen
 */
export function useInstallPrompt() {
  const [eligible, setEligible] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;

    const state = registerVisit();
    const cooledDown =
      state.dismissedAt === null || Date.now() - state.dismissedAt > INSTALL_PROMPT_COOLDOWN_MS;
    setEligible(state.visits >= INSTALL_PROMPT_MIN_VISITS && !state.installed && cooledDown);
    setIos(isIosDevice());

    const onBeforeInstall = (event: Event) => {
      // Keeps the browser's own mini bar away so our sheet is the only prompt
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      writePwaState({ installed: true });
      setDeferred(null);
      setEligible(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    writePwaState({ dismissedAt: Date.now() });
    setEligible(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // The browser only lets an event be used once
    setDeferred(null);
    if (outcome === "accepted") setEligible(false);
    else dismiss();
  }, [deferred, dismiss]);

  const mode: InstallMode | null = !eligible ? null : deferred ? "native" : ios ? "ios" : null;
  return { mode, install, dismiss };
}
