import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { FileText, CalendarCheck, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  ArchitecturalKey,
  ArchitecturalCalendar,
  ArchitecturalVaultLedger,
} from "@/components/illustrations/architectural-illustrations";
import { LUXURY_EASE } from "@/lib/motion";
import { formatMAD } from "@/lib/currency";
import { LEASE_ROWS, MONTH } from "./landing-figures";
import { Deduction, Pill } from "./landing-mockups";
import { useLandingLocale } from "./use-landing-locale";

/** The numbered circle on the centre line (or on the start edge on a phone). */
function StepNode({ label }: { label: string }) {
  return (
    <div className="absolute start-6 sm:start-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 -top-4 sm:top-1/2 sm:-translate-y-1/2 z-20">
      <motion.div
        className="size-11 rounded-full border-2 border-primary bg-[#0B0B0B] text-primary flex items-center justify-center font-display text-sm font-semibold tracking-wider transition-all duration-500"
        whileInView={{
          boxShadow: "0 0 30px rgba(212,175,55,0.7), inset 0 0 10px rgba(212,175,55,0.3)",
          borderColor: "#FFF1BE",
        }}
        viewport={{ once: false, margin: "-100px" }}
      >
        {label}
      </motion.div>
    </div>
  );
}

export function HowItWorksSection() {
  const { t } = useTranslation(["landing", "common"]);
  const { sign } = useLandingLocale();
  const containerRef = React.useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const reveal = (from: 1 | -1) => ({
    initial: { opacity: 0, x: 30 * from * sign },
    whileInView: { opacity: 1, x: 0 },
    viewport: { once: true },
    transition: { duration: 0.9, ease: LUXURY_EASE },
  });

  const lease = LEASE_ROWS[0];

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative px-6 py-28 sm:px-10 lg:px-16 lg:py-36 bg-[#0B0B0B] border-t border-border/70 overflow-hidden"
    >
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-x-0 top-1/3 mx-auto size-[650px] rounded-full bg-primary/4 blur-[180px] -z-10" />

      {/* Header */}
      <div className="mx-auto max-w-4xl text-center space-y-4 mb-24">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary">
          {t("landing:howItWorks.badge")}
        </p>
        <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl uppercase tracking-[0.14em] text-foreground">
          {t("landing:howItWorks.title")}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground font-light max-w-xl mx-auto leading-relaxed">
          {t("landing:howItWorks.subtitle")}
        </p>
      </div>

      {/* Steps Container with Vertical Gold Drawing Line */}
      <div className="relative mx-auto max-w-5xl">
        {/* Background Guide Line (Dimmest) */}
        <div className="absolute start-6 sm:start-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 top-10 bottom-10 w-[1.5px] bg-border/40 -z-10" />

        {/* Active Animated Gold Line Drawing on Scroll */}
        <motion.div
          className="absolute start-6 sm:start-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 top-10 w-[2px] bg-gradient-to-b from-primary via-[#FFF1BE] to-primary -z-10 shadow-[0_0_15px_rgba(212,175,55,0.6)]"
          style={{
            height: prefersReduced ? "100%" : lineHeight,
          }}
        />

        {/* Steps Stack */}
        <div className="space-y-24 sm:space-y-36">
          {/* ========================================================
              STEP 1: Add your properties
              ======================================================== */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-center">
            <StepNode label="01" />

            {/* Step Description */}
            <motion.div className="ps-14 sm:ps-0 sm:text-end space-y-4" {...reveal(-1)}>
              <div className="inline-flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-primary">
                <span>{t("landing:howItWorks.step1.phase")}</span>
                <span>·</span>
                <span>{t("landing:howItWorks.step1.tag")}</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-foreground">
                {t("landing:howItWorks.step1.title")}
              </h3>
              <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-md sm:ms-auto">
                {t("landing:howItWorks.step1.body")}
              </p>
            </motion.div>

            {/* Line-Art Key + Mini Property Setup UI */}
            <motion.div className="ps-14 sm:ps-0 flex items-center gap-6" {...reveal(1)}>
              <div className="hidden lg:block shrink-0">
                <ArchitecturalKey />
              </div>
              <div className="flex-1 min-w-0 rounded-xl border border-primary/25 bg-[#141414] p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground min-w-0">
                    <Home className="size-3.5 shrink-0 text-primary" />
                    <span className="truncate">{t("landing:howItWorks.step1.cardTitle")}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Pill tone="gold">{t("landing:mock.str")}</Pill>
                    <Pill tone="jade">{t("landing:mock.ltr")}</Pill>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between gap-3 text-muted-foreground">
                    <span>{t("landing:howItWorks.step1.property")}</span>
                    <span className="text-foreground font-mono text-end">
                      {t("landing:howItWorks.step1.propertyMeta")}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-muted-foreground">
                    <span>{t("landing:howItWorks.step1.target")}</span>
                    <span className="text-primary font-mono">
                      {t("landing:howItWorks.step1.perMonth", { amount: formatMAD(60000) })}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-muted-foreground">
                    <span>{t("landing:mock.commission", { pct: MONTH.commissionPct })}</span>
                    <span className="text-[#A2E8DD] font-mono">
                      {t("landing:howItWorks.step1.set")}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ========================================================
              STEP 2: Bookings and rent flow in
              ======================================================== */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-center">
            <StepNode label="02" />

            {/* Mini Operations UI + Line-Art Calendar (swapped on desktop) */}
            <motion.div
              className="order-2 sm:order-1 ps-14 sm:ps-0 flex items-center justify-end gap-6"
              {...reveal(-1)}
            >
              <div className="flex-1 min-w-0 rounded-xl border border-[#A2E8DD]/25 bg-[#141414] p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground min-w-0">
                    <CalendarCheck className="size-3.5 shrink-0 text-[#A2E8DD]" />
                    <span className="truncate">{t("landing:howItWorks.step2.cardTitle")}</span>
                  </div>
                  <span className="shrink-0 text-[9px] uppercase font-mono text-[#A2E8DD] bg-[#A2E8DD]/10 px-2 py-0.5 rounded">
                    {t("landing:howItWorks.step2.active")}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-foreground">{t("landing:howItWorks.step2.booking")}</span>
                    <span className="text-[10px] font-mono text-primary whitespace-nowrap">
                      {formatMAD(5900)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-foreground">{t("landing:howItWorks.step2.rent")}</span>
                    <span className="text-[10px] font-mono text-[#A2E8DD] whitespace-nowrap">
                      {formatMAD(lease.rent)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-foreground">{t("landing:howItWorks.step2.expense")}</span>
                    <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                      <Deduction amount={4200} />
                    </span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block shrink-0">
                <ArchitecturalCalendar />
              </div>
            </motion.div>

            {/* Step Description */}
            <motion.div className="order-1 sm:order-2 ps-14 sm:ps-0 space-y-4" {...reveal(1)}>
              <div className="inline-flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-[#A2E8DD]">
                <span>{t("landing:howItWorks.step2.phase")}</span>
                <span>·</span>
                <span>{t("landing:howItWorks.step2.tag")}</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-foreground">
                {t("landing:howItWorks.step2.title")}
              </h3>
              <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-md">
                {t("landing:howItWorks.step2.body")}
              </p>
            </motion.div>
          </div>

          {/* ========================================================
              STEP 3: Everyone sees the numbers
              ======================================================== */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-16 items-center">
            <StepNode label="03" />

            {/* Step Description */}
            <motion.div className="ps-14 sm:ps-0 sm:text-end space-y-4" {...reveal(-1)}>
              <div className="inline-flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-primary">
                <span>{t("landing:howItWorks.step3.phase")}</span>
                <span>·</span>
                <span>{t("landing:howItWorks.step3.tag")}</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-foreground">
                {t("landing:howItWorks.step3.title")}
              </h3>
              <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-md sm:ms-auto">
                {t("landing:howItWorks.step3.body")}
              </p>
            </motion.div>

            {/* Line-Art Ledger + Mini Owner Statement UI */}
            <motion.div className="ps-14 sm:ps-0 flex items-center gap-6" {...reveal(1)}>
              <div className="hidden lg:block shrink-0">
                <ArchitecturalVaultLedger />
              </div>
              <div className="flex-1 min-w-0 rounded-xl border border-primary/25 bg-[#141414] p-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] space-y-3">
                <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground min-w-0">
                    <FileText className="size-3.5 shrink-0 text-primary" />
                    <span className="truncate">{t("landing:howItWorks.step3.cardTitle")}</span>
                  </div>
                  <span className="shrink-0 text-[9px] uppercase font-mono text-primary font-bold">
                    {t("landing:howItWorks.step3.pdf")}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between gap-3 text-muted-foreground">
                    <span>{t("landing:mock.gross")}</span>
                    <span className="text-foreground font-mono">{formatMAD(MONTH.gross)}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-muted-foreground">
                    <span className="text-primary">
                      {t("landing:mock.commission", { pct: MONTH.commissionPct })}
                    </span>
                    <span className="text-primary font-mono">
                      <Deduction amount={MONTH.commission} />
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-muted-foreground">
                    <span>{t("landing:mock.costs")}</span>
                    <span className="font-mono">
                      <Deduction amount={MONTH.costs} />
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-border/50 pt-1.5 text-muted-foreground">
                    <span>{t("landing:mock.net")}</span>
                    <span className="text-[#A2E8DD] font-mono font-medium">
                      {formatMAD(MONTH.net)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
