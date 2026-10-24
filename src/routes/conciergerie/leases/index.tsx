import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { LeaseStatePill, RentStatusPill } from "@/components/conciergerie/lease-badges";
import { NewLeaseDrawer } from "@/components/conciergerie/new-lease-drawer";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { FilterChips } from "@/components/filter-chips";
import { InitialsAvatar } from "@/components/initials-avatar";
import { ListSearch } from "@/components/list-controls";
import { ListPagination } from "@/components/list-pagination";
import { MediaImage } from "@/components/media/media-image";
import { PageHeader } from "@/components/page-header";
import { QueryView } from "@/components/panel-states";
import { SummaryStrip } from "@/components/summary-strip";
import { Button } from "@/components/ui/button";
import { useLeasesPage } from "@/hooks/use-portfolio-data";
import { useServerPageControls, useServerPagination } from "@/hooks/use-server-pagination";
import { parseOneOf, useUrlState } from "@/hooks/use-url-state";
import { formatDate } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { parseDay } from "@/lib/dates";
import type { Lease, LeaseStatusFilter } from "@/types/ltr";

export const Route = createFileRoute("/conciergerie/leases/")({
  component: LeasesPage,
});

const FILTERS = ["active", "ending", "ended"] as const;
type LeaseFilter = (typeof FILTERS)[number];

function LeasesPage() {
  const { t } = useTranslation(["conciergerie", "common"]);
  const navigate = useNavigate();
  const [filter, setFilter] = useUrlState<LeaseFilter>("filter", "active", parseOneOf(FILTERS));
  const [lateOnly, setLateOnly] = React.useState(false);
  const [newOpen, setNewOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const controls = useServerPageControls();
  const query = useLeasesPage({
    page: controls.page,
    pageSize: controls.pageSize,
    status: filter as LeaseStatusFilter,
    lateRent: lateOnly,
    ...(search ? { q: search } : {}),
  });

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumb={[{ label: t("common:nav.group.longTerm") }, { label: t("common:nav.leases") }]}
        title={t("leases.pageTitle")}
        actions={
          <ReadOnlyGuard>
            <Button size="sm" onClick={() => setNewOpen(true)} className="h-9">
              <Plus className="size-4" aria-hidden="true" />
              {t("leases.newLease")}
            </Button>
          </ReadOnlyGuard>
        }
      />

      <SummaryStrip
        items={[
          { id: "total", label: t("leases.summary.active"), value: query.data?.total ?? 0 },
        ]}
      />

      <QueryView
        query={query}
        skeleton="table"
        isEmpty={(page) => page.total === 0 && !search && !lateOnly}
        empty={
          <EmptyState
            illustrationName="empty-leases"
            title={t("leases.emptyTitle")}
            description={t("leases.emptyLine")}
            action={t("leases.newLease")}
            onAction={() => setNewOpen(true)}
          />
        }
      >
        {(page) => (
          <LeasesContent
            page={page}
            filter={filter}
            setFilter={setFilter}
            lateOnly={lateOnly}
            setLateOnly={setLateOnly}
            search={search}
            setSearch={setSearch}
            controls={controls}
            open={(lease) =>
              void navigate({ to: "/conciergerie/leases/$leaseId", params: { leaseId: lease.id } })
            }
          />
        )}
      </QueryView>

      <NewLeaseDrawer open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}

function LeasesContent({
  page,
  filter,
  setFilter,
  lateOnly,
  setLateOnly,
  search,
  setSearch,
  controls,
  open,
}: {
  page: import("@/lib/apiClient").Page<Lease>;
  filter: LeaseFilter;
  setFilter: (value: LeaseFilter, options?: { replace?: boolean }) => void;
  lateOnly: boolean;
  setLateOnly: (value: boolean) => void;
  search: string;
  setSearch: (value: string) => void;
  controls: ReturnType<typeof useServerPageControls>;
  open: (lease: Lease) => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const pager = useServerPagination(page, controls);

  const columns: DataTableColumn<Lease>[] = [
    {
      id: "unit",
      header: t("leases.colUnit"),
      hideOnMobile: true,
      cell: (lease) => <UnitCell lease={lease} />,
    },
    {
      id: "tenant",
      header: t("leases.colTenant"),
      cell: (lease) => (
        <span className="inline-flex items-center gap-2.5">
          <InitialsAvatar name={lease.tenant.name} size="sm" tone="jade" />
          <span className="text-foreground">{lease.tenant.name}</span>
        </span>
      ),
    },
    {
      id: "period",
      header: t("leases.colPeriod"),
      className: "min-w-56",
      cell: (lease) => (
        <span className="block space-y-1.5">
          <LeaseStatePill state={lease.computedStatus} />
        </span>
      ),
    },
    {
      id: "rent",
      header: t("leases.colRent"),
      align: "end",
      cell: (lease) => (
        <span dir="ltr" className="whitespace-nowrap tabular-nums text-[#A2E8DD]">
          {formatMoney(lease.monthlyRentMinor, lease.currency)}
        </span>
      ),
    },
    {
      id: "nextDue",
      header: t("leases.colNextDue"),
      cell: (lease) =>
        lease.nextDueDate ? (
          <span className="block whitespace-nowrap text-xs">
            <span
              className={lease.nextDueStatus === "late" ? "block text-[#FF85A1]" : "block text-foreground"}
            >
              {formatDate(parseDay(lease.nextDueDate))}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "rentStatus",
      header: t("leases.colRentStatus"),
      cell: (lease) =>
        lease.nextDueStatus ? (
          <RentStatusPill status={lease.nextDueStatus} />
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          label={t("leases.filterLabel")}
          value={lateOnly ? "late" : filter}
          onChange={(next) => {
            if (next === "late") {
              setLateOnly(!lateOnly);
            } else {
              setLateOnly(false);
              setFilter(next as LeaseFilter, { replace: true });
            }
          }}
          chips={[
            ...FILTERS.map((value) => ({ value, label: t(`leases.filter.${value}`) })),
            { value: "late", label: t("leases.filter.late"), tone: "ruby" as const },
          ]}
        />
        <div className="flex items-center gap-2">
          <ListSearch
            value={search}
            onChange={setSearch}
            placeholder={t("common:listControls.placeholder.leases")}
            className="sm:w-60"
          />
        </div>
      </div>

      {page.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
          {search ? t("common:listControls.noResults") : t(`leases.emptyFilter.${filter}`)}
        </p>
      ) : (
        <>
          <DataTable
            label={t("leases.pageTitle")}
            columns={columns}
            pagination={pager}
            getRowId={(lease) => lease.id}
            onRowClick={open}
            mobileTitle={(lease) => <UnitCell lease={lease} />}
            rowClassName={(lease) =>
              lease.nextDueStatus === "late"
                ? "[&>td:first-child]:shadow-[inset_3px_0_0_#FF85A1] rtl:[&>td:first-child]:shadow-[inset_-3px_0_0_#FF85A1]"
                : undefined
            }
          />
          <ListPagination pagination={pager} mono={false} />
        </>
      )}
    </section>
  );
}

function UnitCell({ lease }: { lease: Lease }) {
  return (
    <span className="group flex min-w-0 items-center gap-3">
      <span className="overflow-hidden rounded-lg">
        <MediaImage kind="unit" id={lease.unitId} name={lease.unitName} variant="thumb" className="hover-zoom size-10 shrink-0 rounded-lg" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-serif text-[0.98rem] text-[#F8F9FA]">
          {lease.unitName}
        </span>
        <span className="block truncate text-[0.7rem] text-muted-foreground">
          {lease.propertyName}
        </span>
      </span>
    </span>
  );
}
