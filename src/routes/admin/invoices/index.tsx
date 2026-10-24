import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { differenceInCalendarDays } from "date-fns";
import { X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { AdminPage } from "@/components/admin/admin-page";
import { BulkMarkPaidDialog } from "@/components/admin/bulk-mark-paid-dialog";
import {
  DataTable,
  type DataChip,
  type DataColumn,
  type RowAction,
} from "@/components/admin/data-table";
import { MarkPaidDialog } from "@/components/admin/mark-paid-dialog";
import { ReasonDialog } from "@/components/admin/reason-dialog";
import { InvoiceStatusPill } from "@/components/billing/invoice-status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAdminAllInvoices,
  useAdminInvoiceSummary,
  useGenerateInvoices,
  useRemindInvoice,
  useVoidInvoice,
} from "@/hooks/use-admin-data";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { today } from "@/lib/clock";
import { backendErrorMessage } from "@/lib/error-message";
import { formatDate, formatMonth } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { parseDay, toMonthKey } from "@/lib/dates";
import type { AdminInvoiceListItem } from "@/types/platform-admin";
import type { MonthKey } from "@/types/common";

export const Route = createFileRoute("/admin/invoices/")({
  validateSearch: (search: Record<string, unknown>): { period?: MonthKey } => {
    const period = typeof search["period"] === "string" ? search["period"] : "";
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(period) ? { period: period as MonthKey } : {};
  },
  component: AdminInvoicesPage,
});

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-[#121212] px-4 py-3">
      <p className="text-label-caps text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint && <p className="text-xs tabular-nums text-muted-foreground">{hint}</p>}
    </div>
  );
}

function isPayable(invoice: AdminInvoiceListItem) {
  return invoice.status === "sent" || invoice.status === "overdue";
}

/** Days an invoice has been overdue (today - due date), for the "Days overdue" column. */
function daysOverdue(invoice: AdminInvoiceListItem): number {
  if (!invoice.dueDate) return 0;
  return Math.max(0, differenceInCalendarDays(today(), parseDay(invoice.dueDate)));
}

/**
 * Note: the real `POST .../mark-paid` marks one invoice at a time (there is no bulk endpoint),
 * so "mark selected as paid" below sends that request once per selected invoice
 * (`BulkMarkPaidDialog`) and "send reminders" does the same for `.../remind`. Everything else --
 * search, sortable columns, filter chips with real counts, the column-visibility menu, CSV export
 * and row selection -- comes from the same admin `DataTable` the Clients screen uses, backed by
 * `GET /admin/billing/invoices/all` (unpaginated, like `GET /admin/clients`). The KPI cards and
 * chip counts are platform-wide aggregates from `GET /admin/billing/invoices/summary`.
 */
function AdminInvoicesPage() {
  const { t } = useTranslation("admin-invoices");
  const { t: ta } = useTranslation("admin");
  const { period } = Route.useSearch();
  const navigate = useNavigate();
  const query = useAdminAllInvoices({ ...(period ? { period } : {}) });
  const invoices = React.useMemo(() => query.data ?? [], [query.data]);
  const summary = useAdminInvoiceSummary();
  const remindInvoice = useRemindInvoice();
  const voidInvoice = useVoidInvoice();
  const generate = useGenerateInvoices();
  const [payTarget, setPayTarget] = React.useState<AdminInvoiceListItem | null>(null);
  const [voidTarget, setVoidTarget] = React.useState<AdminInvoiceListItem | null>(null);
  const [generatePeriod, setGeneratePeriod] = React.useState(() => toMonthKey(today()));
  const [selection, setSelection] = React.useState<Set<string>>(new Set());
  const [bulkPayOpen, setBulkPayOpen] = React.useState(false);

  const selectedInvoices = React.useMemo(
    () => invoices.filter((invoice) => selection.has(invoice.id) && isPayable(invoice)),
    [invoices, selection],
  );

  function remind(invoice: AdminInvoiceListItem) {
    remindInvoice.mutate(invoice.id, {
      onSuccess: () =>
        toast.success(t("actions.reminderSent", { client: "", number: invoice.number })),
      onError: () => toast.error(ta("errors.saveFailed")),
    });
  }

  async function remindMany(list: AdminInvoiceListItem[]) {
    const eligible = list.filter(isPayable);
    if (eligible.length === 0) {
      toast.info(t("actions.reminderNothing"));
      return;
    }
    const results = await Promise.allSettled(
      eligible.map((invoice) => remindInvoice.mutateAsync(invoice.id)),
    );
    const done = results.filter((result) => result.status === "fulfilled").length;
    if (done > 0) toast.success(t("bulk.remindersSent", { count: done }));
    if (done < results.length) toast.error(ta("errors.saveFailed"));
  }

  async function copyReference(invoice: AdminInvoiceListItem) {
    try {
      await navigator.clipboard.writeText(invoice.number);
      toast.success(t("actions.copied", { reference: invoice.number }));
    } catch {
      toast.error(t("actions.copyFailed"));
    }
  }

  function runGenerate() {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(generatePeriod.trim())) {
      toast.error(t("generate.badPeriod"));
      return;
    }
    generate.mutate(generatePeriod.trim(), {
      onSuccess: (result) =>
        toast.success(
          t("generate.result", {
            created: result.created.length,
            skipped: result.skipped.length,
          }),
        ),
      onError: (error) =>
        toast.error(t("generate.failed"), {
          description: backendErrorMessage(error, ta("errors.saveFailed")),
        }),
    });
  }

  const columns: DataColumn<AdminInvoiceListItem>[] = [
    {
      id: "number",
      header: ta("invoices.colNumber"),
      locked: true,
      sort: (a, b) => a.number.localeCompare(b.number),
      csv: (invoice) => invoice.number,
      cell: (invoice) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-medium text-foreground">{invoice.number}</span>
          {invoice.proForma && (
            <span className="rounded-full border border-dashed border-muted-foreground/60 px-1.5 py-px text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {ta("invoices.proForma")}
            </span>
          )}
        </span>
      ),
    },
    {
      id: "client",
      header: ta("invoices.colClient"),
      sort: (a, b) => a.accountName.localeCompare(b.accountName),
      csv: (invoice) => invoice.accountName,
      className: "max-w-56",
      cell: (invoice) => (
        <Link
          to="/admin/clients/$clientId"
          params={{ clientId: invoice.accountId }}
          onClick={(event) => event.stopPropagation()}
          className="block truncate text-muted-foreground hover:text-primary"
        >
          {invoice.accountName}
        </Link>
      ),
    },
    {
      id: "period",
      header: ta("invoices.colPeriod"),
      sort: (a, b) => a.periodStart.localeCompare(b.periodStart),
      csv: (invoice) => invoice.periodStart.slice(0, 7),
      cell: (invoice) => (
        <span className="text-muted-foreground">
          {formatMonth(toMonthKey(parseDay(invoice.periodStart)), {
            style: "short",
            withYear: true,
          })}
        </span>
      ),
    },
    {
      id: "total",
      header: ta("invoices.colTotal"),
      align: "end",
      sort: (a, b) => a.totalMinor - b.totalMinor,
      csv: (invoice) => invoice.totalMinor,
      cell: (invoice) => formatMoney(invoice.totalMinor, ACCOUNT_CURRENCY),
    },
    {
      id: "status",
      header: ta("invoices.colStatus"),
      sort: (a, b) => a.status.localeCompare(b.status),
      csv: (invoice) => invoice.status,
      cell: (invoice) => <InvoiceStatusPill status={invoice.status} />,
    },
    {
      id: "issued",
      header: t("col.issued"),
      defaultHidden: true,
      sort: (a, b) => (a.issuedAt ?? "").localeCompare(b.issuedAt ?? ""),
      csv: (invoice) => invoice.issuedAt ?? "",
      cell: (invoice) => (
        <span className="text-muted-foreground">
          {invoice.issuedAt ? formatDate(parseDay(invoice.issuedAt)) : "—"}
        </span>
      ),
    },
    {
      id: "due",
      header: ta("invoices.colDue"),
      sort: (a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""),
      csv: (invoice) => invoice.dueDate ?? "",
      cell: (invoice) => (
        <span className="text-muted-foreground">
          {invoice.dueDate ? formatDate(parseDay(invoice.dueDate)) : "—"}
        </span>
      ),
    },
    {
      id: "daysOverdue",
      header: ta("invoices.colDaysOverdue"),
      align: "end",
      sort: (a, b) => daysOverdue(a) - daysOverdue(b),
      csv: (invoice) => (invoice.status === "overdue" ? daysOverdue(invoice) : 0),
      cell: (invoice) =>
        invoice.status === "overdue" ? (
          <span className="font-semibold text-[#FF85A1]">
            {t("col.days", { count: daysOverdue(invoice) })}
          </span>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        ),
    },
    {
      id: "markPaid",
      header: ta("invoices.colActions"),
      locked: true,
      align: "end",
      cell: (invoice) =>
        isPayable(invoice) ? (
          <ReadOnlyGuard>
            <Button
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                setPayTarget(invoice);
              }}
              className="h-7 border-border/80 px-2.5 text-xs text-foreground hover:border-primary/60 hover:text-primary"
            >
              {t("actions.markPaid")}
            </Button>
          </ReadOnlyGuard>
        ) : null,
    },
  ];

  const chips: DataChip<AdminInvoiceListItem>[] = [
    { id: "all", label: ta("invoices.chip.all"), predicate: () => true },
    { id: "sent", label: ta("invoices.chip.sent"), predicate: (i) => i.status === "sent" },
    { id: "overdue", label: ta("invoices.chip.overdue"), predicate: (i) => i.status === "overdue" },
    { id: "paid", label: ta("invoices.chip.paid"), predicate: (i) => i.status === "paid" },
    { id: "free", label: t("chip.free"), predicate: (i) => i.status === "free" },
    { id: "proforma", label: ta("invoices.chip.proforma"), predicate: (i) => i.proForma },
  ];

  const rowActions = (invoice: AdminInvoiceListItem): RowAction<AdminInvoiceListItem>[] => [
    {
      id: "reminder",
      label: t("actions.sendReminder"),
      hidden: () => !isPayable(invoice),
      onSelect: () => remind(invoice),
    },
    {
      id: "void",
      label: t("actions.void", { defaultValue: "Void" }),
      destructive: true,
      hidden: () => invoice.status === "void",
      onSelect: () => setVoidTarget(invoice),
    },
    {
      id: "copy",
      label: t("actions.copyReference"),
      onSelect: () => void copyReference(invoice),
    },
  ];

  return (
    <AdminPage
      eyebrow={ta("invoices.eyebrow")}
      title={ta("invoices.title")}
      subtitle={ta("invoices.count", {
        shown: invoices.length,
        count: invoices.length,
        amount: summary.data
          ? formatMoney(summary.data.outstanding.amountMinor, ACCOUNT_CURRENCY)
          : "—",
      })}
      actions={
        <ReadOnlyGuard>
          <div className="flex items-center gap-2">
            <Input
              value={generatePeriod}
              onChange={(event) => setGeneratePeriod(event.target.value)}
              placeholder="YYYY-MM"
              className="h-9 w-28 border-border/80 bg-[#121212] text-xs"
            />
            <Button
              size="sm"
              onClick={runGenerate}
              disabled={generate.isPending}
              className="h-9 bg-primary text-xs font-semibold text-primary-foreground"
            >
              {generate.isPending
                ? ta("actions.saving")
                : t("generate.action")}
            </Button>
          </div>
        </ReadOnlyGuard>
      }
    >
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          label={t("summary.outstanding")}
          value={
            summary.data ? formatMoney(summary.data.outstanding.amountMinor, ACCOUNT_CURRENCY) : "—"
          }
          hint={
            summary.data
              ? t("summary.outstandingHint", { count: summary.data.outstanding.count })
              : undefined
          }
        />
        <SummaryCard
          label={t("summary.overdue")}
          value={
            summary.data ? formatMoney(summary.data.overdue.amountMinor, ACCOUNT_CURRENCY) : "—"
          }
          hint={
            summary.data
              ? t("summary.overdueHint", { count: summary.data.overdue.count })
              : undefined
          }
        />
        <SummaryCard
          label={t("summary.dueWeek")}
          value={
            summary.data ? formatMoney(summary.data.dueThisWeek.amountMinor, ACCOUNT_CURRENCY) : "—"
          }
          hint={
            summary.data
              ? t("summary.dueWeekHint", {
                  count: summary.data.dueThisWeek.count,
                  date: formatDate(parseDay(summary.data.dueThisWeekUntil)),
                })
              : undefined
          }
        />
        <SummaryCard
          label={t("summary.collected")}
          value={
            summary.data
              ? formatMoney(summary.data.paidThisMonth.amountMinor, ACCOUNT_CURRENCY)
              : "—"
          }
          hint={
            summary.data
              ? t("summary.collectedHint", {
                  count: summary.data.paidThisMonth.count,
                  month: formatMonth(summary.data.paidThisMonthPeriod as MonthKey, {
                    style: "long",
                    withYear: true,
                  }),
                })
              : undefined
          }
        />
      </div>

      <DataTable<AdminInvoiceListItem>
        columns={columns}
        rows={invoices}
        rowKey={(invoice) => invoice.id}
        isLoading={query.isPending}
        error={query.isError}
        onRetry={() => void query.refetch()}
        onRowClick={(invoice) =>
          void navigate({ to: "/admin/invoices/$invoiceId", params: { invoiceId: invoice.id } })
        }
        rowActions={rowActions}
        searchText={(invoice) => [invoice.number, invoice.accountName]}
        searchPlaceholder={ta("invoices.searchPlaceholder")}
        chips={chips}
        chipsLabel={ta("invoices.filterLabel")}
        csvName="invoices"
        initialSort={{ key: "due", dir: "desc" }}
        selection={selection}
        onSelectionChange={setSelection}
        isSelectable={isPayable}
        rowClassName={(invoice) =>
          invoice.status === "overdue"
            ? "shadow-[inset_3px_0_0_#8B002B] rtl:shadow-[inset_-3px_0_0_#8B002B]"
            : undefined
        }
        toolbar={
          period ? (
            <button
              type="button"
              onClick={() => void navigate({ to: "/admin/invoices", search: {} })}
              aria-label={t("period.dismiss")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 text-xs text-primary hover:bg-primary/15"
            >
              {t("period.chip", { month: formatMonth(period, { style: "long", withYear: true }) })}
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null
        }
      />

      {selectedInvoices.length > 0 && (
        <div className="sticky bottom-4 z-20 mx-auto flex w-fit max-w-full flex-wrap items-center gap-3 rounded-xl border border-primary/40 bg-[#141414] px-4 py-2.5 shadow-2xl">
          <span className="text-xs font-medium tabular-nums">
            {t("bulk.selected", { count: selectedInvoices.length })}
          </span>
          <ReadOnlyGuard>
            <Button
              size="sm"
              onClick={() => setBulkPayOpen(true)}
              className="h-8 bg-primary text-xs font-semibold text-primary-foreground"
            >
              {t("bulk.markSelected")}
            </Button>
          </ReadOnlyGuard>
          <Button
            variant="outline"
            size="sm"
            disabled={remindInvoice.isPending}
            onClick={() => void remindMany(selectedInvoices)}
            className="h-8 text-xs"
          >
            {t("bulk.sendReminders")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelection(new Set())}
            className="h-8 text-xs text-muted-foreground"
          >
            {t("bulk.clear")}
          </Button>
        </div>
      )}

      <MarkPaidDialog
        invoice={payTarget}
        onOpenChange={(open) => {
          if (!open) setPayTarget(null);
        }}
      />
      <BulkMarkPaidDialog
        invoices={selectedInvoices}
        open={bulkPayOpen}
        onOpenChange={setBulkPayOpen}
        onDone={() => setSelection(new Set())}
      />
      <ReasonDialog
        open={voidTarget !== null}
        onOpenChange={(open) => !open && setVoidTarget(null)}
        title={t("void.title", { defaultValue: "Void invoice" })}
        description={t("void.description", {
          defaultValue: "This invoice will no longer be payable.",
        })}
        confirmLabel={t("void.confirm", { defaultValue: "Void" })}
        tone="danger"
        pending={voidInvoice.isPending}
        onConfirm={(reason) => {
          if (!voidTarget) return;
          voidInvoice.mutate(
            { invoiceId: voidTarget.id, reason },
            {
              onSuccess: () => {
                toast.success(t("void.done", { defaultValue: "Invoice voided." }));
                setVoidTarget(null);
              },
              onError: () => toast.error(ta("errors.saveFailed")),
            },
          );
        }}
      />
    </AdminPage>
  );
}
