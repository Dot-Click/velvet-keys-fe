import { cn } from "@/lib/utils";
import { LogoMark } from "./brand/logo-mark";
import { LogoHorizontal } from "./brand/logo-horizontal";

export interface BrandMarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  subtitle?: string;
  className?: string;
}

export function BrandMark({ size = "md", showLabel = false, subtitle, className }: BrandMarkProps) {
  if (showLabel) {
    const horizontalSize = size === "xl" ? "lg" : size;
    return <LogoHorizontal size={horizontalSize} subtitle={subtitle} className={className} />;
  }

  return <LogoMark size={size} className={className} />;
}

export * from "./brand";
