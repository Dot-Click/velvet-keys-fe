import { addDays, endOfMonth, endOfWeek, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatDateFields } from "@/lib/currency";
import { toISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "./calendar-model";

const MAX_DOTS = 4;

/**
 * Classic month grid for the units in view: gold dots for check-ins and jade dots for
 * check-outs. Choosing a day opens the timeline there.
 */
export function MonthView({
  anchor,
  items,
  todayIso,
  onPickDay,
}: {
  anchor: Date;
  /** Every item of the units in view */
  items: CalendarItem[];
  todayIso: string;
  onPickDay: (day: Date) => void;
}) {
  const { t } = useTranslation("conciergerie");
  const first = startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 });
  const last = endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let day = first; day <= last; day = addDays(day, 1)) days.push(day);
  const stays = items.filter((item) => item.kind === "stay");

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-[#101010]">
      <div className="grid grid-cols-7 border-b border-border/70 bg-[#121212] text-center text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
        {days.slice(0, 7).map((day) => (
          <div key={toISODate(day)} className="py-2">
            {formatDateFields(day, { weekday: "short" })}
          </div>
        ))}
      </div>
      <div
        className="grid min-h-0 flex-1 grid-cols-7 overflow-y-auto"
        style={{ gridAutoRows: "minmax(84px, 1fr)" }}
      >
        {days.map((day) => {
          const iso = toISODate(day);
          const arrivals = stays.filter((item) => item.start === iso).length;
          const departures = stays.filter((item) => item.end === iso).length;
          const outside = !isSameMonth(day, anchor);
          const isToday = iso === todayIso;
          const weekend = day.getDay() === 0 || day.getDay() === 6;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onPickDay(day)}
              aria-label={t("calendar.monthDay", {
                date: formatDateFields(day, { weekday: "long", day: "numeric", month: "long" }),
                arrivals,
                departures,
              })}
              className={cn(
                "group flex flex-col gap-1.5 border-b border-e border-border/40 p-2 text-start transition-colors hover:bg-primary/[0.04]",
                weekend && "bg-[#C8964A]/[0.03]",
                outside && "opacity-40",
                isToday && "ring-1 ring-inset ring-[#A2E8DD]/60",
              )}
            >
              <span
                className={cn(
                  "text-sm tabular-nums",
                  isToday ? "font-semibold text-[#A2E8DD]" : "text-foreground",
                )}
              >
                {formatDateFields(day, { day: "numeric" })}
              </span>
              <span className="flex flex-wrap gap-1" aria-hidden="true">
                {Array.from({ length: Math.min(arrivals, MAX_DOTS) }, (_, index) => (
                  <span key={`in-${index}`} className="size-1.5 rounded-full bg-primary" />
                ))}
                {arrivals > MAX_DOTS && (
                  <span className="text-[0.55rem] text-primary">+{arrivals - MAX_DOTS}</span>
                )}
              </span>
              <span className="flex flex-wrap gap-1" aria-hidden="true">
                {Array.from({ length: Math.min(departures, MAX_DOTS) }, (_, index) => (
                  <span key={`out-${index}`} className="size-1.5 rounded-full bg-[#A2E8DD]" />
                ))}
                {departures > MAX_DOTS && (
                  <span className="text-[0.55rem] text-[#A2E8DD]">+{departures - MAX_DOTS}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 border-t border-border/70 px-3 py-2 text-[0.68rem] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          {t("calendar.checkIns")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#A2E8DD]" aria-hidden="true" />
          {t("calendar.checkOuts")}
        </span>
      </div>
    </div>
  );
}
