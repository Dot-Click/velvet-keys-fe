import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from "recharts";
import { ArrowLeft, ChevronRight, MapPin, Sparkles } from "lucide-react";
import { formatDate, formatPercent, formatMonth } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { parseDay, toISODate } from "@/lib/dates";
import { today } from "@/lib/clock";
import { Button } from "@/components/ui/button";
import { MediaImage } from "@/components/media/media-image";
import { RentStatusPill } from "@/components/conciergerie/lease-badges";
import { UnitTypeBadge } from "@/components/conciergerie/unit-badges";
import { PropertyOccupancy } from "@/components/owner/portfolio-figures";
import { ListSearch, SortSelect } from "@/components/list-controls";
import { matchesQuery } from "@/lib/search";
import { ListPagination } from "@/components/list-pagination";
import { QueryView } from "@/components/panel-states";
import { usePagination } from "@/hooks/use-pagination";
import { compareNumber, compareText, useSort, type Comparators } from "@/hooks/use-sort";
import {
  useOwnerCalendar,
  useOwnerMonthlyTrend,
  useOwnerPropertyOperations,
  usePortfolioProperty,
  usePropertyFinancials,
} from "@/hooks/use-portfolio-data";
import {
  monthWindow,
  useOwnerPropertyPerformance,
  type OwnerPropertyPerformance,
} from "@/hooks/use-owner-performance";
import { adrMinor, unitMixLabel } from "@/lib/owner-analytics";
import type { Booking } from "@/types/str";
import type { PropertyDetail } from "@/types/portfolio";
import type { PropertyFinancialDetail } from "@/types/owner-financials";

export const Route = createFileRoute("/owner/properties")({
  component: OwnerPropertiesPage,
});

const SOURCE_LABELS: Record<Booking["source"], string | null> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  direct: null,
};

const money = (minor: number | null | undefined, hideDecimals = false) =>
  minor === null || minor === undefined
    ? "—"
    : formatMoney(minor, ACCOUNT_CURRENCY, { hideDecimals });

/** The backend keeps no property description, so cards show the real facts it does keep. */
function propertyFacts(row: OwnerPropertyPerformance) {
  return [unitMixLabel(row.property.unitCounts), row.property.ownerName, row.property.city]
    .filter(Boolean)
    .join(" · ");
}

function OwnerPropertiesPage() {
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<string | null>(null);
  const performance = useOwnerPropertyPerformance();

  if (selectedPropertyId) {
    return (
      <PropertyDetailView
        propertyId={selectedPropertyId}
        onBack={() => setSelectedPropertyId(null)}
      />
    );
  }

  return (
    <QueryView query={performance.properties} skeleton="gallery">
      {() => <PropertyGallery rows={performance.rows} onSelect={setSelectedPropertyId} />}
    </QueryView>
  );
}

const SORTS: Comparators<OwnerPropertyPerformance> = {
  name: (a, b) => compareText(a.property.name, b.property.name),
  city: (a, b) => compareText(a.property.city, b.property.city),
  units: (a, b) => compareNumber(a.property.unitCounts.total, b.property.unitCounts.total),
  adr: (a, b) => compareNumber(a.adrMinor ?? 0, b.adrMinor ?? 0),
  margin: (a, b) => compareNumber(a.breakdown?.marginPct ?? 0, b.breakdown?.marginPct ?? 0),
};

function PropertyGallery({
  rows,
  onSelect,
}: {
  rows: OwnerPropertyPerformance[];
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation(["owner", "common"]);
  const [search, setSearch] = React.useState("");
  const matching = rows.filter((row) =>
    matchesQuery(search, row.property.name, row.property.city, row.property.address),
  );
  const sorting = useSort(matching, SORTS);
  const pager = usePagination(sorting.items);

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-10">
      {/* Gallery Grid View */}
      <div className="space-y-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <p className="text-label-caps text-primary">
                {t("owner:properties.portfolioDirectory")}
              </p>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-[0.1em] text-[#F8F9FA]">
              {t("owner:properties.title")}
            </h1>
            <p className="text-xs text-muted-foreground">{t("owner:properties.subtitle")}</p>
          </div>

          <div className="text-xs font-mono text-muted-foreground">
            <span className="text-primary font-semibold">{rows.length}</span>{" "}
            {t("owner:properties.estatesActive", { count: rows.length })}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <ListSearch
            value={search}
            onChange={setSearch}
            placeholder={t("common:listControls.placeholder.ownerProperties")}
            className="sm:w-72"
          />
          <SortSelect
            sorting={sorting}
            options={[
              { key: "name", label: t("owner:properties.sort.name") },
              { key: "city", label: t("owner:properties.sort.city") },
              { key: "units", label: t("owner:properties.sort.units") },
              { key: "adr", label: t("owner:properties.sort.adr") },
              { key: "margin", label: t("owner:properties.sort.margin") },
            ]}
          />
        </div>
        {pager.items.length === 0 && (
          <p className="rounded-xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
            {t("common:listControls.noResults")}
          </p>
        )}

        {/* Large Image Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {pager.items.map((row) => (
            <div
              key={row.property.id}
              onClick={() => onSelect(row.property.id)}
              className="group cursor-pointer rounded-2xl border border-primary/20 bg-[#141414] overflow-hidden flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.7)] hover:border-primary/50 hover:-translate-y-1.5 transition-all duration-400"
            >
              {/* Large Image (Chiaroscuro Interior) */}
              <div className="relative h-72 w-full overflow-hidden">
                <MediaImage
                  kind="property"
                  id={row.property.id}
                  variant="card"
                  fileId={row.property.imageFileId}
                  name={row.property.name}
                  className="size-full transition-transform duration-700 group-hover:scale-106"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-black/35 to-transparent" />
                <div className="absolute top-4 start-4">
                  <span className="rounded-full border border-primary/50 bg-[#0B0B0B]/80 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-primary font-semibold backdrop-blur-md">
                    {unitMixLabel(row.property.unitCounts)}
                  </span>
                </div>
                <div className="absolute bottom-4 inset-x-4 flex items-end justify-between">
                  <div>
                    <h2 className="font-serif text-2xl text-[#F8F9FA] group-hover:text-primary transition-colors">
                      {row.property.name}
                    </h2>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3 text-primary" />
                      {row.property.address}, {row.property.city}
                    </p>
                  </div>
                  <span className="rounded-full border border-border/80 bg-[#111111]/90 p-2 text-primary group-hover:bg-primary group-hover:text-[#0B0B0B] transition-colors">
                    <ChevronRight className="size-4 rtl-flip" />
                  </span>
                </div>
              </div>

              {/* Card Content & Metrics */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {propertyFacts(row)}
                </p>

                <div className="grid grid-cols-3 gap-3 border-t border-border/60 pt-4 text-center font-tabular">
                  <div className="rounded-lg border border-border/60 bg-[#161616] p-2.5">
                    <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                      {t("owner:properties.monthly")}
                    </p>
                    <p className="text-xs font-semibold text-primary font-mono mt-0.5">
                      {row.breakdown ? money(row.breakdown.grossRevenueMinor, true) : "…"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-[#161616] p-2.5">
                    <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                      {t("owner:properties.adr")}
                    </p>
                    <p className="text-xs font-semibold text-foreground font-mono mt-0.5">
                      {row.strUnits > 0 ? money(row.adrMinor) : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-[#161616] p-2.5">
                    <p className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                      {t("owner:properties.occupancy")}
                    </p>
                    <div className="text-xs mt-0.5">
                      <PropertyOccupancy row={row} compact />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ListPagination pagination={pager} />
      </div>
    </div>
  );
}

function PropertyDetailView({ propertyId, onBack }: { propertyId: string; onBack: () => void }) {
  const propertyQuery = usePortfolioProperty(propertyId);
  const financialQuery = usePropertyFinancials(propertyId, { period: "month" });
  return (
    <QueryView query={propertyQuery} skeleton="split">
      {(property) => (
        <QueryView query={financialQuery} skeleton="split">
          {(financial) => (
            <PropertyDetailContent property={property} financial={financial} onBack={onBack} />
          )}
        </QueryView>
      )}
    </QueryView>
  );
}

function PropertyDetailContent({
  property,
  financial,
  onBack,
}: {
  property: PropertyDetail;
  financial: PropertyFinancialDetail;
  onBack: () => void;
}) {
  const { t } = useTranslation(["owner", "common", "tenant", "conciergerie"]);
  const window = monthWindow();
  const operations = useOwnerPropertyOperations(property.id);
  const calendar = useOwnerCalendar(toISODate(window.start), toISODate(window.end), property.id);
  const units = property.units.filter((unit) => !unit.archivedAt);
  const unitCalendar = new Map(
    (calendar.data ?? []).map((entry) => [entry.unit.unitId, entry.unit]),
  );
  const todayIso = toISODate(today());
  const leaseFor = (unitId: string) =>
    (operations.data?.leases ?? []).find(
      (lease) =>
        lease.unitId === unitId && lease.startDate <= todayIso && lease.endDate >= todayIso,
    );

  // 12 months, one real /owner/kpis?propertyId call per month (the property detail endpoint only
  // returns 6); its own 6-month trend is shown until the 12 months arrive.
  const yearTrend = useOwnerMonthlyTrend(12, property.id);
  const trendPoints = yearTrend.data
    ? yearTrend.data.map((point) => ({
        period: point.month,
        grossRevenueMinor: point.grossRevenueMinor,
        netProfitMinor: point.netProfitMinor,
        occupancyPct: point.occupancyPct,
      }))
    : financial.monthlyTrend;
  const trailingRevenue = trendPoints.reduce((sum, point) => sum + point.grossRevenueMinor, 0);
  // Trailing revenue as a 12-month run rate
  const annualized =
    trendPoints.length === 0 ? 0 : Math.round((trailingRevenue / trendPoints.length) * 12);
  const recentBookings = operations.data?.recentBookings ?? [];
  const openRepairs = operations.data?.openTickets ?? [];

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-10">
      {/* Property Detail View */}
      <div className="space-y-10 animate-in fade-in duration-300">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary ps-0"
        >
          <ArrowLeft className="size-4 me-2 rtl-flip" />
          <span>{t("owner:properties.returnToGallery")}</span>
        </Button>

        {/* Hero Banner with Dark Gradient Overlay */}
        <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden border border-primary/30 shadow-2xl">
          <MediaImage
            kind="property"
            id={property.id}
            variant="hero"
            fileId={property.imageFileId}
            name={property.name}
            className="size-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
          <div className="absolute inset-0 texture-vein opacity-50" />

          <div className="absolute bottom-8 inset-x-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-black/60 px-3.5 py-1 text-xs uppercase tracking-wider text-primary backdrop-blur-md">
                <Sparkles className="size-3" />
                <span>{unitMixLabel(property.unitCounts)}</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl text-[#F8F9FA] tracking-wide">
                {property.name}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" />
                {property.address} · {property.city}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* No deed/title document is stored by the backend yet: kept visible, disabled */}
              <Button
                size="sm"
                disabled
                title={t("owner:properties.deedUnavailable", {
                  defaultValue: "Asset deeds are not available yet",
                })}
                className="btn-shimmer bg-primary text-primary-foreground text-xs uppercase tracking-wider font-semibold"
              >
                {t("owner:properties.downloadAssetDeed")}
              </Button>
            </div>
          </div>
        </div>

        {/* Grid Layout: Units List + Revenue & Occupancy Trend + Recent Bookings + Open Repairs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Units List & Charts - 7 cols */}
          <div className="lg:col-span-7 space-y-8">
            {/* Units List */}
            <div className="rounded-xl border border-primary/20 bg-[#141414] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
                  {t("owner:properties.residentialUnits")}
                </h3>
                <span className="text-xs text-primary font-mono">
                  {t("owner:properties.unitsCount", { count: units.length })}
                </span>
              </div>

              {units.map((unit) => {
                const lease = unit.type === "LTR" ? leaseFor(unit.id) : undefined;
                const calendarUnit = unitCalendar.get(unit.id);
                const unitAdr = calendarUnit
                  ? adrMinor([calendarUnit], window.start, window.end)
                  : null;
                // Backend-computed occupancy of this unit over the calendar window (this month)
                const occupancy = calendarUnit ? calendarUnit.occupancyPct : null;
                const rentStatus = lease ? (lease.nextDueStatus ?? "paid") : null;
                return (
                  <div
                    key={unit.id}
                    className="rounded-lg border border-border/60 bg-[#161616] p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4 min-w-0 md:flex-1">
                      <MediaImage
                        kind="unit"
                        id={unit.id}
                        variant="thumb"
                        fileId={unit.imageFileId}
                        name={unit.name}
                        className="size-14 shrink-0 rounded-lg border border-primary/30"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Sans with lining numerals: the serif face draws a "1" like a capital "I" ("12" read "I2"). */}
                          <p
                            dir="auto"
                            className="font-sans text-base font-medium text-[#F8F9FA] [font-variant-numeric:lining-nums] break-words"
                          >
                            {unit.name}
                          </p>
                          <UnitTypeBadge type={unit.type} />
                        </div>
                        {unit.type === "LTR" ? (
                          lease ? (
                            <p className="text-xs text-muted-foreground">
                              <span className="text-foreground">{lease.tenant.name}</span> ·{" "}
                              {t("owner:properties.leaseEnds", {
                                date: formatDate(parseDay(lease.endDate)),
                              })}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {operations.isPending ? "…" : t("owner:properties.noLease")}
                            </p>
                          )
                        ) : (
                          <p className="text-xs text-muted-foreground">{t("common:units.str")}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-mono md:shrink-0 md:flex-nowrap">
                      <div className="min-w-0">
                        <p className="text-muted-foreground font-sans text-[0.65rem] whitespace-nowrap">
                          {unit.type === "STR"
                            ? t("owner:properties.nightlyAdr")
                            : t("owner:properties.monthlyRent")}
                        </p>
                        <p className="text-primary font-semibold whitespace-nowrap">
                          {unit.type === "STR"
                            ? money(unitAdr ?? unit.nightlyRateMinor)
                            : lease
                              ? money(lease.monthlyRentMinor)
                              : "—"}
                        </p>
                      </div>
                      {unit.type === "STR" ? (
                        <>
                          <div>
                            <p className="text-muted-foreground font-sans text-[0.65rem]">
                              {t("owner:properties.occupancy")}
                            </p>
                            <p className="text-[#A2E8DD] font-semibold">
                              {occupancy === null ? "…" : formatPercent(occupancy)}
                            </p>
                          </div>
                          <span className="shrink-0 whitespace-nowrap rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-[0.62rem] text-success uppercase">
                            {t("owner:properties.operational")}
                          </span>
                        </>
                      ) : lease && rentStatus ? (
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-sans text-[0.65rem]">
                            {t("owner:properties.rentStatus")}
                          </p>
                          <RentStatusPill status={rentStatus} />
                        </div>
                      ) : (
                        <span className="shrink-0 whitespace-nowrap rounded-full border border-border/80 bg-[#121212] px-2.5 py-0.5 text-[0.62rem] text-muted-foreground uppercase">
                          {t("common:status.vacant")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Revenue Chart & Occupancy Trend (real /owner/properties/{id}/detail monthly trend) */}
            <div className="rounded-xl border border-primary/20 bg-[#141414] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div>
                  <p className="text-label-caps text-primary">
                    {t("owner:properties.historicalTelemetry")}
                  </p>
                  <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
                    {t("owner:properties.revenueOccupancyTrend")}
                  </h3>
                </div>
                <span className="text-xs font-mono text-primary font-semibold">
                  {t("owner:properties.annualized", { amount: money(annualized) })}
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendPoints.map((point) => ({
                      ...point,
                      grossRevenue: point.grossRevenueMinor / 100,
                      label: formatMonth(point.period),
                    }))}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="propAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" stroke="#666" tick={{ fontSize: 11 }} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0]
                            ?.payload as PropertyFinancialDetail["monthlyTrend"][number];
                          return (
                            <div className="rounded-lg border border-primary/40 bg-[#141414] p-2.5 text-xs font-mono shadow-xl space-y-1">
                              <p className="text-muted-foreground font-sans">
                                {formatMonth(d.period, { withYear: true })}
                              </p>
                              <p className="text-primary">
                                {t("owner:financials.revenue")}: {money(d.grossRevenueMinor)}
                              </p>
                              <p className="text-[#A2E8DD]">
                                {t("owner:demand.occupancy")} {formatPercent(d.occupancyPct)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="grossRevenue"
                      stroke="#D4AF37"
                      strokeWidth={2}
                      fill="url(#propAreaGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Bookings & Open Repairs - 5 cols */}
          <div className="lg:col-span-5 space-y-8">
            {/* Recent Bookings */}
            <div className="rounded-xl border border-primary/20 bg-[#141414] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
                  {t("owner:properties.recentBookings")}
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {t("owner:properties.liveRoster")}
                </span>
              </div>

              <div className="space-y-3">
                {operations.isPending &&
                  Array.from({ length: 2 }, (_, index) => (
                    <div key={index} className="gold-skeleton h-14 w-full" />
                  ))}
                {operations.isError && (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive-foreground">
                    {t("common:states.errorBody")}
                  </p>
                )}
                {operations.isSuccess && recentBookings.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                    {t("owner:properties.noBookings")}
                  </p>
                )}
                {recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-lg border border-border/60 bg-[#161616] p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-serif text-sm font-semibold text-[#F8F9FA]">
                        {b.guest.name}
                      </p>
                      <span className="text-[0.62rem] uppercase font-mono px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary">
                        {SOURCE_LABELS[b.source] ?? t("common:status.direct")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span>
                        {formatDate(b.checkIn, { month: "short", day: "numeric" })} –{" "}
                        {formatDate(b.checkOut, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        · {b.unitName}
                      </span>
                      <span className="text-foreground font-semibold">{money(b.amountMinor)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Open Repairs */}
            <div className="rounded-xl border border-destructive/25 bg-[#141414] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
                  {t("owner:properties.openEngineering")}
                </h3>
                <span className="text-xs text-destructive-foreground font-mono">
                  {t("owner:properties.pendingTickets", { count: openRepairs.length })}
                </span>
              </div>

              <div className="space-y-3">
                {operations.isPending && <div className="gold-skeleton h-14 w-full" />}
                {operations.isSuccess && openRepairs.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                    {t("owner:properties.noOpenRepairs")}
                  </p>
                )}
                {openRepairs.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg border border-border/60 bg-[#161616] p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">{r.title}</p>
                      <span
                        className={`text-[0.62rem] uppercase font-mono px-2 py-0.5 rounded-full border ${
                          r.urgency === "critical"
                            ? "border-destructive/40 bg-destructive/15 text-destructive-foreground"
                            : "border-primary/40 bg-primary/15 text-primary"
                        }`}
                      >
                        {t(`common:urgency.${r.urgency}`)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span>
                        {r.unitName}
                        {r.workerName
                          ? ` · ${t("owner:properties.assignedTo", { name: r.workerName })}`
                          : ""}
                      </span>
                      <span className="text-destructive-foreground">
                        {money(r.actualCostMinor ?? r.estCostMinor)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* This month's largest expense lines (real /owner/properties/{id}/detail topExpenses) */}
            <div className="rounded-xl border border-primary/20 bg-[#141414] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
                  {t("owner:properties.topExpenses", {
                    defaultValue: "Largest expenses this month",
                  })}
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {financial.topExpenses.length}
                </span>
              </div>
              <div className="space-y-3">
                {financial.topExpenses.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                    {t("owner:properties.noExpenses", {
                      defaultValue: "No expenses recorded this month.",
                    })}
                  </p>
                )}
                {financial.topExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="rounded-lg border border-border/60 bg-[#161616] p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">{expense.description}</p>
                      <span className="text-destructive-foreground font-mono text-xs">
                        {money(expense.amountMinor)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span>{expense.category}</span>
                      <span>{formatDate(expense.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
