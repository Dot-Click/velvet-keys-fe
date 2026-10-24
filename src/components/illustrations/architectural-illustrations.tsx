import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LUXURY_EASE } from "@/lib/motion";

interface IllustrationProps {
  className?: string;
  animate?: boolean;
  opacity?: number;
}

const strokeTransition = {
  duration: 1.4,
  ease: LUXURY_EASE,
};

/**
 * Empty Bookings State: A quiet, serene architectural doorway with arched transom
 */
export function ArchitecturalDoorway({
  className,
  animate = true,
  opacity = 0.65,
}: IllustrationProps) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible text-primary", className)}
      style={{ opacity }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Outer Door Frame / Pilasters */}
      <motion.rect
        x="30"
        y="38"
        width="60"
        height="74"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: strokeTransition },
        }}
      />

      {/* Semicircular Transom Arch */}
      <motion.path
        d="M 30 38 A 30 30 0 0 1 90 38"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.15 } },
        }}
      />

      {/* Fanlight Sunburst Spokes */}
      <motion.path
        d="M 60 38 L 60 8 M 60 38 L 38 16 M 60 38 L 82 16"
        stroke="currentColor"
        strokeWidth="1.0"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.3 } },
        }}
      />

      {/* Double Doors Center Seam & Panels */}
      <motion.line
        x1="60"
        y1="38"
        x2="60"
        y2="112"
        stroke="currentColor"
        strokeWidth="1.0"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.25 } },
        }}
      />

      {/* Left Inset Panel */}
      <motion.rect
        x="36"
        y="46"
        width="18"
        height="26"
        stroke="currentColor"
        strokeWidth="0.8"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.4 } },
        }}
      />

      {/* Right Inset Panel */}
      <motion.rect
        x="66"
        y="46"
        width="18"
        height="26"
        stroke="currentColor"
        strokeWidth="0.8"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.4 } },
        }}
      />

      {/* Threshold Steps */}
      <motion.line
        x1="22"
        y1="112"
        x2="98"
        y2="112"
        stroke="currentColor"
        strokeWidth="1.4"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.2 } },
        }}
      />
      <motion.line
        x1="18"
        y1="116"
        x2="102"
        y2="116"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.25 } },
        }}
      />
    </motion.svg>
  );
}

/**
 * Empty Repairs State: Architectural drafting caliper, compass & precision tools
 */
export function ArchitecturalTools({
  className,
  animate = true,
  opacity = 0.65,
}: IllustrationProps) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible text-primary", className)}
      style={{ opacity }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Drafting Compass Top Hinge */}
      <motion.circle
        cx="60"
        cy="24"
        r="4"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: strokeTransition },
        }}
      />

      {/* Compass Left Leg */}
      <motion.path
        d="M 58 28 L 36 94"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.15 } },
        }}
      />

      {/* Compass Right Leg */}
      <motion.path
        d="M 62 28 L 84 94"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.15 } },
        }}
      />

      {/* Compass Arc / Wing Divider */}
      <motion.path
        d="M 44 64 A 32 32 0 0 1 76 64"
        stroke="currentColor"
        strokeWidth="1.0"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.3 } },
        }}
      />

      {/* Precision Caliper Marks */}
      <motion.line
        x1="24"
        y1="102"
        x2="96"
        y2="102"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.35 } },
        }}
      />
      <motion.path
        d="M 30 98 V 102 M 40 100 V 102 M 50 98 V 102 M 60 97 V 102 M 70 100 V 102 M 80 98 V 102 M 90 100 V 102"
        stroke="currentColor"
        strokeWidth="0.8"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.45 } },
        }}
      />
    </motion.svg>
  );
}

/**
 * Empty Expenses State: Classical fluted column with ledger register motif
 */
export function ArchitecturalLedger({
  className,
  animate = true,
  opacity = 0.65,
}: IllustrationProps) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible text-primary", className)}
      style={{ opacity }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Column Capital / Abacus */}
      <motion.rect
        x="32"
        y="22"
        width="56"
        height="6"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: strokeTransition },
        }}
      />

      {/* Ionic Volutes */}
      <motion.path
        d="M 34 32 C 34 26 40 28 44 32 M 86 32 C 86 26 80 28 76 32"
        stroke="currentColor"
        strokeWidth="1.0"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.15 } },
        }}
      />

      {/* Fluted Column Shaft Lines */}
      <motion.path
        d="M 40 32 V 96 M 48 32 V 96 M 56 32 V 96 M 64 32 V 96 M 72 32 V 96 M 80 32 V 96"
        stroke="currentColor"
        strokeWidth="1.0"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.3 } },
        }}
      />

      {/* Column Plinth Base */}
      <motion.rect
        x="30"
        y="96"
        width="60"
        height="8"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.25 } },
        }}
      />
      <motion.line
        x1="22"
        y1="106"
        x2="98"
        y2="106"
        stroke="currentColor"
        strokeWidth="1.4"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.35 } },
        }}
      />
    </motion.svg>
  );
}

/**
 * Empty Reports State: Folded architectural folio / blueprint document
 */
export function ArchitecturalDocument({
  className,
  animate = true,
  opacity = 0.65,
}: IllustrationProps) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible text-primary", className)}
      style={{ opacity }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Outer Folio Sheet with Folded Corner */}
      <motion.path
        d="M 32 18 H 74 L 88 32 V 102 H 32 Z"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: strokeTransition },
        }}
      />

      {/* Folded Corner Triangle */}
      <motion.path
        d="M 74 18 V 32 H 88"
        stroke="currentColor"
        strokeWidth="1.0"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.2 } },
        }}
      />

      {/* Architectural Floor Plan Grid Lines Inside Folio */}
      <motion.path
        d="M 40 44 H 80 M 40 56 H 80 M 40 68 H 70 M 40 80 H 76"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="4 2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.35 } },
        }}
      />

      {/* Seal Circle at Bottom Right */}
      <motion.circle
        cx="72"
        cy="90"
        r="5"
        stroke="currentColor"
        strokeWidth="1.0"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { ...strokeTransition, delay: 0.5 } },
        }}
      />
    </motion.svg>
  );
}

/**
 * Login Screen: Grand partial building facade line-drawing bleeding off one edge of the screen
 */
export function ArchitecturalFacade({
  className,
  animate = true,
  opacity = 0.5,
}: IllustrationProps) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <motion.svg
      width="640"
      height="800"
      viewBox="0 0 640 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible text-primary pointer-events-none select-none", className)}
      style={{ opacity }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Classical Portico Pediment Top */}
      <motion.path
        d="M 80 180 L 360 40 L 640 180"
        stroke="currentColor"
        strokeWidth="1.4"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.6, ease: LUXURY_EASE } },
        }}
      />
      <motion.path
        d="M 120 180 L 360 70 L 600 180"
        stroke="currentColor"
        strokeWidth="0.8"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.6, delay: 0.2, ease: LUXURY_EASE } },
        }}
      />

      {/* Entablature Horizontal Beams */}
      <motion.line
        x1="40"
        y1="180"
        x2="640"
        y2="180"
        stroke="currentColor"
        strokeWidth="1.5"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.4, delay: 0.3, ease: LUXURY_EASE } },
        }}
      />
      <motion.line
        x1="40"
        y1="205"
        x2="640"
        y2="205"
        stroke="currentColor"
        strokeWidth="1.0"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.4, delay: 0.4, ease: LUXURY_EASE } },
        }}
      />

      {/* Grand Columns (Colonnade) */}
      {[100, 220, 360, 500, 620].map((colX, index) => (
        <React.Fragment key={colX}>
          {/* Column Capital */}
          <motion.rect
            x={colX - 18}
            y="205"
            width="36"
            height="16"
            stroke="currentColor"
            strokeWidth="1.0"
            variants={{
              hidden: { pathLength: shouldAnimate ? 0 : 1 },
              visible: {
                pathLength: 1,
                transition: { duration: 1.2, delay: 0.4 + index * 0.1, ease: LUXURY_EASE },
              },
            }}
          />
          {/* Column Shaft */}
          <motion.line
            x1={colX - 10}
            y1="221"
            x2={colX - 10}
            y2="760"
            stroke="currentColor"
            strokeWidth="1.0"
            variants={{
              hidden: { pathLength: shouldAnimate ? 0 : 1 },
              visible: {
                pathLength: 1,
                transition: { duration: 1.5, delay: 0.5 + index * 0.1, ease: LUXURY_EASE },
              },
            }}
          />
          <motion.line
            x1={colX + 10}
            y1="221"
            x2={colX + 10}
            y2="760"
            stroke="currentColor"
            strokeWidth="1.0"
            variants={{
              hidden: { pathLength: shouldAnimate ? 0 : 1 },
              visible: {
                pathLength: 1,
                transition: { duration: 1.5, delay: 0.5 + index * 0.1, ease: LUXURY_EASE },
              },
            }}
          />
        </React.Fragment>
      ))}

      {/* Tall Palladian Arched Windows Between Columns */}
      {[160, 300, 440].map((winX, idx) => (
        <React.Fragment key={winX}>
          <motion.path
            d={`M ${winX - 30} 340 A 30 30 0 0 1 ${winX + 30} 340 V 580 H ${winX - 30} Z`}
            stroke="currentColor"
            strokeWidth="0.8"
            variants={{
              hidden: { pathLength: shouldAnimate ? 0 : 1 },
              visible: {
                pathLength: 1,
                transition: { duration: 1.5, delay: 0.7 + idx * 0.15, ease: LUXURY_EASE },
              },
            }}
          />
          {/* Internal Window Grid Lines */}
          <motion.line
            x1={winX}
            y1="310"
            x2={winX}
            y2="580"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeDasharray="4 2"
          />
        </React.Fragment>
      ))}

      {/* Ground Base Steps */}
      <motion.line
        x1="20"
        y1="760"
        x2="640"
        y2="760"
        stroke="currentColor"
        strokeWidth="1.8"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.2, delay: 0.9, ease: LUXURY_EASE } },
        }}
      />
    </motion.svg>
  );
}

/**
 * Section Divider: Thin ornamental gold rule with center architectural diamond motif
 */
export function ArchitecturalDivider({
  className,
  opacity = 0.6,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      className={cn("relative flex items-center justify-center my-12", className)}
      style={{ opacity }}
    >
      {/* Left Hairline */}
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-[#D4AF37]" />

      {/* Center Crest Emblem */}
      <div className="mx-4 flex items-center gap-2 text-primary">
        <span className="size-1 rounded-full bg-primary" />
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
          <path d="M 12 3 L 21 12 L 12 21 L 3 12 Z" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
        <span className="size-1 rounded-full bg-primary" />
      </div>

      {/* Right Hairline */}
      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#D4AF37]/50 to-[#D4AF37]" />
    </div>
  );
}

/**
 * 404 / Error State: Open arch leading nowhere into calm perspective
 */
export function ArchitecturalArch404({
  className,
  opacity = 0.7,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <motion.svg
      width="200"
      height="220"
      viewBox="0 0 200 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible text-primary mx-auto", className)}
      style={{ opacity }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Monumental Outer Arch */}
      <motion.path
        d="M 40 90 A 60 60 0 0 1 160 90 V 210 H 40 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1, transition: { duration: 1.4, ease: LUXURY_EASE } },
        }}
      />

      {/* Inner Perspective Vanishing Arch */}
      <motion.path
        d="M 68 115 A 32 32 0 0 1 132 115 V 210 H 68 Z"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeDasharray="3 3"
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1, transition: { duration: 1.4, delay: 0.3, ease: LUXURY_EASE } },
        }}
      />

      {/* Perspective Floor Vanishing Lines */}
      <motion.line x1="40" y1="210" x2="68" y2="210" stroke="currentColor" strokeWidth="1.2" />
      <motion.line x1="132" y1="210" x2="160" y2="210" stroke="currentColor" strokeWidth="1.2" />
      <motion.line
        x1="68"
        y1="210"
        x2="100"
        y2="175"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="2 2"
      />
      <motion.line
        x1="132"
        y1="210"
        x2="100"
        y2="175"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="2 2"
      />
    </motion.svg>
  );
}

/**
 * Large Monumental Line-Art Arch for framing the Hero Headline
 */
export function HeroArchFrame({
  className,
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <motion.svg
      viewBox="0 0 800 680"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("pointer-events-none select-none text-primary/45 overflow-visible", className)}
      initial="hidden"
      animate="visible"
    >
      {/* Outer Grand Arch */}
      <motion.path
        d="M 60 670 V 380 C 60 170 212 20 400 20 C 588 20 740 170 740 380 V 670"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 2.2, ease: LUXURY_EASE } },
        }}
      />
      {/* Inner Concentric Hairline Arch */}
      <motion.path
        d="M 90 670 V 390 C 90 200 228 56 400 56 C 572 56 710 200 710 390 V 670"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="6 4"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 2.0, delay: 0.2, ease: LUXURY_EASE } },
        }}
      />
      {/* Keystones at Arch Apex */}
      <motion.path
        d="M 390 10 L 410 10 L 406 32 L 394 32 Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.2, delay: 0.5, ease: LUXURY_EASE } },
        }}
      />
      <motion.circle
        cx="400"
        cy="44"
        r="3"
        stroke="currentColor"
        strokeWidth="1.0"
        variants={{
          hidden: { scale: 0, opacity: 0 },
          visible: { scale: 1, opacity: 1, transition: { delay: 0.8, duration: 0.6 } },
        }}
      />
      {/* Impost moldings / horizontal capital lines */}
      <motion.line
        x1="40"
        y1="380"
        x2="110"
        y2="380"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.0, delay: 0.6 } },
        }}
      />
      <motion.line
        x1="690"
        y1="380"
        x2="760"
        y2="380"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.0, delay: 0.6 } },
        }}
      />
      {/* Delicate tick marks around perimeter */}
      {[0, 30, 60, 90, 120, 150, 180].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const cx = 400 - Math.cos(rad) * 350;
        const cy = 380 - Math.sin(rad) * 350;
        return (
          <motion.circle
            key={i}
            cx={cx}
            cy={cy}
            r="1.5"
            fill="currentColor"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 0.7, transition: { delay: 0.8 + i * 0.08 } },
            }}
          />
        );
      })}
    </motion.svg>
  );
}

/**
 * Step 1: Classical Line-Art Key (Discretion & Onboarding)
 */
export function ArchitecturalKey({
  className,
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <motion.svg
      width="90"
      height="90"
      viewBox="0 0 90 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary overflow-visible", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Bow (Key Head) - Trefoil / Architectural Quatrefoil */}
      <motion.circle
        cx="32"
        cy="32"
        r="16"
        stroke="currentColor"
        strokeWidth="1.3"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.4, ease: LUXURY_EASE } },
        }}
      />
      <motion.circle
        cx="32"
        cy="32"
        r="8"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeDasharray="2 2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.2, delay: 0.2, ease: LUXURY_EASE } },
        }}
      />
      {/* Key Shaft / Barrel */}
      <motion.line
        x1="44"
        y1="44"
        x2="74"
        y2="74"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.2, delay: 0.3, ease: LUXURY_EASE } },
        }}
      />
      {/* Bit / Teeth of Key */}
      <motion.path
        d="M 64 64 L 72 56 M 70 70 L 78 62 M 72 56 L 76 60 M 78 62 L 80 64"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.2, delay: 0.45, ease: LUXURY_EASE } },
        }}
      />
      {/* Ornamental Collar Ring */}
      <motion.circle
        cx="46"
        cy="46"
        r="3"
        stroke="currentColor"
        strokeWidth="1.0"
        variants={{
          hidden: { scale: 0 },
          visible: { scale: 1, transition: { delay: 0.5, duration: 0.4 } },
        }}
      />
    </motion.svg>
  );
}

/**
 * Step 2: Neoclassical Line-Art Calendar (Daily Orchestration)
 */
export function ArchitecturalCalendar({
  className,
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <motion.svg
      width="90"
      height="90"
      viewBox="0 0 90 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-[#A2E8DD] overflow-visible", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Calendar Architectural Frame */}
      <motion.rect
        x="18"
        y="22"
        width="54"
        height="52"
        rx="6"
        stroke="currentColor"
        strokeWidth="1.3"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.4, ease: LUXURY_EASE } },
        }}
      />
      {/* Top Header Bar */}
      <motion.line
        x1="18"
        y1="36"
        x2="72"
        y2="36"
        stroke="currentColor"
        strokeWidth="1.0"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.0, delay: 0.2, ease: LUXURY_EASE } },
        }}
      />
      {/* Binding Rings */}
      <motion.line
        x1="32"
        y1="16"
        x2="32"
        y2="24"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 0.6, delay: 0.3 } },
        }}
      />
      <motion.line
        x1="58"
        y1="16"
        x2="58"
        y2="24"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 0.6, delay: 0.3 } },
        }}
      />
      {/* Grid Dots / Cadence Points */}
      <motion.path
        d="M 28 46 H 32 M 43 46 H 47 M 58 46 H 62 M 28 56 H 32 M 43 56 H 47 M 58 56 H 62 M 28 64 H 32 M 43 64 H 47"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.8, delay: 0.45 } },
        }}
      />
      {/* Active Stay Indicator Circle */}
      <motion.circle
        cx="58"
        cy="64"
        r="4"
        stroke="currentColor"
        strokeWidth="1.0"
        variants={{
          hidden: { scale: 0 },
          visible: { scale: 1, transition: { delay: 0.6, duration: 0.4 } },
        }}
      />
    </motion.svg>
  );
}

/**
 * Step 3: Classical Line-Art Ledger / Vault (Executive Visibility)
 */
export function ArchitecturalVaultLedger({
  className,
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <motion.svg
      width="90"
      height="90"
      viewBox="0 0 90 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary overflow-visible", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Ledger Spine & Cover */}
      <motion.path
        d="M 22 20 H 68 C 72 20 74 22 74 26 V 70 C 74 74 72 76 68 76 H 22 Z"
        stroke="currentColor"
        strokeWidth="1.3"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.4, ease: LUXURY_EASE } },
        }}
      />
      {/* Spine Double Crease */}
      <motion.line
        x1="30"
        y1="20"
        x2="30"
        y2="76"
        stroke="currentColor"
        strokeWidth="1.0"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.0, delay: 0.2 } },
        }}
      />
      {/* Central Diamond Crest */}
      <motion.path
        d="M 52 40 L 58 48 L 52 56 L 46 48 Z"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.0, delay: 0.4 } },
        }}
      />
      {/* Ledger Horizontal Registers */}
      <motion.line
        x1="38"
        y1="30"
        x2="66"
        y2="30"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="2 2"
      />
      <motion.line
        x1="38"
        y1="66"
        x2="66"
        y2="66"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="2 2"
      />
    </motion.svg>
  );
}

/**
 * Tall Fluted Classical Column for Request Access Section Left Panel
 */
export function ArchitecturalFlutedColumn({
  className,
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animate && !prefersReduced;

  return (
    <motion.svg
      viewBox="0 0 160 520"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary/60 pointer-events-none select-none overflow-visible", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Corinthian / Ionic Capital Abacus */}
      <motion.rect
        x="20"
        y="30"
        width="120"
        height="10"
        stroke="currentColor"
        strokeWidth="1.3"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.2, ease: LUXURY_EASE } },
        }}
      />
      {/* Capital Scroll Volutes */}
      <motion.path
        d="M 28 50 C 28 36 46 40 54 48 M 132 50 C 132 36 114 40 106 48"
        stroke="currentColor"
        strokeWidth="1.1"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.2, delay: 0.2, ease: LUXURY_EASE } },
        }}
      />
      {/* Necking Band */}
      <motion.line
        x1="36"
        y1="56"
        x2="124"
        y2="56"
        stroke="currentColor"
        strokeWidth="1.0"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 0.8, delay: 0.3 } },
        }}
      />
      {/* Fluted Shaft Lines */}
      {[42, 54, 66, 80, 94, 106, 118].map((x, i) => (
        <motion.line
          key={x}
          x1={x}
          y1="56"
          x2={x}
          y2="460"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeOpacity={i === 3 ? 1 : 0.75}
          variants={{
            hidden: { pathLength: shouldAnimate ? 0 : 1 },
            visible: {
              pathLength: 1,
              transition: { duration: 1.6, delay: 0.3 + i * 0.08, ease: LUXURY_EASE },
            },
          }}
        />
      ))}
      {/* Base Torus & Plinth */}
      <motion.rect
        x="30"
        y="460"
        width="100"
        height="16"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.0, delay: 0.8 } },
        }}
      />
      <motion.line
        x1="16"
        y1="476"
        x2="144"
        y2="476"
        stroke="currentColor"
        strokeWidth="1.5"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.0, delay: 0.9 } },
        }}
      />
      <motion.line
        x1="8"
        y1="486"
        x2="152"
        y2="486"
        stroke="currentColor"
        strokeWidth="1.2"
        variants={{
          hidden: { pathLength: shouldAnimate ? 0 : 1 },
          visible: { pathLength: 1, transition: { duration: 1.0, delay: 1.0 } },
        }}
      />
    </motion.svg>
  );
}

/**
 * Floorplan Fragment for Section Details & Decorative Hairline Overlays
 */
export function FloorplanFragment({
  className,
  opacity = 0.45,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 300 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary pointer-events-none select-none", className)}
      style={{ opacity }}
    >
      <rect x="20" y="20" width="260" height="200" stroke="currentColor" strokeWidth="1.2" />
      <line x1="120" y1="20" x2="120" y2="220" stroke="currentColor" strokeWidth="1.0" />
      <line x1="20" y1="110" x2="120" y2="110" stroke="currentColor" strokeWidth="1.0" />
      {/* Door Swing Arc */}
      <path
        d="M 120 70 A 30 30 0 0 1 90 100"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="3 2"
      />
      <line x1="120" y1="70" x2="120" y2="100" stroke="currentColor" strokeWidth="1.0" />
      {/* Window ticks */}
      <line x1="160" y1="18" x2="220" y2="18" stroke="currentColor" strokeWidth="2.5" />
      <line x1="282" y1="60" x2="282" y2="140" stroke="currentColor" strokeWidth="2.5" />
      <text
        x="35"
        y="65"
        fill="currentColor"
        fontSize="8"
        letterSpacing="0.2em"
        fontFamily="sans-serif"
      >
        SUITE 01
      </text>
      <text
        x="145"
        y="65"
        fill="currentColor"
        fontSize="8"
        letterSpacing="0.2em"
        fontFamily="sans-serif"
      >
        GRAND SALON
      </text>
    </svg>
  );
}
