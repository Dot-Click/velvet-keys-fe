import * as React from "react";

export const PAGE_SIZES = [10, 25, 50] as const;

export interface Pagination<T> {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  /** 1-based position of the first and last visible item, 0 when the list is empty */
  from: number;
  to: number;
  items: T[];
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

/**
 * Client-side paging for a list that is already loaded and filtered. The page falls back to the
 * first one whenever the list is replaced by a different one (a new filter or search), and is
 * clamped when rows disappear (a deletion on the last page).
 */
export function usePagination<T>(
  items: T[],
  initialPageSize: number = PAGE_SIZES[0],
): Pagination<T> {
  const [pageSize, setPageSizeState] = React.useState<number>(initialPageSize);
  const [requested, setRequested] = React.useState(1);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requested, pageCount);

  // A different filter produces a different length most of the time; going back to page 1 keeps the
  // reader from landing on an empty page.
  const lastTotal = React.useRef(total);
  React.useEffect(() => {
    if (lastTotal.current !== total) {
      lastTotal.current = total;
      setRequested((current) => Math.min(current, Math.max(1, Math.ceil(total / pageSize))));
    }
  }, [total, pageSize]);

  const start = (page - 1) * pageSize;
  const pageItems = React.useMemo(
    () => items.slice(start, start + pageSize),
    [items, start, pageSize],
  );

  return {
    page,
    pageSize,
    pageCount,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
    items: pageItems,
    setPage: (next) => setRequested(Math.min(Math.max(1, next), pageCount)),
    setPageSize: (size) => {
      setPageSizeState(size);
      setRequested(1);
    },
  };
}
