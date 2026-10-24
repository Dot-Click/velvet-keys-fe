import { motion } from "framer-motion";
import { LUXURY_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** A check mark that draws itself in, for "saved" and "paid" moments. */
export function SuccessCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn("size-4", className)}>
      <motion.path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, ease: LUXURY_EASE }}
      />
    </svg>
  );
}
