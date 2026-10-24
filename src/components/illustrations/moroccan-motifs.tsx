import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LUXURY_EASE } from "@/lib/motion";

interface MotifProps {
  className?: string;
  animate?: boolean;
  opacity?: number;
  strokeWidth?: number;
}

const strokeTransition = {
  duration: 1.6,
  ease: LUXURY_EASE,
};

/**
 * Authentic Moroccan Horseshoe Arch (Bab Mansour / Bab Agnaou inspired)
 * Thin gold hairline vector with horseshoe curvature and keyhole spandrels.
 */
export function HorseshoeArch({
  className,
  animate = true,
  opacity = 0.6,
  strokeWidth = 1.1,
}: MotifProps) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <motion.svg
      viewBox="0 0 400 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible text-primary", className)}
      style={{ opacity }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Outer Rectangular Alfiz Frame */}
      <motion.rect
        x="20"
        y="20"
        width="360"
        height="460"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: strokeTransition },
        }}
      />
      <motion.rect
        x="36"
        y="36"
        width="328"
        height="444"
        stroke="currentColor"
        strokeWidth={strokeWidth * 0.75}
        strokeDasharray="3 3"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.15 } },
        }}
      />

      {/* Horseshoe Arch Profile (curves beyond semicircle inward at springline) */}
      <motion.path
        d="M 80 480 L 80 260 C 80 260 55 235 60 170 C 66 90 140 45 200 45 C 260 45 334 90 340 170 C 345 235 320 260 320 260 L 320 480"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.25 } },
        }}
      />

      {/* Inner Scalloped / Multilobed Arch Trim */}
      <motion.path
        d="M 100 480 L 100 270 C 100 250 85 230 92 185 C 100 120 150 75 200 75 C 250 75 300 120 308 185 C 315 230 300 250 300 270 L 300 480"
        stroke="currentColor"
        strokeWidth={strokeWidth * 0.75}
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.35 } },
        }}
      />

      {/* Keystone Finial & Star at Apex */}
      <motion.circle
        cx="200"
        cy="105"
        r="8"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        variants={{
          hidden: { scale: 0, opacity: 0 },
          visible: { scale: 1, opacity: 1, transition: { ...strokeTransition, delay: 0.5 } },
        }}
      />
      <motion.line
        x1="200"
        y1="45"
        x2="200"
        y2="97"
        stroke="currentColor"
        strokeWidth={strokeWidth * 0.8}
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.45 } },
        }}
      />

      {/* Spandrel Decorative Arabesque Medallions */}
      <motion.circle
        cx="75"
        cy="75"
        r="14"
        stroke="currentColor"
        strokeWidth={strokeWidth * 0.7}
        variants={{
          hidden: { opacity: 0, scale: 0.5 },
          visible: { opacity: 1, scale: 1, transition: { ...strokeTransition, delay: 0.6 } },
        }}
      />
      <motion.circle
        cx="325"
        cy="75"
        r="14"
        stroke="currentColor"
        strokeWidth={strokeWidth * 0.7}
        variants={{
          hidden: { opacity: 0, scale: 0.5 },
          visible: { opacity: 1, scale: 1, transition: { ...strokeTransition, delay: 0.6 } },
        }}
      />
    </motion.svg>
  );
}

/**
 * 8-Point Zellige Star (Khatam Suleyman)
 * Authentic Moroccan geometric star formed by two overlapping rotated squares and radiating octagonal interlacing.
 */
export function ZelligeStar8({
  className,
  size = 80,
  strokeWidth = 1.1,
  animate = true,
}: MotifProps & { size?: number }) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible text-primary", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Outer bounding circle */}
      <motion.circle
        cx="50"
        cy="50"
        r="44"
        stroke="currentColor"
        strokeWidth={strokeWidth * 0.7}
        strokeDasharray="2 3"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: strokeTransition },
        }}
      />

      {/* First Square */}
      <motion.rect
        x="21.7"
        y="21.7"
        width="56.6"
        height="56.6"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.15 } },
        }}
      />

      {/* Second Square rotated 45 degrees */}
      <motion.rect
        x="21.7"
        y="21.7"
        width="56.6"
        height="56.6"
        transform="rotate(45 50 50)"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.25 } },
        }}
      />

      {/* Center 8-point star polygon */}
      <motion.polygon
        points="50,15 58,35 78,35 62,47 70,68 50,55 30,68 38,47 22,35 42,35"
        stroke="currentColor"
        strokeWidth={strokeWidth * 0.9}
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.35 } },
        }}
      />

      {/* Inner Central Jewel */}
      <motion.circle
        cx="50"
        cy="50"
        r="5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        variants={{
          hidden: { scale: 0 },
          visible: { scale: 1, transition: { ...strokeTransition, delay: 0.5 } },
        }}
      />
    </motion.svg>
  );
}

/**
 * Moroccan Brass Lantern Silhouette (Fanoos)
 * Pierced metalwork lantern with finial, glass facets, and warm flicker point.
 */
export function BrassLantern({
  className,
  width = 60,
  height = 120,
  strokeWidth = 1.1,
  animate = true,
}: MotifProps & { width?: number; height?: number }) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox="0 0 60 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible text-primary", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Hanging Chain & Loop */}
      <motion.line
        x1="30"
        y1="0"
        x2="30"
        y2="20"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray="2 2"
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1, transition: strokeTransition },
        }}
      />
      <motion.circle
        cx="30"
        cy="22"
        r="3"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />

      {/* Dome / Hood */}
      <motion.path
        d="M 18 36 C 20 26 26 24 30 24 C 34 24 40 26 42 36 Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.1 } },
        }}
      />

      {/* Hexagonal / Faceted Glass Body */}
      <motion.path
        d="M 15 40 L 45 40 L 52 75 L 30 100 L 8 75 Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.2 } },
        }}
      />

      {/* Facet Ribs */}
      <motion.line
        x1="30"
        y1="40"
        x2="30"
        y2="100"
        stroke="currentColor"
        strokeWidth={strokeWidth * 0.8}
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.3 } },
        }}
      />
      <motion.line
        x1="22"
        y1="40"
        x2="19"
        y2="87"
        stroke="currentColor"
        strokeWidth={strokeWidth * 0.7}
      />
      <motion.line
        x1="38"
        y1="40"
        x2="41"
        y2="87"
        stroke="currentColor"
        strokeWidth={strokeWidth * 0.7}
      />

      {/* Delicate Pierced Pattern Dots */}
      <motion.circle cx="30" cy="55" r="1.5" fill="currentColor" opacity={0.8} />
      <motion.circle cx="25" cy="65" r="1.2" fill="currentColor" opacity={0.8} />
      <motion.circle cx="35" cy="65" r="1.2" fill="currentColor" opacity={0.8} />
      <motion.circle cx="30" cy="75" r="1.5" fill="currentColor" opacity={0.8} />

      {/* Bottom Finial Teardrop */}
      <motion.path
        d="M 30 100 L 28 108 C 28 110 32 110 32 108 Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />

      {/* Subtle Glowing Candle / Light Source inside */}
      <motion.circle
        cx="30"
        cy="65"
        r="6"
        fill="#F3E2A9"
        opacity={0.35}
        animate={
          prefersReduced
            ? {}
            : {
                opacity: [0.2, 0.45, 0.25, 0.5, 0.3],
                scale: [0.9, 1.1, 0.95, 1.05, 1],
              }
        }
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.svg>
  );
}

/**
 * Ambient Mashrabiya Shadow Pattern (Lattice Light)
 * Very slow-moving shadow pattern that drifts gently across dark sections at 4–6% opacity,
 * evoking afternoon sun filtering through a carved cedar mashrabiya screen.
 */
export function MashrabiyaAmbientLight({
  className,
  opacity = 0.05,
}: {
  className?: string;
  opacity?: number;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden select-none -z-10",
        className,
      )}
      style={{ opacity }}
    >
      <motion.div
        className="w-[200%] h-[200%] -top-[50%] -start-[50%] absolute"
        animate={
          prefersReduced
            ? {}
            : {
                x: ["0%", "3%", "-2%", "0%"],
                y: ["0%", "-4%", "2%", "0%"],
                rotate: [0, 0.5, -0.5, 0],
              }
        }
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='1.2'%3E%3Cpath d='M0 40 L40 0 L80 40 L40 80 Z'/%3E%3Cpath d='M40 10 L70 40 L40 70 L10 40 Z'/%3E%3Ccircle cx='40' cy='40' r='8'/%3E%3Ccircle cx='0' cy='0' r='6'/%3E%3Ccircle cx='80' cy='0' r='6'/%3E%3Ccircle cx='0' cy='80' r='6'/%3E%3Ccircle cx='80' cy='80' r='6'/%3E%3Cpath d='M40 0 L40 80 M0 40 L80 40' stroke-width='0.8' stroke-dasharray='3 3'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />
      {/* Vignette to soften edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B0B0B]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B] via-transparent to-[#0B0B0B]" />
    </div>
  );
}
