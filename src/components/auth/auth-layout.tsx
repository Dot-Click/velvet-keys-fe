import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LogoHorizontal, LogoPlaque } from "@/components/brand";
import { ArchitecturalFacade } from "@/components/illustrations/architectural-illustrations";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LuxuryImage } from "@/components/motion/luxury-image";
import { LUXURY_IMAGERY } from "@/lib/luxury-imagery";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
  /** Editorial line on the image panel; defaults to the sign-in quote. */
  quote?: string;
  quoteSub?: string;
  /** "wide" gives multi-card steps more room. */
  width?: "default" | "wide";
}

/** Split-screen frame shared by every authentication screen. */
export function AuthLayout({ children, quote, quoteSub, width = "default" }: AuthLayoutProps) {
  const { t } = useTranslation("auth");

  return (
    <main className="relative min-h-screen bg-[#0B0B0B] text-foreground flex flex-col justify-between overflow-hidden">
      {/* Top Header Navigation */}
      <header className="relative z-20 flex items-center justify-between gap-4 px-6 py-6 sm:px-12 lg:px-16 border-b border-border/40 bg-[#0B0B0B]/80 backdrop-blur-md">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <LogoHorizontal size="sm" subtitle={t("privateAccess")} />
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher variant="segmented" />
          <Link
            to="/"
            className="hidden items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-primary transition-colors sm:inline-flex"
          >
            <ArrowLeft className="size-3.5 rtl-flip" />
            <span>{t("publicPortal")}</span>
          </Link>
        </div>
      </header>

      {/* Main Split Screen Container */}
      <div className="relative z-10 flex-1 grid lg:grid-cols-12 min-h-[calc(100vh-80px)]">
        {/* Start 55%: interior image, gold facade line-art and one-line brand statement */}
        <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-12 lg:p-16 overflow-hidden border-e border-border/60 bg-[#0E0E0E]">
          <div className="absolute inset-0 pointer-events-none z-0">
            <LuxuryImage
              src={LUXURY_IMAGERY.login.url}
              alt={LUXURY_IMAGERY.login.alt}
              kenBurns={true}
              overlayOpacity={0.82}
              aspectRatio="h-full w-full"
              className="h-full w-full object-cover border-0 rounded-none"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0B0B0B]/40 to-[#0B0B0B] pointer-events-none rtl:bg-gradient-to-l" />
            <div className="absolute inset-0 texture-vein opacity-60 pointer-events-none" />
          </div>

          <div className="absolute -bottom-28 -start-32 w-[650px] pointer-events-none z-10 opacity-35">
            <ArchitecturalFacade animate={true} />
          </div>

          <div className="relative z-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[0.68rem] uppercase tracking-[0.2em] text-primary backdrop-blur-md">
              <Sparkles className="size-3" />
              <span>{t("taglinePill")}</span>
            </div>
          </div>

          <div className="relative z-20 max-w-xl space-y-5 my-auto pt-10">
            <div className="flex justify-start">
              <LogoPlaque size="sm" className="shadow-2xl" />
            </div>
            <div className="gold-rule w-24 opacity-80" />
            <h1 className="font-serif italic text-3xl xl:text-5xl text-[#F8F9FA] leading-[1.2] font-light tracking-normal">
              {quote ?? t("editorialQuote")}
            </h1>
            <p className="text-xs uppercase tracking-[0.24em] text-primary/80 font-medium">
              {quoteSub ?? t("editorialSub")}
            </p>
          </div>

          <div className="relative z-20 flex items-center gap-6 text-[0.72rem] text-muted-foreground/80 tracking-wider">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary" />
              <span>{t("telemetryLedger")}</span>
            </span>
            <span className="size-1 rounded-full bg-border" />
            <span>{t("telemetrySecurity")}</span>
          </div>
        </div>

        {/* End 45%: the screen's form */}
        <div className="relative lg:col-span-5 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-[#0B0B0B] texture-vein">
          <div
            className={cn(
              "w-full mx-auto space-y-7 reveal-up",
              width === "wide" ? "max-w-xl" : "max-w-md",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

/** Eyebrow, title and lead paragraph at the top of an auth screen. */
export function AuthHeading({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      {icon}
      <div className="space-y-1.5">
        <p className="text-label-caps text-primary">{eyebrow}</p>
        <h2 className="font-display text-3xl uppercase tracking-[0.14em] text-[#F8F9FA]">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}

/** Gold primary call to action used across the auth screens. */
export const authPrimaryButtonClassName =
  "w-full h-12 btn-shimmer bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B89225] text-[#0B0B0B] font-semibold text-xs uppercase tracking-[0.16em] rounded-xl hover:brightness-105 transition-all shadow-[0_8px_24px_rgba(212,175,55,0.25)] rtl:bg-gradient-to-l";
