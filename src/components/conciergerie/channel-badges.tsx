import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ChannelPlatform } from "@/types/channel";
import type { ChannelStatus } from "@/types/property";
import { cn } from "@/lib/utils";

const MONOGRAM: Record<ChannelPlatform, string> = { airbnb: "a", bookingCom: "B." };

/** Small monogram tile for Airbnb or Booking.com, readable on gold and dark surfaces. */
export function ChannelMark({
  platform,
  className,
}: {
  platform: ChannelPlatform;
  className?: string;
}) {
  const { t } = useTranslation("conciergerie");
  const name = t(`channels.platform.${platform}`);
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={cn(
        "inline-grid size-4 shrink-0 place-items-center rounded-[4px] bg-[#F8F9FA] font-sans text-[0.6rem] font-bold leading-none text-[#0B0B0B]",
        platform === "airbnb" && "lowercase",
        className,
      )}
    >
      <span aria-hidden="true">{MONOGRAM[platform]}</span>
    </span>
  );
}

/** "Synced" pill with the sync icon, and the platform mark when known. */
export function SyncedBadge({
  platform,
  className,
}: {
  platform?: ChannelPlatform;
  className?: string;
}) {
  const { t } = useTranslation("conciergerie");
  return (
    <span
      title={
        platform
          ? t("bookings.syncedFrom", { platform: t(`channels.platform.${platform}`) })
          : undefined
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-[#A2E8DD]/40 bg-[#A2E8DD]/10 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-[#A2E8DD]",
        className,
      )}
    >
      <RefreshCw className="size-3" aria-hidden="true" />
      {t("bookings.synced")}
      {platform && <ChannelMark platform={platform} className="size-3.5 text-[0.55rem]" />}
    </span>
  );
}

/** Pulsing jade dot for a connection that is live. */
export function LiveSyncDot({ large = false, className }: { large?: boolean; className?: string }) {
  const size = large ? "size-4" : "size-2.5";
  return (
    <span className={cn("relative inline-flex shrink-0", size, className)} aria-hidden="true">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#A2E8DD] opacity-60" />
      <span className={cn("relative inline-flex rounded-full bg-[#A2E8DD]", size)} />
    </span>
  );
}

const STATUS_STYLES: Record<ChannelStatus, string> = {
  connected: "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]",
  pending: "border-primary/40 bg-primary/10 text-primary",
  error: "border-destructive/60 bg-destructive/20 text-destructive-foreground",
  disconnected: "border-border/80 bg-[#161616] text-muted-foreground",
};

const STATUS_DOTS: Record<ChannelStatus, string> = {
  connected: "bg-[#A2E8DD]",
  pending: "bg-primary",
  error: "bg-[#FF85A1]",
  disconnected: "bg-muted-foreground/50",
};

/** Connected / Not connected / Error for one platform link. */
export function ChannelStatusPill({ status }: { status: ChannelStatus }) {
  const { t } = useTranslation("conciergerie");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider",
        STATUS_STYLES[status],
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_DOTS[status])} aria-hidden="true" />
      {t(`channels.status.${status}`)}
    </span>
  );
}
