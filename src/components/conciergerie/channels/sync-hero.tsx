import { useTranslation } from "react-i18next";
import { LogoMark } from "@/components/brand";
import { ChannelMark } from "@/components/conciergerie/channel-badges";
import { formatRelativeTime } from "@/lib/currency";
import { cn } from "@/lib/utils";

/** A sync line with gold dots travelling out and jade dots travelling back. */
function SyncLine({ delay = 0 }: { delay?: number }) {
  return (
    <span
      aria-hidden="true"
      className="relative h-px flex-1 bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10"
    >
      {[0, 0.8, 1.6].map((offset) => (
        <span
          key={`out-${offset}`}
          className="sync-dot"
          style={{ animationDelay: `${delay + offset}s` }}
        />
      ))}
      {[0.4, 1.2].map((offset) => (
        <span
          key={`back-${offset}`}
          className="sync-dot sync-dot-back"
          style={{ animationDelay: `${delay + offset}s` }}
        />
      ))}
    </span>
  );
}

/**
 * Channels hero: Airbnb ⇄ VK key ⇄ Booking.com with travelling dots, and the sync totals:
 * units synced, errors and the last sync.
 */
export function SyncHero({
  synced,
  errors,
  lastSyncAt,
  note,
}: {
  synced: number;
  errors: number;
  lastSyncAt: string | undefined;
  /** One line under the totals, e.g. the sync price */
  note?: string;
}) {
  const { t } = useTranslation("conciergerie");
  return (
    <section
      aria-label={t("channels.hero.label")}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-[radial-gradient(120%_140%_at_50%_0%,rgba(212,175,55,0.10),transparent_60%),#121212] px-5 py-5 sm:px-8"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-10">
        <div className="flex flex-1 items-center gap-3 sm:gap-4" dir="ltr">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border/70 bg-[#181818]">
            <ChannelMark platform="airbnb" className="size-7 rounded-md text-sm" />
          </span>
          <SyncLine />
          <span className="grid size-14 shrink-0 place-items-center rounded-full border border-primary/40 bg-[#17150F] shadow-[0_0_30px_rgba(212,175,55,0.18)]">
            <LogoMark size="sm" />
          </span>
          <SyncLine delay={0.3} />
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border/70 bg-[#181818]">
            <ChannelMark platform="bookingCom" className="size-7 rounded-md text-[0.7rem]" />
          </span>
        </div>
        <div className="space-y-1.5 md:max-w-sm">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span>
              <span className="figure-serif me-1 text-2xl text-[#A2E8DD]">{synced}</span>
              {t("channels.hero.synced", { count: synced })}
            </span>
            <span aria-hidden="true">·</span>
            <span className={cn(errors > 0 && "text-[#FF85A1]")}>
              <span className="figure-serif me-1 text-2xl">{errors}</span>
              {t("channels.hero.errors", { count: errors })}
            </span>
            {lastSyncAt && (
              <>
                <span aria-hidden="true">·</span>
                <span>{t("channels.hero.lastSync", { time: formatRelativeTime(lastSyncAt) })}</span>
              </>
            )}
          </p>
          {note && <p className="text-xs leading-relaxed text-muted-foreground/80">{note}</p>}
        </div>
      </div>
    </section>
  );
}
