import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LogoMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { HeroArchFrame } from "@/components/illustrations/architectural-illustrations";
import { LUXURY_EASE } from "@/lib/motion";

interface HeroSectionProps {
  onExploreClick: () => void;
  introDone: boolean;
}

export function HeroSection({ onExploreClick, introDone }: HeroSectionProps) {
  const { t } = useTranslation("landing");
  const containerRef = React.useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax: image moves at 0.5x relative to scroll
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.65], [0, 60]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between pt-24 pb-12 px-6 sm:px-10 lg:px-16"
    >
      {/* Background full-bleed penthouse-at-dusk with Ken Burns zoom, Picture LCP element & Parallax */}
      <motion.div
        className="absolute inset-0 -z-20 w-full h-[120%] -top-[10%]"
        style={{ y: prefersReduced ? 0 : imageY }}
      >
        <motion.div
          className="relative w-full h-full overflow-hidden"
          initial={{ scale: 1.0 }}
          animate={prefersReduced ? { scale: 1.0 } : { scale: 1.06 }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <picture className="size-full">
            <source type="image/avif" srcSet="/images/hero-penthouse-dusk.avif" />
            <source type="image/webp" srcSet="/images/hero-penthouse-dusk.webp" />
            <img
              src="/images/hero-penthouse-dusk.jpg"
              alt=""
              width={2400}
              height={1339}
              fetchPriority="high"
              decoding="async"
              className="size-full object-cover object-center"
            />
          </picture>

          {/* Drifting dust particles in beam of light (respects prefers-reduced-motion) */}
          {!prefersReduced && (
            <video
              autoPlay
              loop
              muted
              playsInline
              poster="/images/hero-penthouse-dusk.jpg"
              className="pointer-events-none absolute inset-0 size-full object-cover object-center opacity-40 mix-blend-screen"
            >
              <source src="/media/hero-dust.webm" type="video/webm" />
              <source src="/media/hero-dust.mp4" type="video/mp4" />
            </video>
          )}
        </motion.div>
        {/* Dark Chiaroscuro Gradient Overlays for AA Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0B]/75 via-[#0B0B0B]/40 to-[#0B0B0B]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06)_0%,rgba(11,11,11,0.85)_80%)]" />
      </motion.div>

      {/* Monumental Gold Line-Art Arch Framing the Center Headline */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
        <HeroArchFrame
          className="w-[92vw] max-w-[840px] h-auto max-h-[82vh] opacity-60 translate-y-6"
          animate={introDone}
        />
      </div>

      {/* Main Editorial Content */}
      <motion.div
        className="mx-auto my-auto max-w-5xl text-center space-y-7 relative z-10 pt-6"
        style={{
          opacity: contentOpacity,
          y: contentY,
        }}
      >
        {/* The Velvet Keys key, framed by the gold arch */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: LUXURY_EASE }}
          className="flex justify-center"
        >
          <LogoMark size="lg" />
        </motion.div>

        {/* Micro Category Tag */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.1, ease: LUXURY_EASE }}
          className="inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.24em] text-primary backdrop-blur-md shadow-[0_0_20px_rgba(212,175,55,0.12)]"
        >
          <Sparkles className="size-3 text-primary" />
          <span>{t("hero.tag")}</span>
        </motion.div>

        {/* Headline split into 3 masked overflow lines with 120ms stagger */}
        <div className="space-y-1">
          {/* Line 1: ABSOLUTE */}
          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: "115%" }}
              animate={introDone ? { y: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.2, ease: LUXURY_EASE }}
              className="font-display text-4xl sm:text-7xl lg:text-8xl font-normal uppercase tracking-[0.14em] text-[#F8F9FA] leading-[1.05]"
            >
              {t("hero.line1")}
            </motion.h1>
          </div>

          {/* Line 2: CONTROL */}
          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: "115%" }}
              animate={introDone ? { y: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.32, ease: LUXURY_EASE }}
              className="font-display text-4xl sm:text-7xl lg:text-8xl font-normal uppercase tracking-[0.14em] text-[#F8F9FA] leading-[1.05]"
            >
              {t("hero.line2")}
            </motion.h1>
          </div>

          {/* Line 3: the promise, in gold italic with a slow shimmer sweep once */}
          <div className="overflow-hidden pt-2">
            <motion.div
              initial={{ y: "115%" }}
              animate={introDone ? { y: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.44, ease: LUXURY_EASE }}
              className="relative inline-block"
            >
              <span className="font-serif italic rtl:not-italic rtl:font-['Noto_Naskh_Arabic',serif] font-normal text-3xl sm:text-5xl lg:text-6xl text-primary tracking-wide">
                {t("hero.line3")}
              </span>
              {/* Shimmer sweep beam */}
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none -skew-x-12"
                initial={{ x: "-120%" }}
                animate={introDone ? { x: "220%" } : {}}
                transition={{ duration: 1.6, delay: 1.1, ease: LUXURY_EASE }}
              />
            </motion.div>
          </div>
        </div>

        {/* Subcopy fading in after headline */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.0, delay: 0.65, ease: LUXURY_EASE }}
          className="mx-auto max-w-2xl text-sm sm:text-lg text-muted-foreground font-light leading-relaxed tracking-wide"
        >
          {t("hero.subcopy")}
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.0, delay: 0.8, ease: LUXURY_EASE }}
          className="space-y-5 pt-4"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
            <Button
              size="lg"
              asChild
              className="btn-shimmer w-full sm:w-auto text-xs uppercase tracking-[0.18em] font-semibold bg-primary text-[#0B0B0B] hover:bg-primary/90 px-8 py-6 rounded-md shadow-[0_0_35px_rgba(212,175,55,0.3)] transition-all duration-300 hover:scale-[1.03]"
            >
              <Link to="/signup">{t("hero.getStarted")}</Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              asChild
              className="w-full sm:w-auto text-xs uppercase tracking-[0.18em] font-medium border-border/80 hover:border-primary/60 text-muted-foreground hover:text-foreground px-8 py-6 rounded-md bg-transparent/40 backdrop-blur-sm transition-all duration-300"
            >
              <Link to="/signup" search={{ type: "conciergerie" }}>
                {t("hero.manageProperties")}
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("hero.haveAccount")}{" "}
            <Link
              to="/login"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("hero.signIn")}
            </Link>
          </p>
        </motion.div>
      </motion.div>

      {/* Bottom Animated Scroll Cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={introDone ? { opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="relative z-10 flex flex-col items-center justify-center gap-2 cursor-pointer pb-2"
        onClick={onExploreClick}
      >
        <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/80 font-medium">
          {t("hero.scrollExplore")}
        </span>
        <div className="relative w-[1.5px] h-10 overflow-hidden bg-primary/20 rounded-full">
          <motion.div
            className="w-full h-4 bg-primary rounded-full"
            animate={{
              y: ["-100%", "280%"],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: LUXURY_EASE,
            }}
          />
        </div>
      </motion.div>
    </section>
  );
}
