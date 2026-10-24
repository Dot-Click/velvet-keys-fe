import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const UPDATE_TOAST_ID = "pwa-update";
/** How often an open app asks the server whether a new version exists. */
const UPDATE_CHECK_MS = 60 * 60 * 1000;

/**
 * Registers the service worker (production only) and, when a new version has downloaded, shows a
 * toast with a Refresh button. The new version waits until the person taps it, so a form being
 * filled in is never reloaded by surprise.
 */
export function PwaLifecycle() {
  const { t } = useTranslation("common");
  // The toast is built from an effect that runs once, so it reads the latest translator here
  const translate = useRef(t);
  translate.current = t;

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

    let cancelled = false;
    let stopChecking = () => {};

    void import("workbox-window").then(({ Workbox }) => {
      if (cancelled) return;
      const workbox = new Workbox("/sw.js");

      workbox.addEventListener("waiting", () => {
        toast(translate.current("pwa.update.message"), {
          id: UPDATE_TOAST_ID,
          duration: Infinity,
          action: {
            label: translate.current("pwa.update.refresh"),
            onClick: () => {
              // Reload once the new worker has taken over
              workbox.addEventListener("controlling", () => window.location.reload());
              workbox.messageSkipWaiting();
            },
          },
        });
      });

      void workbox.register().then((registration) => {
        if (!registration || cancelled) return;
        const check = () => void registration.update().catch(() => undefined);
        const timer = window.setInterval(check, UPDATE_CHECK_MS);
        const onVisible = () => {
          if (document.visibilityState === "visible") check();
        };
        document.addEventListener("visibilitychange", onVisible);
        stopChecking = () => {
          window.clearInterval(timer);
          document.removeEventListener("visibilitychange", onVisible);
        };
      });
    });

    return () => {
      cancelled = true;
      stopChecking();
    };
  }, []);

  return null;
}
