import { useNavigate } from "@tanstack/react-router";
import { differenceInCalendarDays } from "date-fns";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { today } from "@/lib/clock";
import { formatDate } from "@/lib/currency";
import { money } from "./format";
import { parseDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { UpcomingEvent, UpcomingKind } from "@/types/admin-overview";

const HORIZON = 30;
const LANES: UpcomingKind[] = ["free_end", "invoice_due", "read_only"];
const DOT: Record<UpcomingKind, string> = {
  free_end: "bg-[#D4AF37] ring-[#D4AF37]/30",
  invoice_due: "bg-[#B8B8B8] ring-white/15",
  read_only: "bg-[#8B002B] ring-[#FF85A1]/40",
};
const ROW = 16;
const MAX_STACK = 3;

/** The next 30 days on a date axis: markers by kind, hover for the client, click to open it. */
export function UpcomingTimeline({ events }: { events: UpcomingEvent[] }) {
  const { t } = useTranslation("admin-overview");
  const navigate = useNavigate();
  const now = today();

  // Markers that fall on the same day in the same lane stack, so none hides another. A whole
  // billing run shares one due date, so the stack stops at MAX_STACK and the last marker
  // carries the rest ("+N more") in its tooltip.
  const total = new Map<string, number>();
  for (const event of events) {
    const key = `${event.kind}|${event.date}`;
    total.set(key, (total.get(key) ?? 0) + 1);
  }
  const slot = new Map<string, number>();
  const placed = events.flatMap((event) => {
    const key = `${event.kind}|${event.date}`;
    const index = slot.get(key) ?? 0;
    slot.set(key, index + 1);
    if (index >= MAX_STACK) return [];
    const count = total.get(key) ?? 1;
    const more = index === MAX_STACK - 1 && count > MAX_STACK ? count - MAX_STACK : 0;
    return [{ event, index, more }];
  });
  const laneRows = (kind: UpcomingKind) =>
    Math.max(1, ...placed.filter((p) => p.event.kind === kind).map((p) => p.index + 1));
  const laneTop: Record<string, number> = {};
  let height = 0;
  for (const kind of LANES) {
    laneTop[kind] = height;
    height += laneRows(kind) * ROW + 10;
  }

  const open = (event: UpcomingEvent) => {
    if (event.invoiceId) {
      void navigate({ to: "/admin/invoices/$invoiceId", params: { invoiceId: event.invoiceId } });
    } else {
      void navigate({ to: "/admin/clients/$clientId", params: { clientId: event.accountId } });
    }
  };

  const ticks = [0, 5, 10, 15, 20, 25, 30];
  const label = (event: UpcomingEvent) =>
    t(`upcoming.kind.${event.kind}`, {
      client: event.clientName,
      product: event.product ? t(`upcoming.product.${event.product}`) : "",
    });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem] text-muted-foreground">
        {LANES.map((kind) => (
          <span key={kind} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", DOT[kind].split(" ")[0])} />
            {t(`upcoming.legend.${kind}`)}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <div dir="ltr" className="relative min-w-[560px] px-3 pb-7" style={{ height: height + 34 }}>
          <TooltipProvider delayDuration={80}>
            <div className="relative mt-1" style={{ height }}>
              {ticks.map((day) => (
                <span
                  key={day}
                  aria-hidden
                  className="absolute inset-y-0 w-px bg-border/50"
                  style={{ left: `${(day / HORIZON) * 100}%` }}
                />
              ))}
              {placed.map(({ event, index, more }) => {
                const days = Math.min(
                  HORIZON,
                  Math.max(0, differenceInCalendarDays(parseDay(event.date), now)),
                );
                return (
                  <React.Fragment key={event.id}>
                  {more > 0 && (
                    <span
                      aria-hidden
                      className="absolute ms-3 text-[0.65rem] font-semibold tabular-nums text-muted-foreground"
                      style={{
                        left: `${(days / HORIZON) * 100}%`,
                        top: laneTop[event.kind]! + index * ROW + 1,
                      }}
                    >
                      +{more}
                    </span>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => open(event)}
                        aria-label={`${label(event)} · ${formatDate(parseDay(event.date))}`}
                        className={cn(
                          "absolute size-3 -translate-x-1/2 rounded-full ring-4 transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-primary",
                          DOT[event.kind],
                        )}
                        style={{
                          left: `${(days / HORIZON) * 100}%`,
                          top: laneTop[event.kind]! + index * ROW + 4,
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent
                      dir="ltr"
                      className="space-y-0.5 border border-border bg-[#141414] text-xs text-foreground"
                    >
                      <p className="font-semibold">{event.clientName}</p>
                      <p className="text-muted-foreground">{label(event)}</p>
                      <p className="tabular-nums text-muted-foreground">
                        {formatDate(parseDay(event.date))}
                        {event.amountMinor !== undefined && ` · ${money(event.amountMinor)}`}
                      </p>
                      {more > 0 && (
                        <p className="text-primary">{t("upcoming.more", { count: more })}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                  </React.Fragment>
                );
              })}
            </div>
          </TooltipProvider>
          <div className="relative mt-2 h-4 border-t border-border/70 text-[0.65rem] tabular-nums text-muted-foreground">
            {ticks.map((day) => (
              <span
                key={day}
                className={cn(
                  "absolute top-1",
                  day === 0 ? "" : day === HORIZON ? "-translate-x-full" : "-translate-x-1/2",
                )}
                style={{ left: `${(day / HORIZON) * 100}%` }}
              >
                {day === 0
                  ? t("upcoming.today")
                  : formatDate(new Date(now.getTime() + day * 86_400_000), { year: undefined })}
              </span>
            ))}
          </div>
        </div>
      </div>
      {events.length === 0 && (
        <p className="text-xs text-muted-foreground">{t("upcoming.empty")}</p>
      )}
    </div>
  );
}
