import { useRef, type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { useTableCardLabels } from "@/hooks/use-table-card-labels";
import { cn } from "@/lib/utils";

/**
 * Compact data table: scrolls sideways on tablets instead of squeezing columns, and shows one card
 * per row on phones. The wrapper is positioned so screen-reader-only text stays inside it.
 */
export function AdminTable({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useTableCardLabels(ref);
  return (
    <div
      ref={ref}
      className={cn(
        "table-cards-frame relative overflow-x-auto rounded-lg border border-border/80 bg-[#121212]",
        className,
      )}
    >
      <table className="w-full whitespace-nowrap text-[13px]">{children}</table>
    </div>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-border/80 bg-[#0F0F0F] px-2.5 py-2 text-start text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-2.5 py-2 align-middle text-foreground", className)} {...props} />;
}
