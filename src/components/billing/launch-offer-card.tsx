import { motion } from "framer-motion";
import { Cable, Gift, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { today } from "@/lib/clock";
import { formatDate } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ActiveOffer, BillingSummary } from "@/types/subscription";

/** The last free day, one day before the exclusive `freeUntil` the backend sends. */
function lastFreeDay(freeUntil: string): Date {
  const day = parseDay(freeUntil);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - 1);
}

/**
 * Launch offer status built straight from the real `offers` array (one entry per product that is
 * currently free, whatever its source) and the account-wide `freeSyncStatus` enum. Simpler than
 * the old mock shape: no offer "type" to classify, no manual-grant list to special-case -- every
 * free product, whoever granted it, shows the same way.
 */
export function LaunchOfferCard({
  summary,
  animated = false,
}: {
  summary: BillingSummary;
  /** Rings fill on load, and free channel sync gets a ring of its own */
  animated?: boolean;
}) {
  const { t } = useTranslation("billing");
  const { offers, freeSyncStatus } = summary;
  const now = today();
  // The backend sends ended offers too; only a still-running one makes the offer "active".
  const hasRunning = offers.some((offer) => parseDay(offer.freeUntil) > now);

  return (
    <section
      aria-labelledby="launch-offer"
      className="relative space-y-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#1A1712] via-[#141414] to-[#121212] p-6 shadow-xl"
    >
      <div className="pointer-events-none absolute -top-24 -end-24 size-64 rounded-full bg-primary/10 blur-[80px]" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-label-caps text-primary">{t("offer.badge")}</p>
          <h2 id="launch-offer" className="font-serif text-2xl text-[#F8F9FA]">
            {hasRunning
              ? t("offer.active")
              : offers.length > 0
                ? t("offer.endedTitle")
                : t("offer.type.none")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {offers.length === 0
              ? t("offer.noneBody")
              : hasRunning
                ? t("offer.activeBody")
                : t("offer.endedBody")}
          </p>
        </div>
        <Gift className="size-6 shrink-0 text-primary" aria-hidden="true" />
      </div>

      {(offers.length > 0 || (animated && freeSyncStatus !== "slots_full")) && (
        <div
          className={cn(
            "relative grid grid-cols-1 gap-4 sm:grid-cols-2",
            animated && "xl:grid-cols-3",
          )}
        >
          {offers.map((offer) => (
            <FreeOfferRing key={offer.product} offer={offer} now={now} animated={animated} />
          ))}
        </div>
      )}

      <div
        className={cn(
          "relative flex items-start gap-3 rounded-xl border p-4",
          freeSyncStatus === "slots_available"
            ? "border-[#A2E8DD]/40 bg-[#A2E8DD]/5"
            : "border-border/70 bg-[#161616]",
        )}
      >
        <Cable
          className={cn(
            "mt-0.5 size-4 shrink-0",
            freeSyncStatus === "slots_available" ? "text-[#A2E8DD]" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
        <div className="space-y-0.5 text-xs">
          <p className="font-semibold text-foreground">
            {t(`offer.freeSyncStatus.${freeSyncStatus}`)}
          </p>
          <p className="text-muted-foreground">
            {t("offer.syncNote", { price: formatMoney(summary.syncPriceMinor, ACCOUNT_CURRENCY) })}
          </p>
        </div>
      </div>
    </section>
  );
}

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const PRODUCT_COLOR: Record<ActiveOffer["product"], string> = {
  str: "#D4AF37",
  ltr: "#A2E8DD",
  sync: "#F8F9FA",
};

/** Ring showing a free product's remaining time, with the last free day. */
function FreeOfferRing({
  offer,
  now,
  animated = false,
}: {
  offer: ActiveOffer;
  now: Date;
  animated?: boolean;
}) {
  const { t } = useTranslation("billing");
  const until = parseDay(offer.freeUntil);
  const ended = now >= until;
  const color = PRODUCT_COLOR[offer.product];
  const label = t(`offer.product.${offer.product}`);
  const caption = ended
    ? t("offer.endedSimple", { type: label })
    : t("offer.freeSimple", { type: label });

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-[#161616]/80 p-4">
      <div className="relative size-16 shrink-0" role="img" aria-label={caption}>
        <svg viewBox="0 0 64 64" className="size-full -rotate-90">
          <circle cx="32" cy="32" r={RADIUS} fill="none" stroke="#222" strokeWidth="5" />
          {animated ? (
            <motion.circle
              cx="32"
              cy="32"
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: ended ? 0 : CIRCUMFERENCE * 0.35 }}
              transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1], delay: 0.2 }}
            />
          ) : (
            <circle
              cx="32"
              cy="32"
              r={RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={ended ? 0 : CIRCUMFERENCE * 0.35}
            />
          )}
        </svg>
        <span className="absolute inset-0 grid place-items-center font-mono text-xs font-bold text-foreground">
          {ended ? "✓" : <Sparkles className="size-4" aria-hidden="true" />}
        </span>
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{caption}</p>
        <p className="text-[0.7rem] text-muted-foreground">
          {t(ended ? "offer.endedOn" : "offer.until", {
            date: formatDate(lastFreeDay(offer.freeUntil)),
          })}
        </p>
      </div>
    </div>
  );
}
