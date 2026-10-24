import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LUXURY_EASE } from "@/lib/motion";

interface IntroLoaderProps {
  onComplete: () => void;
}

export function IntroMonogramLoader({ onComplete }: IntroLoaderProps) {
  const { t, i18n } = useTranslation("common");
  const prefersReduced = useReducedMotion();
  const [isVisible, setIsVisible] = React.useState(true);

  // Generate unique IDs for SVG definitions to avoid any collisions
  const id = React.useId().replace(/:/g, "");
  const goldId = `introGold-${id}`;
  const goldLightId = `introGoldLight-${id}`;
  const diamondId = `introDiamond-${id}`;

  const handleFinish = React.useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 400);
  }, [onComplete]);

  // Support ESC key to skip immediately
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleFinish();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFinish]);

  React.useEffect(() => {
    // 2.2s intro duration as specified, or shorter if reduced motion
    const timer = setTimeout(
      () => {
        handleFinish();
      },
      prefersReduced ? 300 : 2200,
    );

    return () => clearTimeout(timer);
  }, [handleFinish, prefersReduced]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.5, ease: LUXURY_EASE }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0B0B] cursor-pointer selection:bg-transparent"
        onClick={handleFinish}
        aria-label={t("brand.name")}
        role="dialog"
        aria-modal="true"
      >
        {/* Subtle Ambient Gold Backlight & Radial Glow */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [0.7, 1.3, 1.15], opacity: [0, 0.28, 0.2] }}
          transition={{ duration: 1.8, ease: LUXURY_EASE }}
          className="absolute size-72 rounded-full bg-[#D4AF37] blur-3xl -z-10 pointer-events-none"
        />

        <div className="relative flex flex-col items-center">
          {/* Key Logo Container with Subtle Ambient Underglow */}
          <div className="relative flex items-center justify-center">
            {/* Ambient warm gold underglow directly behind the key */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-b from-[#D4AF37]/35 to-transparent blur-[14px] -z-10 pointer-events-none"
              aria-hidden="true"
            />

            {/* Velvet Keys Authentic Key Logo (matching Hero Section LogoMark) */}
            <svg
              width="88"
              height="132"
              viewBox="0 0 80 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="overflow-visible drop-shadow-[0_4px_24px_rgba(212,175,55,0.3)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              aria-hidden="true"
            >
              <defs>
                {/* Metallic Gold Gradient with userSpaceOnUse coordinates so vertical & horizontal strokes render reliably */}
                <linearGradient
                  id={goldId}
                  gradientUnits="userSpaceOnUse"
                  x1="12"
                  y1="0"
                  x2="68"
                  y2="120"
                >
                  <stop offset="0%" stopColor="#FFF2B2" />
                  <stop offset="22%" stopColor="#E5C158" />
                  <stop offset="55%" stopColor="#D4AF37" />
                  <stop offset="85%" stopColor="#9E781D" />
                  <stop offset="100%" stopColor="#6C4E08" />
                </linearGradient>

                {/* Fine Inner & Diamond Lighter Gold */}
                <linearGradient
                  id={goldLightId}
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="0"
                  x2="80"
                  y2="120"
                >
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="35%" stopColor="#FFF2B2" />
                  <stop offset="70%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#9E781D" />
                </linearGradient>

                <radialGradient id={diamondId} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#FFF6CC" />
                  <stop offset="100%" stopColor="#D4AF37" />
                </radialGradient>
              </defs>

              {/* --- 1. KEY HEAD (Bow) --- */}
              {/* Outer Ring */}
              <motion.circle
                cx="40"
                cy="28"
                r="19"
                stroke={`url(#${goldId})`}
                strokeWidth="1.6"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, ease: LUXURY_EASE }}
              />

              {/* Inner Ring */}
              <motion.circle
                cx="40"
                cy="28"
                r="15.5"
                stroke={`url(#${goldId})`}
                strokeWidth="0.9"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.85 }}
                transition={{ duration: 0.65, delay: 0.1, ease: LUXURY_EASE }}
              />

              {/* --- 2. VK MONOGRAM INSIDE BOW --- */}
              {/* V: Left leg -> Apex -> Right leg */}
              <motion.path
                d="M 31 21.5 L 37.5 34.5 L 43.5 28"
                stroke={`url(#${goldId})`}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: LUXURY_EASE }}
              />

              {/* K: Vertical stem */}
              <motion.path
                d="M 43.5 21.5 L 43.5 34.5"
                stroke={`url(#${goldId})`}
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.45, delay: 0.3, ease: LUXURY_EASE }}
              />

              {/* K: Upper diagonal */}
              <motion.path
                d="M 43.5 28 L 49.5 21.5"
                stroke={`url(#${goldId})`}
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.38, ease: LUXURY_EASE }}
              />

              {/* K: Lower diagonal */}
              <motion.path
                d="M 43.5 28 L 49.5 34.5"
                stroke={`url(#${goldId})`}
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.42, ease: LUXURY_EASE }}
              />

              {/* --- 3. DIAMOND AT JUNCTION (Sparkles with Starburst) --- */}
              <motion.polygon
                points="43.5,25.6 45.8,28 43.5,30.4 41.2,28"
                fill={`url(#${diamondId})`}
                stroke={`url(#${goldLightId})`}
                strokeWidth="0.4"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.4, 1], opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.5, ease: LUXURY_EASE }}
                style={{ transformOrigin: "43.5px 28px" }}
              />
              <motion.circle
                cx="43.5"
                cy="28"
                r="0.6"
                fill="#FFFFFF"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.25, delay: 0.55 }}
                style={{ transformOrigin: "43.5px 28px" }}
              />

              {/* Diamond Sparkle Glint / Starburst Flare */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 2.2, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 45],
                }}
                transition={{ duration: 0.55, delay: 0.58, ease: "easeOut" }}
                style={{ transformOrigin: "43.5px 28px" }}
              >
                <line
                  x1="43.5"
                  y1="21"
                  x2="43.5"
                  y2="35"
                  stroke="#FFFFFF"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                />
                <line
                  x1="36.5"
                  y1="28"
                  x2="50.5"
                  y2="28"
                  stroke="#FFFFFF"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                />
                <circle cx="43.5" cy="28" r="1.3" fill="#FFFFFF" />
              </motion.g>

              {/* --- 4. KEY COLLAR (Decorative band below bow) --- */}
              <motion.path
                d="M 36.5 48 L 43.5 48"
                stroke={`url(#${goldId})`}
                strokeWidth="1.6"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, delay: 0.45, ease: LUXURY_EASE }}
              />

              {/* --- 5. KEY SHAFT --- */}
              <motion.path
                d="M 40 48 L 40 105"
                stroke={`url(#${goldId})`}
                strokeWidth="2.1"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.55, delay: 0.5, ease: LUXURY_EASE }}
              />

              {/* --- 6. KEY BIT / TEETH --- */}
              {/* Upper tooth at y = 92 */}
              <motion.path
                d="M 40 92 L 47.5 92"
                stroke={`url(#${goldId})`}
                strokeWidth="2.1"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, delay: 0.72, ease: LUXURY_EASE }}
              />

              {/* Lower tooth at y = 99 */}
              <motion.path
                d="M 40 99 L 49 99"
                stroke={`url(#${goldId})`}
                strokeWidth="2.1"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.35, delay: 0.8, ease: LUXURY_EASE }}
              />

              {/* --- 7. SHAFT BOTTOM TIP --- */}
              <motion.circle
                cx="40"
                cy="105.5"
                r="1.1"
                fill={`url(#${goldId})`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.25, delay: 0.88 }}
                style={{ transformOrigin: "40px 105.5px" }}
              />
            </svg>

            {/* Radiant Gold Shimmer Sweep across the completed key */}
            <motion.div
              className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ duration: 1.1, delay: 0.95, ease: "easeInOut" }}
            >
              <motion.div
                className="w-full h-full bg-gradient-to-r from-transparent via-[#FFF2B2]/25 to-transparent -skew-x-12"
                initial={{ x: "-120%" }}
                animate={{ x: "120%" }}
                transition={{ duration: 1.1, delay: 0.95, ease: "easeInOut" }}
              />
            </motion.div>
          </div>

          {/* Typography Reveal: Wordmark & Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85, ease: LUXURY_EASE }}
            className="mt-6 flex flex-col items-center select-none text-center"
          >
            <p
              className="font-['Jost',sans-serif] font-light text-base sm:text-lg tracking-[0.28em] text-[#F8F9FA] uppercase leading-none"
              style={{ letterSpacing: "0.28em" }}
            >
              VELVET KEYS
            </p>

            <div className="flex items-center gap-3 mt-2.5">
              <div className="h-[1px] w-6 bg-gradient-to-r from-transparent to-[#D4AF37]/80" />
              <span
                className="font-['Jost',sans-serif] font-normal text-[0.66rem] tracking-[0.32em] text-[#D4AF37] uppercase leading-none"
                style={{ letterSpacing: i18n.dir() === "rtl" ? "normal" : "0.32em" }}
              >
                {t("brand.tagline")}
              </span>
              <div className="h-[1px] w-6 bg-gradient-to-l from-transparent to-[#D4AF37]/80" />
            </div>
          </motion.div>

          {/* Sleek Golden Hairline Progress Track */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-7 w-28 h-[1.5px] bg-white/10 rounded-full overflow-hidden relative"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-[#D4AF37] via-[#FFF2B2] to-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.7)]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
            />
          </motion.div>
        </div>

        {/* Skippable Cue in bottom corner */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          onClick={(e) => {
            e.stopPropagation();
            handleFinish();
          }}
          className="group absolute bottom-8 end-8 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground/80 hover:text-primary hover:border-primary/40 hover:bg-primary/10 transition-all cursor-pointer backdrop-blur-sm"
          aria-label={t("actions.skip")}
        >
          <span>{t("actions.skip")}</span>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
