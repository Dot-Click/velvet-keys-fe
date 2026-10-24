import * as React from "react";
import { ChevronRight, Columns3, Download, MoreHorizontal, Rows3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ListSearch, SortButton } from "@/components/list-controls";
import { ListPagination } from "@/components/list-pagination";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePagination } from "@/hooks/use-pagination";
import { useSort, type Comparators } from "@/hooks/use-sort";
import { useTableCardLabels } from "@/hooks/use-table-card-labels";
import { matchesQuery } from "@/lib/search";
import { cn } from "@/lib/utils";
import { FilterChips } from "./filter-chips";

export interface DataColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Numbers and amounts are "end"; text is "start" (both mirror in RTL) */
  align?: "start" | "end";
  /** Makes the header sortable */
  sort?: (a: T, b: T) => number;
  /** Plain value for the CSV export; columns without one are left out of the file */
  csv?: (row: T) => string | number;
  /** Starts hidden; the column menu can bring it back */
  defaultHidden?: boolean;
  /** Never hidden by the column menu */
  locked?: boolean;
  className?: string;
}

export interface RowAction<T> {
  id: string;
  label: string;
  onSelect: (row: T) => void;
  /** Destructive actions live here, never as a loud button repeated on every row */
  destructive?: boolean;
  hidden?: (row: T) => boolean;
}

export interface DataChip<T> {
  id: string;
  label: string;
  predicate: (row: T) => boolean;
}

/** Quotes a CSV field the way spreadsheets expect. */
function csvField(value: string | number) {
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * The Admin table: sticky header, search, filter chips with counts, sortable columns, a column
 * menu, comfortable/compact density, CSV export, pagination and designed empty, loading and error
 * states. The whole row opens its detail page; secondary actions sit in the ⋯ menu.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowActions,
  searchText,
  searchPlaceholder,
  chips,
  chipsLabel,
  defaultChip,
  chip,
  onChipChange,
  toolbar,
  footer,
  isLoading,
  error,
  onRetry,
  empty,
  csvName,
  rowClassName,
  selection,
  onSelectionChange,
  isSelectable,
  initialSort,
}: {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => RowAction<T>[];
  /** Text a search should match for a row */
  searchText?: (row: T) => (string | number | null | undefined)[];
  searchPlaceholder?: string;
  chips?: DataChip<T>[];
  chipsLabel?: string;
  defaultChip?: string;
  /** Controlled chip, when the page needs to know it (e.g. to read it from the URL) */
  chip?: string;
  onChipChange?: (id: string) => void;
  /** Extra controls placed at the end of the toolbar */
  toolbar?: React.ReactNode;
  /** Optional totals row or footer slot */
  footer?:
    | React.ReactNode
    | ((context: { visibleColumns: DataColumn<T>[]; colCount: number }) => React.ReactNode);
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  empty?: React.ReactNode;
  csvName?: string;
  rowClassName?: (row: T) => string | undefined;
  /** Row selection for bulk actions */
  selection?: ReadonlySet<string>;
  onSelectionChange?: (next: Set<string>) => void;
  isSelectable?: (row: T) => boolean;
  initialSort?: { key: string; dir: "asc" | "desc" };
}) {
  const { t } = useTranslation("admin");
  const frameRef = React.useRef<HTMLDivElement>(null);
  useTableCardLabels(frameRef);

  const [search, setSearch] = React.useState("");
  const [chipState, setChipState] = React.useState(defaultChip ?? chips?.[0]?.id ?? "");
  const activeChip = chip ?? chipState;
  const [compact, setCompact] = React.useState(true);
  const [hidden, setHidden] = React.useState<Set<string>>(
    () => new Set(columns.filter((column) => column.defaultHidden).map((column) => column.id)),
  );

  const chipMatches = chips?.find((item) => item.id === activeChip);
  const afterChip = chipMatches ? rows.filter(chipMatches.predicate) : rows;
  const matching = searchText
    ? afterChip.filter((row) => matchesQuery(search, ...searchText(row)))
    : afterChip;

  const comparators = React.useMemo(() => {
    const map: Comparators<T> = {};
    for (const column of columns) if (column.sort) map[column.id] = column.sort;
    return map;
  }, [columns]);
  const sorting = useSort(matching, comparators, initialSort ?? null);
  const pager = usePagination(sorting.items);

  const visibleColumns = columns.filter((column) => !hidden.has(column.id));
  const selectable = Boolean(onSelectionChange);
  const pageSelectable = pager.items.filter((row) => (isSelectable ? isSelectable(row) : true));
  const allOnPage =
    pageSelectable.length > 0 && pageSelectable.every((row) => selection?.has(rowKey(row)));

  function toggleRow(row: T, on: boolean) {
    const next = new Set(selection);
    if (on) next.add(rowKey(row));
    else next.delete(rowKey(row));
    onSelectionChange?.(next);
  }

  function toggleAll(on: boolean) {
    const next = new Set(selection);
    for (const row of pageSelectable) {
      if (on) next.add(rowKey(row));
      else next.delete(rowKey(row));
    }
    onSelectionChange?.(next);
  }

  function exportCsv() {
    const exportable = columns.filter((column) => column.csv && !hidden.has(column.id));
    const lines = [
      exportable.map((column) => csvField(column.header)).join(","),
      ...sorting.items.map((row) =>
        exportable.map((column) => csvField(column.csv?.(row) ?? "")).join(","),
      ),
    ];
    // The BOM keeps accents and Arabic readable when the file opens in a spreadsheet
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${csvName ?? "export"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const cellPad = compact ? "px-2.5 py-1.5" : "px-3 py-3";
  const hasActions = Boolean(rowActions);
  const colCount =
    visibleColumns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0) + (onRowClick ? 1 : 0);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {chips && chips.length > 0 ? (
          <FilterChips
            label={chipsLabel ?? ""}
            value={activeChip}
            onChange={(next) => {
              setChipState(next);
              onChipChange?.(next);
            }}
            options={chips.map((item) => ({
              value: item.id,
              label: item.label,
              count: rows.filter(item.predicate).length,
            }))}
          />
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center gap-2">
          {searchText && (
            <ListSearch
              value={search}
              onChange={setSearch}
              placeholder={searchPlaceholder ?? t("dataTable.search")}
              className="sm:w-64"
            />
          )}
          {toolbar}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 border-border/80 bg-[#121212]"
            aria-label={t(compact ? "dataTable.comfortable" : "dataTable.compact")}
            title={t(compact ? "dataTable.comfortable" : "dataTable.compact")}
            onClick={() => setCompact((value) => !value)}
          >
            <Rows3 className="size-4" aria-hidden />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 border-border/80 bg-[#121212]"
                aria-label={t("dataTable.columns")}
                title={t("dataTable.columns")}
              >
                <Columns3 className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-border bg-[#141414] text-[13px]">
              <DropdownMenuLabel>{t("dataTable.columns")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns
                .filter((column) => !column.locked)
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={!hidden.has(column.id)}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(on) =>
                      setHidden((current) => {
                        const next = new Set(current);
                        if (on) next.delete(column.id);
                        else next.add(column.id);
                        return next;
                      })
                    }
                  >
                    {column.header}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {csvName && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 border-border/80 bg-[#121212] text-xs"
              onClick={exportCsv}
              disabled={sorting.items.length === 0}
            >
              <Download className="size-3.5" aria-hidden />
              {t("dataTable.export")}
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-8 text-center">
          <p className="text-sm text-[#FF85A1]">{t("dataTable.loadError")}</p>
          {onRetry && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              {t("dataTable.retry")}
            </Button>
          )}
        </div>
      ) : isLoading ? (
        <div className="space-y-1.5 rounded-lg border border-border/80 bg-[#121212] p-3">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : matching.length === 0 ? (
        (empty ?? (
          <p className="rounded-lg border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
            {t("dataTable.empty")}
          </p>
        ))
      ) : (
        <>
          <div
            ref={frameRef}
            className="table-cards-frame relative max-h-[70vh] overflow-auto rounded-lg border border-border/80 bg-[#121212]"
          >
            <table className="w-full whitespace-nowrap text-[13px]">
              <thead className="sticky top-0 z-10">
                <tr>
                  {selectable && (
                    <th
                      scope="col"
                      className="w-9 border-b border-border/80 bg-[#0F0F0F] ps-2.5 text-start"
                    >
                      <Checkbox
                        checked={allOnPage}
                        onCheckedChange={(on) => toggleAll(on === true)}
                        aria-label={t("dataTable.selectAll")}
                      />
                    </th>
                  )}
                  {visibleColumns.map((column) => (
                    <th
                      key={column.id}
                      scope="col"
                      aria-sort={column.sort ? sorting.ariaSort(column.id) : undefined}
                      className={cn(
                        "border-b border-border/80 bg-[#0F0F0F] px-2.5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
                        column.align === "end" ? "text-end" : "text-start",
                      )}
                    >
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block max-w-full truncate align-middle">
                              {column.sort ? (
                                <SortButton
                                  sorting={sorting}
                                  sortKey={column.id}
                                  align={column.align === "end" ? "end" : "start"}
                                >
                                  {column.header}
                                </SortButton>
                              ) : (
                                column.header
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="border border-border/80 bg-[#161616] px-2.5 py-1 text-xs font-normal normal-case tracking-normal text-foreground"
                          >
                            {column.header}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                  ))}
                  {hasActions && (
                    <th scope="col" className="w-9 border-b border-border/80 bg-[#0F0F0F]">
                      <span className="sr-only">{t("dataTable.actions")}</span>
                    </th>
                  )}
                  {onRowClick && (
                    <th scope="col" className="w-7 border-b border-border/80 bg-[#0F0F0F]">
                      <span className="sr-only">{t("dataTable.open")}</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pager.items.map((row) => {
                  const key = rowKey(row);
                  const actions = rowActions?.(row).filter((action) => !action.hidden?.(row)) ?? [];
                  const canSelect = isSelectable ? isSelectable(row) : true;
                  return (
                    <tr
                      key={key}
                      tabIndex={onRowClick ? 0 : undefined}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      onKeyDown={
                        onRowClick
                          ? (event) => {
                              if (event.target === event.currentTarget && event.key === "Enter") {
                                onRowClick(row);
                              }
                            }
                          : undefined
                      }
                      className={cn(
                        "group transition-colors hover:bg-[#1A1814] focus-visible:bg-[#1A1814] focus-visible:outline-none",
                        onRowClick && "cursor-pointer",
                        rowClassName?.(row),
                      )}
                    >
                      {selectable && (
                        <td className="ps-2.5" onClick={(event) => event.stopPropagation()}>
                          {canSelect && (
                            <Checkbox
                              checked={selection?.has(key) ?? false}
                              onCheckedChange={(on) => toggleRow(row, on === true)}
                              aria-label={t("dataTable.selectRow")}
                            />
                          )}
                        </td>
                      )}
                      {visibleColumns.map((column) => (
                        <td
                          key={column.id}
                          className={cn(
                            cellPad,
                            "align-middle tabular-nums text-foreground",
                            column.align === "end" ? "text-end" : "text-start",
                            column.className,
                          )}
                        >
                          {column.cell(row)}
                        </td>
                      ))}
                      {hasActions && (
                        <td className="w-9 pe-1" onClick={(event) => event.stopPropagation()}>
                          {actions.length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-foreground"
                                  aria-label={t("dataTable.actions")}
                                >
                                  <MoreHorizontal className="size-4" aria-hidden />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="border-border bg-[#141414] text-[13px]"
                              >
                                {actions.map((action, index) => (
                                  <React.Fragment key={action.id}>
                                    {action.destructive && index > 0 && <DropdownMenuSeparator />}
                                    <DropdownMenuItem
                                      onSelect={() => action.onSelect(row)}
                                      className={cn(action.destructive && "text-[#FF85A1]")}
                                    >
                                      {action.label}
                                    </DropdownMenuItem>
                                  </React.Fragment>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      )}
                      {onRowClick && (
                        <td className="w-7 pe-2 text-muted-foreground group-hover:text-primary">
                          <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              {footer && (
                <tfoot className="border-t-2 border-border/80 bg-[#0F0F0F] font-semibold sticky bottom-0 z-10">
                  {typeof footer === "function" ? footer({ visibleColumns, colCount }) : footer}
                </tfoot>
              )}
            </table>
          </div>
          <ListPagination pagination={pager} mono={false} />
        </>
      )}
    </div>
  );
}
