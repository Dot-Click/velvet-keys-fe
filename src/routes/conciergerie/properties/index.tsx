import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { PropertyCard } from "@/components/conciergerie/property-card";
import { PropertyFormDrawer } from "@/components/conciergerie/property-form-drawer";
import { UnitTypeBadge } from "@/components/conciergerie/unit-badges";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { InitialsAvatar } from "@/components/initials-avatar";
import { ListSearch } from "@/components/list-controls";
import { ListPagination } from "@/components/list-pagination";
import { MediaImage } from "@/components/media/media-image";
import { PageHeader } from "@/components/page-header";
import { QueryView } from "@/components/panel-states";
import { Button } from "@/components/ui/button";
import { ViewToggle, type ListView } from "@/components/view-toggle";
import { useIsSoloOwner } from "@/hooks/use-is-solo-owner";
import { PAGE_SIZES } from "@/hooks/use-pagination";
import { usePropertiesPage } from "@/hooks/use-portfolio-data";
import {
  parseOneOf,
  parsePositiveInt,
  parseString,
  useSetSearchParams,
  useUrlState,
  type UrlPagination,
} from "@/hooks/use-url-state";
import type { Page } from "@/lib/apiClient";
import { formatPercent } from "@/lib/currency";
import type { Property } from "@/types/portfolio";

export const Route = createFileRoute("/conciergerie/properties/")({
  component: PropertiesPage,
});

const VIEWS = ["cards", "table"] as const;
const SEARCH_DELAY_MS = 300;

type PageSize = (typeof PAGE_SIZES)[number];

function parsePageSize(raw: unknown): PageSize | undefined {
  const value = parsePositiveInt(raw);
  return PAGE_SIZES.find((size) => size === value);
}

function PropertiesPage() {
  const [q] = useUrlState("q", "", parseString);
  const [page] = useUrlState("page", 1, parsePositiveInt);
  const [pageSize] = useUrlState<PageSize>("pageSize", PAGE_SIZES[0], parsePageSize);
  const query = usePropertiesPage({ page, pageSize, ...(q ? { q } : {}) });
  return (
    <QueryView query={query} skeleton="gallery">
      {(data) => <PropertiesGallery data={data} q={q} />}
    </QueryView>
  );
}

function PropertiesGallery({ data, q }: { data: Page<Property>; q: string }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const navigate = useNavigate();
  const solo = useIsSoloOwner();
  const setParams = useSetSearchParams();
  const [view, setView] = useUrlState<ListView>("view", "cards", parseOneOf(VIEWS));
  const [addOpen, setAddOpen] = React.useState(false);
  const [search, setSearch] = React.useState(q);

  // The backend filters; the URL follows the search box once typing pauses
  React.useEffect(() => {
    if (search.trim() === q) return;
    const handle = window.setTimeout(
      () => setParams({ q: search.trim() || undefined, page: undefined }, { replace: true }),
      SEARCH_DELAY_MS,
    );
    return () => window.clearTimeout(handle);
  }, [search, q, setParams]);

  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));
  const pager: UrlPagination<Property> = {
    page: data.page,
    pageSize: data.pageSize,
    pageCount,
    total: data.total,
    from: data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1,
    to: Math.min(data.page * data.pageSize, data.total),
    items: data.items,
    loadMore: false,
    setPage: (next) =>
      setParams({ page: Math.min(Math.max(1, next), pageCount) === 1 ? undefined : next }),
    setPageSize: (next) =>
      setParams({ pageSize: next === PAGE_SIZES[0] ? undefined : next, page: undefined }),
  };

  const columns: DataTableColumn<Property>[] = [
    {
      id: "name",
      header: t("properties.sort.name"),
      hideOnMobile: true,
      cell: (property) => <NameCell property={property} />,
    },
    {
      id: "units",
      header: t("properties.sort.units"),
      cell: (property) => (
        <span className="inline-flex items-center gap-1.5 text-xs">
          {property.unitCounts.str > 0 && (
            <UnitTypeBadge type="STR" className="px-1.5 py-0 text-[0.55rem]" />
          )}
          {property.unitCounts.str > 0 && (
            <span className="tabular-nums">{property.unitCounts.str}</span>
          )}
          {property.unitCounts.ltr > 0 && (
            <UnitTypeBadge type="LTR" className="px-1.5 py-0 text-[0.55rem]" />
          )}
          {property.unitCounts.ltr > 0 && (
            <span className="tabular-nums">{property.unitCounts.ltr}</span>
          )}
          {property.unitCounts.total === 0 && <span className="text-muted-foreground">—</span>}
        </span>
      ),
    },
    ...(solo
      ? []
      : [
          {
            id: "owner",
            header: t("properties.sort.owner"),
            cell: (property: Property) =>
              property.ownerUserId ? (
                <span className="inline-flex items-center gap-2 text-xs text-foreground">
                  <InitialsAvatar
                    name={property.ownerName}
                    size="sm"
                    className="size-6 text-[0.55rem]"
                  />
                  {property.ownerName}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">{t("properties.noOwner")}</span>
              ),
          },
          {
            id: "commission",
            header: t("properties.sort.commission"),
            align: "end" as const,
            cell: (property: Property) => (
              <span className="tabular-nums text-primary">
                {property.commissionPct === null ? "—" : formatPercent(property.commissionPct)}
              </span>
            ),
          },
        ]),
  ];

  const hasNoProperties = data.total === 0 && q === "";

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumb={[
          { label: t("common:nav.group.portfolio") },
          { label: t("common:nav.properties") },
        ]}
        title={t("properties.pageTitle")}
        description={t("properties.subtitleTotal", { count: data.total })}
        actions={
          <ReadOnlyGuard>
            <Button size="sm" onClick={() => setAddOpen(true)} className="h-9">
              <Plus className="size-4" aria-hidden="true" />
              {t("properties.addProperty")}
            </Button>
          </ReadOnlyGuard>
        }
      />

      {hasNoProperties ? (
        <EmptyState
          illustrationName="empty-properties"
          title={t("properties.emptyTitle")}
          description={t("properties.emptyLine")}
          action={t("properties.addProperty")}
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <ListSearch
              value={search}
              onChange={setSearch}
              placeholder={t("properties.searchPlaceholder")}
              className="sm:w-72"
            />
            <div className="flex items-center gap-2">
              <ViewToggle value={view} onChange={(next) => setView(next, { replace: true })} />
            </div>
          </div>

          {pager.total === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
              {t("common:listControls.noResults")}
            </p>
          ) : view === "cards" ? (
            <>
              <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {pager.items.map((property) => (
                  <li key={property.id}>
                    <PropertyCard property={property} />
                  </li>
                ))}
              </ul>
              <ListPagination pagination={pager} mono={false} />
            </>
          ) : (
            <DataTable
              label={t("properties.pageTitle")}
              columns={columns}
              pagination={pager}
              getRowId={(property) => property.id}
              onRowClick={(property) =>
                void navigate({
                  to: "/conciergerie/properties/$propertyId",
                  params: { propertyId: property.id },
                })
              }
              mobileTitle={(property) => <NameCell property={property} />}
            />
          )}
        </section>
      )}

      <PropertyFormDrawer open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function NameCell({ property }: { property: Property }) {
  return (
    <span className="group flex min-w-0 items-center gap-3">
      <span className="overflow-hidden rounded-lg">
        <MediaImage
          kind="property"
          id={property.id}
          fileId={property.imageFileId}
          name={property.name}
          variant="thumb"
          className="hover-zoom size-10 shrink-0 rounded-lg"
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-serif text-[0.98rem] text-[#F8F9FA]">
          {property.name}
        </span>
        <span className="block truncate text-[0.7rem] text-muted-foreground">{property.city}</span>
      </span>
    </span>
  );
}
