import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { SortButton } from "@/components/list-controls";
import { ListPagination } from "@/components/list-pagination";
import type { UrlPagination } from "@/hooks/use-url-state";
import type { Sorting } from "@/hooks/use-sort";
import { opsItemVariants, opsListVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Applied to the header and every cell of the column */
  className?: string;
  align?: "start" | "end" | "center";
  /** Left out of the phone cards (e.g. a thumbnail already shown in the title) */
  hideOnMobile?: boolean;
  /** Comparator key in `sorting`; the header becomes a sort button */
  sortKey?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  /** The page to show, from useUrlPagination */
  pagination: UrlPagination<T>;
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Column sorting from useSort; headers with a `sortKey` toggle it */
  sorting?: Sorting<T>;
  /** Extra classes per row, e.g. a ruby start edge for late rows */
  rowClassName?: (row: T) => string | undefined;
  /** Phone card title; columns keep their labelled rows below it */
  mobileTitle?: (row: T) => ReactNode;
  /** Groups consecutive rows under a header row, e.g. one per week */
  groupBy?: (row: T) => { key: string; label: ReactNode };
  /**
   * Caps the table height so it scrolls inside with a sticky header (and sticky group headers),
   * e.g. "max-h-[620px]"
   */
  scrollClassName?: string;
  /** Accessible name of the table */
  label: string;
  /** Shown instead of the table when there are no rows */
  empty?: ReactNode;
  className?: string;
}

const ALIGN = { start: "text-start", end: "text-end", center: "text-center" } as const;

/**
 * Shared operations table: rows highlight with a sliding end chevron, reveal 40ms apart, become
 * labelled cards on phones and page 10 / 25 / 50 at a time with the page kept in the URL.
 */
export function DataTable<T>({
  columns,
  pagination,
  getRowId,
  onRowClick,
  sorting,
  rowClassName,
  mobileTitle,
  groupBy,
  scrollClassName,
  label,
  empty,
  className,
}: DataTableProps<T>) {
  if (pagination.total === 0 && empty) return <>{empty}</>;
  const rows = pagination.items;
  const clickable = Boolean(onRowClick);

  return (
    <div className={cn("space-y-0", className)}>
      {/* Desktop and tablet */}
      <div
        className={cn(
          "relative hidden overflow-x-auto rounded-xl border border-border/70 bg-[#121212] md:block",
          scrollClassName && cn("overflow-y-auto", scrollClassName),
        )}
      >
        <table className="w-full text-sm" aria-label={label}>
          <thead className={cn(scrollClassName && "sticky top-0 z-20 bg-[#121212]")}>
            <tr className="border-b border-border/70 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  {...(sorting && column.sortKey
                    ? { "aria-sort": sorting.ariaSort(column.sortKey) }
                    : {})}
                  className={cn(
                    "px-4 py-3 font-semibold",
                    ALIGN[column.align ?? "start"],
                    column.className,
                  )}
                >
                  {sorting && column.sortKey ? (
                    <SortButton
                      sorting={sorting}
                      sortKey={column.sortKey}
                      align={column.align === "end" ? "end" : "start"}
                    >
                      {column.header}
                    </SortButton>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {clickable && <th aria-hidden="true" className="w-10" />}
            </tr>
          </thead>
          <motion.tbody
            key={`${pagination.page}-${pagination.pageSize}`}
            variants={opsListVariants}
            initial="initial"
            animate="animate"
          >
            {rows.map((row, index) => {
              const group = groupBy?.(row);
              const previous = index > 0 && groupBy ? groupBy(rows[index - 1] as T).key : null;
              const groupRow =
                group && group.key !== previous ? (
                  <tr key={`group-${group.key}`} className="border-b border-border/50">
                    <th
                      scope="rowgroup"
                      colSpan={columns.length + (clickable ? 1 : 0)}
                      className={cn(
                        "bg-[#171717] px-4 py-2 text-start text-[0.7rem] font-medium text-muted-foreground",
                        scrollClassName && "sticky top-[41px] z-10",
                      )}
                    >
                      {group.label}
                    </th>
                  </tr>
                ) : null;
              return [
                groupRow,
                <motion.tr
                  key={getRowId(row)}
                  variants={opsItemVariants}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={clickable ? 0 : undefined}
                  className={cn(
                    "border-b border-border/40 last:border-b-0",
                    clickable &&
                      "hover-row cursor-pointer focus-visible:bg-primary/5 focus-visible:outline-none",
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn("px-4 py-3", ALIGN[column.align ?? "start"], column.className)}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                  {clickable && (
                    <td className="pe-3 text-end">
                      <ChevronRight
                        className="row-chevron inline size-4 text-primary"
                        aria-hidden
                      />
                    </td>
                  )}
                </motion.tr>,
              ];
            })}
          </motion.tbody>
        </table>
      </div>

      {/* Phones: one card per row */}
      <ul className="space-y-2 md:hidden" aria-label={label}>
        {rows.map((row, index) => {
          const group = groupBy?.(row);
          const previous = index > 0 && groupBy ? groupBy(rows[index - 1] as T).key : null;
          return (
            <li key={getRowId(row)}>
              {group && group.key !== previous && (
                <p className="px-1 pb-1.5 pt-2 text-[0.7rem] font-medium text-muted-foreground">
                  {group.label}
                </p>
              )}
              <div
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "hover-row rounded-xl border border-border/70 bg-[#121212] p-3.5",
                  rowClassName?.(row),
                )}
              >
                {mobileTitle && <div className="mb-2.5">{mobileTitle(row)}</div>}
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                  {columns
                    .filter((column) => !column.hideOnMobile)
                    .map((column) => (
                      <div key={column.id} className="contents">
                        <dt className="text-muted-foreground">{column.header}</dt>
                        <dd className="min-w-0 text-end text-foreground">{column.cell(row)}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            </li>
          );
        })}
      </ul>

      <ListPagination pagination={pagination} mono={false} />
    </div>
  );
}
