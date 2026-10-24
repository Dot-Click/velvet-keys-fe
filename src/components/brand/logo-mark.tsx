import * as React from "react";
import { cn } from "@/lib/utils";

export interface LogoMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number | "sm" | "md" | "lg" | "xl";
  className?: string;
  glow?: boolean;
}

const SIZE_MAP = {
  sm: 24,
  md: 36,
  lg: 52,
  xl: 72,
};

export function LogoMark({ size = "md", className, glow = true, ...props }: LogoMarkProps) {
  const pixelSize = typeof size === "number" ? size : (SIZE_MAP[size] ?? 36);
  const id = React.useId().replace(/:/g, "");
  const goldId = `goldGradient-${id}`;
  const goldLightId = `goldLightGradient-${id}`;
  const diamondId = `diamondGlow-${id}`;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 select-none",
        className,
      )}
      style={{ width: pixelSize, height: (pixelSize * 120) / 80 }}
    >
      {/* Ambient warm gold underglow */}
      {glow && (
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-b from-[#D4AF37]/30 to-transparent blur-[6px] -z-10 pointer-events-none"
          aria-hidden="true"
        />
      )}

      <svg
        width={pixelSize}
        height={(pixelSize * 120) / 80}
        viewBox="0 0 80 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-full overflow-visible drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
        aria-hidden="true"
        {...props}
      >
        <defs>
          {/* Subtle metallic gold gradient. User-space units, because a vertical stroke such as
              the key shaft has a zero-width bounding box and would not render with percentages. */}
          <linearGradient
            id={goldId}
            gradientUnits="userSpaceOnUse"
            x1="12"
            y1="0"
            x2="68"
            y2="120"
          >
            <stop offset="0%" stopColor="#FFF2B2" />
            <stop offset="22%" stopColor="#E5C158" />
            <stop offset="55%" stopColor="#D4AF37" />
            <stop offset="85%" stopColor="#9E781D" />
            <stop offset="100%" stopColor="#6C4E08" />
          </linearGradient>

          {/* Lighter gold for fine inner lines and diamond */}
          <linearGradient
            id={goldLightId}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="80"
            y2="120"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#FFF2B2" />
            <stop offset="70%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#9E781D" />
          </linearGradient>

          <radialGradient id={diamondId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#FFF6CC" />
            <stop offset="100%" stopColor="#D4AF37" />
          </radialGradient>
        </defs>

        {/* --- KEY HEAD (Bow) --- */}
        {/* Outer Ring */}
        <circle cx="40" cy="28" r="19" stroke={`url(#${goldId})`} strokeWidth="1.6" />

        {/* Inner Ring */}
        <circle
          cx="40"
          cy="28"
          r="15.5"
          stroke={`url(#${goldId})`}
          strokeWidth="0.9"
          strokeOpacity="0.85"
        />

        {/* --- VK MONOGRAM --- */}
        {/* V: Left leg (31, 21.5) -> (37.5, 34.5), Right leg (37.5, 34.5) -> (43.5, 28) */}
        <path
          d="M 31 21.5 L 37.5 34.5 L 43.5 28"
          stroke={`url(#${goldId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* K: Vertical stem (43.5, 21.5) -> (43.5, 34.5) */}
        <path
          d="M 43.5 21.5 V 34.5"
          stroke={`url(#${goldId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* K: Upper diagonal (43.5, 28) -> (49.5, 21.5) */}
        <path
          d="M 43.5 28 L 49.5 21.5"
          stroke={`url(#${goldId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* K: Lower diagonal (43.5, 28) -> (49.5, 34.5) */}
        <path
          d="M 43.5 28 L 49.5 34.5"
          stroke={`url(#${goldId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Diamond at meeting point of V & K (43.5, 28) */}
        <polygon
          points="43.5,25.6 45.8,28 43.5,30.4 41.2,28"
          fill={`url(#${diamondId})`}
          stroke={`url(#${goldLightId})`}
          strokeWidth="0.4"
        />
        {/* Diamond center brilliant highlight */}
        <circle cx="43.5" cy="28" r="0.6" fill="#FFFFFF" />

        {/* --- KEY COLLAR (Decorative band below bow) --- */}
        <path
          d="M 36.5 48 H 43.5"
          stroke={`url(#${goldId})`}
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* --- KEY SHAFT --- */}
        <line
          x1="40"
          y1="48"
          x2="40"
          y2="105"
          stroke={`url(#${goldId})`}
          strokeWidth="2.1"
          strokeLinecap="round"
        />

        {/* --- KEY BIT / TEETH (2 short teeth at the bottom) --- */}
        {/* Upper tooth at y = 92 */}
        <path
          d="M 40 92 H 47.5"
          stroke={`url(#${goldId})`}
          strokeWidth="2.1"
          strokeLinecap="round"
        />

        {/* Lower tooth at y = 99 */}
        <path d="M 40 99 H 49" stroke={`url(#${goldId})`} strokeWidth="2.1" strokeLinecap="round" />

        {/* Shaft Bottom Tip */}
        <circle cx="40" cy="105.5" r="1.1" fill={`url(#${goldId})`} />
      </svg>
    </div>
  );
}
