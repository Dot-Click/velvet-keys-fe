import {
  BrushCleaning,
  ChevronRight,
  Flag,
  KeyRound,
  LogIn,
  LogOut,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { formatDateFields } from "@/lib/currency";
import { toISODate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { opsItemVariants, opsListVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { SourceGlyph } from "./calendar-bars";
import { nightsOf, type CalendarItem, type CalendarRow } from "./calendar-model";

type AgendaKind = "arrival" | "departure" | "turnover" | "works" | "leaseStart" | "leaseEnd";

interface AgendaItem {
  id: string;
  kind: AgendaKind;
  item: CalendarItem;
  row: CalendarRow;
}

const KIND_META: Record<AgendaKind, { icon: LucideIcon; chip: string }> = {
  arrival: { icon: LogIn, chip: "border-primary/40 bg-primary/10 text-primary" },
  departure: { icon: LogOut, chip: "border-[#E8C9A8]/30 bg-[#E8C9A8]/8 text-[#E8C9A8]" },
  turnover: { icon: BrushCleaning, chip: "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]" },
  works: { icon: Wrench, chip: "border-[#FF85A1]/40 bg-destructive/20 text-[#FF85A1]" },
  leaseStart: { icon: KeyRound, chip: "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]" },
  leaseEnd: { icon: Flag, chip: "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]" },
};

/** One week, day by day: arrivals, departures, turnovers, blocks and lease events. */
export function AgendaView({
  days,
  rows,
  items,
  todayIso,
  onOpenItem,
}: {
  days: Date[];
  rows: CalendarRow[];
  items: Map<string, CalendarItem[]>;
  todayIso: string;
  onOpenItem: (item: CalendarItem) => void;
}) {
  const { t } = useTranslation("conciergerie");

  const itemsOf = (iso: string): AgendaItem[] => {
    const list: AgendaItem[] = [];
    for (const row of rows) {
      for (const item of items.get(row.unit.unitId) ?? []) {
        if (item.kind === "stay") {
          if (item.start === iso) list.push({ id: `in-${item.id}`, kind: "arrival", item, row });
          if (item.end === iso) list.push({ id: `out-${item.id}`, kind: "departure", item, row });
        } else if (item.kind === "turnover") {
          if (item.start === iso) list.push({ id: item.id, kind: "turnover", item, row });
        } else if (item.kind === "block") {
          if (item.start === iso) list.push({ id: item.id, kind: "works", item, row });
        } else {
          if (item.start === iso) list.push({ id: `ls-${item.id}`, kind: "leaseStart", item, row });
          if (item.end === iso) list.push({ id: `le-${item.id}`, kind: "leaseEnd", item, row });
        }
      }
    }
    return list;
  };

  const describe = ({ kind, item }: AgendaItem) => {
    // Isolate the name so a Latin name next to Arabic text and figures keeps its order
    const iso = (name: string) => `⁨${name}⁩`;
    switch (kind) {
      case "arrival":
        return item.kind === "stay"
          ? t("calendar.agenda.arrival", {
              name: iso(item.booking.guest.name),
              count: nightsOf(item),
            })
          : "";
      case "departure":
        return item.kind === "stay"
          ? t("calendar.agenda.departure", { name: iso(item.booking.guest.name) })
          : "";
      case "turnover":
        return t("calendar.legend.housekeeping");
      case "works":
        return item.kind === "block" ? t(`calendar.blockReason.${item.block.reason}`) : "";
      case "leaseStart":
        return item.kind === "lease"
          ? t("calendar.agenda.leaseStart", { name: iso(item.lease.tenantName) })
          : "";
      case "leaseEnd":
        return item.kind === "lease"
          ? t("calendar.agenda.leaseEnd", { name: iso(item.lease.tenantName) })
          : "";
    }
  };

  return (
    <div className="fade-edges h-full min-h-0 overflow-y-auto rounded-2xl border border-border/70 bg-[#101010]">
      {days.map((day) => {
        const iso = toISODate(day);
        const dayItems = itemsOf(iso);
        const isToday = iso === todayIso;
        return (
          <section
            key={iso}
            aria-label={formatDateFields(day, { weekday: "long", day: "numeric", month: "long" })}
          >
            <h3
              className={cn(
                "sticky top-0 z-10 flex items-baseline gap-2 tracking-normal border-b border-border/60 bg-[#121212]/95 px-4 py-2 backdrop-blur",
                isToday && "text-[#A2E8DD]",
              )}
            >
              <span className="font-serif text-base">
                {formatDateFields(day, { weekday: "long", day: "numeric", month: "long" })}
              </span>
              {isToday && (
                <span className="text-[0.62rem] uppercase tracking-[0.16em]">
                  {t("calendar.legend.today")}
                </span>
              )}
              <span className="ms-auto text-[0.68rem] tabular-nums text-muted-foreground">
                {dayItems.length}
              </span>
            </h3>
            {dayItems.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground/70">
                {t("calendar.agenda.quiet")}
              </p>
            ) : (
              <motion.ul
                variants={opsListVariants}
                initial="initial"
                animate="animate"
                className="divide-y divide-border/40"
              >
                {dayItems.map((entry) => {
                  const meta = KIND_META[entry.kind];
                  const Icon = meta.icon;
                  const stay = entry.item.kind === "stay" ? entry.item.booking : null;
                  return (
                    <motion.li key={entry.id} variants={opsItemVariants}>
                      <button
                        type="button"
                        onClick={() => onOpenItem(entry.item)}
                        className="group hover-row flex w-full items-center gap-3 px-4 py-2.5 text-start"
                      >
                        <span
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-lg border",
                            meta.chip,
                          )}
                        >
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.85rem] text-foreground">
                            {describe(entry)}
                          </span>
                          <span className="block truncate text-[0.7rem] text-muted-foreground">
                            {entry.row.property.propertyName} · {entry.row.unit.unitName}
                          </span>
                        </span>
                        {stay && <SourceGlyph kind={stay.source} />}
                        {stay && entry.kind === "arrival" && (
                          <span
                            dir="ltr"
                            className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline"
                          >
                            {formatMoney(stay.amountMinor, stay.currency)}
                          </span>
                        )}
                        <ChevronRight
                          className="row-chevron size-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                      </button>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
