import * as React from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { formatMADNumber } from "@/lib/currency";

interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.2,
  className,
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const prefersReducedMotion = useReducedMotion();

  const formatNumber = React.useCallback(
    (n: number) => {
      return (
        prefix +
        // Grouping and decimals follow the reader's language
        formatMADNumber(n, decimals) +
        suffix
      );
    },
    [prefix, suffix, decimals],
  );

  React.useEffect(() => {
    if (!ref.current) return;

    if (prefersReducedMotion || !isInView) {
      ref.current.textContent = formatNumber(value);
      return;
    }

    const controls = animate(0, value, {
      duration,
      ease: [0.25, 1, 0.5, 1], // ease-out luxury
      onUpdate(latest) {
        if (ref.current) {
          ref.current.textContent = formatNumber(latest);
        }
      },
    });

    return () => controls.stop();
  }, [isInView, value, duration, prefersReducedMotion, formatNumber]);

  return (
    <span ref={ref} className={className}>
      {formatNumber(prefersReducedMotion ? value : 0)}
    </span>
  );
}
