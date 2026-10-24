import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { formatMAD, formatPercent } from "@/lib/currency";
import { LUXURY_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { share } from "./landing-figures";

/** STR is gold and LTR is jade, as everywhere else in the product. */
export const STR_COLOR = "#D4AF37";
export const LTR_COLOR = "#A2E8DD";

/** A negative amount, kept in left-to-right order inside right-to-left text. */
export function Deduction({ amount }: { amount: number }) {
  return <span dir="ltr">−{formatMAD(amount)}</span>;
}

/** Short-term against long-term revenue, as a bar with both amounts underneath. */
export function SplitBar({
  str,
  ltr,
  className,
}: {
  str: number;
  ltr: number;
  className?: string;
}) {
  const { t } = useTranslation("landing");
  const reduced = useReducedMotion();
  const total = str + ltr;
  const strShare = share(str, total);
  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        className="flex h-1.5 w-full overflow-hidden rounded-full bg-[#202020]"
        role="img"
        aria-label={t("mock.splitLabel", {
          str: formatPercent(strShare, { decimals: 0 }),
          ltr: formatPercent(100 - strShare, { decimals: 0 }),
        })}
      >
        <motion.div
          className="h-full"
          style={{ backgroundColor: STR_COLOR }}
          initial={{ width: reduced ? `${strShare}%` : 0 }}
          animate={{ width: `${strShare}%` }}
          transition={{ duration: 1.1, ease: LUXURY_EASE }}
        />
        <motion.div
          className="h-full"
          style={{ backgroundColor: LTR_COLOR }}
          initial={{ width: reduced ? `${100 - strShare}%` : 0 }}
          animate={{ width: `${100 - strShare}%` }}
          transition={{ duration: 1.1, ease: LUXURY_EASE }}
        />
      </div>
      <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: STR_COLOR }} />
          {t("mock.str")} {formatMAD(str)}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: LTR_COLOR }} />
          {t("mock.ltr")} {formatMAD(ltr)}
        </span>
      </div>
    </div>
  );
}

/**
 * An owner's month or year in dirhams: gross revenue split into short-term and long-term, the
 * manager's commission as its own highlighted line, the operating costs, and what is left.
 */
export function PnlLedger({
  gross,
  str,
  ltr,
  commissionPct,
  commission,
  costs,
  net,
  className,
}: {
  gross: number;
  str: number;
  ltr: number;
  commissionPct: number;
  commission: number;
  costs: number;
  net: number;
  className?: string;
}) {
  const { t } = useTranslation("landing");
  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border border-border/70 bg-[#0B0B0B]/80 p-4 text-xs",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium text-foreground">{t("mock.gross")}</span>
        <span className="font-mono font-medium text-foreground">{formatMAD(gross)}</span>
      </div>
      <SplitBar str={str} ltr={ltr} />

      <div className="flex items-baseline justify-between gap-3 rounded-lg border border-primary/25 bg-primary/[0.06] px-3 py-2">
        <span className="font-medium text-primary">
          {t("mock.commission", { pct: commissionPct })}
        </span>
        <span className="font-mono font-medium text-primary">
          <Deduction amount={commission} />
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-3 px-3 text-muted-foreground">
        <span>{t("mock.costs")}</span>
        <span className="font-mono">
          <Deduction amount={costs} />
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-3 border-t border-border/60 pt-3">
        <span className="font-semibold text-foreground">{t("mock.net")}</span>
        <span className="font-mono text-sm font-semibold text-primary">{formatMAD(net)}</span>
      </div>
    </div>
  );
}

/** A small pill used for statuses and tags in the mockups. */
export function Pill({
  tone,
  children,
  className,
}: {
  tone: "gold" | "jade" | "muted" | "ruby";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    gold: "border-primary/30 bg-primary/10 text-primary",
    jade: "border-[#A2E8DD]/30 bg-[#A2E8DD]/10 text-[#A2E8DD]",
    muted: "border-white/10 bg-white/5 text-muted-foreground",
    ruby: "border-destructive/50 bg-destructive/15 text-[#FF85A1]",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
