import { differenceInCalendarDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { today } from "@/lib/clock";
import { formatDate } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { OfferProduct } from "@/types/account";

const PRODUCTS: OfferProduct[] = ["str", "ltr", "sync"];
/** Free periods ending within this many days are highlighted. */
const SOON_DAYS = 7;

/**
 * One compact chip per product with a free period: "STR · 4d left". Running periods are bright
 * (gold when about to end), finished ones are muted.
 */
export function FreeUntilCell({ freeUntil }: { freeUntil: Partial<Record<OfferProduct, string>> }) {
  const { t } = useTranslation("admin-clients");
  const { t: tAdmin } = useTranslation("admin");
  const now = today();
  const products = PRODUCTS.filter((product) => freeUntil[product]);
  if (products.length === 0) return <span className="text-muted-foreground">—</span>;

  return (
    <span className="flex flex-wrap gap-1">
      {products.map((product) => {
        const until = parseDay(freeUntil[product] ?? "");
        const left = differenceInCalendarDays(until, now);
        const ended = left <= 0;
        const soon = !ended && left <= SOON_DAYS;
        return (
          <span
            key={product}
            title={t("free.until", { date: formatDate(new Date(until.getTime() - 86_400_000)) })}
            className={cn(
              "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[0.7rem] font-medium tabular-nums",
              ended && "border-border/60 text-muted-foreground/80",
              soon && "border-primary/50 bg-primary/10 text-primary",
              !ended && !soon && "border-border/80 bg-[#161616] text-foreground",
            )}
          >
            <span className="text-[0.62rem] font-semibold uppercase tracking-wider">
              {tAdmin(`products.${product}`)}
            </span>
            <span aria-hidden>·</span>
            {ended ? t("free.ended") : t("free.left", { count: left })}
          </span>
        );
      })}
    </span>
  );
}
