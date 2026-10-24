import { useCallback, useEffect, useState } from "react";
import { LogoDrawLoader } from "@/components/motion/logo-draw-loader";
import { SPLASH_ATTRIBUTE } from "@/lib/pwa";

/**
 * The splash screen of the installed app: black, with the key drawing itself in gold. It shows
 * once per launch from the home screen and never in a browser tab. A script in the page head
 * (see __root.tsx) decides at the very first paint, so the page behind never flashes.
 */
export function PwaSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (document.documentElement.hasAttribute(SPLASH_ATTRIBUTE)) setShow(true);
  }, []);

  const finish = useCallback(() => {
    setShow(false);
    document.documentElement.removeAttribute(SPLASH_ATTRIBUTE);
  }, []);

  return show ? <LogoDrawLoader onComplete={finish} /> : null;
}
