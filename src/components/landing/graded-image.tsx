import * as React from "react";

export interface GradedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  className?: string;
  imgClassName?: string;
  children?: React.ReactNode;
}

/**
 * Editorial Luxury Graded Image Component:
 * - Supports modern AVIF and WebP sources via <picture>
 * - Subtle retuned grading preserves natural chiaroscuro depth without over-crushing
 * - Warm gold multiply tint: rgba(212,175,55,0.05)
 * - Bottom-to-top #0B0B0B dark chiaroscuro gradient
 */
export function GradedImage({
  src,
  alt,
  width,
  height,
  loading = "lazy",
  className = "",
  imgClassName = "",
  children,
}: GradedImageProps) {
  const isJpg = src.endsWith(".jpg");
  const avifSrc = isJpg ? src.replace(/\.jpg$/, ".avif") : undefined;
  const webpSrc = isJpg ? src.replace(/\.jpg$/, ".webp") : undefined;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <picture className="size-full">
        {avifSrc && <source type="image/avif" srcSet={avifSrc} />}
        {webpSrc && <source type="image/webp" srcSet={webpSrc} />}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          decoding="async"
          className={`h-full w-full object-cover [filter:saturate(0.9)_brightness(0.95)_contrast(1.05)] ${imgClassName}`}
        />
      </picture>
      {/* Warm gold multiply tint overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[#D4AF37]/[0.05] mix-blend-multiply" />
      {/* Bottom-to-top #0B0B0B dark chiaroscuro gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/35 to-transparent" />
      {children}
    </div>
  );
}
