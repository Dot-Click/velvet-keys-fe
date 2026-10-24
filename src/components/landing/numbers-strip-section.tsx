import * as React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LUXURY_EASE } from "@/lib/motion";

export function NumbersStripSection() {
  const { t } = useTranslation("landing");
  const metrics = [1, 2, 3, 4].map((n) => ({
    valueText: t(`numbers.stat${n}Value`),
    label: t(`numbers.stat${n}Label`),
    subtext: t(`numbers.stat${n}Sub`),
  }));

  return (
    <section className="relative py-24 sm:py-32 px-6 sm:px-10 lg:px-16 overflow-hidden border-t border-b border-border/70 bg-[#0B0B0B]">
      {/* Background: Dark marble with gold veining at 22% opacity with dark chiaroscuro vignette */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <picture className="size-full">
          <source type="image/avif" srcSet="/images/dark-marble.avif" />
          <source type="image/webp" srcSet="/images/dark-marble.webp" />
          <img
            src="/images/dark-marble.jpg"
            alt=""
            width={2000}
            height={1116}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-center opacity-22 filter brightness-90 contrast-125"
          />
        </picture>
        {/* Dark edge vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-transparent to-[#0B0B0B]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B] via-transparent to-[#0B0B0B]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
          {metrics.map((item, idx) => (
            <motion.div
              key={idx}
              className={`relative px-6 sm:px-8 py-4 flex flex-col justify-between ${
                idx > 0 ? "lg:border-s lg:border-primary/25" : ""
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.15, ease: LUXURY_EASE }}
            >
              <div className="space-y-3">
                <div className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal text-primary tracking-tight">
                  <span dir="ltr" className="inline-block">
                    {item.valueText}
                  </span>
                </div>
                <h3 className="font-display text-lg sm:text-xl uppercase tracking-wider text-foreground">
                  {item.label}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground font-light pt-2 leading-relaxed">
                {item.subtext}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
