import type { Transition, Variants } from "framer-motion";

/**
 * Quiet Luxury Motion Design Primitives
 * All animations follow strict restraint: calm, expensive, devoid of bouncy or playful physics.
 */

export const LUXURY_EASE: [number, number, number, number] = [0.25, 1, 0.5, 1];

export const TRANSITION_STANDARD: Transition = {
  duration: 0.4,
  ease: LUXURY_EASE,
};

export const TRANSITION_CINEMATIC: Transition = {
  duration: 1.0,
  ease: LUXURY_EASE,
};

export const TRANSITION_SLOW: Transition = {
  duration: 1.2,
  ease: LUXURY_EASE,
};

export const pageMotionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: LUXURY_EASE,
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.25,
      ease: LUXURY_EASE,
    },
  },
};

export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: LUXURY_EASE },
  },
};

export const drawerSlideVariants: Variants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: LUXURY_EASE },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.3, ease: LUXURY_EASE },
  },
};

export const scrollRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: LUXURY_EASE,
    },
  },
};

export const strokeDrawVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1.4, ease: LUXURY_EASE },
      opacity: { duration: 0.3 },
    },
  },
};

/** Operations panel route change: a quiet fade and 8px rise. */
export const opsPageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: LUXURY_EASE } },
};

/** Lists reveal one item after another, 40ms apart. */
export const opsListVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04 } },
};

export const opsItemVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: LUXURY_EASE } },
};
