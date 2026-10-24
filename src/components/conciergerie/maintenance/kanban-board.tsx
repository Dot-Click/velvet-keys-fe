import { LayoutGroup, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Ticket, TicketStatus } from "@/types/ops";
import { TicketCard } from "./ticket-parts";

export const BOARD_COLUMNS: TicketStatus[] = ["reported", "assigned", "in_progress", "resolved"];
const COLUMN_KEYS: Record<TicketStatus, string> = {
  reported: "maintenance.status.reported",
  assigned: "maintenance.status.assigned",
  in_progress: "maintenance.status.in_progress",
  resolved: "maintenance.status.resolved",
};
const NEXT: Partial<Record<TicketStatus, TicketStatus>> = {
  reported: "assigned",
  assigned: "in_progress",
  in_progress: "resolved",
};
const SPRING = { type: "spring", stiffness: 420, damping: 36 } as const;

/**
 * Reported → Assigned → In progress → Resolved. Columns scroll inside a fixed height, cards drag
 * between columns (or step on with "Next") and spring into place, and the column that took the
 * card glows for a moment.
 */
export function KanbanBoard({
  tickets,
  readOnly,
  ageOf,
  onOpen,
  onMove,
  onViewResolved,
}: {
  tickets: Ticket[];
  readOnly: boolean;
  ageOf: (ticket: Ticket) => string;
  onOpen: (ticket: Ticket) => void;
  onMove: (ticket: Ticket, status: TicketStatus) => void;
  onViewResolved: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const [over, setOver] = React.useState<TicketStatus | null>(null);
  const [landed, setLanded] = React.useState<TicketStatus | null>(null);
  const dragged = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!landed) return;
    const timer = setTimeout(() => setLanded(null), 700);
    return () => clearTimeout(timer);
  }, [landed]);

  const drop = (status: TicketStatus) => {
    const ticket = tickets.find((item) => item.id === dragged.current);
    dragged.current = null;
    setOver(null);
    if (!ticket || ticket.status === status) return;
    setLanded(status);
    onMove(ticket, status);
  };

  return (
    <LayoutGroup>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {BOARD_COLUMNS.map((status) => {
          const inColumn = tickets.filter((ticket) => ticket.status === status);
          // The backend already limits Resolved to the last week; the list view has the rest
          const cards = [
            ...inColumn.filter((ticket) => ticket.urgency === "critical"),
            ...inColumn.filter((ticket) => ticket.urgency !== "critical"),
          ];
          const next = NEXT[status];
          return (
            <section
              key={status}
              aria-label={t(COLUMN_KEYS[status])}
              onDragOver={(event) => {
                if (readOnly || !dragged.current) return;
                event.preventDefault();
                if (over !== status) setOver(status);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                  setOver(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                drop(status);
              }}
              className={cn(
                "flex h-[calc(100dvh-var(--shell-top,64px)-300px)] min-h-[440px] flex-col overflow-hidden rounded-2xl border bg-[#131313] transition-[border-color,box-shadow] duration-300",
                over === status
                  ? "border-primary/60 shadow-[0_0_0_1px_rgba(212,175,55,0.35)]"
                  : "border-border/70",
                landed === status &&
                  "shadow-[0_0_0_2px_rgba(212,175,55,0.55),0_0_28px_rgba(212,175,55,0.2)]",
              )}
            >
              <header className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-medium tracking-normal text-foreground">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      status === "resolved"
                        ? "bg-[#A2E8DD]"
                        : status === "reported"
                          ? "bg-[#FF85A1]"
                          : "bg-primary",
                    )}
                    aria-hidden="true"
                  />
                  {t(COLUMN_KEYS[status])}
                </h3>
                <span className="rounded-full border border-border/60 px-2 text-[0.68rem] leading-5 tabular-nums text-muted-foreground">
                  {cards.length}
                </span>
              </header>
              <div className="fade-edges min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
                {cards.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                    {t("maintenance.emptyColumn")}
                  </p>
                )}
                {cards.map((ticket) => (
                  <motion.div key={ticket.id} layout layoutId={ticket.id} transition={SPRING}>
                    <div
                      role="button"
                      tabIndex={0}
                      draggable={!readOnly}
                      onDragStart={(event) => {
                        dragged.current = ticket.id;
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", ticket.id);
                      }}
                      onDragEnd={() => {
                        dragged.current = null;
                        setOver(null);
                      }}
                      onClick={() => onOpen(ticket)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onOpen(ticket);
                        }
                      }}
                      className={cn(
                        "relative rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                        !readOnly && "cursor-grab active:cursor-grabbing",
                      )}
                    >
                      <TicketCard ticket={ticket} age={ageOf(ticket)} />
                      {next && !readOnly && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setLanded(next);
                            onMove(ticket, next);
                          }}
                          aria-label={t("maintenance.moveTo", { status: t(COLUMN_KEYS[next]) })}
                          className="absolute bottom-2.5 end-2.5 inline-flex items-center gap-1 rounded-full border border-primary/35 px-2 py-0.5 text-[0.65rem] text-primary opacity-80 transition-opacity hover:bg-primary/10 hover:opacity-100"
                        >
                          {t("common:actions.next")}
                          <ArrowRight className="size-3 rtl-flip" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              {status === "resolved" && (
                <button
                  type="button"
                  onClick={onViewResolved}
                  className="group flex items-center justify-center gap-1 border-t border-border/60 px-4 py-2.5 text-xs text-primary hover:bg-primary/5"
                >
                  {t("maintenance.viewAllResolved")}
                  <ArrowRight
                    className="size-3.5 rtl-flip transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              )}
            </section>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
