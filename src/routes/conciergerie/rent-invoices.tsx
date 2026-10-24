import { createFileRoute, Link } from "@tanstack/react-router";
import { differenceInCalendarDays } from "date-fns";
import { AlertTriangle, Check, Download, Landmark, MoreHorizontal, Sparkles } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { RentStatusPill } from "@/components/conciergerie/lease-badges";
import { RentInvoicePreviewDialog } from "@/components/conciergerie/rent-invoice-preview-dialog";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { FilterChips } from "@/components/filter-chips";
import { InitialsAvatar } from "@/components/initials-avatar";
import { ListSearch } from "@/components/list-controls";
import { PageHeader } from "@/components/page-header";
import { QueryView } from "@/components/panel-states";
import { SummaryStrip } from "@/components/summary-strip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIssuerProfile, usePanelMutation, useRentInvoicesPage } from "@/hooks/use-portfolio-data";
import { useReadOnly } from "@/hooks/use-read-only";
import { useServerPageControls, useServerPagination } from "@/hooks/use-server-pagination";
import { parseOneOf, useUrlState } from "@/hooks/use-url-state";
import { today } from "@/lib/clock";
import { formatDate, formatMonth } from "@/lib/currency";
import { isIssuerProfileComplete } from "@/lib/issuer";
import { formatMoney } from "@/lib/money";
import { parseDay, toMonthKey } from "@/lib/dates";
import { rentInvoicesService } from "@/services/ltr-service";
import type { RentInvoice, RentInvoiceStatus } from "@/types/ltr";

export const Route = createFileRoute("/conciergerie/rent-invoices")({
  component: RentInvoicesPage,
});

const FILTERS = ["all", "unpaid", "late", "paid"] as const;
type StatusFilter = (typeof FILTERS)[number];

const LATE_EDGE =
  "[&>td:first-child]:shadow-[inset_3px_0_0_#FF85A1] rtl:[&>td:first-child]:shadow-[inset_-3px_0_0_#FF85A1] border-s-[3px] border-s-[#FF85A1] md:border-s-0";

function RentInvoicesPage() {
  const { t } = useTranslation(["conciergerie", "common"]);
  const { isReadOnly } = useReadOnly();
  const [filter, setFilter] = useUrlState<StatusFilter>("status", "all", parseOneOf(FILTERS));
  const [search, setSearch] = React.useState("");
  const [previewInvoice, setPreviewInvoice] = React.useState<RentInvoice | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const controls = useServerPageControls();
  const issuer = useIssuerProfile();
  const period = toMonthKey(today());

  const query = useRentInvoicesPage({
    page: controls.page,
    pageSize: controls.pageSize,
    ...(filter !== "all" ? { status: filter as RentInvoiceStatus } : {}),
    ...(search ? { q: search } : {}),
  });

  const generate = usePanelMutation((generatePeriod: string) =>
    rentInvoicesService.generate(generatePeriod),
  );
  const markReceived = usePanelMutation((invoiceId: string) =>
    rentInvoicesService.markReceived(invoiceId),
  );

  const issuerReady = isIssuerProfileComplete(issuer.data);
  const month = formatMonth(period, { style: "long", withYear: true });

  const receive = (row: RentInvoice) =>
    markReceived.mutate(row.id, {
      onSuccess: (invoice) =>
        toast.success(t("today.rentReceived", { tenant: row.tenantName }), {
          description: t("today.rentReceivedDesc", {
            amount: formatMoney(invoice.amountMinor, invoice.currency),
            period: formatMonth(invoice.period, { style: "long", withYear: true }),
          }),
        }),
      onError: () => toast.error(t("today.rentFailed")),
    });

  const daysLate = (row: RentInvoice) =>
    differenceInCalendarDays(today(), parseDay(row.dueDate));

  const columns: DataTableColumn<RentInvoice>[] = [
    {
      id: "period",
      header: t("rentInvoices.colPeriod"),
      cell: (row) => (
        <span className="block whitespace-nowrap">
          <span className="block text-foreground">
            {formatMonth(row.period, { style: "long", withYear: true })}
          </span>
          <span className="block text-[0.68rem] tabular-nums text-muted-foreground">
            {row.number}
          </span>
        </span>
      ),
    },
    {
      id: "tenant",
      header: t("rentInvoices.colTenant"),
      hideOnMobile: true,
      cell: (row) => <TenantCell row={row} />,
    },
    {
      id: "unit",
      header: t("rentInvoices.colUnit"),
      cell: (row) => (
        <span className="min-w-0 text-xs">
          <span className="block truncate text-foreground">{row.unitName}</span>
          <span className="block truncate text-muted-foreground">{row.propertyName}</span>
        </span>
      ),
    },
    {
      id: "amount",
      header: t("rentInvoices.colAmount"),
      align: "end",
      cell: (row) => (
        <span dir="ltr" className="whitespace-nowrap tabular-nums text-foreground">
          {formatMoney(row.amountMinor, row.currency)}
        </span>
      ),
    },
    {
      id: "due",
      header: t("rentInvoices.colDue"),
      cell: (row) => (
        <span className="block whitespace-nowrap text-xs">
          <span className="block text-foreground">{formatDate(parseDay(row.dueDate))}</span>
          {row.status === "late" && (
            <span className="block text-[#FF85A1]">
              {t("today.rentLate", { count: daysLate(row) })}
            </span>
          )}
        </span>
      ),
    },
    {
      id: "status",
      header: t("rentInvoices.colStatus"),
      cell: (row) => <RentStatusPill status={row.status} />,
    },
    {
      id: "actions",
      header: <span className="sr-only">{t("rentInvoices.colActions")}</span>,
      align: "end",
      cell: (row) => (
        <span
          className="inline-flex items-center justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {row.status !== "paid" && (
            <ReadOnlyGuard>
              <Button
                variant="outlineGold"
                size="sm"
                onClick={() => receive(row)}
                className="h-8 px-2.5 text-[0.7rem]"
              >
                <Check className="size-3.5" aria-hidden="true" />
                {t("today.markReceived")}
              </Button>
            </ReadOnlyGuard>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("rentInvoices.moreActions")}
                className="size-8"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 border-border bg-[#141414]">
              <DropdownMenuItem
                className="cursor-pointer gap-2 text-xs"
                onSelect={() => setPreviewInvoice(row)}
              >
                <Download className="size-3.5" aria-hidden="true" />
                {t("rentInvoices.downloadPdf")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      ),
    },
  ];

  const canGenerate = issuerReady;
  const generateButton = (
    <Button
      size="sm"
      onClick={() => setGenerating(true)}
      disabled={!canGenerate || generating || generate.isPending}
      className="h-9"
    >
      <Sparkles className="size-4" aria-hidden="true" />
      {t("rentInvoices.generate", { month })}
    </Button>
  );

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumb={[
          { label: t("common:nav.group.longTerm") },
          { label: t("common:nav.rentInvoices") },
        ]}
        title={t("rentInvoices.pageTitle")}
        description={t("rentInvoices.subtitle")}
        actions={
          <>
            <Button variant="outlineGold" size="sm" asChild className="h-9">
              <Link to="/conciergerie/settings/issuer">
                <Landmark className="size-4" aria-hidden="true" />
                {t("rentInvoices.issuerLink")}
              </Link>
            </Button>
            {isReadOnly ? (
              <ReadOnlyGuard className="flex">{generateButton}</ReadOnlyGuard>
            ) : !canGenerate ? (
              <TooltipProvider delayDuration={120}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} className="inline-flex cursor-not-allowed rounded-md">
                      {generateButton}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64 border border-border bg-[#141414] text-xs text-foreground">
                    {t("rentInvoices.generateNeedsIssuer")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              generateButton
            )}
          </>
        }
      />

      {!issuerReady && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-border/70 border-s-[3px] border-s-[#FF85A1] bg-[#191214] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#FF85A1]" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {t("rentInvoices.issuerIncompleteTitle")}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("rentInvoices.issuerIncompleteBody")}
              </p>
            </div>
          </div>
          <Button variant="outlineRuby" size="sm" asChild className="h-9 shrink-0">
            <Link to="/conciergerie/settings/issuer">{t("rentInvoices.completeIssuer")}</Link>
          </Button>
        </div>
      )}

      <QueryView
        query={query}
        skeleton="table"
        isEmpty={(page) => page.total === 0 && !search && filter === "all"}
        empty={
          <EmptyState
            illustrationName="empty-rent"
            title={t("rentInvoices.emptyTitle")}
            description={t("rentInvoices.emptyLine")}
            {...(canGenerate && !isReadOnly
              ? { action: t("rentInvoices.generate", { month }), onAction: () => setGenerating(true) }
              : {})}
          />
        }
      >
        {(page) => (
          <RentInvoicesContent
            page={page}
            columns={columns}
            controls={controls}
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
            month={month}
            onOpenInvoice={setPreviewInvoice}
          />
        )}
      </QueryView>

      {generating && (
        <GenerateConfirm
          month={month}
          onClose={() => setGenerating(false)}
          onConfirm={async () => {
            try {
              await generate.mutateAsync(period);
              toast.success(t("rentInvoices.generate", { month }));
            } catch (error) {
              void error;
              toast.error(t("common:states.errorBody"));
            } finally {
              setGenerating(false);
            }
          }}
        />
      )}
      <RentInvoicePreviewDialog invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />
    </div>
  );
}

function RentInvoicesContent({
  page,
  columns,
  controls,
  filter,
  setFilter,
  search,
  setSearch,
  month,
  onOpenInvoice,
}: {
  page: import("@/lib/apiClient").Page<RentInvoice>;
  columns: DataTableColumn<RentInvoice>[];
  controls: ReturnType<typeof useServerPageControls>;
  filter: StatusFilter;
  setFilter: (value: StatusFilter, options?: { replace?: boolean }) => void;
  search: string;
  setSearch: (value: string) => void;
  month: string;
  onOpenInvoice: (row: RentInvoice) => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const pager = useServerPagination(page, controls);

  return (
    <section className="space-y-4">
      <SummaryStrip
        items={[
          { id: "total", label: t("rentInvoices.summary.expected", { month }), value: page.total },
        ]}
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          label={t("rentInvoices.filterLabel")}
          value={filter}
          onChange={(next) => setFilter(next, { replace: true })}
          chips={FILTERS.map((value) => ({
            value,
            label: t(`rentInvoices.filter.${value}`),
            ...(value === "late" ? { tone: "ruby" as const } : {}),
            ...(value === "paid" ? { tone: "jade" as const } : {}),
          }))}
        />
        <ListSearch
          value={search}
          onChange={setSearch}
          placeholder={t("common:listControls.placeholder.rentInvoices")}
          className="sm:w-60"
        />
      </div>

      <DataTable
        label={t("rentInvoices.pageTitle")}
        columns={columns}
        pagination={pager}
        getRowId={(row) => row.id}
        onRowClick={onOpenInvoice}
        mobileTitle={(row) => <TenantCell row={row} />}
        rowClassName={(row) => (row.status === "late" ? LATE_EDGE : undefined)}
        empty={
          <p className="rounded-xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
            {search ? t("common:listControls.noResults") : t("rentInvoices.emptyFilter")}
          </p>
        }
      />
    </section>
  );
}

/** Lightweight confirm step in place of the old client-side "who's missing" preview dialog --
 *  the backend decides who is missing an invoice and skips them, returned in the response. */
function GenerateConfirm({
  month,
  onClose,
  onConfirm,
}: {
  month: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-primary/30 bg-[#141414] p-6">
        <h2 className="font-display text-lg uppercase tracking-[0.12em] text-foreground">
          {t("rentInvoices.generate", { month })}
        </h2>
        <p className="text-sm text-muted-foreground">{t("rentInvoices.missingNote", { count: 0, month })}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            {t("common:actions.cancel")}
          </Button>
          <Button size="sm" onClick={() => void onConfirm()} className="text-xs">
            {t("rentInvoices.generate", { month })}
          </Button>
        </div>
      </div>
    </div>
  );
}

function TenantCell({ row }: { row: RentInvoice }) {
  return (
    <Link
      to="/conciergerie/leases/$leaseId"
      params={{ leaseId: row.leaseId }}
      onClick={(event) => event.stopPropagation()}
      className="inline-flex min-w-0 items-center gap-2.5 hover:text-primary"
    >
      <InitialsAvatar name={row.tenantName} size="sm" tone="jade" />
      <span className="truncate font-serif text-[0.98rem]">{row.tenantName}</span>
    </Link>
  );
}
