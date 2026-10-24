import * as React from "react";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

export interface LogoHorizontalProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  subtitle?: string;
}

const SCALE_MAP = {
  sm: {
    markSize: 22,
    wordmarkSize: "text-xs tracking-[0.22em]",
    subSize: "text-[0.58rem] tracking-[0.24em]",
    gap: "gap-2.5",
  },
  md: {
    markSize: 30,
    wordmarkSize: "text-sm sm:text-base tracking-[0.25em]",
    subSize: "text-[0.62rem] tracking-[0.26em]",
    gap: "gap-3",
  },
  lg: {
    markSize: 38,
    wordmarkSize: "text-lg tracking-[0.25em]",
    subSize: "text-[0.68rem] tracking-[0.28em]",
    gap: "gap-3.5",
  },
};

export function LogoHorizontal({ size = "md", className, subtitle }: LogoHorizontalProps) {
  const conf = SCALE_MAP[size];

  return (
    <div className={cn("inline-flex items-center select-none", conf.gap, className)}>
      {/* Mark on the left */}
      <LogoMark size={conf.markSize} />

      {/* Wordmark on the right, no tagline */}
      <div className="flex flex-col min-w-0">
        <span
          className={cn(
            "font-['Jost',sans-serif] font-light uppercase text-[#F8F9FA] leading-tight truncate",
            conf.wordmarkSize,
          )}
          style={{ letterSpacing: "0.25em" }}
        >
          VELVET KEYS
        </span>
        {subtitle && (
          <span
            className={cn(
              "font-sans uppercase text-[#D4AF37] font-medium leading-tight truncate mt-0.5",
              conf.subSize,
            )}
            style={{ letterSpacing: "0.22em" }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
