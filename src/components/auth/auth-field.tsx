import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

/** Shared input styling for the auth screens. */
export const authInputClassName =
  "h-12 rounded-xl border-border/80 bg-[#141414] px-4 text-sm text-foreground focus:border-primary/80 focus:ring-1 focus:ring-primary/40 aria-[invalid=true]:border-destructive";

interface AuthFieldProps {
  id: string;
  label: string;
  /** Already-translated message */
  error?: string | undefined;
  /** Shown under the control, e.g. a password strength meter */
  hint?: ReactNode;
  /** Rendered at the end of the label row, e.g. a "Forgot password?" link */
  labelAction?: ReactNode;
  children: ReactNode;
}

export function fieldErrorId(id: string) {
  return `${id}-error`;
}

export function AuthField({ id, label, error, hint, labelAction, children }: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-label-caps text-muted-foreground">
          {label}
        </label>
        {labelAction}
      </div>
      {children}
      {error && (
        <p
          id={fieldErrorId(id)}
          role="alert"
          className="flex items-start gap-1.5 rounded-md border border-destructive/40 bg-destructive/15 px-2.5 py-1.5 text-xs text-destructive-foreground"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      {hint}
    </div>
  );
}

/** Form-level error such as a failed sign-in. */
export function AuthAlert({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-destructive/50 bg-destructive/15 p-4 text-sm text-destructive-foreground"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <p className="text-xs leading-relaxed text-destructive-foreground/90">{children}</p>
      </div>
    </div>
  );
}
