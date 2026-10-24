import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { useAuth } from "@/components/auth-provider";
import { BookingDrawer } from "@/components/conciergerie/booking-drawer";
import {
  BookingCard,
  GuestCell,
  PaymentPill,
  SourceCell,
  StayStatePill,
  UnitCell,
  nightsOfStay,
  stayRange,
} from "@/components/conciergerie/bookings/booking-parts";
import { DirectBookingDrawer } from "@/components/conciergerie/bookings/direct-booking-drawer";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { FilterChips } from "@/components/filter-chips";
import { ListSearch } from "@/components/list-controls";
import { ListPagination } from "@/components/list-pagination";
import { PageHeader } from "@/components/page-header";
import { QueryView } from "@/components/panel-states";
import { Button } from "@/components/ui/button";
import { ViewToggle, type ListView } from "@/components/view-toggle";
import { PAGE_SIZES } from "@/hooks/use-pagination";
import { useBookingsPage } from "@/hooks/use-portfolio-data";
import {
  parseOneOf,
  parsePositiveInt,
  parseString,
  useSetSearchParams,
  useUrlState,
  type UrlPagination,
} from "@/hooks/use-url-state";
import type { Page } from "@/lib/apiClient";
import { formatMoney } from "@/lib/money";
import { hasCapability } from "@/lib/roles";
import type { Booking, BookingSource, BookingStatusFilter } from "@/types/str";

export const Route = createFileRoute("/conciergerie/bookings")({
  component: ConciergeBookingsPage,
});

const STATUS_FILTERS = ["all", "upcoming", "inhouse", "past", "unpaid"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const SOURCE_FILTERS = ["all", "airbnb", "booking", "direct"] as const;
type SourceFilter = (typeof SOURCE_FILTERS)[number];
const VIEWS = ["table", "cards"] as const;
const SEARCH_DELAY_MS = 300;

type PageSize = (typeof PAGE_SIZES)[number];

function parsePageSize(raw: unknown): PageSize | undefined {
  const value = parsePositiveInt(raw);
  return PAGE_SIZES.find((size) => size === value);
}

function ConciergeBookingsPage() {
  const [status] = useUrlState<StatusFilter>("status", "all", parseOneOf(STATUS_FILTERS));
  const [source] = useUrlState<SourceFilter>("source", "all", parseOneOf(SOURCE_FILTERS));
  const [q] = useUrlState("q", "", parseString);
  const [page] = useUrlState("page", 1, parsePositiveInt);
  const [pageSize] = useUrlState<PageSize>("pageSize", PAGE_SIZES[0], parsePageSize);
  const query = useBookingsPage({
    page,
    pageSize,
    ...(status !== "all" ? { status: status as BookingStatusFilter } : {}),
    ...(source !== "all" ? { source: source as BookingSource } : {}),
    ...(q ? { q } : {}),
  });

  return (
    <QueryView query={query} skeleton="table">
      {(data) => <BookingsContent data={data} q={q} status={status} source={source} />}
    </QueryView>
  );
}

function BookingsContent({
  data,
  q,
  status,
  source,
}: {
  data: Page<Booking>;
  q: string;
  status: StatusFilter;
  source: SourceFilter;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const { session } = useAuth();
  const canWrite = session ? hasCapability(session.profile, "operations") : false;
  const setParams = useSetSearchParams();
  const [view, setView] = useUrlState<ListView>("view", "table", parseOneOf(VIEWS));
  const [search, setSearch] = React.useState(q);
  const [addOpen, setAddOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Booking | null>(null);
  const closeDrawer = React.useCallback(() => setSelected(null), []);

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
  const pager: UrlPagination<Booking> = {
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

  const filtered = status !== "all" || source !== "all" || q !== "";

  const columns: DataTableColumn<Booking>[] = [
    {
      id: "guest",
      header: t("bookings.colGuest"),
      cell: (booking) => <GuestCell booking={booking} />,
      hideOnMobile: true,
    },
    {
      id: "unit",
      header: t("bookings.colUnit"),
      cell: (booking) => (
        <UnitCell
          unitId={booking.unitId}
          unitName={booking.unitName}
          propertyName={booking.propertyName}
        />
      ),
    },
    {
      id: "dates",
      header: t("bookings.colDates"),
      cell: (booking) => (
        <span className="block whitespace-nowrap text-xs">
          <span className="block tabular-nums text-foreground">
            {stayRange(booking.checkIn, booking.checkOut)}
          </span>
          <span className="block text-[0.7rem] text-muted-foreground">
            {t("bookings.nights", { count: nightsOfStay(booking) })}
          </span>
        </span>
      ),
    },
    {
      id: "source",
      header: t("bookings.colChannel"),
      cell: (booking) => <SourceCell booking={booking} />,
    },
    {
      id: "amount",
      header: t("bookings.colRevenue"),
      align: "end",
      cell: (booking) => (
        <span dir="ltr" className="whitespace-nowrap tabular-nums text-foreground">
          {formatMoney(booking.amountMinor, booking.currency)}
        </span>
      ),
    },
    {
      id: "payment",
      header: t("bookings.paymentStatus"),
      cell: (booking) => <PaymentPill status={booking.paymentStatus} />,
    },
    {
      id: "stay",
      header: t("bookings.colStay"),
      cell: (booking) => <StayStatePill booking={booking} />,
    },
  ];

  const noMatch = (
    <p className="rounded-xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
      {t("bookings.noResults")}
    </p>
  );

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumb={[
          { label: t("common:nav.group.operations") },
          { label: t("common:nav.bookings") },
        ]}
        title={t("bookings.pageTitle")}
        description={t("bookings.pageLine")}
        actions={
          canWrite ? (
            <ReadOnlyGuard>
              <Button size="sm" onClick={() => setAddOpen(true)} className="h-9">
                <Plus className="size-4" aria-hidden="true" />
                {t("bookings.addDirectBooking")}
              </Button>
            </ReadOnlyGuard>
          ) : undefined
        }
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-3">
            <FilterChips
              label={t("bookings.statusFilter")}
              value={status}
              onChange={(next) =>
                setParams(
                  { status: next === "all" ? undefined : next, page: undefined },
                  { replace: true },
                )
              }
              chips={STATUS_FILTERS.map((value) => ({
                value,
                label: t(`bookings.filter.${value === "inhouse" ? "in_house" : value}`),
                ...(value === "unpaid" ? { tone: "ruby" as const } : {}),
              }))}
            />
            <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
            <FilterChips
              label={t("bookings.sourceFilter")}
              value={source}
              onChange={(next) =>
                setParams(
                  { source: next === "all" ? undefined : next, page: undefined },
                  { replace: true },
                )
              }
              chips={SOURCE_FILTERS.map((value) => ({
                value,
                label:
                  value === "all"
                    ? t("bookings.filter.allSources")
                    : t(`bookings.sourceName.${value}`),
              }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <ListSearch
              value={search}
              onChange={setSearch}
              placeholder={t("bookings.searchGuests")}
              className="sm:w-72"
            />
            <ViewToggle value={view} onChange={(next) => setView(next, { replace: true })} />
          </div>
        </div>

        {view === "table" ? (
          <DataTable
            label={t("bookings.pageTitle")}
            columns={columns}
            pagination={pager}
            getRowId={(booking) => booking.id}
            onRowClick={setSelected}
            mobileTitle={(booking) => <GuestCell booking={booking} />}
            empty={noMatch}
          />
        ) : pager.total === 0 ? (
          noMatch
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {pager.items.map((booking) => (
                <li key={booking.id}>
                  <BookingCard booking={booking} onOpen={() => setSelected(booking)} />
                </li>
              ))}
            </ul>
            <ListPagination pagination={pager} mono={false} />
          </>
        )}
      </section>

      <DirectBookingDrawer open={addOpen} onClose={() => setAddOpen(false)} />
      <BookingDrawer booking={selected} onClose={closeDrawer} />
    </div>
  );
}
