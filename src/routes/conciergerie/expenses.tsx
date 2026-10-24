import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { useAuth } from "@/components/auth-provider";
import {
  CategoryBreakdown,
  ExpenseStatusPill,
  UtilityCard,
} from "@/components/conciergerie/expenses/expense-cards";
import { ExpenseDialog, expenseErrorKey } from "@/components/conciergerie/expenses/expense-dialog";
import { ReceiptThumb } from "@/components/conciergerie/expenses/receipt-thumb";
import { TrendStrip } from "@/components/conciergerie/expenses/trend-strip";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ListSearch } from "@/components/list-controls";
import { PageHeader } from "@/components/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useExpensesPage,
  useExpenseSummary,
  useOwnerExpenseKpis,
  usePanelMutation,
  useProperties,
  useUtilities,
} from "@/hooks/use-portfolio-data";
import { useServerPageControls, useServerPagination } from "@/hooks/use-server-pagination";
import { parseOneOf, parseString, useSetSearchParams, useUrlState } from "@/hooks/use-url-state";
import { formatDate } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { hasCapability } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { expensesService } from "@/services/ops-service";
import type { Expense, ExpenseCategory, ExpenseStatus } from "@/types/ops";

export const Route = createFileRoute("/conciergerie/expenses")({
  component: ExpensesPage,
});

const TABS = ["all", "workers", "utilities", "repairs", "other"] as const;
type ExpenseTab = (typeof TABS)[number];
const TAB_CATEGORY: Record<ExpenseTab, ExpenseCategory | undefined> = {
  all: undefined,
  workers: "worker_pay",
  utilities: "utility",
  repairs: "repair",
  other: "other",
};
const STATUS_FILTERS = ["all", "due", "overdue", "paid"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const ALL = "all";
const SEARCH_DELAY_MS = 300;

function ExpensesPage() {
  const { t } = useTranslation(["conciergerie", "common"]);
  const { session } = useAuth();
  const canWrite = session ? hasCapability(session.profile, "operations") : false;
  const setParams = useSetSearchParams();
  const controls = useServerPageControls();

  const [tab] = useUrlState<ExpenseTab>("tab", "all", parseOneOf(TABS));
  const [statusFilter] = useUrlState<StatusFilter>("status", "all", parseOneOf(STATUS_FILTERS));
  const [propertyId] = useUrlState<string>("property", ALL, parseString);
  const [urlQuery] = useUrlState<string>("q", "", parseString);

  // The search box is typed into freely; the URL (and the request) follow after a pause
  const [search, setSearch] = React.useState(urlQuery);
  React.useEffect(() => {
    if (search === urlQuery) return;
    const timer = setTimeout(
      () => setParams({ q: search.trim() || undefined, page: undefined }, { replace: true }),
      SEARCH_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [search, urlQuery, setParams]);

  const category = TAB_CATEGORY[tab];
  const propertyFilter = propertyId === ALL ? undefined : propertyId;
  const list = useExpensesPage({
    page: controls.page,
    pageSize: controls.pageSize,
    ...(category ? { category } : {}),
    ...(propertyFilter ? { propertyId: propertyFilter } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter as ExpenseStatus } : {}),
    ...(urlQuery ? { q: urlQuery } : {}),
  });
  const summary = useExpenseSummary();
  const kpis = useOwnerExpenseKpis(propertyFilter ? { propertyId: propertyFilter } : {});
  const utilities = useUtilities();
  const properties = useProperties();

  const [dialog, setDialog] = React.useState<{ expense: Expense | null } | null>(null);
  const [toDelete, setToDelete] = React.useState<Expense | null>(null);

  const markPaid = usePanelMutation((id: string) => expensesService.markPaid(id));
  const remove = usePanelMutation((id: string) => expensesService.remove(id));

  const filtersActive = Boolean(urlQuery || propertyFilter || statusFilter !== "all");

  const columns: DataTableColumn<Expense>[] = [
    {
      id: "date",
      header: t("expenses.colDate"),
      cell: (row) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDate(row.date)}
        </span>
      ),
    },
    {
      id: "description",
      header: t("expenses.colDescription"),
      hideOnMobile: true,
      cell: (row) => <DescriptionCell row={row} />,
    },
    {
      id: "property",
      header: t("expenses.colProperty"),
      cell: (row) => <span className="text-xs text-foreground">{row.propertyName}</span>,
    },
    {
      id: "category",
      header: t("expenses.colCategory"),
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-muted-foreground">
          {t(`expenses.categoryName.${row.category}`)}
        </span>
      ),
    },
    {
      id: "status",
      header: t("expenses.colStatus"),
      cell: (row) => (
        <span className="flex flex-col items-start gap-0.5">
          <ExpenseStatusPill status={row.status} />
          {row.status !== "paid" && row.dueDate && (
            <span className="text-[0.65rem] text-muted-foreground">
              {t("expenses.dueOn", { date: formatDate(row.dueDate) })}
            </span>
          )}
        </span>
      ),
    },
    {
      id: "amount",
      header: t("expenses.colAmount"),
      align: "end",
      cell: (row) => (
        <span dir="ltr" className="whitespace-nowrap tabular-nums text-foreground">
          {formatMoney(row.amountMinor, row.currency)}
        </span>
      ),
    },
    ...(canWrite
      ? [
          {
            id: "actions",
            header: <span className="sr-only">{t("expenses.colActions")}</span>,
            align: "end" as const,
            cell: (row: Expense) => (
              <span className="flex items-center justify-end gap-1">
                {row.status !== "paid" && (
                  <ReadOnlyGuard>
                    <Button
                      size="sm"
                      variant="outlineGold"
                      disabled={markPaid.isPending}
                      onClick={(event) => {
                        event.stopPropagation();
                        markPaid.mutate(row.id, {
                          onSuccess: () =>
                            toast.success(t("expenses.billPaid", { property: row.propertyName }), {
                              description: t("expenses.billPaidBody", {
                                amount: formatMoney(row.amountMinor, row.currency),
                              }),
                            }),
                          onError: (error) => toast.error(t(expenseErrorKey(error))),
                        });
                      }}
                      className="h-8 px-2.5 text-xs"
                    >
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                      {t("expenses.markPaid")}
                    </Button>
                  </ReadOnlyGuard>
                )}
                <ReadOnlyGuard>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t("common:actions.edit")}
                    onClick={(event) => {
                      event.stopPropagation();
                      setDialog({ expense: row });
                    }}
                    className="size-8"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </Button>
                </ReadOnlyGuard>
                <ReadOnlyGuard>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={t("common:actions.delete")}
                    onClick={(event) => {
                      event.stopPropagation();
                      setToDelete(row);
                    }}
                    className="size-8 text-muted-foreground hover:text-[#FF85A1]"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                </ReadOnlyGuard>
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumb={[{ label: t("common:nav.group.finance") }, { label: t("common:nav.expenses") }]}
        title={t("expenses.pageTitle")}
        description={t("expenses.pageLine")}
        actions={
          canWrite ? (
            <ReadOnlyGuard>
              <Button size="sm" onClick={() => setDialog({ expense: null })} className="h-9">
                <Plus className="size-4" aria-hidden="true" />
                {t("expenses.add")}
              </Button>
            </ReadOnlyGuard>
          ) : undefined
        }
      />

      {summary.isError ? (
        <InlineError onRetry={() => void summary.refetch()} />
      ) : summary.data ? (
        <TrendStrip summary={summary.data} label={t("expenses.thisMonth")} />
      ) : (
        <Skeleton className="h-44 w-full rounded-2xl" />
      )}

      {kpis.isError ? (
        <InlineError onRetry={() => void kpis.refetch()} />
      ) : kpis.data ? (
        <CategoryBreakdown kpis={kpis.data} />
      ) : (
        <Skeleton className="h-32 w-full rounded-2xl" />
      )}

      <div
        role="tablist"
        aria-label={t("expenses.pageTitle")}
        className="flex gap-6 overflow-x-auto border-b border-border/70"
      >
        {TABS.map((item) => {
          const active = tab === item;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() =>
                setParams(
                  { tab: item === "all" ? undefined : item, page: undefined },
                  { replace: true },
                )
              }
              className={cn(
                "relative whitespace-nowrap pb-3 text-sm transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`expenses.tabs.${item}`)}
              {active && (
                <motion.span
                  layoutId="expensesTab"
                  className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-primary shadow-[0_0_12px_rgba(212,175,55,0.7)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {tab === "utilities" && (
        <section className="space-y-3">
          <h2 className="font-serif text-xl tracking-normal text-[#F8F9FA]">
            {t("expenses.utilitiesTitle")}
          </h2>
          {utilities.isError ? (
            <InlineError onRetry={() => void utilities.refetch()} />
          ) : !utilities.data ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-36 rounded-2xl" />
              ))}
            </div>
          ) : utilities.data.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
              {t("expenses.noBills")}
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {utilities.data.map((row) => (
                <li key={`${row.unitId}-${row.utilityType}`}>
                  <UtilityCard row={row} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="font-serif text-xl tracking-normal text-[#F8F9FA]">
            {t("expenses.ledgerTitle")}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={propertyId}
              onValueChange={(value) =>
                setParams(
                  { property: value === ALL ? undefined : value, page: undefined },
                  { replace: true },
                )
              }
            >
              <SelectTrigger
                aria-label={t("expenses.colProperty")}
                className="h-9 w-44 border-border/80 bg-[#121212] text-[13px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("expenses.allProperties")}</SelectItem>
                {(properties.data ?? []).map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setParams(
                  { status: value === ALL ? undefined : value, page: undefined },
                  { replace: true },
                )
              }
            >
              <SelectTrigger
                aria-label={t("expenses.colStatus")}
                className="h-9 w-36 border-border/80 bg-[#121212] text-[13px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item === "all" ? t("expenses.allStatuses") : t(`expenses.status.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ListSearch
              value={search}
              onChange={setSearch}
              placeholder={t("common:listControls.placeholder.ledger")}
              className="sm:w-60"
            />
          </div>
        </div>

        {list.isError ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-10 text-center"
          >
            <AlertTriangle className="size-5 text-destructive-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{t("common:states.errorBody")}</p>
            <Button variant="outline" size="sm" onClick={() => void list.refetch()}>
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {t("common:states.retry")}
            </Button>
          </div>
        ) : !list.data ? (
          <div aria-busy="true" aria-label={t("common:states.loading")} className="space-y-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : (
          <LedgerTable
            data={list.data}
            refreshing={list.isPlaceholderData}
            columns={columns}
            filtersActive={filtersActive}
            canWrite={canWrite}
            onAdd={() => setDialog({ expense: null })}
            controls={controls}
          />
        )}
      </section>

      <ExpenseDialog
        open={dialog !== null}
        expense={dialog?.expense ?? null}
        onClose={() => setDialog(null)}
      />

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-primary/30 bg-[#141414]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("expenses.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? t("expenses.deleteBody", {
                    description: toDelete.description,
                    amount: formatMoney(toDelete.amountMinor, toDelete.currency),
                  })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!toDelete) return;
                remove.mutate(toDelete.id, {
                  onSuccess: () => {
                    setToDelete(null);
                    toast.success(t("expenses.deleted"));
                  },
                  onError: (error) => toast.error(t(expenseErrorKey(error))),
                });
              }}
            >
              {t("common:actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LedgerTable({
  data,
  refreshing,
  columns,
  filtersActive,
  canWrite,
  onAdd,
  controls,
}: {
  data: NonNullable<ReturnType<typeof useExpensesPage>["data"]>;
  refreshing: boolean;
  columns: DataTableColumn<Expense>[];
  filtersActive: boolean;
  canWrite: boolean;
  onAdd: () => void;
  controls: ReturnType<typeof useServerPageControls>;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const pager = useServerPagination(data, controls);
  return (
    <div className={cn("transition-opacity", refreshing && "opacity-60")} aria-busy={refreshing}>
      <DataTable
        label={t("expenses.ledgerTitle")}
        columns={columns}
        pagination={pager}
        getRowId={(row) => row.id}
        mobileTitle={(row) => <DescriptionCell row={row} />}
        empty={
          <EmptyState
            illustrationName="empty-expenses"
            title={t("expenses.emptyLedgerTitle")}
            description={
              filtersActive ? t("common:listControls.noResults") : t("expenses.emptyLedgerLine")
            }
            {...(canWrite && !filtersActive ? { action: t("expenses.add"), onAction: onAdd } : {})}
            className="min-h-56"
          />
        }
      />
    </div>
  );
}

function InlineError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("common");
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-muted-foreground"
    >
      <span className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-destructive-foreground" aria-hidden="true" />
        {t("states.errorBody")}
      </span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCcw className="size-3.5" aria-hidden="true" />
        {t("states.retry")}
      </Button>
    </div>
  );
}

function DescriptionCell({ row }: { row: Expense }) {
  const { t } = useTranslation("conciergerie");
  const detail = [
    row.category === "utility" && row.utilityType ? t(`expenses.utility.${row.utilityType}`) : null,
    row.workerName,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <span className="flex min-w-0 items-center gap-3">
      <ReceiptThumb expense={row} />
      <span className="min-w-0">
        <span className="block truncate text-[0.85rem] text-foreground">{row.description}</span>
        {detail && (
          <span className="block truncate text-[0.7rem] text-muted-foreground">{detail}</span>
        )}
        {row.ticketId && (
          <Link
            to="/conciergerie/maintenance"
            onClick={(event) => event.stopPropagation()}
            className="block truncate text-[0.7rem] text-primary hover:underline"
          >
            {t("expenses.viewTicket")}
          </Link>
        )}
      </span>
    </span>
  );
}
