import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const THRESHOLD = 72;

/**
 * Phone list row that runs `onSwipe` when dragged towards the start edge past a threshold,
 * revealing a jade action label behind it. Elsewhere it renders its children unchanged.
 */
export function SwipeRow({
  children,
  onSwipe,
  label,
  disabled,
  className,
}: {
  children: ReactNode;
  onSwipe: () => void;
  /** Shown behind the row while it is dragged, e.g. "Done" */
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  const mobile = useIsMobile();
  const { i18n } = useTranslation();
  if (!mobile || disabled) return <div className={className}>{children}</div>;
  const rtl = i18n.dir() === "rtl";

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-end gap-1.5 rounded-xl bg-[#A2E8DD]/15 pe-4 text-xs font-semibold text-[#A2E8DD]"
      >
        <Check className="size-4" />
        {label}
      </div>
      <motion.div
        drag="x"
        dragDirectionLock
        dragSnapToOrigin
        dragElastic={0.12}
        dragConstraints={rtl ? { left: 0, right: 140 } : { left: -140, right: 0 }}
        onDragEnd={(_, info) => {
          const distance = rtl ? info.offset.x : -info.offset.x;
          if (distance > THRESHOLD) onSwipe();
        }}
        className="relative touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
