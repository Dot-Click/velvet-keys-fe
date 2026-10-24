import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

export interface LogoFullProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  align?: "center" | "start";
}

const SCALE_MAP = {
  sm: {
    markSize: 28,
    titleSize: "text-base tracking-[0.25em]",
    taglineSize: "text-[0.55rem] tracking-[0.3em]",
    lineW: "w-4",
    gap: "gap-2.5",
  },
  md: {
    markSize: 42,
    titleSize: "text-xl tracking-[0.25em]",
    taglineSize: "text-[0.62rem] tracking-[0.3em]",
    lineW: "w-6",
    gap: "gap-3.5",
  },
  lg: {
    markSize: 58,
    titleSize: "text-2xl sm:text-3xl tracking-[0.25em]",
    taglineSize: "text-[0.7rem] tracking-[0.32em]",
    lineW: "w-8 sm:w-10",
    gap: "gap-4",
  },
  xl: {
    markSize: 76,
    titleSize: "text-3xl sm:text-4xl tracking-[0.25em]",
    taglineSize: "text-xs tracking-[0.35em]",
    lineW: "w-10 sm:w-14",
    gap: "gap-5",
  },
};

export function LogoFull({ size = "md", className, align = "center" }: LogoFullProps) {
  const { t, i18n } = useTranslation("common");
  const conf = SCALE_MAP[size];

  return (
    <div
      className={cn(
        "inline-flex flex-col select-none",
        align === "center" ? "items-center text-center" : "items-start text-start",
        conf.gap,
        className,
      )}
    >
      {/* Slim Key Mark */}
      <LogoMark size={conf.markSize} />

      {/* Stacked Wordmark and Tagline */}
      <div className={cn("flex flex-col", align === "center" ? "items-center" : "items-start")}>
        {/* Wordmark: VELVET KEYS in Jost 300, uppercase, letter-spacing 0.25em, Diamond White #F8F9FA */}
        <h1
          className={cn(
            "font-['Jost',sans-serif] font-light uppercase text-[#F8F9FA] leading-none m-0",
            conf.titleSize,
          )}
          style={{ letterSpacing: "0.25em" }}
        >
          VELVET KEYS
        </h1>

        {/* Tagline: ABSOLUTE CONTROL in Jost 400, small uppercase, gold, letter-spacing 0.3em, flanked by thin gold lines */}
        <div className="flex items-center gap-2.5 mt-2">
          <div
            className={cn("h-[1px] bg-gradient-to-r from-transparent to-[#D4AF37]/80", conf.lineW)}
            aria-hidden="true"
          />
          <span
            className={cn(
              "font-['Jost',sans-serif] font-normal uppercase text-[#D4AF37] leading-none whitespace-nowrap",
              conf.taglineSize,
            )}
            // Arabic letters join, so spacing them out would break the words apart
            style={{ letterSpacing: i18n.dir() === "rtl" ? "normal" : "0.3em" }}
          >
            {t("brand.tagline")}
          </span>
          <div
            className={cn("h-[1px] bg-gradient-to-l from-transparent to-[#D4AF37]/80", conf.lineW)}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
