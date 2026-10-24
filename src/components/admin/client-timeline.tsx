import { useTranslation } from "react-i18next";
import { today } from "@/lib/clock";
import { formatDate } from "@/lib/currency";
import { parseDay, toISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { BillingProduct } from "@/types/subscription";
import type { ClientTimelineEvent } from "@/types/platform-admin";

const PRODUCTS: BillingProduct[] = ["str", "ltr", "sync"];

/** Known moderation/offer action kinds get their own dot color; anything else is neutral. */
const ACTION_DOTS: Record<string, string> = {
  ban: "bg-destructive",
  unban: "bg-[#A2E8DD]",
  delist: "bg-destructive/70",
  relist: "bg-[#A2E8DD]",
  manual_offer: "bg-primary",
};
const DEFAULT_DOT = "bg-muted-foreground/50";

/** Signup, free periods and Admin decisions in date order along a horizontal line, with a marker for today. */
export function ClientTimeline({ events }: { events: ClientTimelineEvent[] }) {
  const day = toISODate(today());
  const firstFuture = events.findIndex((event) => event.at.slice(0, 10) > day);
  const todayAt = firstFuture === -1 ? events.length : firstFuture;
  const items: ({ today: true } | { today?: false; event: ClientTimelineEvent })[] = [
    ...events.slice(0, todayAt).map((event) => ({ event })),
    { today: true as const },
    ...events.slice(todayAt).map((event) => ({ event })),
  ];

  return (
    <div className="overflow-x-auto pb-1">
      <ol className="relative flex min-w-max items-start gap-0">
        {items.map((item, index) => (
          <li key={index} className="relative w-44 shrink-0 pe-4 pt-5">
            {/* The line runs through every node; it fades out after the last one */}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-0 top-1.5 h-px",
                index === items.length - 1
                  ? "bg-gradient-to-r from-border/80 to-transparent rtl:bg-gradient-to-l"
                  : "bg-border/80",
              )}
            />
            {item.today ? <TodayMarker /> : <TimelineItem event={item.event} />}
          </li>
        ))}
      </ol>
    </div>
  );
}

function TodayMarker() {
  const { t } = useTranslation("admin");
  return (
    <>
      <span className="absolute start-0 top-0 size-3 rounded-full border-2 border-primary bg-[#0B0B0B] shadow-[0_0_0_3px_rgba(212,175,55,0.15)]" />
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-primary">
        {t("timeline.today")}
      </p>
      <p className="text-xs text-muted-foreground">{formatDate(today())}</p>
    </>
  );
}

function TimelineItem({ event }: { event: ClientTimelineEvent }) {
  const { t } = useTranslation("admin");
  const date = formatDate(parseDay(event.at));
  const future = event.at.slice(0, 10) > toISODate(today());

  const { action } = event;
  const dot = action ? (ACTION_DOTS[action.kind] ?? DEFAULT_DOT) : "bg-foreground";
  const title = action
    ? action.kind === "manual_offer"
      ? t("timeline.action.manual_offer", {
          months: PRODUCTS.filter((product) => action.months?.[product])
            .map((product) =>
              t("timeline.monthsOf", {
                count: action.months?.[product] ?? 0,
                product: t(`products.${product}`),
              }),
            )
            .join(", "),
        })
      : t(`timeline.action.${action.kind}`, { defaultValue: action.kind })
    : t(`timeline.kind.${event.kind}`, { defaultValue: event.kind });
  const body = action?.reason ?? undefined;
  const by = action?.adminName ?? undefined;

  return (
    <div className={cn("space-y-0.5", future && "opacity-80")}>
      <span className={cn("absolute start-0 top-0.5 size-2.5 rounded-full", dot)} />
      <p className="text-xs text-muted-foreground">{date}</p>
      <p className="font-medium leading-snug text-foreground">{title}</p>
      {body && (
        <p dir="auto" className="text-xs leading-relaxed text-muted-foreground">
          “{body}”{by && <span className="text-muted-foreground/80"> — {by}</span>}
        </p>
      )}
    </div>
  );
}
