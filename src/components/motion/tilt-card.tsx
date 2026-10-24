import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number;
  className?: string;
  glow?: boolean;
}

export function TiltCard({
  children,
  maxTilt = 4,
  className,
  glow = true,
  ...props
}: TiltCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const cardRef = React.useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring physics for expensive feel
  const springConfig = { damping: 25, stiffness: 180 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (prefersReducedMotion) {
    return (
      <div
        className={cn("rounded-xl border border-border bg-card p-6 shadow-xl", className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.98 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "group relative rounded-xl border border-border/80 bg-card p-6 shadow-xl transition-colors duration-400",
        "hover:border-primary/45 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.12)]",
        className,
      )}
      {...props}
    >
      {/* Subtle border gold glow sheen */}
      {glow && (
        <div className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-b from-primary/15 via-transparent to-transparent -z-10" />
      )}
      <div style={{ transform: "translateZ(10px)" }}>{children}</div>
    </motion.div>
  );
}
