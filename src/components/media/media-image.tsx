import * as React from "react";
import { useFileUrl } from "@/hooks/use-file-url";
import {
  initialsOf,
  isUploadedImage,
  mediaSource,
  type PropertyVariant,
  type UnitVariant,
} from "@/lib/media";
import { cn } from "@/lib/utils";

type MediaImageProps = (
  { kind: "property"; variant: PropertyVariant } | { kind: "unit"; variant: UnitVariant }
) & {
  id: string;
  /** Entity name, used for the alt text and the fallback initials */
  name: string;
  /**
   * The entity's stored photo. Only a photo someone uploaded (data or blob URL) is shown, ahead of
   * the manifest; stock paths are ignored so the manifest stays the single source of media.
   */
  upload?: string | null;
  /** The entity's uploaded photo (imageFileId), resolved to a short-lived download URL. */
  fileId?: string | null;
  /** Sizes and shapes the frame; the image and fallback fill it */
  className?: string;
  loading?: "lazy" | "eager";
};

/** Brand grade applied to every photo. */
const GRADE = "saturate(.8) brightness(.85) contrast(1.05)";

/**
 * Property or unit photo from the media manifest: blur preview first, then the graded image
 * fades in. Until the media is delivered it renders a charcoal tile with the entity's initials.
 */
export function MediaImage({
  kind,
  id,
  variant,
  name,
  upload,
  fileId,
  className,
  loading = "lazy",
}: MediaImageProps) {
  const manifest = mediaSource(kind, id, variant);
  const fileUrl = useFileUrl(fileId);
  const src = isUploadedImage(upload) ? upload : (fileUrl.data ?? manifest.src);
  const lqip = src === manifest.src ? manifest.lqip : null;
  const [state, setState] = React.useState<"loading" | "loaded" | "failed">("loading");
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    setState("loading");
    // A cached image can finish before hydration attaches onLoad
    const img = imgRef.current;
    if (img?.complete) setState(img.naturalWidth > 0 ? "loaded" : "failed");
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-[#121212]", className)}>
      {src && state !== "failed" ? (
        <>
          {lqip && (
            <img
              src={lqip}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full scale-110 object-cover"
              style={{ filter: `blur(24px) ${GRADE}` }}
            />
          )}
          <img
            ref={imgRef}
            src={src}
            alt={name}
            loading={loading}
            decoding="async"
            onLoad={() => setState("loaded")}
            onError={() => setState("failed")}
            className={cn(
              "relative size-full object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none",
              state === "loaded" ? "opacity-100" : "opacity-0",
            )}
            style={{ filter: GRADE }}
          />
          {/* Warm grade over the photo */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(212,175,55,0.10),rgba(140,82,30,0.14))] mix-blend-soft-light"
          />
        </>
      ) : (
        <MediaFallback name={name} />
      )}
    </div>
  );
}

/** Charcoal tile with gold initials under a faint arch, sized to whatever frame holds it. */
function MediaFallback({ name }: { name: string }) {
  return (
    <div
      role="img"
      aria-label={name}
      className="absolute inset-0 grid place-items-center bg-[radial-gradient(120%_90%_at_50%_0%,#262421_0%,#171717_55%,#0E0E0E_100%)] [container-type:size]"
    >
      <span
        aria-hidden="true"
        className="absolute bottom-[14%] left-1/2 aspect-[3/4] h-[70%] -translate-x-1/2 rounded-t-full border border-b-0 border-primary/15"
      />
      <span
        aria-hidden="true"
        className="relative translate-y-[12%] font-['Cormorant_Garamond',Georgia,serif] leading-none tracking-[0.04em] text-primary/90 [font-size:clamp(0.6rem,26cqmin,4.5rem)]"
      >
        {initialsOf(name)}
      </span>
    </div>
  );
}
