import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Undo2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { ListSearch } from "@/components/list-controls";
import { MediaImage } from "@/components/media/media-image";
import { SwipeRow } from "@/components/swipe-row";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useReadOnly } from "@/hooks/use-read-only";
import { LUXURY_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { TASK_KINDS, TASK_META } from "./task-meta";
import type { TodayItem, TodayItemKind } from "./today-items";

export type TaskFilter = "all" | TodayItemKind;

interface DayTimelineProps {
  items: TodayItem[];
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  /** Whether an item matches the search box */
  matches: (item: TodayItem) => boolean;
  titleOf: (item: TodayItem) => string;
  personOf: (item: TodayItem) => string | null;
  actionLabel: (kind: TodayItemKind) => string;
  /** Hint shown instead of the action when the backend would refuse it */
  blockedLabel: (item: TodayItem) => string | null;
  /** Whether the viewer holds the operations capability */
  canWrite: boolean;
  onDone: (item: TodayItem) => void;
  onUndo: (item: TodayItem) => void;
  /** An item to scroll to and highlight (from "Needs attention") */
  focusItemId: string | null;
  onFocusHandled: () => void;
  className?: string;
}

/**
 * The day's work as one list grouped by arrivals, departures and housekeeping, with finished
 * items folded away. The backend gives dates, not times, so there is no hour axis.
 */
export function DayTimeline({
  items,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  matches,
  titleOf,
  personOf,
  actionLabel,
  blockedLabel,
  canWrite,
  onDone,
  onUndo,
  focusItemId,
  onFocusHandled,
  className,
}: DayTimelineProps) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const reduceMotion = useReducedMotion();
  const { isReadOnly } = useReadOnly();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = React.useState<string | null>(null);
  const [completedOpen, setCompletedOpen] = React.useState(false);

  const visible = items.filter(
    (item) => (filter === "all" || item.kind === filter) && matches(item),
  );
  const open = visible.filter((item) => !item.done);
  const done = visible.filter((item) => item.done);
  const countOf = (kind: TaskFilter) =>
    kind === "all" ? items.length : items.filter((item) => item.kind === kind).length;

  React.useEffect(() => {
    if (!focusItemId) return;
    const row = scrollRef.current?.querySelector(`[data-task-id="${CSS.escape(focusItemId)}"]`);
    row?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    setHighlight(focusItemId);
    onFocusHandled();
  }, [focusItemId, onFocusHandled, reduceMotion]);

  React.useEffect(() => {
    if (!highlight) return;
    const timer = setTimeout(() => setHighlight(null), 1800);
    return () => clearTimeout(timer);
  }, [highlight]);

  let rowIndex = 0;

  return (
    <section
      aria-labelledby="day-timeline-title"
      className={cn(
        "flex h-[calc(100dvh-340px)] min-h-[440px] flex-col overflow-hidden rounded-2xl border border-border/70 bg-[#141414]",
        className,
      )}
    >
      <div className="space-y-3 border-b border-border/70 px-4 pb-3 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="day-timeline-title" className="font-serif text-xl tracking-normal text-[#F8F9FA]">
            {t("today.day.title")}
          </h2>
          <ListSearch
            value={search}
            onChange={onSearchChange}
            placeholder={t("common:listControls.placeholder.todayTasks")}
            className="sm:w-60"
          />
        </div>
        <div
          role="radiogroup"
          aria-label={t("today.day.filterLabel")}
          // me-20 on mobile shrinks this scroll container's own box so it clips (and scrolls)
          // before reaching the floating quick-actions button's zone (fixed bottom-end, ~76px
          // wide incl. its own margin), instead of rendering the last chip underneath it --
          // confirmed overlapping on a 375px-wide viewport before this margin was added. Trailing
          // padding alone doesn't help here: it only adds space after the scrolled-to-end content,
          // it doesn't affect what's visible at the initial, unscrolled position.
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 me-20 md:me-0"
        >
          {(["all", ...TASK_KINDS] as TaskFilter[]).map((kind) => (
            <button
              key={kind}
              type="button"
              role="radio"
              aria-checked={filter === kind}
              onClick={() => onFilterChange(kind)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors",
                filter === kind
                  ? "border-primary/60 bg-primary/12 text-primary"
                  : "border-border/70 text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {t(`today.day.filter.${kind}`)}
              <span className="tabular-nums opacity-70">{countOf(kind)}</span>
            </button>
          ))}
        </div>
      </div>

      {done.length > 0 && (
        <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
          <CollapsibleTrigger className="flex w-full items-center gap-2 border-b border-border/60 px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <Check className="size-3.5 text-[#A2E8DD]" aria-hidden="true" />
            {t("today.day.completed", { count: done.length })}
            <ChevronDown
              className={cn("ms-auto size-3.5 transition-transform", completedOpen && "rotate-180")}
              aria-hidden="true"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="max-h-40 overflow-y-auto border-b border-border/60 py-1">
              {done.map((item) => (
                <li key={item.id} className="flex h-10 items-center gap-3 px-4 text-xs opacity-60">
                  <Check className="size-3.5 shrink-0 text-[#A2E8DD]" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-foreground">{titleOf(item)}</span>
                  <span className="hidden truncate text-muted-foreground sm:inline">
                    {item.unitName}
                  </span>
                  {/* Only housekeeping can be reopened: the backend has no undo for check-in/out */}
                  {canWrite && item.kind === "housekeeping" && (
                    <ReadOnlyGuard>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUndo(item)}
                        className="h-7 px-2 text-[0.7rem]"
                      >
                        <Undo2 className="size-3" aria-hidden="true" />
                        {t("today.undo")}
                      </Button>
                    </ReadOnlyGuard>
                  )}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}

      <div ref={scrollRef} className="fade-edges relative min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {open.length === 0 && (
          <p className="mx-4 mt-6 rounded-xl border border-dashed border-border/70 p-5 text-center text-xs text-muted-foreground">
            {items.length === 0
              ? t("today.noTasks")
              : visible.length === 0
                ? t("today.day.noMatch")
                : t("today.day.allDone")}
          </p>
        )}
        {TASK_KINDS.map((kind) => {
          const group = open.filter((item) => item.kind === kind);
          if (group.length === 0) return null;
          return (
            <div key={kind} className="mb-3">
              <div className="sticky top-0 z-10 flex h-8 items-center gap-2 bg-[#141414]/95 px-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
                {t(`today.day.group.${kind}`)}
                <span className="tabular-nums text-muted-foreground/60">{group.length}</span>
              </div>
              <ul className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {group.map((item) => (
                    <TimelineRow
                      key={item.id}
                      item={item}
                      index={rowIndex++}
                      title={titleOf(item)}
                      person={personOf(item)}
                      action={actionLabel(item.kind)}
                      blocked={blockedLabel(item)}
                      canWrite={canWrite}
                      highlighted={highlight === item.id}
                      readOnly={isReadOnly}
                      onComplete={() => onDone(item)}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TimelineRow({
  item,
  index,
  title,
  person,
  action,
  blocked,
  canWrite,
  highlighted,
  readOnly,
  onComplete,
}: {
  item: TodayItem;
  index: number;
  title: string;
  person: string | null;
  action: string;
  blocked: string | null;
  canWrite: boolean;
  highlighted: boolean;
  readOnly: boolean;
  onComplete: () => void;
}) {
  const meta = TASK_META[item.kind];
  const Icon = meta.icon;
  const { t } = useTranslation("conciergerie");
  const actionable = canWrite && item.canAct;

  return (
    <motion.li
      data-task-id={item.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: LUXURY_EASE, delay: Math.min(index, 12) * 0.04 }}
    >
      <SwipeRow
        onSwipe={onComplete}
        label={t("today.day.swipeDone")}
        disabled={readOnly || !actionable}
      >
        <div
          className={cn(
            "group hover-row flex min-h-16 items-center gap-3 rounded-xl border border-border/60 bg-[#181818] px-3 py-2 transition-shadow",
            highlighted && "ring-2 ring-primary/70 ring-offset-2 ring-offset-[#141414]",
          )}
        >
          <span
            className={cn("grid size-8 shrink-0 place-items-center rounded-lg border", meta.chip)}
          >
            <Icon className={cn("size-4", meta.motion)} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-[0.95rem] leading-tight text-[#F8F9FA]">
              {title}
            </p>
            <p className="truncate text-[0.7rem] text-muted-foreground">
              {person ?? `${item.propertyName} · ${item.unitName}`}
              <span className="sm:hidden">{person ? ` · ${item.unitName}` : ""}</span>
            </p>
          </div>
          <div className="hidden w-40 min-w-0 shrink-0 items-center gap-2 sm:flex">
            <MediaImage
              kind="unit"
              id={item.unitId}
              name={item.unitName}
              variant="thumb"
              upload={null}
              className="size-8 shrink-0 rounded-md border border-border/60"
            />
            <span className="min-w-0 text-[0.7rem] leading-tight">
              <span className="block truncate text-foreground">{item.unitName}</span>
              <span className="block truncate text-muted-foreground">{item.propertyName}</span>
            </span>
          </div>
          {canWrite &&
            (item.canAct ? (
              <ReadOnlyGuard>
                <Button
                  size="sm"
                  variant="outlineGold"
                  onClick={onComplete}
                  aria-label={`${action} · ${title}`}
                  className="h-9 shrink-0 px-2.5 text-[0.7rem] sm:px-3"
                >
                  <Check className="size-3.5 sm:hidden" aria-hidden="true" />
                  <span className="hidden sm:inline">{action}</span>
                </Button>
              </ReadOnlyGuard>
            ) : (
              blocked && (
                <span className="max-w-28 shrink-0 text-end text-[0.68rem] leading-tight text-muted-foreground">
                  {blocked}
                </span>
              )
            ))}
        </div>
      </SwipeRow>
    </motion.li>
  );
}
