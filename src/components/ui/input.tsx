import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-border bg-card/65 px-4 py-2.5 text-sm text-foreground shadow-inner shadow-black/20 outline-hidden transition-all duration-300 placeholder:text-muted-foreground/60",
        "hover:border-primary/45 hover:bg-card/85 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-card",
        "disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
export { Input };
