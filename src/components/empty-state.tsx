import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArchitecturalDoorway,
  ArchitecturalTools,
  ArchitecturalLedger,
  ArchitecturalDocument,
} from "@/components/illustrations/architectural-illustrations";
import { Illustration } from "@/components/media/illustration";
import type { IllustrationName } from "@/assets/manifest";

export interface EmptyStateProps {
  icon?: ReactNode;
  illustration?: "doorway" | "tools" | "ledger" | "document";
  /** Media manifest illustration; takes the place of `illustration` and `icon` */
  illustrationName?: IllustrationName;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  illustration,
  illustrationName,
  title,
  description,
  action,
  onAction,
  className,
}: EmptyStateProps) {
  const renderVisual = () => {
    if (illustrationName) {
      return <Illustration name={illustrationName} size={96} animate className="mb-3" />;
    }

    // 1. Explicit illustration prop
    let resolved = illustration;

    // 2. Intelligent inference from title / description if not specified
    if (!resolved) {
      const text = `${title} ${description}`.toLowerCase();
      if (text.includes("book") || text.includes("stay") || text.includes("residence")) {
        resolved = "doorway";
      } else if (
        text.includes("repair") ||
        text.includes("maintenance") ||
        text.includes("work order") ||
        text.includes("fix")
      ) {
        resolved = "tools";
      } else if (
        text.includes("expense") ||
        text.includes("pay") ||
        text.includes("bill") ||
        text.includes("ledger") ||
        text.includes("cost") ||
        text.includes("financial")
      ) {
        resolved = "ledger";
      } else if (
        text.includes("report") ||
        text.includes("dispatch") ||
        text.includes("statement") ||
        text.includes("document")
      ) {
        resolved = "document";
      }
    }

    switch (resolved) {
      case "doorway":
        return <ArchitecturalDoorway className="size-24 mb-3" />;
      case "tools":
        return <ArchitecturalTools className="size-24 mb-3" />;
      case "ledger":
        return <ArchitecturalLedger className="size-24 mb-3" />;
      case "document":
        return <ArchitecturalDocument className="size-24 mb-3" />;
      default:
        return icon ? (
          <div className="relative mb-5 grid size-14 place-items-center rounded-full border border-primary/30 bg-gradient-to-b from-[#1C1A14] to-[#121212] text-primary shadow-[0_0_24px_rgba(212,175,55,0.12)]">
            <div className="size-6 [&_svg]:size-full">{icon}</div>
          </div>
        ) : (
          <ArchitecturalDoorway className="size-24 mb-3" />
        );
    }
  };

  return (
    <div
      className={cn(
        "relative flex min-h-68 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-12 text-center backdrop-blur-xs",
        className,
      )}
    >
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 bg-radial from-primary/5 via-transparent to-transparent" />

      {/* Architectural Illustration or Icon */}
      {renderVisual()}

      <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>

      {action && onAction && (
        <Button
          variant="outline"
          size="sm"
          className="mt-6 border-primary/30 text-xs tracking-wider uppercase hover:border-primary hover:text-primary"
          onClick={onAction}
        >
          {action}
        </Button>
      )}
    </div>
  );
}
