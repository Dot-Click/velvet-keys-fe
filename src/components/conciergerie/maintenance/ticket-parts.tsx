import { AlertTriangle, Camera, Gauge, ImageOff, Leaf } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { InitialsAvatar } from "@/components/initials-avatar";
import { formatRelativeTime } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Ticket, TicketPhoto, TicketUrgency } from "@/types/ops";

export const URGENCY_META: Record<
  TicketUrgency,
  { icon: typeof Leaf; pill: string; tile: string }
> = {
  low: {
    icon: Leaf,
    pill: "border-[#A2E8DD]/35 bg-[#A2E8DD]/10 text-[#A2E8DD]",
    tile: "border-[#A2E8DD]/60 bg-[#A2E8DD]/10 text-[#A2E8DD]",
  },
  medium: {
    icon: Gauge,
    pill: "border-primary/40 bg-primary/10 text-primary",
    tile: "border-primary/70 bg-primary/10 text-primary",
  },
  critical: {
    icon: AlertTriangle,
    pill: "border-[#FF85A1]/45 bg-destructive/20 text-[#FF85A1]",
    tile: "border-[#FF85A1]/70 bg-destructive/20 text-[#FF85A1]",
  },
};

export function UrgencyPill({ urgency }: { urgency: TicketUrgency }) {
  const { t } = useTranslation("common");
  const meta = URGENCY_META[urgency];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-px text-[0.65rem]",
        meta.pill,
      )}
    >
      <meta.icon className="size-3" aria-hidden="true" />
      {t(`urgency.${urgency}`)}
    </span>
  );
}

/** The final cost once known, otherwise the estimate; null when neither was entered. */
export function ticketCost(ticket: Ticket): string | null {
  const minor = ticket.actualCostMinor ?? ticket.estCostMinor;
  return minor === null ? null : formatMoney(minor, ticket.currency);
}

/** An uploaded ticket photo from its download URL; a placeholder when storage gave none. */
export function TicketPhotoImage({
  photo,
  alt,
  className,
}: {
  photo: TicketPhoto;
  alt: string;
  className?: string | undefined;
}) {
  const { t } = useTranslation("conciergerie");
  const [failed, setFailed] = React.useState(false);
  if (!photo.url || failed) {
    return (
      <span
        role="img"
        aria-label={t("maintenance.photoUnavailable")}
        title={t("maintenance.photoUnavailable")}
        className={cn("grid place-items-center bg-[#121212] text-muted-foreground", className)}
      >
        <ImageOff className="size-5" aria-hidden="true" />
      </span>
    );
  }
  return (
    <img
      src={photo.url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}

/** When a ticket was reported, or resolved once it is. */
export function useTicketAge() {
  const { t } = useTranslation("conciergerie");
  return (ticket: Ticket) =>
    ticket.status === "resolved" && ticket.resolvedAt
      ? t("maintenance.resolvedAgo", { time: formatRelativeTime(ticket.resolvedAt) })
      : t("maintenance.reportedAgo", { time: formatRelativeTime(ticket.reportedAt) });
}

/**
 * Kanban card: title, unit, urgency, worker, age, photo count and cost. Critical tickets carry a
 * ruby edge.
 */
export function TicketCard({ ticket, age }: { ticket: Ticket; age: string }) {
  const { t } = useTranslation("conciergerie");
  const critical = ticket.urgency === "critical";
  const cost = ticketCost(ticket);
  return (
    <div
      className={cn(
        "group hover-lift space-y-3 rounded-xl border bg-[#181818] p-3",
        critical ? "border-[#FF85A1]/35 border-s-[3px] border-s-[#FF85A1]" : "border-border/60",
      )}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-[0.85rem] font-medium leading-snug text-foreground">
            {ticket.title}
          </p>
          <UrgencyPill urgency={ticket.urgency} />
        </div>
        <p className="truncate text-[0.7rem] text-muted-foreground">
          {ticket.propertyName} · {ticket.unitName}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2.5 text-[0.7rem]">
        <span className="flex min-w-0 items-center gap-1.5">
          {ticket.workerName ? (
            <InitialsAvatar name={ticket.workerName} size="sm" className="size-6 text-[0.55rem]" />
          ) : (
            <span className="grid size-6 place-items-center rounded-full border border-dashed border-border text-muted-foreground">
              ?
            </span>
          )}
          <span className="truncate text-muted-foreground">
            {ticket.workerName ?? t("maintenance.unassigned")}
          </span>
        </span>
        <span className="shrink-0 text-muted-foreground">{age}</span>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <p dir="ltr" className="tabular-nums text-primary rtl:text-right">
          {cost ?? "—"}
        </p>
        {ticket.photoCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[0.7rem] text-muted-foreground">
            <Camera className="size-3.5" aria-hidden="true" />
            {t("maintenance.photoCount", { count: ticket.photoCount })}
          </span>
        )}
      </div>
    </div>
  );
}
