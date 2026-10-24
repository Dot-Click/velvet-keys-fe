import { Link } from "@tanstack/react-router";
import { BedDouble, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { SwitchUnitTypeButton } from "@/components/conciergerie/switch-unit-type";
import { UnitTypeBadge } from "@/components/conciergerie/unit-badges";
import { MediaImage } from "@/components/media/media-image";
import { Button } from "@/components/ui/button";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { formatMoney } from "@/lib/money";
import type { Unit } from "@/types/portfolio";

/**
 * Unit card on a property: portrait photo, type pill, bedrooms and nightly rate, with Edit and
 * Switch type. Whether a unit can switch is decided by the backend when the switch is requested.
 */
export function UnitPhotoCard({
  propertyId,
  unit,
  onEdit,
}: {
  propertyId: string;
  unit: Unit;
  onEdit: () => void;
}) {
  const { t } = useTranslation("conciergerie");
  return (
    <article className="group hover-lift flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-[#141414]">
      <Link
        to="/conciergerie/properties/$propertyId/units/$unitId"
        params={{ propertyId, unitId: unit.id }}
        className="relative block aspect-[4/3] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <MediaImage
          kind="unit"
          id={unit.id}
          fileId={unit.imageFileId}
          name={unit.name}
          variant="card"
          className="hover-zoom size-full"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
        <span className="absolute start-3 top-3 flex gap-1.5">
          <UnitTypeBadge type={unit.type} />
        </span>
        <span className="absolute inset-x-3 bottom-2 flex items-end justify-between gap-2">
          <span className="truncate font-serif text-lg leading-tight text-[#F8F9FA] group-hover:text-primary">
            {unit.name}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[0.7rem] text-muted-foreground">
            <BedDouble className="size-3.5" aria-hidden="true" />
            <span className="tabular-nums">{unit.bedrooms}</span>
          </span>
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        {unit.type === "STR" && (
          <p
            dir="ltr"
            className="truncate text-xs tabular-nums text-muted-foreground rtl:text-right"
          >
            {unit.nightlyRateMinor === null
              ? t("units.noRate")
              : t("units.ratePerNight", {
                  amount: formatMoney(unit.nightlyRateMinor, ACCOUNT_CURRENCY),
                })}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-end gap-1.5 border-t border-border/50 pt-2.5">
          <ReadOnlyGuard>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 px-2.5 text-xs text-primary"
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              {t("units.edit")}
            </Button>
          </ReadOnlyGuard>
          <SwitchUnitTypeButton unit={unit} />
        </div>
      </div>
    </article>
  );
}
