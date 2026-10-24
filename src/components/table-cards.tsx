import { useRef, type ReactNode } from "react";
import { useTableCardLabels } from "@/hooks/use-table-card-labels";
import { cn } from "@/lib/utils";

/**
 * Frame for a data table: on tablets and desktops the table as designed, on phones one card per
 * row. The frame's own border and background only apply from the `md` breakpoint.
 */
export function TableCards({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useTableCardLabels(ref);
  return (
    <div ref={ref} className={cn("table-cards-frame", className)}>
      {children}
    </div>
  );
}
