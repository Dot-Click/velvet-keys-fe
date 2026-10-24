import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MediaImage } from "@/components/media/media-image";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUrlPagination } from "@/hooks/use-url-state";
import { cn } from "@/lib/utils";
import type { UnitBoardItem, UnitBoardStatus } from "@/types/str";

const PAGE = 24;

const STATUS: Record<UnitBoardStatus, { ring: string; dot: string; key: string }> = {
  occupied: { ring: "ring-primary", dot: "bg-primary", key: "occupied" },
  vacant_clean: { ring: "ring-[#A2E8DD]", dot: "bg-[#A2E8DD]", key: "vacantClean" },
  vacant_dirty: {
    ring: "ring-muted-foreground/60",
    dot: "bg-muted-foreground/70",
    key: "vacantDirty",
  },
  blocked: { ring: "ring-[#FF85A1]", dot: "bg-[#FF85A1]", key: "blocked" },
};
const ORDER: UnitBoardStatus[] = ["occupied", "vacant_clean", "vacant_dirty", "blocked"];

/** Every STR unit as a 44px photo tile with a status ring; more than 24 units page through. */
export function UnitStatusBoard({ units }: { units: UnitBoardItem[] }) {
  const { t } = useTranslation("conciergerie");
  const pager = useUrlPagination(units, { param: "units", fixedPageSize: PAGE });
  const countOf = (status: UnitBoardStatus) =>
    units.filter((unit) => unit.status === status).length;

  return (
    <section
      aria-labelledby="unit-board-title"
      className="rounded-2xl border border-border/70 bg-[#141414] p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 id="unit-board-title" className="font-serif text-lg tracking-normal text-[#F8F9FA]">
          {t("today.board.title")}
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {t("today.unitsTotal", { count: units.length })}
        </span>
      </div>

      <ul className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.68rem] text-muted-foreground">
        {ORDER.map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", STATUS[status].dot)} aria-hidden="true" />
            {t(`today.board.${STATUS[status].key}`)}
            <span className="tabular-nums text-foreground/80">{countOf(status)}</span>
          </li>
        ))}
      </ul>

      {units.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">{t("today.board.none")}</p>
      ) : (
        <TooltipProvider delayDuration={80}>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-2.5">
            {pager.items.map((unit) => {
              const status = STATUS[unit.status];
              const label = `${unit.propertyName} · ${unit.unitName} — ${t(`today.board.${status.key}`)}`;
              return (
                <li key={unit.unitId} className="flex justify-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={label}
                        className={cn(
                          "group size-11 rounded-lg ring-2 ring-offset-2 ring-offset-[#141414] transition-transform hover:-translate-y-0.5 focus-visible:outline-none",
                          status.ring,
                        )}
                      >
                        <MediaImage
                          kind="unit"
                          id={unit.unitId}
                          name={unit.unitName}
                          variant="thumb"
                          upload={null}
                          className={cn(
                            "size-full rounded-lg",
                            unit.status === "vacant_dirty" && "opacity-60",
                          )}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-56 text-xs">
                      <p className="font-medium">{unit.unitName}</p>
                      <p className="text-muted-foreground">{unit.propertyName}</p>
                      <p className="mt-1 flex items-center gap-1.5">
                        <span
                          className={cn("size-1.5 rounded-full", status.dot)}
                          aria-hidden="true"
                        />
                        {t(`today.board.${status.key}`)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </TooltipProvider>
      )}

      {pager.pageCount > 1 && (
        <div className="mt-3 flex items-center justify-end gap-1 text-xs text-muted-foreground">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={pager.page === 1}
            onClick={() => pager.setPage(pager.page - 1)}
            aria-label={t("common:pagination.previous")}
          >
            <ChevronLeft className="size-4 rtl-flip" />
          </Button>
          <span className="tabular-nums" dir="ltr">
            {pager.page} / {pager.pageCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={pager.page === pager.pageCount}
            onClick={() => pager.setPage(pager.page + 1)}
            aria-label={t("common:pagination.next")}
          >
            <ChevronRight className="size-4 rtl-flip" />
          </Button>
        </div>
      )}
    </section>
  );
}
