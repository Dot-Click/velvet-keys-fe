import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthStepperProps {
  steps: string[];
  /** 1-based */
  current: number;
  label: string;
}

export function AuthStepper({ steps, current, label }: AuthStepperProps) {
  return (
    <nav aria-label={label}>
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => {
          const number = index + 1;
          const isDone = number < current;
          const isCurrent = number === current;
          return (
            <li key={step} className="flex flex-1 items-center gap-2 last:flex-none">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className="flex items-center gap-2"
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border text-[0.68rem] font-semibold transition-colors duration-300",
                    isDone && "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-primary/10 text-primary shadow-[0_0_14px_rgba(212,175,55,0.25)]",
                    !isDone && !isCurrent && "border-border text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="size-3.5" /> : number}
                </span>
                <span
                  className={cn(
                    "hidden text-[0.65rem] font-semibold uppercase tracking-[0.16em] sm:inline",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step}
                </span>
              </span>
              {number < steps.length && (
                <span
                  aria-hidden="true"
                  className={cn("h-px flex-1", isDone ? "bg-primary/60" : "bg-border")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
