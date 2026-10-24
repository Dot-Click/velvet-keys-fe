import { useLayoutEffect, type RefObject } from "react";

/**
 * Copies each column header onto the cells below it (`data-label`), so that on phones the CSS in
 * styles.css (`.table-cards`) can show every row as a card of "label — value" lines. Headers are
 * read from the rendered table, so they are already translated, and kept up to date as rows change.
 */
export function useTableCardLabels(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const label = () => {
      for (const table of root.querySelectorAll("table")) {
        table.classList.add("table-cards");
        const headers: string[] = [];
        table.querySelectorAll("thead tr:first-child > th").forEach((cell) => {
          const th = cell as HTMLTableCellElement;
          for (let index = 0; index < (th.colSpan || 1); index += 1) {
            // innerText keeps the line breaks between a header and its sub-label
            headers.push((th.innerText || th.textContent || "").replace(/\s+/g, " ").trim());
          }
        });
        for (const row of table.querySelectorAll("tbody > tr, tfoot > tr")) {
          let column = 0;
          for (const element of row.children) {
            const cell = element as HTMLTableCellElement;
            // A cell spanning the whole row (an expanded detail, a message) needs no label
            const value = cell.colSpan >= headers.length ? "" : (headers[column] ?? "");
            if (cell.getAttribute("data-label") !== value) cell.setAttribute("data-label", value);
            column += cell.colSpan || 1;
          }
        }
      }
    };

    label();
    const observer = new MutationObserver(label);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [ref]);
}
