import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { IllustrationName } from "@/assets/manifest";
import { Illustration } from "@/components/media/illustration";
import { CountUp } from "@/components/motion/count-up";
import { opsItemVariants, opsListVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { TaskFilter } from "./day-timeline";
import type { TodayItemKind } from "./today-items";

/** A KPI tile filters the day list. */
export type TodayFocus = TaskFilter;

export interface KpiCount {
  total: number;
  done: number;
}

interface Tile {
  id: TodayItemKind;
  illustration: IllustrationName;
  count: KpiCount;
}

/** Arrivals, departures and housekeeping counts with their progress; the active one wears a gold rim. */
export function KpiTiles({
  arrivals,
  departures,
  housekeeping,
  active,
  onSelect,
}: {
  arrivals: KpiCount;
  departures: KpiCount;
  housekeeping: KpiCount;
  active: TodayFocus;
  onSelect: (focus: TodayFocus) => void;
}) {
  const { t } = useTranslation("conciergerie");
  const tiles: Tile[] = [
    { id: "check_in", illustration: "kpi-arrivals", count: arrivals },
    { id: "check_out", illustration: "kpi-departures", count: departures },
    { id: "housekeeping", illustration: "kpi-housekeeping", count: housekeeping },
  ];

  return (
    <motion.div
      variants={opsListVariants}
      initial="initial"
      animate="animate"
      role="group"
      aria-label={t("today.kpi.label")}
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {tiles.map((tile) => {
        const selected = active === tile.id;
        return (
          <motion.button
            key={tile.id}
            type="button"
            variants={opsItemVariants}
            aria-pressed={selected}
            onClick={() => onSelect(selected ? "all" : tile.id)}
            className={cn(
              "group hover-lift flex items-center gap-3 rounded-xl border bg-[#141414] p-3.5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              selected
                ? "border-primary/70 shadow-[0_0_0_1px_rgba(212,175,55,0.35),0_10px_30px_rgba(212,175,55,0.08)]"
                : "border-border/70",
            )}
          >
            <Illustration name={tile.illustration} size={44} animate className="text-primary" />
            <span className="min-w-0">
              <span className="block text-[0.7rem] text-muted-foreground">
                {t(`today.kpi.${tile.id}`)}
              </span>
              <span
                dir="ltr"
                className="figure-serif block whitespace-nowrap text-[1.75rem] leading-none text-[#F8F9FA] rtl:text-right"
              >
                <CountUp value={tile.count.total} />
              </span>
              <span className="mt-0.5 block text-[0.65rem] text-muted-foreground">
                {t("today.kpi.progress", { done: tile.count.done, total: tile.count.total })}
              </span>
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
