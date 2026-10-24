import * as React from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatMAD, formatPercent } from "@/lib/currency";
import { LUXURY_EASE } from "@/lib/motion";
import { GradedImage } from "./graded-image";
import { RESIDENCE_FIGURES } from "./landing-figures";
import { Deduction, Pill, SplitBar } from "./landing-mockups";

interface ResidenceItem {
  id: string;
  num: string;
  name: string;
  occupancy: number;
  image: string;
}

/** Names are proper nouns and stay as they are in every language; the rest comes from the locale files. */
const RESIDENCES: ResidenceItem[] = [
  {
    id: "harbour",
    num: "01",
    name: "Harbour House",
    occupancy: 94.8,
    image: "/images/property-harbour.jpg",
  },
  {
    id: "aurora",
    num: "02",
    name: "The Aurora",
    occupancy: 98.2,
    image: "/images/property-aurora.jpg",
  },
  {
    id: "palm",
    num: "03",
    name: "Palm Residences",
    occupancy: 92.6,
    image: "/images/property-palm.jpg",
  },
  {
    id: "marina",
    num: "04",
    name: "Marina House",
    occupancy: 95.4,
    image: "/images/property-marina.jpg",
  },
  {
    id: "skyline",
    num: "05",
    name: "Skyline Tower",
    occupancy: 96.1,
    image: "/images/property-skyline.jpg",
  },
  {
    id: "garden",
    num: "06",
    name: "Garden Court",
    occupancy: 93.9,
    image: "/images/property-gardencourt.jpg",
  },
];

const COMMISSION_PCT = 20;

/** A residence's month in dirhams: what it earned, the STR / LTR split and the commission taken. */
function ResidenceLedger({ id }: { id: string }) {
  const { t } = useTranslation("landing");
  const { str, ltr } = RESIDENCE_FIGURES[id] ?? { str: 0, ltr: 0 };
  const gross = str + ltr;
  const commission = (gross * COMMISSION_PCT) / 100;

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-[#141414]/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5">
          {str > 0 && <Pill tone="gold">{t("mock.str")}</Pill>}
          {ltr > 0 && <Pill tone="jade">{t("mock.ltr")}</Pill>}
        </div>
        <p className="font-mono text-sm font-medium text-foreground">
          {t("marquee.perMonth", { amount: formatMAD(gross) })}
        </p>
      </div>
      <SplitBar str={str} ltr={ltr} />
      <div className="flex items-baseline justify-between gap-3 rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-2 text-xs">
        <span className="font-medium text-primary">
          {t("mock.commission", { pct: COMMISSION_PCT })}
        </span>
        <span className="font-mono font-medium text-primary">
          <Deduction amount={commission} />
        </span>
      </div>
    </div>
  );
}

export function PropertyMarqueeSection() {
  const { t } = useTranslation("landing");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  // Auto-cycle every 5s when idle; pauses on hover
  React.useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % RESIDENCES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isHovered]);

  // The index always wraps within the list
  const activeResidence = RESIDENCES[selectedIndex] as ResidenceItem;
  const unitOf = (id: string) => t(`marquee.items.${id}.unit`);

  return (
    <section
      id="signature-residences"
      className="relative min-h-screen overflow-hidden py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-[#0B0B0B] border-t border-border/70 flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-1/2 end-1/4 -translate-y-1/2 size-[600px] rounded-full bg-primary/4 blur-[180px] -z-10" />

      <div className="mx-auto max-w-7xl w-full space-y-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-6">
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary">
              {t("marquee.kicker")}
            </p>
            <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-[0.12em] text-foreground">
              {t("marquee.title")}
            </h2>
          </div>
          <p className="text-[15px] text-muted-foreground font-light max-w-md leading-relaxed">
            {t("marquee.subtitle")}
          </p>
        </div>

        {/* ========================================================
            DESKTOP LAYOUT (2 Columns, 5/7 Split, 100vh)
            ======================================================== */}
        <div className="hidden lg:grid grid-cols-12 gap-12 xl:gap-16 items-center">
          {/* First Column (5 cols): Vertical Index List */}
          <div className="col-span-5 space-y-0 border-t border-primary/20">
            {RESIDENCES.map((res, index) => {
              const isSelected = selectedIndex === index;
              return (
                <div
                  key={res.id}
                  onClick={() => setSelectedIndex(index)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className="group relative cursor-pointer border-b border-primary/20 py-5 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    {/* Number and Name with 12px shift on hover */}
                    <div className="flex items-baseline gap-4 min-w-0">
                      <span className="font-mono text-[13px] text-primary font-medium shrink-0">
                        {res.num}
                      </span>
                      <div className="relative overflow-hidden ltr:pe-3 rtl:ps-3">
                        <span
                          className={`font-display text-[36px] xl:text-[44px] leading-tight tracking-wide block transition-all duration-300 ${
                            isSelected
                              ? "ltr:translate-x-3 rtl:-translate-x-3 text-primary"
                              : "text-[#F8F9FA] group-hover:ltr:translate-x-3 group-hover:rtl:-translate-x-3 group-hover:text-primary"
                          }`}
                        >
                          {res.name}
                        </span>

                        {/* Thin gold line growing under the name */}
                        <div
                          className={`h-[1.5px] bg-primary transition-transform duration-300 ltr:origin-left rtl:origin-right mt-1 ${
                            isSelected
                              ? "scale-x-100 ltr:translate-x-3 rtl:-translate-x-3"
                              : "scale-x-0 group-hover:scale-x-100 group-hover:ltr:translate-x-3 group-hover:rtl:-translate-x-3"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Unit tag in small caps at the end */}
                    <span
                      className={`text-[11px] uppercase tracking-[0.2em] font-mono whitespace-nowrap transition-colors ${
                        isSelected
                          ? "text-primary font-semibold"
                          : "text-muted-foreground group-hover:text-primary/90"
                      }`}
                    >
                      {unitOf(res.id)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Second Column (7 cols): Large 4:5 image frame with 12px inset gold border & clip-path reveal */}
          <div className="col-span-7 flex flex-col justify-center">
            <div className="relative w-full max-w-[560px] mx-auto">
              {/* 4:5 Aspect Ratio Frame with 12px radius */}
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[12px] border border-primary/30 bg-[#141414] shadow-[0_25px_80px_rgba(0,0,0,0.9)]">
                {/* Thin gold inset border 12px inside the edge */}
                <div className="pointer-events-none absolute inset-3 z-20 rounded-[8px] border border-primary/30" />

                {/* Clip-Path Animated Image Reveal (inset(100% 0 0 0) -> inset(0), 0.8s, plus 1.05 -> 1 scale) */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeResidence.id}
                    initial={{ clipPath: "inset(100% 0 0 0)", scale: 1.05 }}
                    animate={{ clipPath: "inset(0% 0 0 0)", scale: 1.0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: LUXURY_EASE }}
                    className="absolute inset-0 size-full"
                  >
                    <GradedImage
                      src={activeResidence.image}
                      alt={activeResidence.name}
                      className="size-full"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Subtitle tag inside the top corner of the image */}
                <div className="absolute top-6 end-6 z-20">
                  <span className="rounded-full border border-primary/30 bg-[#0B0B0B]/80 backdrop-blur-md px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-primary whitespace-nowrap">
                    {unitOf(activeResidence.id)}
                  </span>
                </div>
              </div>

              {/* Caption Row Below the Image: Location, Bedrooms, Occupancy, Call to action */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 px-2 text-xs">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground font-mono">
                  <span className="text-foreground font-medium">
                    {t(`marquee.items.${activeResidence.id}.location`)}
                  </span>
                  <span>·</span>
                  <span>{t(`marquee.items.${activeResidence.id}.bedrooms`)}</span>
                  <span>·</span>
                  <span className="text-[#A2E8DD] font-medium">
                    {t("marquee.occupancy", { value: formatPercent(activeResidence.occupancy) })}
                  </span>
                </div>

                <Link
                  to="/signup"
                  className="group/link inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] font-semibold text-primary hover:text-[#FFF1BE] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span>{t("marquee.cta")}</span>
                  <ArrowRight className="size-3.5 rtl-flip transition-transform duration-300 group-hover/link:ltr:translate-x-1.5 group-hover/link:rtl:-translate-x-1.5" />
                </Link>
              </div>

              <div className="mt-4">
                <ResidenceLedger key={activeResidence.id} id={activeResidence.id} />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            MOBILE LAYOUT: Swipeable full-width carousel without arch masks
            ======================================================== */}
        <div className="lg:hidden space-y-6">
          <div className="relative aspect-[4/5] w-full max-w-md mx-auto overflow-hidden rounded-xl border border-primary/30 bg-[#141414] shadow-2xl">
            <div className="pointer-events-none absolute inset-2.5 z-20 rounded-lg border border-primary/30" />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeResidence.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="size-full"
              >
                <GradedImage
                  src={activeResidence.image}
                  alt={activeResidence.name}
                  className="size-full"
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-x-4 bottom-4 z-20">
              <span className="font-mono text-xs text-primary font-bold">
                {activeResidence.num}
              </span>
              <h3 className="font-display text-2xl text-foreground uppercase tracking-wide">
                {activeResidence.name}
              </h3>
            </div>
          </div>

          {/* Mobile Caption & Controls */}
          <div className="max-w-md mx-auto space-y-4 px-1">
            <div className="flex items-center justify-between gap-3 text-xs font-mono text-muted-foreground">
              <span>{t(`marquee.items.${activeResidence.id}.location`)}</span>
              <span className="text-[#A2E8DD] text-end">
                {t("marquee.occupancy", { value: formatPercent(activeResidence.occupancy) })}
              </span>
            </div>

            <ResidenceLedger key={activeResidence.id} id={activeResidence.id} />

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setSelectedIndex((prev) => (prev === 0 ? RESIDENCES.length - 1 : prev - 1))
                  }
                  className="size-9 rounded-full border border-primary/30 bg-[#141414] flex items-center justify-center text-primary"
                  aria-label={t("marquee.previous")}
                >
                  <ChevronLeft className="size-4 rtl-flip" />
                </button>
                <button
                  onClick={() => setSelectedIndex((prev) => (prev + 1) % RESIDENCES.length)}
                  className="size-9 rounded-full border border-primary/30 bg-[#141414] flex items-center justify-center text-primary"
                  aria-label={t("marquee.next")}
                >
                  <ChevronRight className="size-4 rtl-flip" />
                </button>
              </div>

              <Link
                to="/signup"
                className="text-xs uppercase tracking-[0.16em] text-primary font-semibold flex items-center gap-1"
              >
                <span>{t("marquee.cta")}</span>
                <ArrowRight className="size-3.5 rtl-flip" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
