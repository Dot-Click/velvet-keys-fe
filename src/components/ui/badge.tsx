import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em]",
  {
    variants: {
      variant: {
        default:
          "border-primary/35 bg-primary/10 text-primary shadow-[0_0_10px_rgba(212,175,55,0.1)]",
        secondary: "border-border bg-secondary text-secondary-foreground",
        destructive:
          "border-destructive/60 bg-destructive/20 text-[#FFA3B5] shadow-[0_0_12px_rgba(139,0,43,0.25)]",
        outline: "border-border/80 text-muted-foreground bg-transparent",
        confirmed:
          "border-[#A2E8DD]/40 bg-[#A2E8DD]/12 text-[#A2E8DD] shadow-[0_0_12px_rgba(162,232,221,0.15)]",
        pending:
          "border-primary/40 bg-primary/12 text-primary shadow-[0_0_12px_rgba(212,175,55,0.15)]",
        critical:
          "border-destructive/60 bg-destructive/22 text-[#FFA3B5] shadow-[0_0_12px_rgba(139,0,43,0.3)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export { Badge, badgeVariants };
