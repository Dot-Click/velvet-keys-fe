import * as React from "react";
import { casablancaClock } from "@/lib/clock";
import { formatCasablancaTime } from "@/lib/currency";

/**
 * Casablanca wall-clock time, refreshed on every minute boundary: `clock` is "HH:mm" in Latin
 * digits for comparisons, `label` is formatted for the reader's language.
 */
export function useMinuteClock() {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const tick = () => setNow(new Date());
    // Line up with the next minute, then tick every minute
    const timeout = setTimeout(
      () => {
        tick();
        interval = setInterval(tick, 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);
  return { clock: casablancaClock(now), label: formatCasablancaTime(now) };
}
