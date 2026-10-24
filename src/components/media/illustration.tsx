import * as React from "react";
import { useReducedMotion } from "framer-motion";
import {
  Banknote,
  BedDouble,
  Building2,
  BrushCleaning,
  CalendarDays,
  Coins,
  CreditCard,
  FilePen,
  Hammer,
  LogIn,
  LogOut,
  Mail,
  Percent,
  Receipt,
  RefreshCw,
  Sparkles,
  Sunrise,
  Unplug,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { illustrations, type IllustrationName } from "@/assets/manifest";
import { LUXURY_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Raw SVG text of the delivered illustrations, loaded on demand. */
const SVG_SOURCES = import.meta.glob<string>("/public/media/illustrations/*.svg", {
  query: "?raw",
  import: "default",
});

/** Shown until an illustration is delivered. */
const FALLBACK_ICONS: Record<IllustrationName, LucideIcon> = {
  "empty-today": Sunrise,
  "empty-bookings": BedDouble,
  "empty-calendar": CalendarDays,
  "empty-leases": FilePen,
  "empty-rent": Receipt,
  "empty-maintenance": Wrench,
  "empty-expenses": Wallet,
  "empty-owners": Users,
  "empty-channels": Unplug,
  "empty-properties": Building2,
  "empty-commission": Percent,
  "empty-billing": CreditCard,
  "kpi-arrivals": LogIn,
  "kpi-departures": LogOut,
  "kpi-housekeeping": Sparkles,
  "kpi-repairs": Hammer,
  "kpi-rent": Banknote,
  "channels-sync-hero": RefreshCw,
  "invite-envelope": Mail,
  "chip-broom": BrushCleaning,
  "chip-coin": Coins,
  "chip-wrench": Wrench,
};

const STROKE_SELECTOR = "path, line, polyline, polygon, circle, ellipse, rect";
const DRAW_MS = 1200;
const STAGGER_MS = 60;

/** Manifest URL ("/media/illustrations/x.svg") → loader for its file under /public. */
function loaderFor(name: IllustrationName) {
  const url = illustrations[name];
  return url ? SVG_SOURCES[`/public${url}`] : undefined;
}

interface IllustrationProps {
  name: IllustrationName;
  /** Width and height in pixels */
  size?: number;
  /** Draw the strokes in when the illustration scrolls into view */
  animate?: boolean;
  className?: string;
}

/**
 * Gold line illustration from the media manifest, inlined so its strokes can draw in. Until the
 * file is delivered it renders the matching lucide icon in a thin gold circle.
 */
export function Illustration({ name, size = 96, animate = false, className }: IllustrationProps) {
  const load = loaderFor(name);
  const [markup, setMarkup] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setMarkup(null);
    setFailed(false);
    if (!load) return;
    let active = true;
    load().then(
      (text) => active && setMarkup(text),
      () => active && setFailed(true),
    );
    return () => {
      active = false;
    };
  }, [load]);

  const box = { width: size, height: size };

  if (!load || failed) {
    const Icon = FALLBACK_ICONS[name];
    return (
      <span
        aria-hidden="true"
        style={box}
        className={cn(
          "grid shrink-0 place-items-center rounded-full border border-primary/40 text-primary",
          className,
        )}
      >
        <Icon size={Math.min(48, Math.round(size / 2))} strokeWidth={1.25} />
      </span>
    );
  }

  return markup ? (
    <InlineSvg markup={markup} animate={animate} style={box} className={className} />
  ) : (
    // Holds the space while the file loads
    <span aria-hidden="true" style={box} className={cn("block shrink-0", className)} />
  );
}

function InlineSvg({
  markup,
  animate,
  style,
  className,
}: {
  markup: string;
  animate: boolean;
  style: React.CSSProperties;
  className: string | undefined;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  React.useLayoutEffect(() => {
    const root = ref.current;
    const svg = root?.querySelector("svg");
    if (!root || !svg) return;
    // The frame sets the size
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    const strokes = Array.from(svg.querySelectorAll<SVGGeometryElement>(STROKE_SELECTOR));
    if (!animate || reduceMotion) return;

    const ease = `cubic-bezier(${LUXURY_EASE.join(",")})`;
    strokes.forEach((element) => {
      if (!element.hasAttribute("pathLength")) element.setAttribute("pathLength", "1");
      element.style.strokeDasharray = "1";
      element.style.strokeDashoffset = "1";
    });

    const draw = () =>
      strokes.forEach((element, index) => {
        element.style.transition = `stroke-dashoffset ${DRAW_MS}ms ${ease} ${index * STAGGER_MS}ms`;
        element.style.strokeDashoffset = "0";
      });

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          draw();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(root);
    return () => {
      observer.disconnect();
      // Leave the strokes drawn if the next run skips the animation (e.g. reduced motion turns on)
      strokes.forEach((element) => {
        element.style.removeProperty("stroke-dasharray");
        element.style.removeProperty("stroke-dashoffset");
        element.style.removeProperty("transition");
      });
    };
  }, [markup, animate, reduceMotion]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      style={style}
      className={cn(
        "block shrink-0 text-primary [&_svg]:size-full [&_svg]:overflow-visible [&_svg_*]:fill-none! [&_svg_*]:stroke-current!",
        className,
      )}
      // First-party line art from /public/media/illustrations, bundled at build time
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
