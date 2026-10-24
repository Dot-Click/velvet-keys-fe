import * as React from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LogoHorizontal, LogoMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

const LINKS = [
  { id: "product-reveal", key: "product" },
  { id: "two-horizons", key: "horizons" },
  { id: "channels", key: "channels" },
  { id: "how-it-works", key: "methodology" },
  { id: "feature-bento", key: "capabilities" },
  { id: "manifesto", key: "manifesto" },
] as const;

export function LandingNav() {
  const { t } = useTranslation(["landing", "common"]);
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 80);
    });
  }, [scrollY]);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.header
      className="fixed top-0 inset-x-0 z-40 transition-all duration-500 ease-out"
      style={{
        backgroundColor: isScrolled ? "rgba(11, 11, 11, 0.72)" : "rgba(11, 11, 11, 0)",
        backdropFilter: isScrolled ? "blur(18px)" : "blur(0px)",
        borderBottom: isScrolled
          ? "1px solid rgba(212, 175, 55, 0.16)"
          : "1px solid rgba(212, 175, 55, 0)",
        boxShadow: isScrolled ? "0 10px 30px rgba(0, 0, 0, 0.5)" : "none",
      }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-10 lg:px-12">
        <Link
          to="/"
          data-keep-tracking
          className="flex shrink-0 items-center gap-3 group"
          aria-label={t("common:brand.name")}
        >
          {/* Just the key on phones, to leave room for the buttons */}
          <LogoMark size="sm" className="sm:hidden" />
          <LogoHorizontal
            size="md"
            subtitle={t("common:brand.tagline")}
            className="hidden sm:inline-flex"
          />
        </Link>

        {/* Desktop Navigation Links with sliding gold underline on hover */}
        {/* Six links only fit from 1280px up, in French too */}
        <nav className="hidden xl:flex items-center gap-6 2xl:gap-9 text-[11px] uppercase tracking-[0.16em] font-medium text-muted-foreground">
          {LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="nav-gold-link hover:text-foreground transition-colors cursor-pointer"
            >
              {t(`landing:nav.${link.key}`)}
            </button>
          ))}
        </nav>

        {/* Language switcher + account actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Wrapped, because the switcher sets its own display and would ignore `hidden` */}
          <div className="hidden md:block">
            <LanguageSwitcher variant="segmented" />
          </div>
          <div className="md:hidden">
            <LanguageSwitcher variant="dropdown" />
          </div>

          <Button
            variant="ghost"
            asChild
            className="px-2 sm:px-4 text-[10px] sm:text-xs uppercase tracking-[0.08em] sm:tracking-[0.16em] text-muted-foreground hover:text-primary transition-colors"
          >
            <Link to="/login">{t("landing:nav.signIn")}</Link>
          </Button>

          <Button
            asChild
            className="btn-shimmer relative overflow-hidden bg-primary text-[#0B0B0B] hover:bg-primary/95 text-[10px] sm:text-xs uppercase tracking-[0.08em] sm:tracking-[0.16em] font-semibold px-3 sm:px-5 py-2.5 rounded-md shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-transform duration-300 hover:scale-[1.02]"
          >
            <Link to="/signup">{t("landing:nav.getStarted")}</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
