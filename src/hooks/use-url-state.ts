import { useNavigate, useSearch } from "@tanstack/react-router";
import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { PAGE_SIZES, type Pagination } from "@/hooks/use-pagination";

type SearchValue = string | number | boolean | undefined;

/**
 * Writes several query params in one navigation; `undefined` removes a param. Page state lives in
 * the URL (filters, page, view) so the back button returns to it.
 */
export function useSetSearchParams() {
  const navigate = useNavigate();
  return React.useCallback(
    (patch: Record<string, SearchValue>, options?: { replace?: boolean }) => {
      void navigate({
        to: ".",
        replace: options?.replace ?? false,
        resetScroll: false,
        search: ((prev: Record<string, unknown>) => {
          const next = { ...prev };
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === "") delete next[key];
            else next[key] = value;
          }
          return next;
        }) as never,
      });
    },
    [navigate],
  );
}

/** One query param with a default; the default is dropped from the URL to keep links short. */
export function useUrlState<T extends SearchValue>(
  param: string,
  fallback: T,
  parse: (raw: unknown) => T | undefined = (raw) => raw as T,
): [T, (next: T, options?: { replace?: boolean }) => void] {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const setParams = useSetSearchParams();
  const value = parse(search[param]) ?? fallback;
  const set = React.useCallback(
    (next: T, options?: { replace?: boolean }) =>
      setParams({ [param]: next === fallback ? undefined : next }, options),
    [setParams, param, fallback],
  );
  return [value, set];
}

export const parseString = (raw: unknown) =>
  typeof raw === "string" ? raw : typeof raw === "number" ? String(raw) : undefined;
export const parsePositiveInt = (raw: unknown) => {
  const value = typeof raw === "number" ? raw : Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
};
export function parseOneOf<T extends string>(options: readonly T[]) {
  return (raw: unknown) => (options.includes(raw as T) ? (raw as T) : undefined);
}

export interface UrlPagination<T> extends Pagination<T> {
  /** Phones show "Load more": the visible items grow page by page instead of being replaced */
  loadMore: boolean;
}

/**
 * Client-side paging with the page and page size in the URL (`page`, `pageSize`, or a custom
 * prefix). On phones the list grows with a "Load more" button instead of page numbers.
 * `fixedPageSize` skips the size choice.
 */
export function useUrlPagination<T>(
  items: T[],
  { param = "page", fixedPageSize }: { param?: string; fixedPageSize?: number } = {},
): UrlPagination<T> {
  const mobile = useIsMobile();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const setParams = useSetSearchParams();
  const sizeParam = `${param}Size`;
  const requestedSize = parsePositiveInt(search[sizeParam]);
  const pageSize =
    fixedPageSize ??
    (requestedSize && (PAGE_SIZES as readonly number[]).includes(requestedSize)
      ? requestedSize
      : PAGE_SIZES[0]);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(parsePositiveInt(search[param]) ?? 1, pageCount);
  const start = mobile ? 0 : (page - 1) * pageSize;
  const end = Math.min(page * pageSize, total);
  const pageItems = React.useMemo(() => items.slice(start, end), [items, start, end]);

  return {
    page,
    pageSize,
    pageCount,
    total,
    from: total === 0 ? 0 : start + 1,
    to: end,
    items: pageItems,
    loadMore: mobile,
    setPage: (next) => {
      const clamped = Math.min(Math.max(1, next), pageCount);
      // "Load more" grows the list in place; it is not a step worth going back through
      setParams({ [param]: clamped === 1 ? undefined : clamped }, { replace: mobile });
    },
    setPageSize: (next) =>
      setParams({ [sizeParam]: next === PAGE_SIZES[0] ? undefined : next, [param]: undefined }),
  };
}
