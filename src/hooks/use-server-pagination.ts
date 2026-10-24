import { useSearch } from "@tanstack/react-router";
import * as React from "react";
import type { Page } from "@/lib/apiClient";
import { PAGE_SIZES } from "@/hooks/use-pagination";
import { parsePositiveInt, useSetSearchParams, type UrlPagination } from "@/hooks/use-url-state";

type PageSize = 10 | 25 | 50;

export interface ServerPageControls {
  page: number;
  pageSize: PageSize;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

/**
 * Page and page size for a list the backend pages itself. They live in the URL (`page`,
 * `pageSize`) so the back button returns to the same page; pass them to the query hook.
 */
export function useServerPageControls(
  defaultPageSize: PageSize = PAGE_SIZES[0],
): ServerPageControls {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const setParams = useSetSearchParams();
  const requestedSize = parsePositiveInt(search["pageSize"]);
  const pageSize = (PAGE_SIZES as readonly number[]).includes(requestedSize ?? 0)
    ? (requestedSize as PageSize)
    : defaultPageSize;
  const page = parsePositiveInt(search["page"]) ?? 1;

  return {
    page,
    pageSize,
    setPage: (next) => setParams({ page: next <= 1 ? undefined : next }),
    setPageSize: (next) =>
      setParams({ pageSize: next === defaultPageSize ? undefined : next, page: undefined }),
  };
}

/**
 * Adapts a backend page to the shape ListPagination and DataTable expect. When the URL points
 * past the last page (rows were removed), it goes back to the first page.
 */
export function useServerPagination<T>(
  data: Page<T>,
  controls: ServerPageControls,
): UrlPagination<T> {
  const { page, pageSize, setPage, setPageSize } = controls;
  const pageCount = Math.max(1, Math.ceil(data.total / pageSize));
  const outOfRange = data.items.length === 0 && data.total > 0 && page > 1;

  React.useEffect(() => {
    if (outOfRange) setPage(1);
  }, [outOfRange, setPage]);

  const start = (page - 1) * pageSize;
  return {
    page,
    pageSize,
    pageCount,
    total: data.total,
    from: data.items.length === 0 ? 0 : start + 1,
    to: start + data.items.length,
    items: data.items,
    loadMore: false,
    setPage: (next) => setPage(Math.min(Math.max(1, next), pageCount)),
    setPageSize,
  };
}
