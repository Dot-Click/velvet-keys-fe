/** How many rows fit on a page, and how much room the closing blocks (totals, payment box) take. */
export interface PageCapacity {
  /** Rows on the first page, which also carries the header blocks, when it is not the last page */
  firstPage: number;
  /** Rows on a middle page */
  nextPage: number;
  /** Rows' worth of room the closing blocks need on the last page */
  closing: number;
}

/**
 * Splits rows over A4 pages. The last page always carries the closing blocks, so when the last
 * rows leave no room for them they get a page of their own (an empty chunk), never a clipped one.
 */
export function paginate<T>(rows: readonly T[], capacity: PageCapacity): T[][] {
  const pages: T[][] = [];
  let start = 0;
  for (;;) {
    const room = pages.length === 0 ? capacity.firstPage : capacity.nextPage;
    const left = rows.length - start;
    if (left <= room - capacity.closing) {
      pages.push(rows.slice(start));
      return pages;
    }
    if (left <= room) {
      pages.push(rows.slice(start), []);
      return pages;
    }
    pages.push(rows.slice(start, start + room));
    start += room;
  }
}
