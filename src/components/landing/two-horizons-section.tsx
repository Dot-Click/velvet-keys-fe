import * as React from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarClock, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LUXURY_EASE } from "@/lib/motion";
import { formatMAD, formatPercent } from "@/lib/currency";
import { AnimatedFigure } from "./animated-figure";
import { GradedImage } from "./graded-image";
import {
  CONCIERGE_MONTH,
  LEASE_ROWS,
  MONTH,
  RENT_COLLECTED,
  RENT_EXPECTED,
  share,
} from "./landing-figures";
import { Deduction, LTR_COLOR, PnlLedger, Pill, SplitBar } from "./landing-mockups";
import { useLandingLocale } from "./use-landing-locale";

const ROLES = ["owner", "conciergerie", "ltr"] as const;
type Role = (typeof ROLES)[number];

/** Accent colour, ambient glow and picture for each of the three horizons. */
const ROLE_STYLE: Record<
  Role,
  { accent: string; glow: string; border: string; image: string; bg: string; text: string }
> = {
  owner: {
    accent: "#D4AF37",
    glow: "rgba(212, 175, 55, 0.04)",
    border: "rgba(212, 175, 55, 0.35)",
    image: "/images/executive-interior.jpg",
    bg: "bg-primary",
    text: "border-primary/30 bg-primary/10 text-primary",
  },
  conciergerie: {
    accent: "#A2E8DD",
    glow: "rgba(162, 232, 221, 0.04)",
    border: "rgba(162, 232, 221, 0.35)",
    image: "/images/concierge-hub.jpg",
    bg: "bg-[#A2E8DD]",
    text: "border-[#A2E8DD]/30 bg-[#A2E8DD]/10 text-[#A2E8DD]",
  },
  ltr: {
    accent: "#FFF1BE",
    glow: "rgba(255, 241, 190, 0.035)",
    border: "rgba(255, 241, 190, 0.35)",
    image: "/images/property-skyline.jpg",
    bg: "bg-[#FFF1BE]",
    text: "border-[#FFF1BE]/30 bg-[#FFF1BE]/10 text-[#FFF1BE]",
  },
};

const formatDirhams = (value: number) => formatMAD(Math.round(value));

function MockupHeader({ dot, title, pill }: { dot: string; title: string; pill: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
        <span className="truncate font-display text-sm sm:text-base uppercase tracking-wider text-foreground">
          {title}
        </span>
      </div>
      {pill}
    </div>
  );
}

/** Owner: the month in dirhams, from gross revenue through the commission line to net profit. */
function OwnerMockup() {
  const { t } = useTranslation("landing");
  const { monthYear } = useLandingLocale();
  return (
    <div className="space-y-4">
      <MockupHeader
        dot={ROLE_STYLE.owner.accent}
        title={t("twoHorizons.owner.mockTitle")}
        pill={<Pill tone="jade">{monthYear}</Pill>}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 rounded-xl border border-border/80 bg-[#0B0B0B]/85 p-3.5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {t("twoHorizons.owner.netProfit")}
          </p>
          <p className="font-display text-xl font-medium tracking-tight text-primary sm:text-2xl">
            <AnimatedFigure value={MONTH.net} format={formatDirhams} />
          </p>
          <p className="font-mono text-[10px] text-[#A2E8DD]">
            {t("twoHorizons.owner.vsPrior", { delta: formatPercent(14.8, { signed: true }) })}
          </p>
        </div>
        <div className="space-y-1 rounded-xl border border-border/80 bg-[#0B0B0B]/85 p-3.5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {t("twoHorizons.owner.netMargin")}
          </p>
          <p className="font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl">
            <AnimatedFigure
              value={(MONTH.net / MONTH.gross) * 100}
              format={(value) => formatPercent(value)}
            />
          </p>
          <p className="font-mono text-[10px] text-primary">
            {t("twoHorizons.owner.afterCommission")}
          </p>
        </div>
      </div>

      <PnlLedger
        gross={MONTH.gross}
        str={MONTH.str}
        ltr={MONTH.ltr}
        commissionPct={MONTH.commissionPct}
        commission={MONTH.commission}
        costs={MONTH.costs}
        net={MONTH.net}
      />
    </div>
  );
}

/** Conciergerie: today's dispatch, and the commission earned across every owner this month. */
function ConciergerieMockup() {
  const { t } = useTranslation("landing");
  const { sign } = useLandingLocale();
  const events = [0, 1].map((index) => ({
    title: t(`twoHorizons.conciergerie.events.${index}.title`),
    sub: t(`twoHorizons.conciergerie.events.${index}.sub`),
    tag: t(`twoHorizons.conciergerie.events.${index}.tag`),
    tone: index === 0 ? ("jade" as const) : ("gold" as const),
  }));
  const strCommission = CONCIERGE_MONTH.strCommission;
  const ltrCommission = CONCIERGE_MONTH.ltrCommission;

  return (
    <div className="space-y-3.5">
      <MockupHeader
        dot={ROLE_STYLE.conciergerie.accent}
        title={t("twoHorizons.conciergerie.mockTitle")}
        pill={<Pill tone="gold">{t("twoHorizons.conciergerie.mockPill")}</Pill>}
      />

      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.title}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-[#0B0B0B]/80 px-3 py-2 text-xs"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{event.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">{event.sub}</p>
            </div>
            <Pill tone={event.tone}>{event.tag}</Pill>
          </div>
        ))}

        <motion.div
          className="flex items-center justify-between gap-3 rounded-lg border border-[#A2E8DD]/30 bg-[#161616] p-2.5"
          initial={{ x: -20 * sign, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Wrench className="size-3 shrink-0 text-[#A2E8DD]" />
            <span className="truncate text-xs font-medium text-foreground">
              {t("twoHorizons.conciergerie.repair")}
            </span>
          </div>
          <span className="whitespace-nowrap font-mono text-[10px] font-semibold text-[#A2E8DD]">
            {formatMAD(4200)}
          </span>
        </motion.div>
      </div>

      {/* Commission earned this month, short stays and long leases separately */}
      <div className="space-y-2.5 rounded-xl border border-border/70 bg-[#0B0B0B]/80 p-4 text-xs">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {t("twoHorizons.conciergerie.earnedHeading")}
        </p>
        <SplitBar str={CONCIERGE_MONTH.strGross} ltr={CONCIERGE_MONTH.ltrGross} />
        <div className="flex items-baseline justify-between gap-3 text-muted-foreground">
          <span>
            {t("twoHorizons.conciergerie.strCommission", { pct: CONCIERGE_MONTH.commissionPct })}
          </span>
          <span className="font-mono text-foreground" dir="ltr">
            +{formatMAD(strCommission)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3 text-muted-foreground">
          <span>
            {t("twoHorizons.conciergerie.ltrCommission", { pct: CONCIERGE_MONTH.commissionPct })}
          </span>
          <span className="font-mono text-foreground" dir="ltr">
            +{formatMAD(ltrCommission)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3 rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-2">
          <span className="font-semibold text-primary">{t("twoHorizons.conciergerie.earned")}</span>
          <span className="font-mono text-sm font-semibold text-primary">
            <AnimatedFigure value={strCommission + ltrCommission} format={formatDirhams} />
          </span>
        </div>
      </div>
    </div>
  );
}

/** Long-term rentals: four leases, who has paid, and the commission on what was collected. */
function LeasesMockup() {
  const { t } = useTranslation("landing");
  const { dayOfMonth, monthYear } = useLandingLocale();
  const reduced = useReducedMotion();
  const collectedShare = share(RENT_COLLECTED, RENT_EXPECTED);
  const commission = (RENT_COLLECTED * MONTH.commissionPct) / 100;

  return (
    <div className="space-y-3.5">
      <MockupHeader
        dot={LTR_COLOR}
        title={t("twoHorizons.ltr.mockTitle")}
        pill={<Pill tone="jade">{monthYear}</Pill>}
      />

      {/* Collected against expected */}
      <div className="space-y-2 rounded-xl border border-border/70 bg-[#0B0B0B]/80 p-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {t("twoHorizons.ltr.collected")}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {t("twoHorizons.ltr.ofExpected", { amount: formatMAD(RENT_EXPECTED) })}
          </span>
        </div>
        <p className="font-display text-xl font-medium tracking-tight text-[#A2E8DD] sm:text-2xl">
          <AnimatedFigure value={RENT_COLLECTED} format={formatDirhams} />
        </p>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-[#1C1C1C]"
          role="img"
          aria-label={t("twoHorizons.ltr.progressLabel", {
            value: formatPercent(collectedShare, { decimals: 0 }),
          })}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#A2E8DD] to-[#FFF1BE]"
            initial={{ width: reduced ? `${collectedShare}%` : 0 }}
            animate={{ width: `${collectedShare}%` }}
            transition={{ duration: 1.2, ease: LUXURY_EASE }}
          />
        </div>
      </div>

      {/* The leases */}
      <div className="space-y-1.5">
        {LEASE_ROWS.map((lease, index) => (
          <motion.div
            key={lease.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + index * 0.07, ease: LUXURY_EASE }}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-[#0B0B0B]/80 px-3 py-2 text-xs"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {t(`twoHorizons.ltr.leases.${lease.id}.tenant`)}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {t(`twoHorizons.ltr.leases.${lease.id}.unit`)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="font-mono text-foreground">{formatMAD(lease.rent)}</span>
              {lease.state === "paid" && <Pill tone="jade">{t("twoHorizons.ltr.paid")}</Pill>}
              {lease.state === "due" && (
                <Pill tone="gold">
                  {t("twoHorizons.ltr.dueOn", { date: dayOfMonth(lease.dueDay) })}
                </Pill>
              )}
              {lease.state === "late" && <Pill tone="ruby">{t("twoHorizons.ltr.late")}</Pill>}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/[0.05] px-3 py-2 text-[11px] text-muted-foreground">
        <CalendarClock className="size-3.5 shrink-0 text-primary" />
        <span className="truncate">{t("twoHorizons.ltr.endingAlert", { days: 45 })}</span>
      </div>

      <div className="flex items-baseline justify-between gap-3 rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-2 text-xs">
        <span className="font-medium text-primary">
          {t("twoHorizons.ltr.commission", { pct: MONTH.commissionPct })}
        </span>
        <span className="font-mono font-medium text-primary">
          <Deduction amount={commission} />
        </span>
      </div>
    </div>
  );
}

export function TwoHorizonsSection() {
  const { t } = useTranslation(["landing", "common"]);
  const { sign } = useLandingLocale();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const [role, setRole] = React.useState<Role>("owner");
  const [hasInteracted, setHasInteracted] = React.useState(false);

  // Parallax between back image and front overlapping mockup
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const backImageY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const frontMockupY = useTransform(scrollYProgress, [0, 1], ["4%", "-4%"]);

  // Auto-switch every 8s until user interacts
  React.useEffect(() => {
    if (hasInteracted) return;

    const timer = setInterval(() => {
      setRole((prev) => ROLES[(ROLES.indexOf(prev) + 1) % ROLES.length] ?? "owner");
    }, 8000);

    return () => clearInterval(timer);
  }, [hasInteracted]);

  const handleToggle = (newRole: Role) => {
    setHasInteracted(true);
    setRole(newRole);
  };

  const style = ROLE_STYLE[role];
  const roleIndex = ROLES.indexOf(role);
  // The account type that the link at the end of the copy opens the sign-up form with
  const signupSearch = role === "ltr" ? {} : { type: role };

  return (
    <section
      id="two-horizons"
      ref={containerRef}
      className="relative min-h-[90vh] py-24 sm:py-32 px-6 sm:px-10 lg:px-16 bg-[#0B0B0B] border-t border-border/70 overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute top-1/2 start-1/3 -translate-y-1/2 size-[650px] rounded-full blur-[190px] -z-10 transition-colors duration-700"
        style={{ backgroundColor: style.glow }}
      />

      <div className="mx-auto max-w-7xl w-full space-y-16">
        {/* ========================================================
            CENTERED SEGMENTED TOGGLE AT TOP
            [ Owner | Conciergerie | Long-term rentals ]
            The pill takes the colour of the horizon it is on
            ======================================================== */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground font-mono">
            {t("landing:twoHorizons.label")}
          </p>

          <div
            role="tablist"
            aria-label={t("landing:twoHorizons.label")}
            className="relative grid w-full max-w-xl grid-cols-3 rounded-full border border-border/80 bg-[#141414] p-1.5 shadow-2xl"
          >
            {/* Sliding Pill Indicator */}
            <motion.div
              className={`absolute inset-y-1.5 start-1.5 w-[calc((100%-12px)/3)] rounded-full shadow-lg transition-colors duration-500 ${style.bg}`}
              initial={false}
              animate={{ x: `${sign * roleIndex * 100}%` }}
              transition={{ duration: 0.45, ease: LUXURY_EASE }}
            />

            {ROLES.map((id) => (
              <button
                key={id}
                role="tab"
                aria-selected={role === id}
                onClick={() => handleToggle(id)}
                className={`relative z-10 flex min-h-11 items-center justify-center px-2 py-2.5 text-center text-[10px] font-semibold uppercase leading-tight tracking-[0.1em] transition-colors duration-300 cursor-pointer sm:px-4 sm:text-xs sm:tracking-[0.18em] ${
                  role === id ? "text-[#0B0B0B]" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`landing:twoHorizons.tabs.${id}`)}
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================
            FULL-WIDTH STAGE (2 Columns, 5/7 Split, min-height 80vh)
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center min-h-[75vh]">
          {/* First Column (5 cols): Badge, 56px headline, 3-line body, 3 feature rows, link */}
          <div className="lg:col-span-5 space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: LUXURY_EASE }}
                className="space-y-6"
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2">
                  <span
                    className={`rounded-full px-3.5 py-1 text-[11px] font-mono uppercase tracking-[0.22em] font-semibold whitespace-nowrap border transition-colors duration-500 ${style.text}`}
                  >
                    {t(`landing:twoHorizons.${role}.badge`)}
                  </span>
                </div>

                {/* 56px Serif Headline (max 2 lines, never clipped, masked reveal) */}
                <div className="overflow-hidden">
                  <motion.h3
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.6, ease: LUXURY_EASE }}
                    className="font-display text-4xl sm:text-[56px] leading-[1.08] tracking-wide text-foreground"
                  >
                    {t(`landing:twoHorizons.${role}.headline`)}
                  </motion.h3>
                </div>

                {/* 3 lines of body copy (minimum 15px text) */}
                <p className="text-[15px] sm:text-base text-muted-foreground font-light leading-relaxed">
                  {t(`landing:twoHorizons.${role}.body`)}
                </p>

                {/* 3 Feature Rows with ✦ icon, bold title, one-line description */}
                <div className="space-y-4 pt-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span
                        className="text-base leading-none transition-colors duration-500 mt-1 shrink-0"
                        style={{ color: style.accent }}
                      >
                        ✦
                      </span>
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground text-[15px] leading-snug">
                          {t(`landing:twoHorizons.${role}.features.${i}.title`)}
                        </p>
                        <p className="text-sm text-muted-foreground font-light leading-relaxed">
                          {t(`landing:twoHorizons.${role}.features.${i}.desc`)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Link to sign up (accent colour follows the horizon) */}
                <div className="pt-2">
                  <Link
                    to="/signup"
                    search={signupSearch}
                    className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold transition-colors duration-500 whitespace-nowrap cursor-pointer"
                    style={{ color: style.accent }}
                  >
                    <span>{t(`landing:twoHorizons.${role}.cta`)}</span>
                    <ArrowRight className="size-3.5 rtl-flip transition-transform duration-300 group-hover:ltr:translate-x-1.5 group-hover:rtl:-translate-x-1.5" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Second Column (7 cols): Layered composition
              - Back layer: Graded interior image (85% width)
              - Front layer: Product mockup card overlapping the image, pulled up over its lower edge
              - Subtle scroll parallax between layers
          */}
          <div className="lg:col-span-7 relative flex justify-end">
            <div className="relative w-full max-w-[580px] pb-4">
              {/* Back Layer: Graded Interior Image (85% width, aligned to the end) */}
              <motion.div
                className="ms-auto w-[82%] sm:w-[85%] aspect-[16/11] rounded-2xl overflow-hidden border border-primary/25 shadow-2xl relative"
                style={{ y: prefersReduced ? 0 : backImageY }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={role}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="size-full"
                  >
                    <GradedImage
                      src={style.image}
                      alt={t(`landing:twoHorizons.${role}.imageAlt`)}
                      className="size-full"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Back Image Corner Label */}
                <div className="absolute top-4 end-4 z-10">
                  <span className="rounded-full border border-primary/30 bg-[#0B0B0B]/80 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-primary">
                    {t(`landing:twoHorizons.${role}.imageLabel`)}
                  </span>
                </div>
              </motion.div>

              {/* Front Overlapping Layer: Product Mockup Card
                  Pulled up over the picture, with a strong shadow and a gold, jade or champagne hairline
              */}
              <motion.div
                className="relative z-20 -mt-24 sm:-mt-32 w-[94%] sm:w-[88%] min-h-[470px] rounded-2xl border bg-[#141414] p-5 sm:p-6 shadow-[0_30px_90px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-colors duration-500"
                style={{
                  y: prefersReduced ? 0 : frontMockupY,
                  borderColor: style.border,
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={role}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={{ duration: 0.5, ease: LUXURY_EASE }}
                  >
                    {role === "owner" && <OwnerMockup />}
                    {role === "conciergerie" && <ConciergerieMockup />}
                    {role === "ltr" && <LeasesMockup />}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
