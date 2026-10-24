import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export interface LogoPlaqueProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Pixel size of /logo.jpg */
const LOGO_WIDTH = 696;
const LOGO_HEIGHT = 623;

export function LogoPlaque({ size = "md", className }: LogoPlaqueProps) {
  const { t } = useTranslation("common");
  const sizeMap = {
    sm: "w-44",
    md: "w-64 sm:w-72",
    lg: "w-80 sm:w-96",
  };

  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.9),0_0_0_1px_rgba(212,175,55,0.3)] select-none group transition-transform duration-500 hover:scale-[1.02]",
        sizeMap[size],
        className,
      )}
    >
      <img
        src="/logo.jpg"
        alt={`${t("brand.name")} — ${t("brand.tagline")}`}
        // Intrinsic size reserves the space before the image loads, so nothing shifts
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className="w-full h-auto object-cover rounded-xl border border-[#D4AF37]/30 block shadow-inner"
        loading="lazy"
      />
    </div>
  );
}
