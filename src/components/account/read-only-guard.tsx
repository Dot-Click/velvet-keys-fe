import { Children, cloneElement, isValidElement, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useReadOnly } from "@/hooks/use-read-only";
import { cn } from "@/lib/utils";

type GuardableProps = {
  disabled?: boolean;
  onClick?: unknown;
  tabIndex?: number;
  "aria-disabled"?: boolean;
};

interface ReadOnlyGuardProps {
  /** A single add/edit/delete control that accepts `disabled`. */
  children: ReactElement<GuardableProps>;
  /** Logical side for the tooltip, mirrored in RTL. */
  side?: "top" | "bottom" | "start" | "end";
  /** Classes for the wrapper, e.g. "flex w-full" when the control stretches. */
  className?: string;
}

/**
 * Disables the wrapped control while the account is read-only, or the device is offline, and
 * explains why on hover or focus. Renders the control untouched otherwise.
 */
export function ReadOnlyGuard({ children, side = "top", className }: ReadOnlyGuardProps) {
  const { isReadOnly, isAccountReadOnly } = useReadOnly();
  const { t, i18n } = useTranslation("common");

  if (!isReadOnly) return children;
  // An overdue invoice is the more serious reason, so it wins when both apply
  const reason = isAccountReadOnly ? t("readOnly.tooltip") : t("pwa.offline.tooltip");

  const child = Children.only(children);
  if (!isValidElement<GuardableProps>(child)) return children;

  const isRtl = i18n.dir() === "rtl";
  const physicalSide =
    side === "start"
      ? isRtl
        ? "right"
        : "left"
      : side === "end"
        ? isRtl
          ? "left"
          : "right"
        : side;

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            data-read-only=""
            aria-label={reason}
            className={cn(
              "inline-flex cursor-not-allowed rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/70",
              className,
            )}
          >
            {cloneElement(child, {
              disabled: true,
              "aria-disabled": true,
              tabIndex: -1,
              onClick: undefined,
            })}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side={physicalSide}
          className="max-w-64 border border-destructive/60 bg-destructive text-destructive-foreground"
        >
          {reason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
