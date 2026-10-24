import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LogoHorizontal } from "@/components/brand";

export function LuxuryFooter() {
  const { t } = useTranslation(["landing", "common"]);

  return (
    <footer className="relative bg-[#0B0B0B] border-t border-border/70 pt-20 pb-16 px-6 sm:px-10 lg:px-16 overflow-hidden">
      {/* Background ambient gold gradient */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-primary/4 blur-[140px] -z-10" />

      <div className="mx-auto max-w-7xl space-y-16">
        {/* Oversized VELVET KEYS Wordmark across full width in outlined serif */}
        <div
          dir="ltr"
          data-keep-tracking
          className="w-full text-center overflow-hidden py-4 select-none"
        >
          <span className="text-outline-gold font-display text-[clamp(2.5rem,10vw,9.5rem)] font-light tracking-[0.18em] uppercase block leading-none cursor-default transition-all duration-700">
            {t("landing:footer.wordmark")}
          </span>
        </div>

        {/* Lower Meta Row: Monogram, One Line Copy, Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-6 border-t border-border/50">
          {/* Brand Mark with Monogram */}
          <div data-keep-tracking className="flex items-center gap-3">
            <LogoHorizontal size="sm" subtitle={t("landing:footer.tagline")} />
          </div>

          {/* One Line of Editorial Copy */}
          <p className="text-xs text-muted-foreground font-light text-center md:text-start max-w-md">
            {t("landing:footer.editorial")}
          </p>

          {/* Account links and a way back to the top */}
          <nav
            aria-label={t("landing:footer.linksLabel")}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.18em] font-medium text-muted-foreground"
          >
            <Link to="/signup" className="hover:text-primary transition-colors">
              {t("landing:footer.signUp")}
            </Link>
            <Link to="/login" className="hover:text-primary transition-colors">
              {t("landing:footer.signIn")}
            </Link>
            <a
              href="#product-reveal"
              className="text-primary hover:text-[#FFF1BE] transition-colors cursor-pointer"
            >
              {t("common:actions.top")}
            </a>
          </nav>
        </div>

        {/* Sub-footer Copyright and Discretion notice */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-muted-foreground/80 uppercase font-mono tracking-widest pt-4">
          <span>{t("landing:footer.copyright")}</span>
          <span>{t("landing:footer.locations")}</span>
        </div>
      </div>
    </footer>
  );
}
