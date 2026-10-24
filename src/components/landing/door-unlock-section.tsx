import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { formatMAD, formatPercent } from "@/lib/currency";
import { LUXURY_EASE } from "@/lib/motion";
import { YTD, MONTH } from "./landing-figures";
import { PnlLedger, Pill } from "./landing-mockups";
import { ZelligeStar8 } from "@/components/illustrations/moroccan-motifs";

/**
 * Detailed carved Moroccan cedar door panel in thin gold hairline SVG.
 */
function CarvedDoorSVG({ side }: { side: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 320 700"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full text-primary"
      preserveAspectRatio="none"
    >
      {/* Outer border & relief lines */}
      <rect
        x="6"
        y="6"
        width="308"
        height="688"
        stroke="currentColor"
        strokeWidth="1.2"
        className="text-primary/70"
      />
      <rect
        x="18"
        y="18"
        width="284"
        height="664"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="4 3"
        className="text-primary/40"
      />

      {/* Top Arched Panel */}
      <rect
        x="32"
        y="32"
        width="256"
        height="200"
        stroke="currentColor"
        strokeWidth="1.0"
        className="text-primary/60"
      />
      {/* Horseshoe Arch inside Top Panel */}
      <path
        d="M 56 210 L 56 120 C 56 60 160 40 160 40 C 160 40 264 60 264 120 L 264 210 Z"
        stroke="currentColor"
        strokeWidth="1.1"
        className="text-primary/80"
      />
      {/* Rosette inside arch */}
      <circle cx="160" cy="120" r="28" stroke="currentColor" strokeWidth="0.8" className="text-primary/60" />
      <circle cx="160" cy="120" r="14" stroke="currentColor" strokeWidth="0.8" className="text-primary/80" />
      <line x1="160" y1="92" x2="160" y2="148" stroke="currentColor" strokeWidth="0.6" className="text-primary/50" />
      <line x1="132" y1="120" x2="188" y2="120" stroke="currentColor" strokeWidth="0.6" className="text-primary/50" />

      {/* Middle Geometric Khatam Star Panel */}
      <rect
        x="32"
        y="250"
        width="256"
        height="200"
        stroke="currentColor"
        strokeWidth="1.0"
        className="text-primary/60"
      />
      {/* 8-point geometric interlacing */}
      <rect
        x="96"
        y="286"
        width="128"
        height="128"
        stroke="currentColor"
        strokeWidth="0.8"
        className="text-primary/50"
      />
      <rect
        x="96"
        y="286"
        width="128"
        height="128"
        transform="rotate(45 160 350)"
        stroke="currentColor"
        strokeWidth="0.8"
        className="text-primary/50"
      />
      <circle cx="160" cy="350" r="22" stroke="currentColor" strokeWidth="0.8" className="text-primary/70" />

      {/* Bottom Panel */}
      <rect
        x="32"
        y="468"
        width="256"
        height="196"
        stroke="currentColor"
        strokeWidth="1.0"
        className="text-primary/60"
      />
      <path
        d="M 60 500 L 260 500 M 60 636 L 260 636 M 160 500 L 160 636"
        stroke="currentColor"
        strokeWidth="0.8"
        className="text-primary/40"
      />

      {/* Brass Studs / Clous de tapissier along frame */}
      {[50, 150, 250, 350, 450, 550, 650].map((y) => (
        <circle
          key={y}
          cx={side === "left" ? 292 : 28}
          cy={y}
          r="3"
          fill="#D4AF37"
          opacity={0.85}
        />
      ))}
    </svg>
  );
}

export function DoorUnlockSection() {
  const { t, i18n } = useTranslation("landing");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const isRTL = i18n.language === "ar";

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Animation timeline mapped across scroll:
  // Phase 1 (0.00 -> 0.10): Key slides into keyhole
  const keyY = useTransform(scrollYProgress, [0, 0.08], [60, 0]);
  const keyOpacity = useTransform(scrollYProgress, [0, 0.06], [0, 1]);

  // Phase 2 (0.08 -> 0.20): Key rotates 90° (unlock action)
  const keyRotate = useTransform(scrollYProgress, [0.08, 0.18], [0, 90]);

  // Phase 3 (0.12 -> 0.32): Light leak bursts through opening seam
  const lightOpacity = useTransform(scrollYProgress, [0.12, 0.22, 0.36], [0, 1, 0]);
  const lightWidth = useTransform(scrollYProgress, [0.12, 0.32], ["2px", "120px"]);

  // Lock escutcheon & key dissolve cleanly as soon as unlocked (0.16 -> 0.26)
  const escutcheonOpacity = useTransform(scrollYProgress, [0.16, 0.26], [1, 0]);
  const escutcheonScale = useTransform(scrollYProgress, [0.16, 0.26], [1, 0.8]);

  // Phase 4 (0.18 -> 0.58): Gates swing fully open in 3D (rotateY ±115deg) and slide outward
  const leftDoorRotate = useTransform(
    scrollYProgress,
    [0.18, 0.58],
    [0, isRTL ? 115 : -115],
  );
  const rightDoorRotate = useTransform(
    scrollYProgress,
    [0.18, 0.58],
    [0, isRTL ? -115 : 115],
  );
  const leftDoorX = useTransform(
    scrollYProgress,
    [0.18, 0.58],
    ["0%", isRTL ? "40%" : "-40%"],
  );
  const rightDoorX = useTransform(
    scrollYProgress,
    [0.18, 0.58],
    ["0%", isRTL ? "-40%" : "40%"],
  );

  // Gates fade out completely as they finish opening (0.42 -> 0.58: 1 -> 0) so they never obscure the dashboard
  const doorsOpacity = useTransform(scrollYProgress, [0.42, 0.58], [1, 0]);

  // Phase 5 (0.20 -> 0.58): Dashboard emerges cleanly behind the opening gates
  const dashboardScale = useTransform(scrollYProgress, [0.20, 0.55], [0.88, 1]);
  const dashboardOpacity = useTransform(scrollYProgress, [0.18, 0.45], [0.1, 1]);

  const handleUnlockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const top = containerRef.current.getBoundingClientRect().top + window.scrollY;
    const height = containerRef.current.offsetHeight;
    window.scrollTo({
      top: top + height * 0.65,
      behavior: "smooth",
    });
  };

  return (
    <section
      ref={containerRef}
      className="relative h-[220vh] bg-[#0B0B0B] selection:bg-primary selection:text-[#0B0B0B]"
    >
      {/* Sticky presentation viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center px-4 sm:px-8">
        {/* Background Atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-radial from-[#121212] via-[#0B0B0B] to-black -z-30" />
        <div className="pointer-events-none absolute size-[800px] rounded-full bg-primary/[0.04] blur-[160px] -z-20" />

        {/* ========================================================
            REVEALED CONTENT: Owner Dashboard Mockup Behind the Doors
            ======================================================== */}
        <motion.div
          className="relative z-10 w-full max-w-4xl rounded-2xl border border-primary/30 bg-[#141414] p-6 sm:p-9 shadow-[0_30px_90px_rgba(0,0,0,0.95),inset_0_1px_1px_rgba(212,175,55,0.4)] backdrop-blur-2xl"
          style={{
            scale: prefersReduced ? 1 : dashboardScale,
            opacity: prefersReduced ? 1 : dashboardOpacity,
          }}
        >
          {/* Subtle gold rim light & glass reflection */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
          <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#F3E2A9] to-transparent" />

          {/* Mockup Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-primary shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
              <span className="font-display text-base uppercase tracking-wider text-foreground">
                {t("reveal.m1.title")}
              </span>
            </div>
            <Pill tone="gold">{t("reveal.live")}</Pill>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 relative z-10">
            <div className="p-4 rounded-xl border border-border/80 bg-[#0B0B0B]/85">
              <p className="text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {t("reveal.m1.netProfit")}
              </p>
              <div className="font-serif text-3xl sm:text-4xl text-primary font-normal tracking-tight tabular-nums mt-1">
                {formatMAD(YTD.net)}
              </div>
            </div>
            <div className="p-4 rounded-xl border border-border/80 bg-[#0B0B0B]/85 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {t("reveal.m1.margin")}
                </p>
                <div className="font-serif text-3xl sm:text-4xl text-[#A2E8DD] font-normal tracking-tight tabular-nums mt-1">
                  {formatPercent(YTD.margin)}
                </div>
              </div>
              <div className="size-12 rounded-full border border-primary/30 flex items-center justify-center text-primary">
                <ZelligeStar8 size={32} strokeWidth={1} animate={false} />
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <PnlLedger
            gross={YTD.gross}
            str={YTD.str}
            ltr={YTD.ltr}
            commissionPct={MONTH.commissionPct}
            commission={YTD.commission}
            costs={YTD.costs}
            net={YTD.net}
          />
        </motion.div>

        {/* ========================================================
            FOREGROUND: Pinned 3D Carved Moroccan Doors
            ======================================================== */}
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden"
          style={{ perspective: 1600 }}
        >
          {/* Light Leak beam through center seam */}
          <motion.div
            className="absolute inset-y-0 z-30 bg-gradient-to-r from-transparent via-[#F3E2A9] to-transparent blur-md"
            style={{
              opacity: prefersReduced ? 0 : lightOpacity,
              width: prefersReduced ? 0 : lightWidth,
            }}
          />

          <motion.div
            className="relative w-full max-w-5xl h-[86vh] flex"
            style={{ opacity: prefersReduced ? 0 : doorsOpacity }}
          >
            {/* Left Door Panel */}
            <motion.div
              className="w-1/2 h-full bg-[#12100C] border-y border-s border-primary/40 shadow-2xl relative overflow-hidden"
              style={{
                transformOrigin: isRTL ? "right center" : "left center",
                rotateY: prefersReduced ? 0 : leftDoorRotate,
                x: prefersReduced ? 0 : leftDoorX,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Cedar Wood Sheen */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#171410] via-[#1A1612] to-[#120F0B]" />
              <div className="absolute inset-0 p-3 sm:p-5 relative z-10">
                <CarvedDoorSVG side="left" />
              </div>
            </motion.div>

            {/* Right Door Panel */}
            <motion.div
              className="w-1/2 h-full bg-[#12100C] border-y border-e border-primary/40 shadow-2xl relative overflow-hidden"
              style={{
                transformOrigin: isRTL ? "left center" : "right center",
                rotateY: prefersReduced ? 0 : rightDoorRotate,
                x: prefersReduced ? 0 : rightDoorX,
                transformStyle: "preserve-3d",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-l from-[#171410] via-[#1A1612] to-[#120F0B]" />
              <div className="absolute inset-0 p-3 sm:p-5 relative z-10">
                <CarvedDoorSVG side="right" />
              </div>
            </motion.div>

            {/* Central Escutcheon & Keyhole */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-none"
              style={{
                opacity: prefersReduced ? 0 : escutcheonOpacity,
                scale: prefersReduced ? 1 : escutcheonScale,
              }}
            >
              {/* Escutcheon Brass Plate */}
              <div className="relative size-24 sm:size-28 rounded-full border-2 border-primary bg-[#12100C] shadow-[0_0_40px_rgba(212,175,55,0.4)] flex items-center justify-center">
                {/* 8-point star embossing */}
                <div className="absolute inset-2 border border-primary/40 rounded-full" />
                <ZelligeStar8 size={56} strokeWidth={1} className="opacity-80" />

                {/* Keyhole */}
                <div className="absolute size-4 flex flex-col items-center justify-center z-10">
                  <div className="size-2 rounded-full bg-black border border-primary/60" />
                  <div className="w-1 h-2 bg-black border-x border-b border-primary/60 -mt-0.5" />
                </div>
              </div>

              {/* The Gold Key that slides in and turns 90deg */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-primary"
                style={{
                  y: prefersReduced ? 0 : keyY,
                  opacity: prefersReduced ? 0 : keyOpacity,
                  rotate: prefersReduced ? 0 : keyRotate,
                }}
              >
                <svg
                  width="44"
                  height="72"
                  viewBox="0 0 44 72"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="filter drop-shadow-[0_0_12px_rgba(212,175,55,0.8)]"
                >
                  <circle
                    cx="22"
                    cy="18"
                    r="12"
                    stroke="#D4AF37"
                    strokeWidth="2.5"
                    fill="#18150F"
                  />
                  <circle cx="22" cy="18" r="6" stroke="#F3E2A9" strokeWidth="1.2" />
                  <line
                    x1="22"
                    y1="30"
                    x2="22"
                    y2="66"
                    stroke="#D4AF37"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 22 52 L 32 52 M 22 62 L 30 62"
                    stroke="#F3E2A9"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.div>

              {/* Micro Scroll Hint */}
              <motion.button
                onClick={handleUnlockClick}
                className="pointer-events-auto mt-6 font-sans text-[10px] uppercase font-medium tracking-[0.24em] text-primary/80 whitespace-nowrap bg-[#0B0B0B]/90 px-4 py-1.5 rounded-full border border-primary/30 backdrop-blur-md hover:border-primary hover:text-primary transition-colors cursor-pointer"
                style={{
                  opacity: useTransform(scrollYProgress, [0, 0.16], [1, 0]),
                }}
              >
                Scroll to unlock
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
