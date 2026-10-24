import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FilterChip<T extends string> {
  value: T;
  label: ReactNode;
  count?: number;
  tone?: "gold" | "ruby" | "jade";
}

const ACTIVE = {
  gold: "border-primary/60 bg-primary/12 text-primary",
  ruby: "border-[#FF85A1]/60 bg-destructive/20 text-[#FF85A1]",
  jade: "border-[#A2E8DD]/60 bg-[#A2E8DD]/10 text-[#A2E8DD]",
} as const;

/** Single-choice filter chips with counts. */
export function FilterChips<T extends string>({
  label,
  chips,
  value,
  onChange,
  className,
}: {
  label: string;
  chips: FilterChip<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5", className)}
    >
      {chips.map((chip) => (
        <button
          key={chip.value}
          type="button"
          role="radio"
          aria-checked={value === chip.value}
          onClick={() => onChange(chip.value)}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors",
            value === chip.value
              ? ACTIVE[chip.tone ?? "gold"]
              : "border-border/70 text-muted-foreground hover:border-primary/30 hover:text-foreground",
          )}
        >
          {chip.label}
          {chip.count !== undefined && (
            <span className="tabular-nums opacity-70">{chip.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
