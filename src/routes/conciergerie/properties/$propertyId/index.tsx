import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, MapPin, Pencil, Plus } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { UnitPhotoCard } from "@/components/conciergerie/properties/property-parts";
import { PropertyFormDrawer } from "@/components/conciergerie/property-form-drawer";
import { UnitFormDrawer } from "@/components/conciergerie/unit-form-drawer";
import { EmptyState } from "@/components/empty-state";
import { InitialsAvatar } from "@/components/initials-avatar";
import { ListPagination } from "@/components/list-pagination";
import { MediaImage } from "@/components/media/media-image";
import { PanelEmptyState, QueryView } from "@/components/panel-states";
import { SummaryStrip } from "@/components/summary-strip";
import { Button } from "@/components/ui/button";
import { useIsSoloOwner } from "@/hooks/use-is-solo-owner";
import { usePortfolioProperty } from "@/hooks/use-portfolio-data";
import { useUrlPagination } from "@/hooks/use-url-state";
import { hasErrorCode } from "@/lib/apiClient";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { formatPercent } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import type { PropertyDetail as PropertyDetailData, Unit } from "@/types/portfolio";

export const Route = createFileRoute("/conciergerie/properties/$propertyId/")({
  component: PropertyDetailPage,
});

const UNITS_PER_PAGE = 9;

function PropertyDetailPage() {
  const { propertyId } = Route.useParams();
  const { t } = useTranslation("conciergerie");
  const navigate = useNavigate();
  const query = usePortfolioProperty(propertyId);

  if (hasErrorCode(query.error, "PROPERTY_NOT_FOUND", "NOT_FOUND")) {
    return (
      <PanelEmptyState
        illustrationName="empty-properties"
        title={t("properties.notFoundTitle")}
        description={t("properties.notFoundBody")}
        action={t("properties.backToProperties")}
        onAction={() => void navigate({ to: "/conciergerie/properties" })}
      />
    );
  }

  return (
    <QueryView query={query} skeleton="split">
      {(property) => <PropertyDetail property={property} />}
    </QueryView>
  );
}

function PropertyDetail({ property }: { property: PropertyDetailData }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  // Solo owners manage their own properties: no owner link and no commission
  const solo = useIsSoloOwner();
  const [editOpen, setEditOpen] = React.useState(false);
  const [unitDrawer, setUnitDrawer] = React.useState<{ open: boolean; unit: Unit | null }>({
    open: false,
    unit: null,
  });
  // Removed units are archived: they stay on the backend for history but are not active
  const units = React.useMemo(
    () => property.units.filter((unit) => unit.archivedAt === null),
    [property.units],
  );
  const pager = useUrlPagination(units, { param: "units", fixedPageSize: UNITS_PER_PAGE });
  const { str, ltr, total } = property.unitCounts;
  const { revenueMinor, occupancyPct } = property.quickStats;

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <nav aria-label={t("common:breadcrumb")}>
        <ol className="flex flex-wrap items-center gap-1 text-[0.7rem] text-muted-foreground">
          <li>{t("common:nav.group.portfolio")}</li>
          <li aria-hidden="true">
            <ChevronRight className="size-3 rtl-flip opacity-60" />
          </li>
          <li>
            <Link to="/conciergerie/properties" className="hover:text-primary">
              {t("common:nav.properties")}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="size-3 rtl-flip opacity-60" />
          </li>
          <li aria-current="page" className="text-foreground/80">
            {property.name}
          </li>
        </ol>
      </nav>

      {/* Full-width hero */}
      <section className="group relative h-[300px] overflow-hidden rounded-2xl border border-border/70 sm:h-[380px]">
        <MediaImage
          kind="property"
          id={property.id}
          fileId={property.imageFileId}
          name={property.name}
          variant="hero"
          loading="eager"
          className="hover-zoom absolute inset-0 size-full"
        />
        <span className="absolute inset-0 bg-[linear-gradient(to_top,#0E0E0E_0%,rgba(14,14,14,0.55)_45%,rgba(14,14,14,0.05)_100%)]" />
        <div className="absolute end-4 top-4 flex gap-2">
          <ReadOnlyGuard>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditOpen(true)}
              className="h-9 bg-black/50 backdrop-blur"
            >
              <Pencil className="size-4" aria-hidden="true" />
              {t("properties.editProperty")}
            </Button>
          </ReadOnlyGuard>
          <ReadOnlyGuard>
            <Button
              size="sm"
              onClick={() => setUnitDrawer({ open: true, unit: null })}
              className="h-9"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("units.addUnit")}
            </Button>
          </ReadOnlyGuard>
        </div>
        <div className="absolute inset-x-5 bottom-5 flex flex-col gap-3 sm:inset-x-8 sm:bottom-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <h1 className="truncate font-serif text-[2.25rem] leading-[1.05] tracking-[0.01em] text-[#F8F9FA] sm:text-[3.25rem]">
              {property.name}
            </h1>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 text-primary" aria-hidden="true" />
              {property.address}, {property.city}
            </p>
          </div>
          {!solo &&
            (property.ownerUserId ? (
              <Link
                to="/conciergerie/owners/$ownerId"
                params={{ ownerId: property.ownerUserId }}
                className="inline-flex shrink-0 items-center gap-2.5 rounded-full border border-border/70 bg-black/50 py-1 pe-4 ps-1 text-sm text-foreground backdrop-blur transition-colors hover:border-primary/50"
              >
                <InitialsAvatar name={property.ownerName} size="sm" />
                <span>
                  <span className="block text-[0.65rem] text-muted-foreground">
                    {t("properties.owner")}
                  </span>
                  <span className="block leading-tight">{property.ownerName}</span>
                </span>
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">{t("properties.noOwner")}</span>
            ))}
        </div>
      </section>

      <SummaryStrip
        items={[
          {
            id: "units",
            label: t("properties.kpi.units"),
            value: total,
            hint: t("properties.kpi.unitsSplit", { str, ltr }),
          },
          {
            id: "occupancy",
            label: t("properties.kpi.occupancyNow"),
            value: occupancyPct,
            tone: "jade",
            display: formatPercent(occupancyPct, { decimals: 0 }),
          },
          {
            id: "revenue",
            label: t("properties.kpi.revenue"),
            value: revenueMinor,
            tone: "gold",
            display: formatMoney(revenueMinor, ACCOUNT_CURRENCY),
          },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
        <section className="space-y-3 xl:col-span-8">
          <h2 className="font-serif text-2xl tracking-normal text-[#F8F9FA]">
            {t("units.title", { count: units.length })}
          </h2>
          {units.length === 0 ? (
            <EmptyState
              illustrationName="empty-properties"
              title={t("units.emptyTitle")}
              description={t("units.emptyLine")}
              action={t("units.addUnit")}
              onAction={() => setUnitDrawer({ open: true, unit: null })}
            />
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {pager.items.map((unit) => (
                  <li key={unit.id}>
                    <UnitPhotoCard
                      propertyId={property.id}
                      unit={unit}
                      onEdit={() => setUnitDrawer({ open: true, unit })}
                    />
                  </li>
                ))}
              </ul>
              <ListPagination pagination={pager} mono={false} />
            </>
          )}
        </section>

        {!solo && property.commissionPct !== null && (
          <aside className="space-y-4 xl:col-span-4">
            <section className="space-y-3 rounded-2xl border border-primary/25 bg-[linear-gradient(160deg,rgba(212,175,55,0.08),transparent_60%),#141414] p-5">
              <h2 className="font-serif text-lg tracking-normal text-[#F8F9FA]">
                {t("properties.commission")}
              </h2>
              <p className="figure-serif text-3xl text-primary" dir="ltr">
                {formatPercent(property.commissionPct)}
              </p>
              <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
                {t("properties.commissionManageHint")}
              </p>
              <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                <Link to="/conciergerie/commission">{t("properties.commissionManage")}</Link>
              </Button>
            </section>
          </aside>
        )}
      </div>

      <PropertyFormDrawer open={editOpen} onClose={() => setEditOpen(false)} property={property} />
      <UnitFormDrawer
        open={unitDrawer.open}
        onClose={() => setUnitDrawer({ open: false, unit: null })}
        propertyId={property.id}
        unit={unitDrawer.unit}
      />
    </div>
  );
}
