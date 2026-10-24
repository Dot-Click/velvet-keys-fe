import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

/** Input styling used by the Conciergerie drawers. */
export const drawerInputClassName =
  "h-11 border-border/80 bg-[#161616] text-xs aria-[invalid=true]:border-destructive";

/** Hides the browser's number stepper, which crowds narrow % fields with a trailing unit. */
export const noSpinnerClassName =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

interface DrawerFieldProps {
  id: string;
  label: string;
  /** Already translated */
  error?: string | undefined;
  hint?: ReactNode;
  children: ReactNode;
}

export function DrawerField({ id, label, error, hint, children }: DrawerFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-label-caps text-muted-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1.5 rounded-md border border-destructive/40 bg-destructive/15 px-2.5 py-1.5 text-xs text-destructive-foreground"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {!error && hint && <p className="text-[0.68rem] text-muted-foreground">{hint}</p>}
    </div>
  );
}
