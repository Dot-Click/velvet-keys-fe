import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LuxuryImageProps {
  src: string;
  alt: string;
  className?: string;
  overlayOpacity?: number; // 0.4 - 0.8
  kenBurns?: boolean;
  priority?: boolean;
  aspectRatio?: string;
  rounded?: string;
}

export function LuxuryImage({
  src,
  alt,
  className,
  overlayOpacity = 0.65,
  kenBurns = false,
  priority = false,
  aspectRatio = "aspect-video",
  rounded = "rounded-xl",
}: LuxuryImageProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isLoaded, setIsLoaded] = React.useState(false);

  const shouldKenBurns = kenBurns && !prefersReducedMotion;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[#0D0D0D] border border-border/60",
        aspectRatio,
        rounded,
        className,
      )}
    >
      {/* Underlying image with slow Ken Burns effect & blur-up */}
      <motion.img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setIsLoaded(true)}
        initial={{ scale: 1, filter: "blur(12px) brightness(0.7)" }}
        animate={{
          scale: shouldKenBurns ? [1, 1.05, 1] : 1,
          filter: isLoaded ? "blur(0px) brightness(0.9)" : "blur(12px) brightness(0.7)",
        }}
        transition={{
          scale: shouldKenBurns
            ? { duration: 20, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.5 },
          filter: { duration: 0.8, ease: "easeOut" },
        }}
        className="size-full object-cover select-none"
      />

      {/* Dark gradient overlay (Ebon Black 40–80%) so text stays legible and on-brand */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/70 to-[#0B0B0B]/40 transition-opacity duration-500"
        style={{ opacity: overlayOpacity }}
      />

      {/* Subtle gold hairline frame on inner perimeter */}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-[#D4AF37]/15" />
    </div>
  );
}
