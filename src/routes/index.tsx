import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { SmoothScrollProvider } from "@/components/landing/smooth-scroll-provider";
import { LuxuryCursor } from "@/components/landing/luxury-cursor";
import { IntroMonogramLoader } from "@/components/landing/intro-monogram-loader";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { ProductRevealSection } from "@/components/landing/product-reveal-section";
import { PropertyMarqueeSection } from "@/components/landing/property-marquee-section";
import { TwoHorizonsSection } from "@/components/landing/two-horizons-section";
import { ConnectedStripSection } from "@/components/landing/connected-strip-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { NumbersStripSection } from "@/components/landing/numbers-strip-section";
import { ManifestoSection } from "@/components/landing/manifesto-section";
import { FeatureBentoSection } from "@/components/landing/feature-bento-section";
import { GetStartedSection } from "@/components/landing/get-started-section";
import { DoorUnlockSection } from "@/components/landing/door-unlock-section";
import { ImageInterludeSection } from "@/components/landing/image-interlude-section";
import { LuxuryFooter } from "@/components/landing/luxury-footer";

const DESCRIPTION =
  "Velvet Keys — Absolute Control. Rental-management and estate stewardship SaaS for Morocco covering short-term and long-term rentals.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Velvet Keys — Absolute Control" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Velvet Keys — Absolute Control" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/images/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/images/og-image.jpg" },
    ],
  }),
  component: PublicLandingPage,
});

/**
 * Arabic joins its letters, so the wide letter-spacing used on the English and French labels would
 * break the words apart. This drops it across the landing page, except where an element opts out
 * with `data-keep-tracking` (the Latin wordmarks).
 */
const ARABIC_TRACKING = `html[lang="ar"] [data-landing] :not([data-keep-tracking], [data-keep-tracking] *) { letter-spacing: normal; }`;

function PublicLandingPage() {
  const { t, i18n } = useTranslation("landing");
  const [introDone, setIntroDone] = React.useState(false);

  // The head above is fixed at build time, so the tab title follows the chosen language here
  React.useEffect(() => {
    document.title = t("pageTitle");
  }, [t, i18n.language]);

  const scrollToExplainer = () => {
    const el = document.getElementById("product-reveal");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <SmoothScrollProvider>
      <div
        data-landing
        className="relative min-h-screen bg-[#0B0B0B] text-[#F8F9FA] selection:bg-primary selection:text-[#0B0B0B]"
      >
        <style>{ARABIC_TRACKING}</style>

        {/* Custom Luxury Desktop Cursor */}
        <LuxuryCursor />

        {/* 1.2s Skippable Monogram Draw Intro Loader */}
        <IntroMonogramLoader onComplete={() => setIntroDone(true)} />

        {/* Fixed Dynamic Blur Nav */}
        <LandingNav />

        {/* Main Editorial Presentation */}
        <main className="relative z-10">
          {/* Section 1: Hero (100vh) */}
          <HeroSection onExploreClick={scrollToExplainer} introDone={introDone} />

          {/* Section 2: Live Product Reveal (Scroll-Driven Mockup) */}
          <ProductRevealSection />

          {/* Section 3: Property Showcase (STR / LTR split and commission per residence) */}
          <PropertyMarqueeSection />

          {/* Section 4: Two Horizons (Owner | Conciergerie | Long-term rentals) */}
          <TwoHorizonsSection />

          {/* Cinematic Editorial Interlude: Casablanca Art Deco */}
          <ImageInterludeSection
            imageSrc="/images/casablanca-art-deco.jpg"
            quoteText={t("hero.line3")}
            subText={t("footer.locations")}
          />

          {/* Section 5: Connected to Airbnb & Booking.com */}
          <ConnectedStripSection />

          {/* Section 6: How It Works (3 Steps with Vertical Drawing Gold Line) */}
          <HowItWorksSection />

          {/* Section 7: Numbers Strip (Dark Marble Background & Gold Rules) */}
          <NumbersStripSection />

          {/* Interactive 3D Carved Cedar Door Unlock */}
          <DoorUnlockSection />

          {/* Section 8: Manifesto (Dark Satin Texture & Word-by-Word Scroll Reveal) */}
          <ManifestoSection />

          {/* Section 9: Feature Bento (Asymmetric 6-Tile Grid with Micro-Animations) */}
          <FeatureBentoSection />

          {/* Section 10: Get Started (account types, sign up and sign in) */}
          <GetStartedSection />
        </main>

        {/* Section 11: Luxury Footer with Oversized Outlined VELVET KEYS Wordmark */}
        <LuxuryFooter />
      </div>
    </SmoothScrollProvider>
  );
}
