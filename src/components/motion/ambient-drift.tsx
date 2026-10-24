import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

export function AmbientDrift() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 size-160 rounded-full bg-primary/4 blur-[140px]" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Orb 1: Primary Warm Gold slow drift */}
      <motion.div
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -50, 30, 0],
          scale: [1, 1.08, 0.95, 1],
          opacity: [0.05, 0.08, 0.04, 0.05],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-20 left-1/4 size-180 rounded-full bg-primary blur-[150px]"
      />

      {/* Orb 2: Deep Imperial Ruby twilight warmth (lower corner) */}
      <motion.div
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.92, 1.05, 1],
          opacity: [0.03, 0.05, 0.02, 0.03],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="absolute -bottom-30 right-10 size-160 rounded-full bg-[#8B002B] blur-[160px]"
      />
    </div>
  );
}
