import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-medium outline-hidden transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "btn-shimmer border-primary bg-primary text-primary-foreground font-medium tracking-[0.03em] shadow-[0_4px_20px_rgba(212,175,55,0.18)] hover:-translate-y-0.5 hover:bg-[#E2BD44] hover:shadow-[0_8px_30px_rgba(212,175,55,0.28)] active:translate-y-0",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground font-medium shadow-[0_4px_20px_rgba(139,0,43,0.25)] hover:-translate-y-0.5 hover:bg-[#A00032] hover:shadow-[0_8px_30px_rgba(139,0,43,0.4)] active:translate-y-0",
        outline:
          "border-border bg-card/60 text-foreground hover:border-primary/50 hover:bg-card hover:text-primary active:translate-y-0",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:border-primary/40 hover:bg-[#222222] active:translate-y-0",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-card hover:text-foreground hover:border-border/60 active:translate-y-0",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
        /** Operations secondary: ghost with a gold outline */
        outlineGold:
          "border-primary/45 bg-transparent text-primary hover:border-primary hover:bg-primary/10 active:translate-y-0",
        /** Operations destructive: ruby outline, never a full ruby fill */
        outlineRuby:
          "border-[#FF85A1]/45 bg-transparent text-[#FF85A1] hover:border-[#FF85A1] hover:bg-destructive/15 active:translate-y-0",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-md px-3.5 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";
export { Button, buttonVariants };
