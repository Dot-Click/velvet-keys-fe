import * as React from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/**
 * A number that counts up when it scrolls into view, written with the page's own formatter so
 * dirhams and digits follow the active language.
 */
export function AnimatedFigure({
  value,
  format,
  duration = 1.2,
  className,
}: {
  value: number;
  format: (value: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const reduced = useReducedMotion();

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced || !inView) {
      node.textContent = format(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: [0.25, 1, 0.5, 1],
      onUpdate(latest) {
        node.textContent = format(latest);
      },
    });
    return () => controls.stop();
  }, [inView, value, duration, reduced, format]);

  return (
    <span ref={ref} className={className}>
      {format(reduced ? value : 0)}
    </span>
  );
}
