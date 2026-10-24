import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MashrabiyaAmbientLight } from "@/components/illustrations/moroccan-motifs";

interface ImageInterludeProps {
  imageSrc: string;
  quoteText: string;
  subText?: string;
  className?: string;
}

export function ImageInterludeSection({
  imageSrc,
  quoteText,
  subText,
  className,
}: ImageInterludeProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Parallax 0.6x movement relative to scroll
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <section
      ref={containerRef}
      data-cursor="view"
      className={cn(
        "relative h-[100vh] w-full overflow-hidden flex items-end justify-start border-y border-border/40 select-none",
        className,
      )}
    >
      {/* Parallax Image Background */}
      <motion.div
        className="absolute inset-0 w-full h-[130%] -top-[15%] -z-20"
        style={{ y: prefersReduced ? 0 : y }}
      >
        <picture className="size-full">
          <source type="image/avif" srcSet={imageSrc.replace(/\.jpg$/, ".avif")} />
          <source type="image/webp" srcSet={imageSrc.replace(/\.jpg$/, ".webp")} />
          <img
            src={imageSrc}
            alt={quoteText}
            width={1376}
            height={768}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.08]"
          />
        </picture>
        {/* Cinematic dark vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/35 to-[#0B0B0B]/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B]/80 via-transparent to-transparent" />
      </motion.div>

      {/* Ambient Mashrabiya Shadow drifting across */}
      <MashrabiyaAmbientLight opacity={0.04} />

      {/* Bottom-Left Overlaid Serif Line */}
      <div className="relative z-10 p-8 sm:p-14 lg:p-20 max-w-3xl space-y-3">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.1, ease: [0.25, 1, 0.5, 1] }}
          className="font-serif font-light text-3xl sm:text-5xl lg:text-6xl text-[#F8F9FA] leading-[1.05] tracking-tight drop-shadow-lg"
        >
          {quoteText}
        </motion.p>
        {subText && (
          <p className="font-sans text-[11px] uppercase tracking-[0.24em] text-primary font-medium">
            {subText}
          </p>
        )}
      </div>
    </section>
  );
}
