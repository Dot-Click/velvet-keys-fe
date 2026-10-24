import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Sparkles, FileText, Layers, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatMAD } from "@/lib/currency";
import { MONTH } from "./landing-figures";
import { PnlLedger, Pill } from "./landing-mockups";
import { useLandingLocale } from "./use-landing-locale";

// Micro-tilt wrapper for individual bento tiles
function BentoCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["3.5deg", "-3.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-3.5deg", "3.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`group relative rounded-2xl border border-primary/25 bg-[#141414] p-6 sm:p-7 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-500 hover:border-primary/60 hover:shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_35px_rgba(212,175,55,0.18)] ${className}`}
    >
      {/* Corner Accent hairline */}
      <div className="pointer-events-none absolute top-0 end-0 size-8 border-t border-e border-primary/40 rounded-se-2xl opacity-40 group-hover:opacity-100 transition-opacity" />
      {children}
    </motion.div>
  );
}

export function FeatureBentoSection() {
  const { t } = useTranslation("landing");
  const { dayOfMonth } = useLandingLocale();

  return (
    <section
      id="feature-bento"
      className="relative px-6 py-28 sm:px-10 lg:px-16 lg:py-36 bg-[#0B0B0B] overflow-hidden"
    >
      {/* Background Lighting */}
      <div className="pointer-events-none absolute bottom-1/4 end-1/4 size-[600px] rounded-full bg-primary/4 blur-[180px] -z-10" />

      {/* Header */}
      <div className="mx-auto max-w-4xl text-center space-y-4 mb-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-[11px] uppercase tracking-[0.22em] text-primary">
          <Sparkles className="size-3" />
          <span>{t("bento.badge")}</span>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl uppercase tracking-[0.14em] text-foreground">
          {t("bento.title")}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground font-light max-w-xl mx-auto leading-relaxed">
          {t("bento.subtitle")}
        </p>
      </div>

      {/* Asymmetric Bento Grid: 1 large 2x2 hero tile, 1x1 tiles, and 2x1 tiles */}
      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* ========================================================
            TILE 1: Demand Heatmap (Hero 2x2 Tile)
            ======================================================== */}
        <BentoCard className="md:col-span-2 md:row-span-2 flex flex-col justify-between overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase font-mono tracking-widest text-primary">
                {t("bento.heatmap.tag")}
              </span>
              <Pill tone="jade">{t("bento.heatmap.pill")}</Pill>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-foreground">
              {t("bento.heatmap.title")}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed max-w-md">
              {t("bento.heatmap.body")}
            </p>
          </div>

          {/* Micro-Animation Visual: Animated Interactive Heatmap Cells */}
          <div className="my-6 rounded-xl border border-border/80 bg-[#0B0B0B]/90 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground font-mono">
              <span>{t("bento.heatmap.matrix")}</span>
              <span className="text-primary font-medium">
                {t("bento.heatmap.peak", { amount: formatMAD(1450) })}
              </span>
            </div>
            <div dir="ltr" className="grid grid-cols-8 gap-1.5 sm:gap-2">
              {Array.from({ length: 32 }).map((_, i) => {
                const heat = (i * 11 + 5) % 5;
                const colors = [
                  "bg-card/40 border-border/40",
                  "bg-primary/20 border-primary/30",
                  "bg-primary/45 border-primary/50",
                  "bg-primary/75 border-primary/80",
                  "bg-[#D4AF37] border-[#FFF1BE] shadow-[0_0_10px_rgba(212,175,55,0.4)]",
                ];
                return (
                  <motion.div
                    key={i}
                    className={`h-7 rounded border transition-all duration-300 ${colors[heat]}`}
                    animate={{
                      opacity: [0.75, 1, 0.75],
                    }}
                    transition={{
                      duration: 3 + (i % 4),
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between items-center gap-3 text-[10px] font-mono text-muted-foreground pt-1">
              <span>{t("bento.heatmap.baseline", { value: "42%" })}</span>
              <div className="flex items-center gap-1.5 text-primary">
                <span className="size-1.5 rounded-full bg-primary animate-ping" />
                <span>{t("bento.heatmap.optimal")}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
            <span>{t("bento.heatmap.visibility")}</span>
            <span className="text-primary font-medium flex items-center gap-1">
              {t("bento.heatmap.live")} <ArrowUpRight className="size-3 rtl-flip" />
            </span>
          </div>
        </BentoCard>

        {/* ========================================================
            TILE 2: One-Click PDF Statements (2x1 Tile)
            ======================================================== */}
        <BentoCard className="md:col-span-2 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-primary">
              {t("bento.pdf.tag")}
            </span>
            <h3 className="font-display text-xl sm:text-2xl uppercase tracking-wider text-foreground">
              {t("bento.pdf.title")}
            </h3>
            <p className="text-xs text-muted-foreground font-light leading-relaxed">
              {t("bento.pdf.body")}
            </p>
          </div>

          {/* Micro-Animation: Statement document compile animation */}
          <div className="my-4 rounded-xl border border-border/80 bg-[#0B0B0B]/90 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <p dir="ltr" className="truncate text-start text-xs font-medium text-foreground">
                  Owner_Statement_2026-09.pdf
                </p>
                <p className="truncate text-[10px] font-mono text-[#A2E8DD]">
                  {t("bento.pdf.meta", { amount: formatMAD(MONTH.net) })}
                </p>
              </div>
            </div>
            <motion.div
              className="shrink-0 rounded-md border border-primary/40 bg-primary/15 px-3 py-1 text-[10px] font-mono text-primary font-semibold"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {t("bento.pdf.export")}
            </motion.div>
          </div>

          <div className="text-[10px] uppercase font-mono text-muted-foreground">
            {t("bento.pdf.footer")}
          </div>
        </BentoCard>

        {/* ========================================================
            TILE 3: Unified Calendar (1x1 Tile)
            ======================================================== */}
        <BentoCard className="flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#A2E8DD]">
              {t("bento.calendar.tag")}
            </span>
            <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
              {t("bento.calendar.title")}
            </h3>
          </div>

          {/* Micro-visual: Sliding Stay Bars */}
          <div className="my-3 rounded-lg border border-border/70 bg-[#0B0B0B] p-3 space-y-2 overflow-hidden">
            <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
              <span>{dayOfMonth(14)}</span>
              <span>{dayOfMonth(21)}</span>
              <span>{dayOfMonth(28)}</span>
            </div>
            <div className="h-3 w-full bg-[#181818] rounded overflow-hidden relative">
              <motion.div
                className="h-full w-2/3 bg-primary rounded text-[7px] text-[#0B0B0B] font-bold flex items-center px-1 whitespace-nowrap"
                animate={{
                  x: ["-20%", "20%", "-20%"],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                {t("bento.calendar.airbnb")}
              </motion.div>
            </div>
            <div className="h-3 w-full bg-[#181818] rounded overflow-hidden relative">
              <motion.div
                className="h-full w-2/3 bg-[#A2E8DD] rounded text-[7px] text-[#0B0B0B] font-bold flex items-center px-1 whitespace-nowrap"
                animate={{
                  x: ["10%", "-15%", "10%"],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                {t("bento.calendar.booking")}
              </motion.div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground font-light">{t("bento.calendar.body")}</p>
        </BentoCard>

        {/* ========================================================
            TILE 4: Photo-Logged Repairs (1x1 Tile)
            ======================================================== */}
        <BentoCard className="flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-primary">
              {t("bento.repairs.tag")}
            </span>
            <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
              {t("bento.repairs.title")}
            </h3>
          </div>

          {/* Micro-visual: Before/After & Verified Stamp */}
          <div className="my-3 rounded-lg border border-border/70 bg-[#0B0B0B] p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-foreground font-medium">{t("bento.repairs.job")}</span>
              <Pill tone="jade">{t("bento.repairs.verified")}</Pill>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>{t("bento.repairs.disbursed")}</span>
              <span className="text-primary font-medium">{formatMAD(3800)}</span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground font-light">{t("bento.repairs.body")}</p>
        </BentoCard>

        {/* ========================================================
            TILE 5: Multi-Property Switching (1x1 Tile)
            ======================================================== */}
        <BentoCard className="flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-primary">
              {t("bento.switcher.tag")}
            </span>
            <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
              {t("bento.switcher.title")}
            </h3>
          </div>

          {/* Micro-visual: Selector pill cycling */}
          <div className="my-3 rounded-lg border border-border/70 bg-[#0B0B0B] p-2.5">
            <motion.div
              className="flex items-center justify-between text-xs p-1.5 rounded bg-[#181818] border border-primary/30"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <div className="flex items-center gap-2">
                <Layers className="size-3 text-primary" />
                <span className="font-medium text-foreground">The Aurora</span>
              </div>
              <span className="text-[9px] font-mono text-primary">
                {t("bento.switcher.active")}
              </span>
            </motion.div>
          </div>

          <p className="text-[11px] text-muted-foreground font-light">{t("bento.switcher.body")}</p>
        </BentoCard>

        {/* ========================================================
            TILE 6: Commission & Net Profit (2x1 Tile)
            ======================================================== */}
        <BentoCard className="md:col-span-2 lg:col-span-3 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#A2E8DD]">
              {t("bento.commission.tag")}
            </span>
            <h3 className="font-display text-xl sm:text-2xl uppercase tracking-wider text-foreground">
              {t("bento.commission.title")}
            </h3>
            <p className="text-xs text-muted-foreground font-light leading-relaxed">
              {t("bento.commission.body")}
            </p>
          </div>

          {/* Micro-visual: the same month, with the commission as its own line */}
          <PnlLedger
            className="my-4"
            gross={MONTH.gross}
            str={MONTH.str}
            ltr={MONTH.ltr}
            commissionPct={MONTH.commissionPct}
            commission={MONTH.commission}
            costs={MONTH.costs}
            net={MONTH.net}
          />

          <div className="text-[10px] uppercase font-mono text-muted-foreground">
            {t("bento.commission.footer")}
          </div>
        </BentoCard>
      </div>
    </section>
  );
}
