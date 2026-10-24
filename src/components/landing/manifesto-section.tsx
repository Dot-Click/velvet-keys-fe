import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArchitecturalDivider } from "@/components/illustrations/architectural-illustrations";

function Word({
  word,
  index,
  total,
  scrollYProgress,
}: {
  word: string;
  index: number;
  total: number;
  scrollYProgress: any;
}) {
  const prefersReduced = useReducedMotion();
  const start = index / total;
  const end = Math.min(1, (index + 1) / total + 0.15);

  const opacity = useTransform(scrollYProgress, [start, end], [0.2, 1]);
  const color = useTransform(
    scrollYProgress,
    [start, end],
    ["rgba(248, 249, 250, 0.25)", "rgba(248, 249, 250, 1)"],
  );

  if (prefersReduced) {
    return <span className="inline-block me-[0.28em] text-[#F8F9FA]">{word}</span>;
  }

  return (
    <motion.span
      style={{ opacity, color }}
      className="inline-block me-[0.28em] transition-colors duration-200"
    >
      {word}
    </motion.span>
  );
}

export function ManifestoSection() {
  const { t } = useTranslation(["landing", "common"]);
  const containerRef = React.useRef<HTMLElement>(null);
  const manifestoQuote = t("landing:manifesto.quote");
  const words = React.useMemo(() => manifestoQuote.split(" "), [manifestoQuote]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.35"],
  });

  return (
    <section
      id="manifesto"
      ref={containerRef}
      className="relative px-6 py-28 sm:px-12 lg:px-20 lg:py-40 overflow-hidden border-b border-border/70"
    >
      {/* Full-width dark satin texture background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <picture className="size-full">
          <source type="image/avif" srcSet="/images/manifesto-satin.avif" />
          <source type="image/webp" srcSet="/images/manifesto-satin.webp" />
          <img
            src="/images/manifesto-satin.jpg"
            alt=""
            width={2000}
            height={1116}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center opacity-35 filter contrast-125 brightness-90"
          />
        </picture>
        {/* Dark Vignettes */}
        <div className="absolute inset-0 bg-[#0B0B0B]/75" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06)_0%,rgba(11,11,11,0.92)_85%)]" />
      </div>

      <div className="mx-auto max-w-4xl text-center space-y-12 relative z-10">
        {/* Top Gold Ornamental Divider */}
        <ArchitecturalDivider className="my-0" opacity={0.7} />

        <div className="space-y-8 py-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-primary font-medium">
            {t("landing:manifesto.title")}
          </p>

          {/* Word-by-word scroll-revealed quote */}
          <blockquote className="font-serif italic text-2xl sm:text-4xl lg:text-5xl leading-[1.35] sm:leading-[1.4] font-light max-w-3xl mx-auto">
            {words.map((w, i) => (
              <Word
                key={i}
                word={w}
                index={i}
                total={words.length}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </blockquote>

          <div className="pt-4 flex items-center justify-center gap-4 text-[10px] uppercase font-mono tracking-[0.26em] text-muted-foreground">
            <span>{t("landing:manifesto.pillar1")}</span>
            <span className="size-1 rounded-full bg-primary" />
            <span>{t("landing:manifesto.pillar2")}</span>
            <span className="size-1 rounded-full bg-primary" />
            <span>{t("landing:manifesto.pillar3")}</span>
          </div>
        </div>

        {/* Bottom Gold Ornamental Divider */}
        <ArchitecturalDivider className="my-0" opacity={0.7} />
      </div>
    </section>
  );
}
