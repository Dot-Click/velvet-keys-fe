import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InitialsAvatar } from "@/components/initials-avatar";
import { MediaImage } from "@/components/media/media-image";
import { useIsSoloOwner } from "@/hooks/use-is-solo-owner";
import { formatPercent } from "@/lib/currency";
import type { Property } from "@/types/portfolio";
import { UnitTypeBadge } from "./unit-badges";

/**
 * Gallery card: a graded 16:10 photo that zooms on hover while the unit split slides up over it,
 * then the name, city and owner. A solo owner manages their own properties, so owner and
 * commission are left out for them. Cover photos are placeholders until uploads arrive.
 */
export function PropertyCard({ property }: { property: Property }) {
  const { t } = useTranslation("conciergerie");
  const solo = useIsSoloOwner();
  const { str, ltr, total } = property.unitCounts;

  return (
    <Link
      to="/conciergerie/properties/$propertyId"
      params={{ propertyId: property.id }}
      className="group hover-lift flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-[#141414] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <MediaImage
          kind="property"
          id={property.id}
          fileId={property.imageFileId}
          name={property.name}
          variant="card"
          className="hover-zoom size-full"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/10 to-transparent" />
        {!solo && property.commissionPct !== null && (
          <span className="absolute end-3 top-3 rounded-full border border-primary/40 bg-black/60 px-2.5 py-0.5 text-[0.68rem] tabular-nums text-primary backdrop-blur-md">
            {t("properties.commissionChip", { pct: formatPercent(property.commissionPct) })}
          </span>
        )}
        {/* Unit split slides up on hover */}
        <dl className="absolute inset-x-3 bottom-3 grid translate-y-[calc(100%+0.75rem)] grid-cols-1 gap-2 rounded-xl border border-primary/25 bg-[#0F0F0F]/85 p-3 text-[0.7rem] backdrop-blur-md transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-y-0 group-focus-visible:translate-y-0">
          <div className="space-y-1">
            <dt className="text-muted-foreground">{t("properties.stats.units")}</dt>
            <dd className="flex flex-wrap items-center gap-1 text-foreground">
              {str > 0 && <UnitTypeBadge type="STR" className="px-1.5 py-0 text-[0.55rem]" />}
              {str > 0 && <span className="tabular-nums">{str}</span>}
              {ltr > 0 && <UnitTypeBadge type="LTR" className="px-1.5 py-0 text-[0.55rem]" />}
              {ltr > 0 && <span className="tabular-nums">{ltr}</span>}
              {total === 0 && "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-1 items-center justify-between gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate font-serif text-xl leading-tight tracking-normal text-[#F8F9FA] transition-colors group-hover:text-primary">
            {property.name}
          </h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 text-primary" aria-hidden="true" />
            {property.city}
          </p>
        </div>
        {!solo && (
          <span className="flex min-w-0 shrink-0 items-center gap-2">
            {property.ownerUserId ? (
              <>
                <span className="hidden min-w-0 text-end text-[0.7rem] text-muted-foreground sm:block">
                  <span className="block max-w-28 truncate text-foreground">
                    {property.ownerName}
                  </span>
                </span>
                <InitialsAvatar name={property.ownerName} size="sm" />
              </>
            ) : (
              <span className="text-[0.7rem] text-muted-foreground">{t("properties.noOwner")}</span>
            )}
          </span>
        )}
      </div>
    </Link>
  );
}
