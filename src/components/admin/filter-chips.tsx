import { cn } from "@/lib/utils";

/** A row of toggle chips with a count each; one is always selected. */
export function FilterChips<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count: number }[];
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              active
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border/80 bg-[#121212] text-muted-foreground hover:border-primary/30 hover:text-foreground",
            )}
          >
            {option.label}
            <span className="tabular-nums text-[0.65rem] tabular-nums opacity-70">
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
