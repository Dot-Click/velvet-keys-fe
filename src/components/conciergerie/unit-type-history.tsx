import { useTranslation } from "react-i18next";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { formatDate } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { parseDay } from "@/lib/dates";
import type { UnitTypeChange } from "@/types/portfolio";
import { UnitTypeBadge } from "./unit-badges";

/** Type changes of a unit as the switch endpoint returned them, newest first. */
export function UnitTypeHistory({ history }: { history: UnitTypeChange[] }) {
  const { t } = useTranslation("conciergerie");
  const changes = [...history].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  return (
    <ol className="relative space-y-4 border-s border-border/80 ps-6">
      {changes.map((change) => (
        <li
          key={`${change.fromType}-${change.toType}-${change.effectiveDate}`}
          className="relative"
        >
          <span
            aria-hidden="true"
            className="absolute -start-[1.85rem] top-1.5 size-3 rounded-full border-2 border-primary bg-primary/40"
          />
          <div className="flex flex-wrap items-center gap-2">
            <UnitTypeBadge type={change.fromType} />
            <span aria-hidden="true" className="text-xs text-muted-foreground">
              →
            </span>
            <UnitTypeBadge type={change.toType} />
          </div>
          <p className="mt-1 text-xs text-foreground">
            {t("units.history.startsOn", { from: formatDate(parseDay(change.effectiveDate)) })}
          </p>
          {change.proratedAmountMinor !== null && (
            <p className="text-[0.68rem] text-muted-foreground">
              {t("units.history.prorated", {
                type: change.fromType,
                amount: formatMoney(change.proratedAmountMinor, ACCOUNT_CURRENCY),
              })}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
