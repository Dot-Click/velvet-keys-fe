import * as React from "react";
import { cn } from "@/lib/utils";

/** A4 is 210 mm wide, which is 793.7 CSS pixels. */
const A4_WIDTH_PX = (210 / 25.4) * 96;

/** Printing shows the pages at full size, whatever scale the screen preview uses. */
const PRINT_CSS = `@media print {
  .pdf-preview { height: auto !important; }
  .pdf-preview-sheet { position: static !important; left: auto !important; transform: none !important; }
}`;

/**
 * Shows PDF pages on screen at the largest size the space allows: the pages keep their real A4
 * size and are scaled down with a transform, so what is previewed is exactly what prints.
 */
export function PdfPreview({
  children,
  className,
  maxScale = 1,
}: {
  children: React.ReactNode;
  className?: string;
  /** Largest scale to use when there is more room than one A4 page needs */
  maxScale?: number;
}) {
  const outer = React.useRef<HTMLDivElement>(null);
  const sheet = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(1);
  const [height, setHeight] = React.useState<number | undefined>(undefined);

  React.useLayoutEffect(() => {
    const container = outer.current;
    const content = sheet.current;
    if (!container || !content) return;
    const measure = () => {
      const next = Math.min(maxScale, container.clientWidth / A4_WIDTH_PX);
      setScale(next);
      setHeight(content.offsetHeight * next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(content);
    return () => observer.disconnect();
  }, [maxScale]);

  return (
    <div
      ref={outer}
      className={cn("pdf-preview relative w-full", className)}
      style={height === undefined ? undefined : { height }}
    >
      <style>{PRINT_CSS}</style>
      <div
        ref={sheet}
        className="pdf-preview-sheet absolute top-0 left-1/2 w-[210mm]"
        style={{ transform: `translateX(-50%) scale(${scale})`, transformOrigin: "top center" }}
      >
        {children}
      </div>
    </div>
  );
}
