import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZES, type Pagination } from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";

/** Page numbers to show: first, last, and a window around the current page, with gaps as null. */
function pageWindow(page: number, pageCount: number): (number | null)[] {
  const keep = new Set([1, pageCount, page - 1, page, page + 1]);
  const pages = [...keep].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const result: (number | null)[] = [];
  pages.forEach((p, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && p - previous > 1) result.push(null);
    result.push(p);
  });
  return result;
}

/**
 * Footer for a paged list: "1–10 of 42", a rows-per-page choice and numbered page buttons. It
 * renders nothing when everything fits on the smallest page, so short lists stay uncluttered.
 */
export function ListPagination<T>({
  pagination,
  mono = true,
  className,
}: {
  /** With `loadMore` (phones, URL paging) a "Load more" button replaces the page numbers */
  pagination: Pagination<T> & { loadMore?: boolean };
  mono?: boolean;
  className?: string;
}) {
  const { t } = useTranslation("common");
  const { page, pageCount, pageSize, total, from, to, setPage, setPageSize } = pagination;
  if (total <= Math.min(pageSize, PAGE_SIZES[0])) return null;

  if (pagination.loadMore) {
    return (
      <div className={cn("flex flex-col items-center gap-2 pt-4", className)}>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {t("pagination.showing", { shown: to, total })}
        </p>
        {page < pageCount && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            className="h-9 border-primary/40 text-xs text-primary hover:border-primary"
          >
            {t("pagination.loadMore", { count: Math.min(pageSize, total - to) })}
          </Button>
        )}
      </div>
    );
  }

  const numClass = mono ? "font-mono text-foreground" : "font-sans tabular-nums font-medium text-foreground";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 border-t border-border/60 px-1 pt-4 sm:flex-row sm:justify-between",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground" aria-live="polite">
        <span dir="ltr" className={numClass}>
          {from}–{to}
        </span>{" "}
        {t("pagination.of")}{" "}
        <span dir="ltr" className={numClass}>
          {total}
        </span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t("pagination.perPage")}</span>
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger
              aria-label={t("pagination.perPage")}
              className="h-8 w-[4.5rem] border-border/80 bg-[#121212] text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-[#141414] text-xs">
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav aria-label={t("pagination.label")} className="flex items-center gap-1">
          <PageButton
            label={t("pagination.first")}
            disabled={page === 1}
            onClick={() => setPage(1)}
            className="hidden sm:inline-flex"
          >
            <ChevronsLeft className="size-4 rtl:rotate-180" />
          </PageButton>
          <PageButton
            label={t("pagination.previous")}
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </PageButton>

          {/* Numbers collapse to "page X of Y" on phones, where there is no room for them */}
          <span className="px-2 text-xs text-muted-foreground sm:hidden" dir="ltr">
            {page} / {pageCount}
          </span>
          <div className="hidden items-center gap-1 sm:flex">
            {pageWindow(page, pageCount).map((entry, index) =>
              entry === null ? (
                <span
                  key={`gap-${index}`}
                  className="px-1 text-xs text-muted-foreground"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <Button
                  key={entry}
                  type="button"
                  size="sm"
                  variant={entry === page ? "default" : "ghost"}
                  aria-current={entry === page ? "page" : undefined}
                  aria-label={t("pagination.goTo", { page: entry })}
                  onClick={() => setPage(entry)}
                  className={cn(
                    "h-8 min-w-8 px-2 text-xs",
                    entry !== page && "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {entry}
                </Button>
              ),
            )}
          </div>

          <PageButton
            label={t("pagination.next")}
            disabled={page === pageCount}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </PageButton>
          <PageButton
            label={t("pagination.last")}
            disabled={page === pageCount}
            onClick={() => setPage(pageCount)}
            className="hidden sm:inline-flex"
          >
            <ChevronsRight className="size-4 rtl:rotate-180" />
          </PageButton>
        </nav>
      </div>
    </div>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  className,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn("size-8 text-muted-foreground hover:text-foreground", className)}
    >
      {children}
    </Button>
  );
}
