import * as React from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, Building2, Home, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArchitecturalFlutedColumn } from "@/components/illustrations/architectural-illustrations";

/** The account types a visitor can start with; each one opens the sign-up form with it chosen. */
const ACCOUNT_TYPES = [
  { type: "owner", icon: Home, accent: "text-primary", hover: "hover:border-primary/60" },
  {
    type: "conciergerie",
    icon: Building2,
    accent: "text-[#A2E8DD]",
    hover: "hover:border-[#A2E8DD]/60",
  },
] as const;

export function GetStartedSection() {
  const { t } = useTranslation(["landing", "common"]);
  const containerRef = React.useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section
      id="get-started"
      ref={containerRef}
      className="relative px-6 py-28 sm:px-10 lg:px-16 lg:py-36 bg-[#0B0B0B] border-t border-border/70 overflow-hidden"
    >
      {/* Background ambient radial glow */}
      <div className="pointer-events-none absolute top-1/2 start-1/4 -translate-y-1/2 size-[650px] rounded-full bg-primary/4 blur-[180px] -z-10" />

      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* ========================================================
              FIRST 45%: Tall Arch-Masked Interior Image with Parallax
              plus Overlaid Line-Art Classical Column Illustration
              ======================================================== */}
          <div className="lg:col-span-5 relative">
            <div className="relative h-[480px] sm:h-[620px] w-full overflow-hidden rounded-t-[140px] rounded-b-2xl border border-primary/30 shadow-[0_30px_90px_rgba(0,0,0,0.9)] bg-[#141414]">
              {/* Parallax Image */}
              <motion.div
                className="w-full h-[120%] -top-[10%] relative"
                style={{ y: prefersReduced ? 0 : imageY }}
              >
                <picture className="size-full">
                  <source type="image/avif" srcSet="/images/property-aurora.avif" />
                  <source type="image/webp" srcSet="/images/property-aurora.webp" />
                  <img
                    src="/images/property-aurora.jpg"
                    alt={t("landing:getStarted.imageAlt")}
                    width={1200}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center"
                  />
                </picture>
                {/* Dark Chiaroscuro Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/40 to-transparent opacity-85" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(11,11,11,0.85)_100%)]" />
              </motion.div>

              {/* Overlaid Classical Fluted Column Line-Art Illustration */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                <ArchitecturalFlutedColumn className="w-48 h-auto opacity-45" />
              </div>

              {/* Editorial Captions inside the panel */}
              <div className="absolute bottom-8 inset-x-8 text-center space-y-2 z-10">
                <p className="text-[10px] uppercase font-mono tracking-[0.28em] text-primary">
                  {t("landing:getStarted.panelTag")}
                </p>
                <h4 className="font-display text-xl sm:text-2xl uppercase tracking-wider text-foreground">
                  {t("landing:getStarted.panelTitle")}
                </h4>
                <p className="text-xs text-muted-foreground font-light max-w-xs mx-auto">
                  {t("landing:getStarted.panelSub")}
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================
              SECOND 55%: Choose how you will use Velvet Keys, then sign up
              ======================================================== */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-[11px] uppercase tracking-[0.22em] text-primary">
                <Sparkles className="size-3" />
                <span>{t("landing:getStarted.badge")}</span>
              </div>
              <h2 className="font-display text-3xl sm:text-5xl uppercase tracking-[0.14em] text-foreground">
                {t("landing:getStarted.title")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground font-light max-w-xl leading-relaxed">
                {t("landing:getStarted.sub")}
              </p>
            </div>

            <div className="rounded-2xl border border-primary/25 bg-[#141414]/90 p-6 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.85)] backdrop-blur-2xl relative space-y-7">
              <p className="text-[10px] uppercase font-mono tracking-[0.18em] text-muted-foreground">
                {t("landing:getStarted.chooseLabel")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ACCOUNT_TYPES.map(({ type, icon: Icon, accent, hover }) => (
                  <Link
                    key={type}
                    to="/signup"
                    search={{ type }}
                    className={`group flex flex-col justify-between gap-5 rounded-xl border border-border/80 bg-[#0E0E0E] p-5 transition-colors duration-300 ${hover}`}
                  >
                    <div className="space-y-3">
                      <Icon className={`size-5 ${accent}`} />
                      <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
                        {t(`landing:getStarted.${type}.title`)}
                      </h3>
                      <p className="text-xs text-muted-foreground font-light leading-relaxed">
                        {t(`landing:getStarted.${type}.desc`)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] font-semibold ${accent}`}
                    >
                      {t(`landing:getStarted.${type}.cta`)}
                      <ArrowRight className="size-3.5 rtl-flip transition-transform duration-300 group-hover:ltr:translate-x-1.5 group-hover:rtl:-translate-x-1.5" />
                    </span>
                  </Link>
                ))}
              </div>

              <Button
                asChild
                className="btn-shimmer w-full h-12 text-xs uppercase tracking-[0.2em] font-semibold bg-primary text-[#0B0B0B] hover:bg-primary/95 rounded-lg shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all"
              >
                <Link to="/signup" className="flex items-center justify-center gap-2">
                  <span>{t("landing:getStarted.cta")}</span>
                  <ArrowRight className="size-3.5 rtl-flip" />
                </Link>
              </Button>

              <div className="space-y-1.5 text-center">
                <p className="text-xs text-muted-foreground">
                  {t("landing:getStarted.haveAccount")}{" "}
                  <Link
                    to="/login"
                    className="font-medium text-primary hover:text-[#FFF1BE] transition-colors"
                  >
                    {t("landing:getStarted.signIn")}
                  </Link>
                </p>
                <p className="text-[10px] text-muted-foreground/80 font-light">
                  {t("landing:getStarted.note")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
