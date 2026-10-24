import * as React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function LuxuryCursor() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isPointer, setIsPointer] = React.useState(false);
  const [isViewing, setIsViewing] = React.useState(false);
  const [isFinePointer, setIsFinePointer] = React.useState(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 28, stiffness: 350, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  React.useEffect(() => {
    // Only enable on desktop pointer devices
    const mediaQuery = window.matchMedia("(pointer: fine)");
    setIsFinePointer(mediaQuery.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsFinePointer(e.matches);
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      // Check hovered elements
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isViewTarget =
        target.closest("[data-cursor='view']") ||
        target.tagName === "IMG" ||
        target.closest(".arch-mask") ||
        target.closest(".marquee-card");

      const isClickable =
        target.closest("button") ||
        target.closest("a") ||
        target.closest("[role='button']") ||
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("[data-cursor='pointer']");

      if (isViewTarget) {
        setIsViewing(true);
        setIsPointer(false);
      } else if (isClickable) {
        setIsPointer(true);
        setIsViewing(false);
      } else {
        setIsPointer(false);
        setIsViewing(false);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mouseX, mouseY, isVisible]);

  if (!isFinePointer || !isVisible) return null;

  return (
    <>
      {/* Central Micro Pin Dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-50 rounded-full bg-primary"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
          width: isViewing || isPointer ? 0 : 4,
          height: isViewing || isPointer ? 0 : 4,
          opacity: isViewing || isPointer ? 0 : 1,
          transition: "width 0.2s, height 0.2s, opacity 0.2s",
        }}
      />

      {/* Main Luxury Ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-50 flex items-center justify-center rounded-full border border-primary text-primary"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
          width: isViewing ? 72 : isPointer ? 44 : 24,
          height: isViewing ? 72 : isPointer ? 44 : 24,
          backgroundColor: isViewing
            ? "rgba(11, 11, 11, 0.75)"
            : isPointer
              ? "rgba(212, 175, 55, 0.12)"
              : "transparent",
          backdropFilter: isViewing ? "blur(8px)" : "none",
          borderColor: isViewing
            ? "#D4AF37"
            : isPointer
              ? "rgba(212, 175, 55, 0.8)"
              : "rgba(212, 175, 55, 0.5)",
          boxShadow: isViewing
            ? "0 0 24px rgba(212, 175, 55, 0.35), inset 0 0 12px rgba(212, 175, 55, 0.15)"
            : isPointer
              ? "0 0 16px rgba(212, 175, 55, 0.2)"
              : "none",
          transition:
            "width 0.35s cubic-bezier(0.25, 1, 0.5, 1), height 0.35s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.35s, border-color 0.35s, box-shadow 0.35s",
        }}
      >
        {isViewing && (
          <span className="font-sans text-[10px] font-semibold tracking-[0.22em] text-primary uppercase select-none">
            VIEW
          </span>
        )}
      </motion.div>
    </>
  );
}
