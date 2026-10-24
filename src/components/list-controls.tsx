import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Sorting } from "@/hooks/use-sort";
import { cn } from "@/lib/utils";

/** Search box with a clear button, sized to sit in a list toolbar. */
export function ListSearch({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const { t } = useTranslation("common");
  return (
    <div className={cn("relative w-full sm:w-64", className)}>
      <Search
        className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 border-border/80 bg-[#121212] ps-8 pe-8 text-[13px] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("listControls.clearSearch")}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/**
 * Column header content that sorts the table when clicked. Put it inside a `<th>` and give the
 * `<th>` `aria-sort={sorting.ariaSort(key)}`; use `SortableTh` for the common case.
 */
export function SortButton<T>({
  sorting,
  sortKey,
  children,
  align = "start",
}: {
  sorting: Sorting<T>;
  sortKey: string;
  children: ReactNode;
  align?: "start" | "end";
}) {
  const active = sorting.sort?.key === sortKey;
  const Icon = !active ? ArrowUpDown : sorting.sort?.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => sorting.toggle(sortKey)}
      className={cn(
        "group inline-flex items-center gap-1.5 uppercase tracking-[inherit] transition-colors hover:text-foreground",
        align === "end" && "flex-row-reverse",
        active && "text-primary",
      )}
    >
      <span>{children}</span>
      <Icon
        className={cn("size-3 shrink-0", !active && "opacity-40 group-hover:opacity-80")}
        aria-hidden="true"
      />
    </button>
  );
}

/** Sort choice for card lists that have no column headers (and for phones, where headers hide). */
export function SortSelect<T>({
  sorting,
  options,
  className,
}: {
  sorting: Sorting<T>;
  options: { key: string; label: string }[];
  className?: string;
}) {
  const { t } = useTranslation("common");
  const value = sorting.sort ? `${sorting.sort.key}:${sorting.sort.dir}` : "default";
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next === "default") return sorting.setSort(null);
        const [key, dir] = next.split(":");
        sorting.setSort({ key: key!, dir: dir === "desc" ? "desc" : "asc" });
      }}
    >
      <SelectTrigger
        aria-label={t("listControls.sortBy")}
        className={cn("h-9 w-full border-border/80 bg-[#121212] text-[13px] sm:w-52", className)}
      >
        <span className="me-1 shrink-0 text-muted-foreground">{t("listControls.sortBy")}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-border bg-[#141414] text-[13px]">
        <SelectItem value="default">{t("listControls.default")}</SelectItem>
        {options.flatMap((option) => [
          <SelectItem key={`${option.key}:asc`} value={`${option.key}:asc`}>
            {option.label} ↑
          </SelectItem>,
          <SelectItem key={`${option.key}:desc`} value={`${option.key}:desc`}>
            {option.label} ↓
          </SelectItem>,
        ])}
      </SelectContent>
    </Select>
  );
}
