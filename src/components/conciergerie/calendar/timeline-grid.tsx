import { ChevronDown } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { UnitTypeBadge } from "@/components/conciergerie/unit-badges";
import { useReadOnly } from "@/hooks/use-read-only";
import { formatDateFields, formatPercent } from "@/lib/currency";
import { toISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { CalendarUnit } from "@/types/str";
import {
  AvailableBar,
  BlockBar,
  BlockHoverCard,
  LeaseBar,
  SelectionBar,
  StayBar,
  TurnoverChip,
} from "./calendar-bars";
import {
  GROUP_HEIGHT,
  ROW_HEIGHT,
  VIRTUALIZE_AFTER,
  ZOOM_COLUMN,
  addIsoDays,
  availableSpans,
  dayIndex,
  findConflict,
  itemSpan,
  type CalendarItem,
  type CalendarZoom,
  type PropertyGroup,
  type StayItem,
} from "./calendar-model";

export interface StayChange {
  item: StayItem;
  checkIn: string;
  /** Exclusive check-out date */
  checkOut: string;
}

interface TimelineGridProps {
  groups: PropertyGroup[];
  /** Every item of every unit, by unit id */
  items: Map<string, CalendarItem[]>;
  days: Date[];
  zoom: CalendarZoom;
  /** Changes with the range, so bars replay their entrance */
  rangeKey: string;
  todayIso: string;
  /** Whether the user may add and move stays (operations capability) */
  canWrite: boolean;
  /** Incremented to scroll smoothly to today */
  scrollToToday: number;
  onOpenItem: (item: CalendarItem) => void;
  onCreateStay: (input: { unit: CalendarUnit; checkIn: string; checkOut: string }) => void;
  onAddLease: (unitId: string) => void;
  /** Saves a moved or resized direct stay; rejects when the backend refuses it */
  onMoveStay: (change: StayChange) => Promise<void>;
  onConflict: (error?: unknown) => void;
}

type GridRow =
  | { type: "group"; key: string; top: number; group: PropertyGroup }
  | { type: "unit"; key: string; top: number; group: PropertyGroup; row: CalendarUnit };

type Drag =
  | { kind: "create"; unitId: string; from: number; to: number }
  | {
      kind: "move" | "start" | "end";
      item: StayItem;
      originX: number;
      delta: number;
      moved: boolean;
    };

/**
 * Tape chart: sticky unit column and date header, units grouped by property, mid-day stay bars,
 * in-row turnover chips, lease bars, hatched blocks and drag to create or move.
 */
export function TimelineGrid({
  groups,
  items,
  days,
  zoom,
  rangeKey,
  todayIso,
  canWrite,
  scrollToToday,
  onOpenItem,
  onCreateStay,
  onAddLease,
  onMoveStay,
  onConflict,
}: TimelineGridProps) {
  const { t, i18n } = useTranslation("conciergerie");
  const rtl = i18n.dir() === "rtl";
  const { isReadOnly: accountReadOnly } = useReadOnly();
  const isReadOnly = accountReadOnly || !canWrite;
  const unitCount = groups.reduce((sum, group) => sum + group.units.length, 0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const todayRef = React.useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => new Set());
  const [viewport, setViewport] = React.useState({ top: 0, height: 800 });
  const [drag, setDrag] = React.useState<Drag | null>(null);
  const [conflictId, setConflictId] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<Map<string, { checkIn: string; checkOut: string }>>(
    () => new Map(),
  );
  const start = days[0] ?? new Date();
  const count = days.length;
  const columnPx = ZOOM_COLUMN[zoom];
  const isoDays = React.useMemo(() => days.map(toISODate), [days]);

  // Pending moves show at their new dates until the refreshed data arrives
  const effectiveItems = React.useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const [unitId, list] of items)
      map.set(
        unitId,
        list.map((entry) => {
          const moved = entry.kind === "stay" ? pending.get(entry.id) : undefined;
          return moved ? { ...entry, start: moved.checkIn, end: moved.checkOut } : entry;
        }),
      );
    return map;
  }, [items, pending]);
  React.useEffect(() => setPending(new Map()), [items]);

  const rows = React.useMemo(() => {
    const list: GridRow[] = [];
    let top = 0;
    for (const group of groups) {
      list.push({ type: "group", key: `g-${group.propertyId}`, top, group });
      top += GROUP_HEIGHT;
      if (collapsed.has(group.propertyId)) continue;
      for (const row of group.units) {
        list.push({ type: "unit", key: row.unitId, top, group, row });
        top += ROW_HEIGHT;
      }
    }
    return { list, height: top };
  }, [groups, collapsed]);

  const virtualize = unitCount > VIRTUALIZE_AFTER;
  const overscan = 240;
  const visibleRows = virtualize
    ? rows.list.filter(
        (row) =>
          row.top + ROW_HEIGHT >= viewport.top - overscan &&
          row.top <= viewport.top + viewport.height + overscan,
      )
    : rows.list;

  const onScroll = React.useCallback(() => {
    if (!virtualize) return;
    const element = scrollRef.current;
    if (!element) return;
    requestAnimationFrame(() =>
      setViewport({ top: element.scrollTop, height: element.clientHeight }),
    );
  }, [virtualize]);

  // A new range opens at its first day; on load and on "Today" the grid brings today to the start
  const firstRange = React.useRef(true);
  React.useEffect(() => {
    if (firstRange.current) {
      firstRange.current = false;
      return;
    }
    scrollRef.current?.scrollTo({ left: 0 });
  }, [rangeKey]);
  // Bring today to the start of the grid by scrolling the grid itself. (scrollIntoView also
  // scrolls every ancestor, which on first load could push the whole grid out of view and leave
  // the page looking blank.) Deferred a frame so the columns have their measured width.
  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const container = scrollRef.current;
      const today = todayRef.current;
      if (!container || !today) return;
      const unitColumn = Number.parseFloat(getComputedStyle(container).getPropertyValue("--unit-col")) || 0;
      const margin = unitColumn + columnPx;
      const box = container.getBoundingClientRect();
      const cell = today.getBoundingClientRect();
      const delta = rtl ? cell.right - box.right + margin : cell.left - box.left - margin;
      container.scrollBy({ left: delta, behavior: scrollToToday === 0 ? "auto" : "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToToday]);

  const dayAt = (event: React.PointerEvent, track: HTMLElement) => {
    const rect = track.getBoundingClientRect();
    const column = rect.width / count;
    const offset = rtl ? rect.right - event.clientX : event.clientX - rect.left;
    return { index: Math.min(count - 1, Math.max(0, Math.floor(offset / column))), offset, column };
  };

  const flashConflict = (id: string, error?: unknown) => {
    setConflictId(id);
    onConflict(error);
    setTimeout(() => setConflictId((current) => (current === id ? null : current)), 1500);
  };

  // Touch pans the grid; creating and moving stays is for mouse and pen
  const beginCreate = (event: React.PointerEvent<HTMLDivElement>, row: CalendarUnit) => {
    if (
      isReadOnly ||
      row.type !== "STR" ||
      event.pointerType === "touch" ||
      event.button !== 0 ||
      event.target !== event.currentTarget
    )
      return;
    const { index } = dayAt(event, event.currentTarget);
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ kind: "create", unitId: row.unitId, from: index, to: index });
  };

  const beginStayDrag = (event: React.PointerEvent<HTMLDivElement>, item: StayItem) => {
    if (event.button !== 0) return;
    if (event.pointerType === "touch") {
      onOpenItem(item);
      return;
    }
    const track = event.currentTarget.parentElement;
    if (!track) return;
    const handle = (event.target as HTMLElement).dataset["handle"];
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      kind: handle === "start" ? "start" : handle === "end" ? "end" : "move",
      item,
      originX: dayAt(event, track).offset,
      delta: 0,
      moved: false,
    });
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>, track: HTMLElement | null) => {
    if (!drag || !track) return;
    const { index, offset, column } = dayAt(event, track);
    if (drag.kind === "create") {
      if (index !== drag.to) setDrag({ ...drag, to: index });
      return;
    }
    const delta = Math.round((offset - drag.originX) / column);
    const moved = drag.moved || Math.abs(offset - drag.originX) > 4;
    if (delta !== drag.delta || moved !== drag.moved) setDrag({ ...drag, delta, moved });
  };

  /** New check-in and (exclusive) check-out of a stay being dragged. */
  const datesOf = (current: Extract<Drag, { item: StayItem }>) => {
    const checkIn = current.item.start;
    const checkOut = current.item.end;
    if (current.kind === "move") {
      return {
        checkIn: addIsoDays(checkIn, current.delta),
        checkOut: addIsoDays(checkOut, current.delta),
      };
    }
    if (current.kind === "start") {
      const next = addIsoDays(checkIn, current.delta);
      return { checkIn: next < checkOut ? next : addIsoDays(checkOut, -1), checkOut };
    }
    const next = addIsoDays(checkOut, current.delta);
    return { checkIn, checkOut: next > checkIn ? next : addIsoDays(checkIn, 1) };
  };

  const endDrag = (row: CalendarUnit) => {
    const current = drag;
    setDrag(null);
    if (!current) return;
    if (current.kind === "create") {
      const from = Math.min(current.from, current.to);
      const to = Math.max(current.from, current.to);
      const checkIn = isoDays[from] ?? isoDays[0] ?? todayIso;
      const checkOut = addIsoDays(isoDays[to] ?? checkIn, 1);
      const conflict = findConflict(effectiveItems.get(row.unitId) ?? [], {
        id: "",
        checkIn,
        checkOut,
      });
      if (conflict) {
        flashConflict(conflict.id);
        return;
      }
      onCreateStay({ unit: row, checkIn, checkOut });
      return;
    }
    if (!current.moved || current.delta === 0) {
      if (!current.moved) onOpenItem(current.item);
      return;
    }
    const next = datesOf(current);
    const conflict = findConflict(effectiveItems.get(current.item.unitId) ?? [], {
      id: current.item.id,
      ...next,
    });
    if (conflict) {
      flashConflict(current.item.id);
      return;
    }
    setPending((map) => new Map(map).set(current.item.id, next));
    onMoveStay({ item: current.item, ...next }).catch((error: unknown) => {
      setPending((map) => {
        const copy = new Map(map);
        copy.delete(current.item.id);
        return copy;
      });
      flashConflict(current.item.id, error);
    });
  };

  let barIndex = 0;
  const nextDelay = () => Math.min(barIndex++, 40) * 20;

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="cal-grid relative h-full overflow-auto overscroll-contain rounded-2xl border border-border/70 bg-[#101010] [--unit-col:168px] md:[--unit-col:260px]"
      style={{ "--cal-col": `${columnPx}px` } as React.CSSProperties}
    >
      <div
        className="relative min-w-full"
        style={{ width: `calc(var(--unit-col) + ${count} * var(--cal-col))` }}
      >
        {/* Date header */}
        <div className="sticky top-0 z-40 flex h-14 border-b border-border/70 bg-[#121212]/95 backdrop-blur">
          <div className="sticky start-0 z-10 flex w-[var(--unit-col)] shrink-0 items-end border-e border-border/70 bg-[#121212] px-3 pb-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("calendar.unitCount", { count: unitCount })}
          </div>
          {days.map((day, index) => {
            const iso = isoDays[index] ?? "";
            const isToday = iso === todayIso;
            const weekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div
                key={iso}
                ref={isToday ? todayRef : undefined}
                className={cn(
                  "relative flex w-[var(--cal-col)] shrink-0 scroll-ms-[calc(var(--unit-col)+var(--cal-col))] flex-col items-center justify-center gap-0.5 border-e border-border/40 text-center",
                  weekend && "bg-[#1A1612]",
                  isToday && "bg-[#A2E8DD]/[0.06]",
                )}
              >
                {isToday && (
                  <span
                    className="absolute -top-px inset-x-1 h-[2px] rounded-b bg-[#A2E8DD]"
                    aria-hidden="true"
                  />
                )}
                <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                  {isToday && columnPx > 60
                    ? t("calendar.legend.today")
                    : formatDateFields(day, { weekday: columnPx > 60 ? "short" : "narrow" })}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    isToday ? "text-[#A2E8DD]" : "text-foreground",
                  )}
                >
                  {formatDateFields(day, { day: "numeric" })}
                </span>
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="relative" style={{ height: rows.height }}>
          {/* Weekend tint and today's column */}
          {days.map((day, index) => {
            const isToday = isoDays[index] === todayIso;
            const weekend = day.getDay() === 0 || day.getDay() === 6;
            if (!isToday && !weekend) return null;
            return (
              <div
                key={`col-${index}`}
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-y-0",
                  weekend && "bg-[#C8964A]/[0.035]",
                  isToday && "border-x border-[#A2E8DD]/45 bg-[#A2E8DD]/[0.03]",
                )}
                style={{
                  insetInlineStart: `calc(var(--unit-col) + ${index} * var(--cal-col))`,
                  width: "var(--cal-col)",
                }}
              />
            );
          })}

          {visibleRows.map((entry) =>
            entry.type === "group" ? (
              <GroupRow
                key={entry.key}
                top={entry.top}
                group={entry.group}
                collapsed={collapsed.has(entry.group.propertyId)}
                onToggle={() =>
                  setCollapsed((current) => {
                    const next = new Set(current);
                    if (next.has(entry.group.propertyId)) next.delete(entry.group.propertyId);
                    else next.add(entry.group.propertyId);
                    return next;
                  })
                }
              />
            ) : (
              <div
                key={entry.key}
                className="absolute inset-x-0 flex border-b border-border/40"
                style={{ top: entry.top, height: ROW_HEIGHT }}
              >
                <UnitCell row={entry.row} propertyName={entry.group.propertyName} />
                <UnitTrack
                  row={entry.row}
                  propertyName={entry.group.propertyName}
                  items={effectiveItems.get(entry.row.unitId) ?? []}
                  start={start}
                  count={count}
                  columnPx={columnPx}
                  rangeKey={rangeKey}
                  drag={drag}
                  conflictId={conflictId}
                  readOnly={isReadOnly}
                  nextDelay={nextDelay}
                  datesOf={datesOf}
                  onBeginCreate={beginCreate}
                  onBeginStayDrag={beginStayDrag}
                  onPointerMove={onPointerMove}
                  onEndDrag={endDrag}
                  onCancelDrag={() => setDrag(null)}
                  onOpenItem={onOpenItem}
                  onAddLease={isReadOnly ? undefined : onAddLease}
                />
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function GroupRow({
  top,
  group,
  collapsed,
  onToggle,
}: {
  top: number;
  group: PropertyGroup;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation("conciergerie");
  return (
    <div
      className="absolute inset-x-0 flex items-center border-b border-border/60 bg-[#151515]"
      style={{ top, height: GROUP_HEIGHT }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="group sticky start-0 flex h-full w-[min(100%,calc(var(--unit-col)+18rem))] items-center gap-2 bg-[#151515] px-3 text-start"
      >
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform",
            collapsed && "-rotate-90 rtl:rotate-90",
          )}
          aria-hidden="true"
        />
        <span className="truncate font-serif text-[0.95rem] text-[#F8F9FA] group-hover:text-primary">
          {group.propertyName}
        </span>
        <span className="shrink-0 text-[0.68rem] text-muted-foreground">
          {t("calendar.groupUnits", { count: group.units.length })}
        </span>
        <span className="shrink-0 rounded-full border border-primary/25 px-1.5 text-[0.62rem] tabular-nums leading-4 text-primary">
          {t("calendar.groupOccupancy", {
            pct: formatPercent(group.occupancyPct, { decimals: 0 }),
          })}
        </span>
      </button>
    </div>
  );
}

function UnitCell({ row, propertyName }: { row: CalendarUnit; propertyName: string }) {
  const { t } = useTranslation("conciergerie");
  return (
    <div className="group sticky start-0 z-[35] flex w-[var(--unit-col)] shrink-0 items-center gap-2.5 border-e border-border/70 bg-[#111111] px-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-[0.92rem] leading-tight text-[#F8F9FA]">
          {row.unitName}
        </p>
        <p className="truncate text-[0.65rem] text-muted-foreground">{propertyName}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <UnitTypeBadge type={row.type} className="px-1.5 py-0 text-[0.55rem]" />
          <span className="truncate text-[0.62rem] tabular-nums text-muted-foreground">
            {t("calendar.unitOccupancy", { pct: formatPercent(row.occupancyPct, { decimals: 0 }) })}
          </span>
        </div>
      </div>
    </div>
  );
}

function UnitTrack({
  row,
  propertyName,
  items,
  start,
  count,
  columnPx,
  rangeKey,
  drag,
  conflictId,
  readOnly,
  nextDelay,
  datesOf,
  onBeginCreate,
  onBeginStayDrag,
  onPointerMove,
  onEndDrag,
  onCancelDrag,
  onOpenItem,
  onAddLease,
}: {
  row: CalendarUnit;
  propertyName: string;
  items: CalendarItem[];
  start: Date;
  count: number;
  columnPx: number;
  rangeKey: string;
  drag: Drag | null;
  conflictId: string | null;
  readOnly: boolean;
  nextDelay: () => number;
  datesOf: (drag: Extract<Drag, { item: StayItem }>) => { checkIn: string; checkOut: string };
  onBeginCreate: (event: React.PointerEvent<HTMLDivElement>, row: CalendarUnit) => void;
  onBeginStayDrag: (event: React.PointerEvent<HTMLDivElement>, item: StayItem) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>, track: HTMLElement | null) => void;
  onEndDrag: (row: CalendarUnit) => void;
  onCancelDrag: () => void;
  onOpenItem: (item: CalendarItem) => void;
  onAddLease: ((unitId: string) => void) | undefined;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const creating = drag?.kind === "create" && drag.unitId === row.unitId ? drag : null;
  const dragged = drag && drag.kind !== "create" && drag.item.unitId === row.unitId ? drag : null;
  const ltrGaps = row.type === "LTR" ? availableSpans(items, start, count) : [];
  const indexOf = (day: string) => dayIndex(start, day);
  const place = { propertyName, unitName: row.unitName };

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative flex-1 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:var(--cal-col)_100%] rtl:bg-[linear-gradient(to_left,rgba(255,255,255,0.035)_1px,transparent_1px)]",
        row.type === "STR" && !readOnly && "cursor-crosshair",
      )}
      onPointerDown={(event) => onBeginCreate(event, row)}
      onPointerMove={(event) => onPointerMove(event, trackRef.current)}
      onPointerUp={() => onEndDrag(row)}
      onPointerCancel={onCancelDrag}
    >
      {onAddLease &&
        ltrGaps.map((gap) => (
          <AvailableBar
            key={`gap-${gap.x0}`}
            x0={gap.x0}
            x1={gap.x1}
            onAdd={() => onAddLease(row.unitId)}
          />
        ))}

      {items.map((item) => {
        const preview =
          item.kind === "stay" && dragged && dragged.item.id === item.id && dragged.moved
            ? datesOf(dragged)
            : null;
        const shown: CalendarItem = preview
          ? { ...item, start: preview.checkIn, end: preview.checkOut }
          : item;
        // `visible` only decides whether to draw; the rest positions the bar
        const { visible, ...span } = itemSpan(shown, start, count);
        const key = `${rangeKey}-${item.id}`;

        if (item.kind === "turnover") {
          const x = indexOf(item.start) + 0.5;
          if (x < 0 || x > count) return null;
          return <TurnoverChip key={key} x={x} item={item} onClick={() => onOpenItem(item)} />;
        }
        if (!visible) return null;
        if (item.kind === "block") {
          return (
            <BlockBar
              key={key}
              item={item}
              {...span}
              delay={nextDelay()}
              onClick={() => onOpenItem(item)}
            />
          );
        }
        if (item.kind === "lease") {
          return (
            <BlockHoverCard key={key} item={item} place={place}>
              <LeaseBar
                item={item}
                {...span}
                endsInRange={!span.clippedEnd}
                delay={nextDelay()}
                onClick={() => onOpenItem(item)}
              />
            </BlockHoverCard>
          );
        }
        const movable = !item.booking.synced && !readOnly;
        const stayShown = shown as StayItem;
        return (
          <BlockHoverCard key={key} item={stayShown} place={place} disabled={Boolean(drag)}>
            <StayBar
              item={stayShown}
              {...span}
              columnPx={columnPx}
              delay={nextDelay()}
              draggable={movable}
              dragging={Boolean(preview)}
              conflict={conflictId === item.id}
              onOpen={() => onOpenItem(item)}
              {...(movable
                ? {
                    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) =>
                      onBeginStayDrag(event, item),
                  }
                : {})}
            />
          </BlockHoverCard>
        );
      })}

      {creating && (
        <SelectionBar
          x0={Math.min(creating.from, creating.to) + 0.5}
          x1={Math.max(creating.from, creating.to) + 1.5}
          nights={Math.abs(creating.to - creating.from) + 1}
        />
      )}
    </div>
  );
}
