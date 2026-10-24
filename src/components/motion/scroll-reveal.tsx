import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LUXURY_EASE } from "@/lib/motion";

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "none";
  className?: string;
}

export function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className,
  ...props
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  const yOffset = prefersReducedMotion
    ? 0
    : direction === "up"
      ? 16
      : direction === "down"
        ? -16
        : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: prefersReducedMotion ? 0.2 : 0.7,
        delay,
        ease: LUXURY_EASE,
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
