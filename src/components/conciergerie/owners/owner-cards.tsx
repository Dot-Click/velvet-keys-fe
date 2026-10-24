import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { OwnerStatusBadge } from "@/components/conciergerie/owner-status-badge";
import { UnitTypeBadge } from "@/components/conciergerie/unit-badges";
import { InitialsAvatar } from "@/components/initials-avatar";
import { MediaImage } from "@/components/media/media-image";
import { formatPercent, formatRelativeTime } from "@/lib/currency";
import type { OwnerSummary, Property } from "@/types/portfolio";

/** Owner card: initials in a gold ring, invite status, property count and last sign-in. */
export function OwnerCard({ owner }: { owner: OwnerSummary }) {
  const { t } = useTranslation("conciergerie");
  return (
    <Link
      to="/conciergerie/owners/$ownerId"
      params={{ ownerId: owner.userId }}
      className="group hover-lift flex h-full flex-col gap-4 rounded-2xl border border-border/70 bg-[#141414] p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div className="flex items-start justify-between gap-3">
        <InitialsAvatar
          name={owner.name}
          size="lg"
          className="size-16 text-2xl ring-2 ring-primary/60 ring-offset-[3px] ring-offset-[#141414]"
        />
        <OwnerStatusBadge status={owner.inviteStatus} />
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-serif text-xl leading-tight tracking-normal text-[#F8F9FA] group-hover:text-primary">
          {owner.name}
        </h3>
        <p className="truncate text-xs text-muted-foreground" dir="ltr">
          {owner.email}
        </p>
      </div>
      <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-border/50 pt-3 text-xs">
        <div>
          <dt className="text-[0.7rem] text-muted-foreground">{t("owners.colProperties")}</dt>
          <dd className="tabular-nums text-foreground">{owner.propertyCount}</dd>
        </div>
        <div>
          <dt className="text-[0.7rem] text-muted-foreground">{t("owners.card.lastLogin")}</dt>
          <dd className="text-foreground">
            {owner.lastLoginAt
              ? formatRelativeTime(owner.lastLoginAt)
              : t("owners.card.neverLoggedIn")}
          </dd>
        </div>
      </dl>
      <span className="inline-flex items-center gap-1 text-xs text-primary">
        {t("owners.open")}
        <ArrowRight
          className="size-3.5 rtl-flip transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}

/** A property of an owner: photo, name, city, unit mix and the commission rate. */
export function OwnerPropertyCard({ property }: { property: Property }) {
  const { t } = useTranslation("conciergerie");
  const { str, ltr } = property.unitCounts;
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
        {property.commissionPct !== null && (
          <span className="absolute end-3 top-3 rounded-full border border-primary/40 bg-black/60 px-2.5 py-0.5 text-[0.68rem] tabular-nums text-primary backdrop-blur-md">
            {t("properties.commissionChip", { pct: formatPercent(property.commissionPct) })}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="truncate font-serif text-lg leading-tight tracking-normal text-[#F8F9FA] group-hover:text-primary">
          {property.name}
        </h3>
        <p className="truncate text-xs text-muted-foreground">{property.city}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 text-xs text-foreground">
          {str > 0 && <UnitTypeBadge type="STR" className="px-1.5 py-0 text-[0.55rem]" />}
          {str > 0 && <span className="tabular-nums">{str}</span>}
          {ltr > 0 && <UnitTypeBadge type="LTR" className="px-1.5 py-0 text-[0.55rem]" />}
          {ltr > 0 && <span className="tabular-nums">{ltr}</span>}
          {str + ltr === 0 && <span className="text-muted-foreground">—</span>}
        </div>
      </div>
    </Link>
  );
}
