import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { CountUp } from "@/components/motion/count-up";
import { opsItemVariants, opsListVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface SummaryItem {
  id: string;
  label: string;
  value: number;
  /** "mad" shows the figure with a small MAD code */
  unit?: "mad";
  tone?: "gold" | "ruby" | "jade";
  hint?: ReactNode;
  /** 0–1, drawn as a thin bar under the figure */
  progress?: number;
  /** Shown instead of the counting figure, e.g. a formatted duration */
  display?: ReactNode;
  /** A pulsing dot by the label, for something that needs attention now */
  pulse?: boolean;
}

const TONE = {
  gold: "text-primary",
  ruby: "text-[#FF85A1]",
  jade: "text-[#A2E8DD]",
} as const;

/** A row of mini KPI cards whose figures count up; ruby cards carry a ruby rim. */
export function SummaryStrip({ items, className }: { items: SummaryItem[]; className?: string }) {
  return (
    <motion.div
      variants={opsListVariants}
      initial="initial"
      animate="animate"
      className={cn(
        "grid grid-cols-2 gap-3",
        items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <motion.div
          key={item.id}
          variants={opsItemVariants}
          className={cn(
            "hover-lift rounded-xl border bg-[#141414] p-4",
            item.tone === "ruby" ? "border-[#FF85A1]/30" : "border-border/70",
          )}
        >
          <p className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
            {item.pulse && (
              <span className="relative inline-flex size-2" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#FF85A1] opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-[#FF85A1]" />
              </span>
            )}
            {item.label}
          </p>
          <p
            dir="ltr"
            className={cn(
              "figure-serif mt-1 whitespace-nowrap text-[1.7rem] leading-none rtl:text-right",
              item.tone ? TONE[item.tone] : "text-[#F8F9FA]",
            )}
          >
            {item.display ?? <CountUp value={item.value} />}
            {item.unit === "mad" && (
              <span className="ms-1 font-sans text-[0.62rem] font-medium tracking-wider text-muted-foreground">
                MAD
              </span>
            )}
          </p>
          {item.progress !== undefined && (
            <span className="mt-2.5 block h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.span
                className="block h-full rounded-full bg-[#A2E8DD]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(Math.min(1, Math.max(0, item.progress)) * 100)}%` }}
                transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}
              />
            </span>
          )}
          {item.hint && <p className="mt-1.5 text-[0.68rem] text-muted-foreground">{item.hint}</p>}
        </motion.div>
      ))}
    </motion.div>
  );
}
