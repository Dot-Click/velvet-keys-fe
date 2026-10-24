import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UnitTypeBadge } from "@/components/conciergerie/unit-badges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { formatPercent } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/** STR and LTR unit counts as gold and jade chips. */
export function UnitMixChips({
  strUnits,
  ltrUnits,
  className,
}: {
  strUnits: number;
  ltrUnits: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {strUnits > 0 && (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[0.68rem] text-muted-foreground">
          <UnitTypeBadge type="STR" /> × {strUnits}
        </span>
      )}
      {ltrUnits > 0 && (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-[0.68rem] text-muted-foreground">
          <UnitTypeBadge type="LTR" /> × {ltrUnits}
        </span>
      )}
    </span>
  );
}

/** Gross revenue split between STR bookings (gold) and LTR rent (jade), amounts in minor units. */
export function RevenueSplitBar({
  strRevenueMinor,
  ltrRevenueMinor,
  className,
}: {
  strRevenueMinor: number;
  ltrRevenueMinor: number;
  className?: string;
}) {
  const { t } = useTranslation("owner");
  const total = strRevenueMinor + ltrRevenueMinor;
  const strShare = total === 0 ? 0 : (strRevenueMinor / total) * 100;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        className="flex h-1.5 w-full overflow-hidden rounded-full bg-[#202020]"
        role="img"
        aria-label={t("overview.revenueSplitLabel", {
          str: formatPercent(strShare, { decimals: 0 }),
          ltr: formatPercent(total === 0 ? 0 : 100 - strShare, { decimals: 0 }),
        })}
      >
        <div style={{ width: `${strShare}%` }} className="h-full bg-[#D4AF37]" />
        <div style={{ width: `${total === 0 ? 0 : 100 - strShare}%` }} className="h-full bg-[#A2E8DD]" />
      </div>
      <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[0.65rem] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#D4AF37]" aria-hidden="true" />
          {t("overview.strRevenue", { amount: formatMoney(strRevenueMinor, ACCOUNT_CURRENCY) })}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#A2E8DD]" aria-hidden="true" />
          {t("overview.ltrRevenue", { amount: formatMoney(ltrRevenueMinor, ACCOUNT_CURRENCY) })}
        </span>
      </div>
    </div>
  );
}

export interface OccupancyFigures {
  strUnits: number;
  ltrUnits: number;
  /** STR occupancy %, null while it is still loading. */
  strOccupancyPct: number | null;
  /** LTR units with a lease today, null while loading. */
  ltrLeased: number | null;
}

/**
 * Occupancy of a property: STR occupancy when it has short-term units, and how many long-term
 * units are leased when it has those.
 */
export function PropertyOccupancy({ row, compact = false }: { row: OccupancyFigures; compact?: boolean }) {
  const { t } = useTranslation("owner");
  if (row.strUnits === 0 && row.ltrUnits === 0) {
    return <span className="block font-mono text-muted-foreground">—</span>;
  }
  return (
    <span className="block space-y-0.5">
      {row.strUnits > 0 && (
        <span className="block font-mono font-semibold text-[#A2E8DD]">
          {row.strOccupancyPct === null ? "…" : formatPercent(row.strOccupancyPct)}
          {!compact && row.ltrUnits > 0 && (
            <span className="ms-1 font-sans text-[0.62rem] font-normal text-muted-foreground">
              {t("overview.strTag")}
            </span>
          )}
        </span>
      )}
      {row.ltrUnits > 0 && (
        <span
          className={cn(
            "block font-mono",
            row.strUnits > 0 ? "text-[0.65rem] text-muted-foreground" : "font-semibold text-[#A2E8DD]",
          )}
        >
          {t("overview.leasedShort", { leased: row.ltrLeased ?? "…", total: row.ltrUnits })}
        </span>
      )}
    </span>
  );
}

/** Info icon explaining that the Conciergerie sets the commission rate. */
export function CommissionInfo({ className }: { className?: string }) {
  const { t } = useTranslation("owner");
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={t("overview.commissionTooltip")}
            className={cn(
              "inline-grid size-5 place-items-center rounded-full text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
          >
            <Info className="size-3.5" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-60 border border-border bg-[#141414] text-xs text-foreground">
          {t("overview.commissionTooltip")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
