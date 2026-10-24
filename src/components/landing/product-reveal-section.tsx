import * as React from "react";
import { motion, useScroll, useTransform, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { formatMAD, formatPercent } from "@/lib/currency";
import { LUXURY_EASE } from "@/lib/motion";
import { AnimatedFigure } from "./animated-figure";
import { GradedImage } from "./graded-image";
import { MONTH, PEAK_MONTH_GROSS, PROPERTY_ROWS, YTD } from "./landing-figures";
import { Deduction, LTR_COLOR, PnlLedger, Pill, STR_COLOR, SplitBar } from "./landing-mockups";
import { useLandingLocale } from "./use-landing-locale";

/** Heatmap cells that are a peak rate night and a high-demand night. */
const PEAK_DAYS = [5, 11, 12, 19, 25, 26];
const HIGH_DAYS = [4, 10, 18, 24];

/** STR occupancy and average nightly rate shown for the month. */
const STR_OCCUPANCY = 82;
const AVERAGE_RATE = 1180;
const PEAK_RATE = 1450;
const CONFIRMED_BOOKINGS = 32;

export function ProductRevealSection() {
  const { t } = useTranslation("landing");
  const { weekdays, months } = useLandingLocale();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Determine active chapter (0, 1, or 2)
  const [activeChapter, setActiveChapter] = React.useState(0);

  React.useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      if (latest < 0.33) {
        setActiveChapter(0);
      } else if (latest < 0.66) {
        setActiveChapter(1);
      } else {
        setActiveChapter(2);
      }
    });
  }, [scrollYProgress]);

  // Thin gold progress line on the leading edge filling as you scroll
  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const formatDirhams = React.useCallback((value: number) => formatMAD(Math.round(value)), []);

  const chapters = [
    {
      id: "c1",
      stats: [
        { text: t("reveal.c1.statGross", { amount: formatMAD(YTD.gross) }), jade: false },
        { text: t("reveal.c1.statMargin", { margin: formatPercent(YTD.margin) }), jade: true },
      ],
    },
    {
      id: "c2",
      stats: [
        {
          text: t("reveal.c2.statOccupancy", {
            value: formatPercent(STR_OCCUPANCY, { decimals: 0 }),
          }),
          jade: false,
        },
        { text: t("reveal.c2.statRate", { amount: formatMAD(AVERAGE_RATE) }), jade: true },
      ],
    },
    {
      id: "c3",
      stats: [
        { text: t("reveal.c3.statProperties", { count: PROPERTY_ROWS.length }), jade: false },
        {
          text: t("reveal.c3.statCommission", { amount: formatMAD(MONTH.commission) }),
          jade: true,
        },
      ],
    },
  ] as const;

  const mockupTitles = [t("reveal.m1.title"), t("reveal.m2.title"), t("reveal.m3.title")];
  const callouts = [
    t("reveal.callout.c1", { margin: formatPercent(YTD.margin) }),
    t("reveal.callout.c2", { count: CONFIRMED_BOOKINGS }),
    t("reveal.callout.c3", { count: PROPERTY_ROWS.length }),
  ];

  return (
    <section
      id="product-reveal"
      ref={containerRef}
      // overflow-x-clip, not -hidden: the mockup below is sticky, and hidden would break that
      className="relative min-h-[300vh] overflow-x-clip bg-[#0B0B0B] px-6 sm:px-10 lg:px-16"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 size-[700px] rounded-full bg-primary/4 blur-[180px] -z-10" />

      <div className="mx-auto max-w-7xl">
        {/* 2 columns, 5/7 split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* ========================================================
              FIRST COLUMN (5 cols): 3 narrative chapters stacked vertically
              each ~100vh apart, with a thin gold progress line on the leading edge
              ======================================================== */}
          <div className="lg:col-span-5 relative ps-8 sm:ps-10">
            <div className="absolute start-0 top-16 bottom-16 w-[1.5px] bg-border/40">
              <motion.div
                className="w-full bg-gradient-to-b from-primary via-[#FFF1BE] to-primary shadow-[0_0_12px_rgba(212,175,55,0.6)]"
                style={{ height: prefersReduced ? "100%" : progressHeight }}
              />
            </div>

            {chapters.map((chapter, index) => (
              <div key={chapter.id} className="min-h-screen flex flex-col justify-center py-20">
                <div
                  className={`transition-opacity duration-500 space-y-4 ${
                    activeChapter === index ? "opacity-100" : "opacity-30"
                  }`}
                >
                  <div className="inline-flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-[0.25em] text-primary font-semibold">
                      0{index + 1}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-primary/80 whitespace-nowrap">
                      {t(`reveal.${chapter.id}.kicker`)}
                    </span>
                  </div>
                  <h3 className="font-display text-[34px] sm:text-[40px] leading-[1.15] text-[#F8F9FA] tracking-wide">
                    {t(`reveal.${chapter.id}.headline`)}
                  </h3>
                  <p className="text-[15px] sm:text-base text-muted-foreground font-light leading-relaxed max-w-md">
                    {t(`reveal.${chapter.id}.body`)}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-primary">
                    {chapter.stats.map((stat, statIndex) => (
                      <React.Fragment key={statIndex}>
                        {statIndex > 0 && <span>·</span>}
                        <span className={stat.jade ? "text-[#A2E8DD]" : ""}>{stat.text}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ========================================================
              SECOND COLUMN (7 cols): sticky mockup frame (top: 15vh)
              Refined frame with a 1px gold hairline and 24px radius
              ======================================================== */}
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-[15vh] py-12 lg:py-0">
              <div className="relative overflow-hidden rounded-[24px] border border-primary/30 bg-[#141414] p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl min-h-[560px] flex flex-col justify-between">
                {/* Subtle internal gold gradient accent */}
                <div className="pointer-events-none absolute -top-24 -end-24 size-60 rounded-full bg-primary/10 blur-[80px]" />

                {/* Top header inside the frame */}
                <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-4 mb-6">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="size-2 shrink-0 rounded-full bg-primary" />
                    <span className="font-display text-base uppercase tracking-wider text-foreground truncate">
                      {mockupTitles[activeChapter]}
                    </span>
                  </div>
                  <Pill tone="gold" className="shrink-0 tracking-widest">
                    {t("reveal.live")}
                  </Pill>
                </div>

                {/* Morphed stage content per chapter */}
                <div className="flex-1 flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {/* 01 → Net profit, margin gauge, the P&L with its commission line, and the trend */}
                    {activeChapter === 0 && (
                      <motion.div
                        key="chapter-01"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.5, ease: LUXURY_EASE }}
                        className="space-y-5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                          <div className="sm:col-span-7 space-y-1">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                              {t("reveal.m1.netProfit")}
                            </p>
                            <div className="font-display text-3xl sm:text-4xl lg:text-5xl text-primary font-medium tracking-tight">
                              <AnimatedFigure value={YTD.net} format={formatDirhams} />
                            </div>
                          </div>

                          {/* Margin ring gauge */}
                          <div className="sm:col-span-5 flex items-center justify-start sm:justify-end gap-3.5">
                            <div className="relative size-18 sm:size-20 flex items-center justify-center">
                              <svg className="size-full -rotate-90" viewBox="0 0 72 72">
                                <circle
                                  cx="36"
                                  cy="36"
                                  r="30"
                                  className="stroke-[#222]"
                                  strokeWidth="5"
                                  fill="none"
                                />
                                <motion.circle
                                  cx="36"
                                  cy="36"
                                  r="30"
                                  stroke="#D4AF37"
                                  strokeWidth="5"
                                  strokeDasharray="188.4"
                                  initial={{ strokeDashoffset: 188.4 }}
                                  animate={{ strokeDashoffset: 188.4 * (1 - YTD.margin / 100) }}
                                  transition={{ duration: 1.4, ease: LUXURY_EASE }}
                                  strokeLinecap="round"
                                  fill="none"
                                />
                              </svg>
                              <span className="absolute font-mono text-xs font-semibold text-[#A2E8DD]">
                                {formatPercent(YTD.margin)}
                              </span>
                            </div>
                            <div>
                              <p className="text-[11px] font-mono uppercase text-foreground font-semibold">
                                {t("reveal.m1.margin")}
                              </p>
                              <p className="text-[11px] text-[#A2E8DD] font-mono">
                                {t("reveal.m1.vsPrior", {
                                  delta: formatPercent(14.8, { signed: true }),
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Gross revenue, the STR / LTR split, the commission line and the costs */}
                        <PnlLedger
                          gross={YTD.gross}
                          str={YTD.str}
                          ltr={YTD.ltr}
                          commissionPct={MONTH.commissionPct}
                          commission={YTD.commission}
                          costs={YTD.costs}
                          net={YTD.net}
                        />

                        {/* Smooth 12-month gold area chart */}
                        <div className="space-y-1.5 rounded-xl border border-border/70 bg-[#0B0B0B]/80 p-4">
                          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
                            <span>{t("reveal.m1.trajectory")}</span>
                            <span className="text-primary font-medium">
                              {t("reveal.m1.peak", { amount: formatMAD(PEAK_MONTH_GROSS) })}
                            </span>
                          </div>
                          <div dir="ltr" className="relative h-20 w-full">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 360 80">
                              <defs>
                                <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.32" />
                                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              <motion.path
                                d="M 0 68 Q 30 62 60 55 T 120 48 T 180 34 T 240 28 T 300 16 T 360 8 L 360 80 L 0 80 Z"
                                fill="url(#goldAreaGrad)"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1.2 }}
                              />
                              <motion.path
                                d="M 0 68 Q 30 62 60 55 T 120 48 T 180 34 T 240 28 T 300 16 T 360 8"
                                fill="none"
                                stroke="#D4AF37"
                                strokeWidth="2"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.6, ease: LUXURY_EASE }}
                              />
                            </svg>
                          </div>
                          <div
                            dir="ltr"
                            className="flex justify-between text-[10px] font-mono text-muted-foreground/80 px-1"
                          >
                            {months.map((month, index) => (
                              <span key={index}>{month}</span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 02 → STR calendar heatmap, then what the month's bookings earn after commission */}
                    {activeChapter === 1 && (
                      <motion.div
                        key="chapter-02"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.5, ease: LUXURY_EASE }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                              {t("reveal.m2.heading")}
                            </p>
                            <p className="font-display text-2xl text-foreground mt-0.5">
                              {t("reveal.m2.sub")}
                            </p>
                          </div>
                          <div className="text-end font-mono text-xs text-[#A2E8DD]">
                            {t("reveal.m2.bookings", { count: CONFIRMED_BOOKINGS })}
                          </div>
                        </div>

                        <div className="rounded-xl border border-border/70 bg-[#0B0B0B]/80 p-4 space-y-3">
                          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                            {weekdays.map((day) => (
                              <div
                                key={day}
                                className="text-center text-[10px] font-mono text-muted-foreground uppercase"
                              >
                                {day}
                              </div>
                            ))}
                            {Array.from({ length: 28 }).map((_, index) => {
                              const isPeak = PEAK_DAYS.includes(index);
                              const isHigh = HIGH_DAYS.includes(index);

                              return (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.7 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{
                                    duration: 0.35,
                                    delay: index * 0.02,
                                    ease: LUXURY_EASE,
                                  }}
                                  className={`h-7 sm:h-8 rounded border flex items-center justify-center text-[10px] font-mono transition-transform hover:scale-110 cursor-pointer ${
                                    isPeak
                                      ? "bg-[#D4AF37] border-[#FFF1BE] text-[#0B0B0B] font-bold shadow-[0_0_12px_rgba(212,175,55,0.5)]"
                                      : isHigh
                                        ? "bg-primary/20 border-primary/35 text-primary"
                                        : "bg-[#141414] border-white/5 text-muted-foreground/80"
                                  }`}
                                >
                                  {index + 1}
                                </motion.div>
                              );
                            })}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground pt-2 border-t border-border/40 font-mono">
                            <div className="flex items-center gap-2">
                              <span className="size-2 rounded bg-[#141414] border border-white/10" />
                              <span>{t("reveal.m2.legendStandard")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="size-2 rounded bg-primary/25 border border-primary/40" />
                              <span>{t("reveal.m2.legendHigh")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="size-2.5 rounded bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.6)]" />
                              <span className="text-primary font-medium">
                                {t("reveal.m2.legendPeak", { amount: formatMAD(PEAK_RATE) })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* What those stays earn: gross, the commission line, and the owner's share */}
                        <div className="space-y-2 rounded-xl border border-border/70 bg-[#0B0B0B]/80 p-4 text-xs">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-foreground font-medium">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: STR_COLOR }}
                              />
                              {t("reveal.m2.strGross")}
                            </span>
                            <span className="font-mono text-foreground">
                              {formatMAD(MONTH.str)}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between gap-3 rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-2">
                            <span className="font-medium text-primary">
                              {t("mock.commission", { pct: MONTH.commissionPct })}
                            </span>
                            <span className="font-mono text-primary">
                              <Deduction amount={(MONTH.str * MONTH.commissionPct) / 100} />
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-2">
                            <span className="font-semibold text-foreground">
                              {t("reveal.m2.ownerShare")}
                            </span>
                            <span className="font-mono text-sm font-semibold text-primary">
                              {formatMAD(MONTH.str - (MONTH.str * MONTH.commissionPct) / 100)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 03 → Property ledger: each property's STR / LTR revenue and commission */}
                    {activeChapter === 2 && (
                      <motion.div
                        key="chapter-03"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.5, ease: LUXURY_EASE }}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3 pb-1">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                            {t("reveal.m3.heading")}
                          </p>
                          <span className="text-[11px] font-mono text-primary">
                            {t("reveal.m3.total", { amount: formatMAD(MONTH.gross) })}
                          </span>
                        </div>

                        {PROPERTY_ROWS.map((property, i) => {
                          const gross = property.str + property.ltr;
                          const commission = (gross * MONTH.commissionPct) / 100;
                          return (
                            <motion.div
                              key={property.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.45, delay: i * 0.08, ease: LUXURY_EASE }}
                              className="rounded-xl border border-border/70 bg-[#0B0B0B]/80 p-3 sm:p-3.5 hover:border-primary/40 transition-colors space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <GradedImage
                                    src={property.image}
                                    alt={property.name}
                                    className="size-11 sm:size-12 rounded-lg shrink-0 border border-primary/20"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-display text-base text-foreground tracking-wide truncate">
                                      {property.name}
                                    </p>
                                    <div className="flex items-center gap-1.5 pt-0.5">
                                      {property.str > 0 && <Pill tone="gold">{t("mock.str")}</Pill>}
                                      {property.ltr > 0 && <Pill tone="jade">{t("mock.ltr")}</Pill>}
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0 text-end space-y-0.5">
                                  <p className="font-mono text-xs sm:text-sm text-foreground font-medium whitespace-nowrap">
                                    {t("reveal.m3.perMonth", { amount: formatMAD(gross) })}
                                  </p>
                                  <p className="font-mono text-[11px] text-primary whitespace-nowrap">
                                    {t("reveal.m3.commission", { amount: formatMAD(commission) })}
                                  </p>
                                </div>
                              </div>
                              <SplitBar str={property.str} ltr={property.ltr} />
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Callout card anchored inside the frame */}
                <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 rounded-lg border border-primary/30 bg-[#0B0B0B] px-3.5 py-2 shadow-md min-w-0">
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="font-mono text-xs text-foreground font-medium truncate">
                      {callouts[activeChapter]}
                    </span>
                  </div>

                  <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest whitespace-nowrap hidden sm:inline-block">
                    {t("reveal.chapterOf", { current: activeChapter + 1, total: 3 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
