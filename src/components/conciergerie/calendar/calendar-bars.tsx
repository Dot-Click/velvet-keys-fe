import { BrushCleaning, Flag, KeyRound, Plus, Wrench } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ChannelMark } from "@/components/conciergerie/channel-badges";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { SOURCE_PLATFORM } from "@/lib/channels";
import { formatDateFields } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { parseDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { BookingSource } from "@/types/str";
import {
  addIsoDays,
  initialsOfGuest,
  nightsOf,
  type BlockItem,
  type LeaseItem,
  type StayItem,
  type TurnoverItem,
} from "./calendar-model";

/** Inline position of something spanning day units x0 … x1 of the track. */
function spanStyle(x0: number, x1: number): React.CSSProperties {
  return {
    insetInlineStart: `calc(${x0} * var(--cal-col))`,
    width: `calc(${x1 - x0} * var(--cal-col))`,
  };
}

const pointStyle = (x: number, size: number): React.CSSProperties => ({
  insetInlineStart: `calc(${x} * var(--cal-col) - ${size / 2}px)`,
});

/** Airbnb / Booking.com monogram, or a key for direct stays. */
export function SourceGlyph({ kind, className }: { kind: BookingSource; className?: string }) {
  const { t } = useTranslation("conciergerie");
  const platform = SOURCE_PLATFORM[kind];
  if (platform)
    return <ChannelMark platform={platform} className={cn("size-4 text-[0.55rem]", className)} />;
  return (
    <span
      role="img"
      aria-label={t("calendar.legend.direct")}
      title={t("calendar.legend.direct")}
      className={cn(
        "inline-grid size-4 shrink-0 place-items-center rounded-[4px] bg-primary/20 text-primary",
        className,
      )}
    >
      <KeyRound className="size-2.5" aria-hidden="true" />
    </span>
  );
}

interface StayBarProps {
  item: StayItem;
  x0: number;
  x1: number;
  clippedStart: boolean;
  clippedEnd: boolean;
  /** Width of a day column in px, to decide when only initials fit */
  columnPx: number;
  delay: number;
  draggable: boolean;
  dragging: boolean;
  conflict: boolean;
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  /** Opens the stay; a draggable bar opens from the keyboard, the grid handles its clicks */
  onOpen: () => void;
}

/**
 * Every STR stay shares one calm style: a charcoal-gold fill with a 3px gold start edge. The
 * source shows as a small glyph; an unpaid stay gets a ruby dot at its end.
 */
export const StayBar = React.forwardRef<HTMLDivElement, StayBarProps>(function StayBar(
  {
    item,
    x0,
    x1,
    clippedStart,
    clippedEnd,
    columnPx,
    delay,
    draggable,
    dragging,
    conflict,
    onPointerDown,
    onOpen,
    ...rest
  },
  ref,
) {
  const { t } = useTranslation("conciergerie");
  const nights = nightsOf(item);
  const title = item.booking.guest.name;
  const narrow = (x1 - x0) * columnPx < 96;
  const unpaid = item.booking.paymentStatus === "unpaid";
  return (
    <div
      ref={ref}
      {...rest}
      role="button"
      tabIndex={0}
      aria-label={`${title} · ${t("calendar.nights", { count: nights })}`}
      onPointerDown={onPointerDown}
      onClick={draggable ? undefined : onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      style={{ ...spanStyle(x0, x1), animationDelay: `${delay}ms` }}
      className={cn(
        "cal-bar-in group absolute top-[10px] z-10 flex h-9 items-center gap-1.5 overflow-hidden border border-primary/25 bg-[linear-gradient(180deg,rgba(212,175,55,0.16),rgba(212,175,55,0.07))] px-2 text-[0.72rem] text-[#F3E7C2] shadow-[0_6px_16px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] duration-200 hover:z-20 hover:-translate-y-px hover:shadow-[0_10px_24px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        clippedStart ? "rounded-s-none" : "rounded-s-lg border-s-[3px] border-s-primary",
        clippedEnd ? "rounded-e-none" : "rounded-e-lg",
        draggable ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-pointer",
        dragging && "z-30 -translate-y-0.5 shadow-[0_14px_30px_rgba(0,0,0,0.6)]",
        conflict && "cal-conflict border-[#FF85A1]",
      )}
    >
      {draggable && (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-y-0 start-0 w-2 cursor-ew-resize"
            data-handle="start"
          />
          <span
            aria-hidden="true"
            className="absolute inset-y-0 end-0 w-2 cursor-ew-resize"
            data-handle="end"
          />
        </>
      )}
      <SourceGlyph kind={item.booking.source} />
      {narrow ? (
        <span className="truncate font-medium">{initialsOfGuest(title)}</span>
      ) : (
        <span className="min-w-0 truncate">
          <bdi className="font-medium">{title}</bdi>
          <span className="ms-1.5 text-[#F3E7C2]/60">
            {t("calendar.nights", { count: nights })}
          </span>
        </span>
      )}
      {unpaid && (
        <span
          className="ms-auto size-1.5 shrink-0 rounded-full bg-[#FF85A1] shadow-[0_0_6px_rgba(255,133,161,0.8)]"
          title={t("calendar.unpaid")}
        />
      )}
    </div>
  );
});

/**
 * Jade broom at checkout, in the same row on the turnover line. It hangs from the bars' lower
 * edge so the stay ends stay free to drag.
 */
export function TurnoverChip({
  x,
  item,
  onClick,
}: {
  x: number;
  item: TurnoverItem;
  onClick: () => void;
}) {
  const { t } = useTranslation("conciergerie");
  const done = item.status === "done";
  const label = `${t("calendar.legend.housekeeping")} · ${t(`calendar.turnoverStatus.${item.status}`)}`;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={pointStyle(x, 16)}
      className={cn(
        "group absolute top-[38px] z-[25] grid size-4 place-items-center rounded-full border bg-[#0F1A18] shadow-[0_0_0_2px_#111] transition-transform hover:scale-125",
        done ? "border-[#A2E8DD]/25 text-[#A2E8DD]/40" : "border-[#A2E8DD]/60 text-[#A2E8DD]",
      )}
    >
      <BrushCleaning className="icon-wiggle size-2.5" aria-hidden="true" />
    </button>
  );
}

/**
 * A lease: one continuous jade-outlined translucent bar. The tenant name stays in view while the
 * grid scrolls sideways and a flag marks the end; rent coins hang below it (RentCoins).
 */
interface LeaseBarProps {
  item: LeaseItem;
  x0: number;
  x1: number;
  clippedStart: boolean;
  clippedEnd: boolean;
  endsInRange: boolean;
  delay: number;
  onClick: () => void;
}

export const LeaseBar = React.forwardRef<HTMLDivElement, LeaseBarProps>(function LeaseBar(
  { item, x0, x1, clippedStart, clippedEnd, endsInRange, delay, onClick, ...rest },
  ref,
) {
  const { t } = useTranslation("conciergerie");
  return (
    <div
      ref={ref}
      {...rest}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      aria-label={`${t("calendar.legend.lease")} · ${item.lease.tenantName}`}
      style={{ ...spanStyle(x0, x1), animationDelay: `${delay}ms` }}
      className={cn(
        "cal-bar-in absolute top-[10px] z-10 flex h-9 cursor-pointer items-center overflow-clip border border-[#A2E8DD]/45 bg-[#A2E8DD]/[0.07] text-[0.72rem] text-[#CFF3EC] transition-[transform,box-shadow] duration-200 hover:z-20 hover:-translate-y-px hover:shadow-[0_10px_24px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A2E8DD]/60",
        clippedStart ? "rounded-s-none border-s-0" : "rounded-s-lg",
        clippedEnd ? "rounded-e-none border-e-0" : "rounded-e-lg",
      )}
    >
      <span className="sticky start-[calc(var(--unit-col)+0.5rem)] z-[1] truncate px-2.5 font-medium">
        {item.lease.tenantName}
      </span>
      {endsInRange && (
        <Flag
          className="absolute end-1.5 top-1/2 size-3 -translate-y-1/2 text-[#A2E8DD]"
          aria-label={t("calendar.leaseEnds")}
        />
      )}
    </div>
  );
});

/** A closed stretch of a unit (maintenance, owner stay, other): a muted ruby hatch. */
export function BlockBar({
  item,
  x0,
  x1,
  clippedStart,
  clippedEnd,
  delay,
  onClick,
}: {
  item: BlockItem;
  x0: number;
  x1: number;
  clippedStart: boolean;
  clippedEnd: boolean;
  delay: number;
  onClick: () => void;
}) {
  const { t } = useTranslation("conciergerie");
  const label = t(`calendar.blockReason.${item.block.reason}`);
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      style={{ ...spanStyle(x0, x1), animationDelay: `${delay}ms` }}
      className={cn(
        "cal-bar-in hatch-ruby group absolute top-[10px] z-10 flex h-9 items-center gap-1.5 overflow-hidden border border-[#FF85A1]/25 px-2 text-start text-[0.7rem] text-[#FFB8C8] transition-transform hover:-translate-y-px",
        clippedStart ? "rounded-s-none" : "rounded-s-lg",
        clippedEnd ? "rounded-e-none" : "rounded-e-lg",
      )}
    >
      <Wrench className="icon-rotate size-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </button>
  );
}

/** Dashed ghost over the empty stretch of an LTR unit; hovering offers to add a lease. */
export function AvailableBar({ x0, x1, onAdd }: { x0: number; x1: number; onAdd: () => void }) {
  const { t } = useTranslation("conciergerie");
  return (
    <button
      type="button"
      onClick={onAdd}
      style={spanStyle(x0, x1)}
      className="group absolute top-[10px] flex h-9 items-center overflow-clip rounded-lg border border-dashed border-[#A2E8DD]/25 px-2.5 text-[0.7rem] text-muted-foreground transition-colors hover:border-[#A2E8DD]/60 hover:bg-[#A2E8DD]/[0.05] hover:text-[#A2E8DD]"
    >
      <span className="sticky start-[calc(var(--unit-col)+0.5rem)] truncate group-hover:hidden">
        {t("calendar.available")}
      </span>
      <span className="sticky start-[calc(var(--unit-col)+0.5rem)] hidden items-center gap-1 truncate group-hover:inline-flex">
        <Plus className="size-3" aria-hidden="true" />
        {t("calendar.addLease")}
      </span>
    </button>
  );
}

/** The would-be stay while dragging across empty days. */
export function SelectionBar({ x0, x1, nights }: { x0: number; x1: number; nights: number }) {
  const { t } = useTranslation("conciergerie");
  return (
    <div
      style={spanStyle(x0, x1)}
      className="pointer-events-none absolute top-[10px] z-20 flex h-9 items-center rounded-lg border border-dashed border-primary/70 bg-primary/10 px-2 text-[0.7rem] text-primary"
    >
      <span className="truncate">{t("calendar.nights", { count: nights })}</span>
    </div>
  );
}

/** Hover card for a stay or lease: who, when, how much, from where. */
export function BlockHoverCard({
  item,
  place,
  disabled,
  children,
}: {
  item: StayItem | LeaseItem;
  place: { propertyName: string; unitName: string };
  disabled?: boolean;
  children: React.ReactElement;
}) {
  const { t } = useTranslation("conciergerie");
  const stay = item.kind === "stay" ? item.booking : null;
  const title = stay ? stay.guest.name : item.kind === "lease" ? item.lease.tenantName : "";
  const nights = nightsOf(item);
  const lastDay = stay ? item.end : addIsoDays(item.end, -1);
  const payment = stay?.paymentStatus;
  return (
    <HoverCard openDelay={280} closeDelay={60} {...(disabled ? { open: false } : {})}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side="top" align="start" className="w-72 border-border bg-[#141414] p-3">
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-serif text-base text-[#F8F9FA]">{title}</p>
          <p className="truncate text-[0.7rem] text-muted-foreground">
            {place.propertyName} · {place.unitName}
          </p>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[0.72rem]">
          <dt className="text-muted-foreground">{t("calendar.hover.dates")}</dt>
          <dd className="text-end tabular-nums text-foreground">
            {formatDateFields(parseDay(item.start), { day: "numeric", month: "short" })} –{" "}
            {formatDateFields(parseDay(lastDay), { day: "numeric", month: "short" })}
          </dd>
          {stay && (
            <>
              <dt className="text-muted-foreground">{t("calendar.hover.nights")}</dt>
              <dd className="text-end tabular-nums text-foreground">{nights}</dd>
              <dt className="text-muted-foreground">{t("calendar.hover.amount")}</dt>
              <dd className="text-end tabular-nums text-foreground">
                <span dir="ltr">{formatMoney(stay.amountMinor, stay.currency)}</span>
              </dd>
              <dt className="text-muted-foreground">{t("calendar.hover.source")}</dt>
              <dd className="flex items-center justify-end gap-1.5 text-foreground">
                <SourceGlyph kind={stay.source} />
                {t(`calendar.legend.${stay.source}`)}
              </dd>
            </>
          )}
          {payment && (
            <>
              <dt className="text-muted-foreground">{t("calendar.hover.payment")}</dt>
              <dd
                className={cn(
                  "text-end",
                  payment === "unpaid"
                    ? "text-[#FF85A1]"
                    : payment === "paid"
                      ? "text-[#A2E8DD]"
                      : "text-primary",
                )}
              >
                {t(`calendar.payment.${payment}`)}
              </dd>
            </>
          )}
        </dl>
      </HoverCardContent>
    </HoverCard>
  );
}
