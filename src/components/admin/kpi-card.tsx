import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

/** A tiny trend line for the last few periods; the last point is today. */
export function Sparkline({
  values,
  color = "#D4AF37",
  className,
}: {
  values: number[];
  color?: string;
  className?: string;
}) {
  const id = useId();
  if (values.length < 2) return null;
  const w = 100;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - 3 - ((v - min) / span) * (h - 6),
  ]);
  const line = points
    .map(([x, y], i) => `${i ? "L" : "M"}${x!.toFixed(1)},${y!.toFixed(1)}`)
    .join(" ");
  const last = points.at(-1)!;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("h-7 w-full overflow-visible", className)}
      style={{ direction: "ltr" }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Change against last month. `goodWhen` says which direction is good news. */
export function DeltaBadge({
  value,
  text,
  goodWhen = "up",
  suffix,
}: {
  value: number | null;
  text: string;
  goodWhen?: "up" | "down";
  suffix?: string;
}) {
  if (value === null) return null;
  const flat = value === 0;
  const good = goodWhen === "up" ? value > 0 : value < 0;
  const Icon = flat ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 tabular-nums",
        flat ? "text-muted-foreground" : good ? "text-[#A2E8DD]" : "text-[#FF85A1]",
      )}
    >
      <Icon className="size-3 rtl:-scale-x-100" aria-hidden="true" />
      <span dir="ltr">{text}</span>
      {suffix && <span className="text-muted-foreground">{suffix}</span>}
    </span>
  );
}

/** One platform figure. Gold is kept for the figures that matter most. */
export function KpiCard({
  label,
  value,
  detail,
  delta,
  spark,
  sparkColor,
  visual,
  highlight = false,
  tone = "default",
  cormorant = true,
  className,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  /** Change against last month, usually a DeltaBadge */
  delta?: ReactNode;
  /** Last months' values for the trend line */
  spark?: number[];
  sparkColor?: string;
  /** Replaces the trend line, e.g. a stacked bar or a gauge */
  visual?: ReactNode;
  highlight?: boolean;
  tone?: "default" | "danger";
  cormorant?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border bg-[#121212] px-4 py-3",
        tone === "danger"
          ? "border-destructive/50"
          : highlight
            ? "border-primary/40"
            : "border-border/80",
        className,
      )}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <p
          className={cn(
            cormorant
              ? "font-serif text-2xl font-normal [font-variant-numeric:lining-nums]"
              : "tabular-nums text-xl font-semibold",
            tone === "danger" ? "text-[#FF85A1]" : highlight ? "text-primary" : "text-[#F8F9FA]",
          )}
        >
          {value}
        </p>
        {delta && <span className="text-xs font-sans">{delta}</span>}
      </div>
      {detail && <div className="text-xs font-sans text-muted-foreground">{detail}</div>}
      {visual ? (
        <div className="mt-auto pt-1.5">{visual}</div>
      ) : (
        spark && (
          <div className="mt-auto pt-1.5">
            <Sparkline
              values={spark}
              color={sparkColor ?? (tone === "danger" ? "#FF85A1" : "#D4AF37")}
            />
          </div>
        )
      )}
    </div>
  );
}
