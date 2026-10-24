import * as React from "react";

export type SortDirection = "asc" | "desc";
export interface SortState {
  key: string;
  dir: SortDirection;
}

export type Comparators<T> = Record<string, (a: T, b: T) => number>;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/** Compare text the way a person expects: case-insensitive, "Apartment 9" before "Apartment 10". */
export const compareText = (a: string, b: string) => collator.compare(a, b);
export const compareNumber = (a: number, b: number) => a - b;

export interface Sorting<T> {
  sort: SortState | null;
  items: T[];
  /** Click on a column: ascending, then descending, then back to the natural order */
  toggle: (key: string) => void;
  setSort: (sort: SortState | null) => void;
  /** aria-sort value for a column header */
  ariaSort: (key: string) => "ascending" | "descending" | "none";
}

/**
 * Sorts an already filtered list. With no sort chosen the list keeps its natural order, which is
 * usually the one the data service already put it in (newest first, overdue first, and so on).
 */
export function useSort<T>(
  items: T[],
  comparators: Comparators<T>,
  initial: SortState | null = null,
): Sorting<T> {
  const [sort, setSort] = React.useState<SortState | null>(initial);

  const sorted = React.useMemo(() => {
    const compare = sort ? comparators[sort.key] : undefined;
    if (!sort || !compare) return items;
    const factor = sort.dir === "asc" ? 1 : -1;
    // A stable sort on a copy, so equal rows keep their natural order
    return items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => factor * compare(a.item, b.item) || a.index - b.index)
      .map(({ item }) => item);
    // The comparators are declared next to the table and never change between renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sort]);

  return {
    sort,
    items: sorted,
    toggle: (key) =>
      setSort((current) => {
        if (!current || current.key !== key) return { key, dir: "asc" };
        return current.dir === "asc" ? { key, dir: "desc" } : null;
      }),
    setSort,
    ariaSort: (key) =>
      sort?.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none",
  };
}
