import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { DetailDrawer } from "@/components/detail-drawer";
import { Button } from "@/components/ui/button";
import { usePanelMutation } from "@/hooks/use-portfolio-data";
import { formatDateFields } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { calendarService } from "@/services/str-service";
import { calendarErrorKey } from "./calendar-errors";
import type { BlockItem, CalendarRow, TurnoverItem } from "./calendar-model";

/** Turnover and calendar block details; operations users can remove a block. */
export function BlockDetailsDrawer({
  item,
  row,
  canWrite,
  onClose,
}: {
  /** A turnover or a block; null keeps the drawer closed */
  item: TurnoverItem | BlockItem | null;
  row: CalendarRow | undefined;
  canWrite: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const remove = usePanelMutation((id: string) => calendarService.deleteBlock(id));
  const isBlock = item?.kind === "block";

  const onRemove = () => {
    if (item?.kind !== "block") return;
    remove.mutate(item.block.id, {
      onSuccess: () => {
        toast.success(t("calendar.blockRemoved"));
        onClose();
      },
      onError: (error) => toast.error(t(calendarErrorKey(error))),
    });
  };

  const title = !item
    ? ""
    : item.kind === "block"
      ? t(`calendar.blockReason.${item.block.reason}`)
      : t("calendar.legend.housekeeping");

  return (
    <DetailDrawer
      open={Boolean(item)}
      onClose={onClose}
      title={title}
      subtitle={row ? `${row.property.propertyName} · ${row.unit.unitName}` : ""}
      badge={
        item && (
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[0.62rem] uppercase tracking-wider",
              isBlock
                ? "border-[#FF85A1]/50 bg-destructive/20 text-[#FF85A1]"
                : "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]",
            )}
          >
            {item.kind === "block"
              ? t("calendar.legend.block")
              : t(`calendar.turnoverStatus.${item.status}`)}
          </span>
        )
      }
    >
      {item && (
        <div className="space-y-4 text-xs">
          <p className="rounded-lg border border-border/80 bg-[#161616] p-4 leading-relaxed text-foreground">
            {item.kind === "turnover"
              ? t("calendar.turnoverBody", {
                  date: formatDateFields(parseDay(item.start), {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  }),
                })
              : t("calendar.blockBody", {
                  from: formatDateFields(parseDay(item.start), { month: "short", day: "numeric" }),
                  to: formatDateFields(parseDay(item.end), {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                })}
          </p>
          {item.kind === "block" && (
            <ReadOnlyGuard className="flex w-full">
              <Button
                type="button"
                variant="outlineGold"
                disabled={!canWrite || remove.isPending}
                onClick={onRemove}
                className={cn(
                  "h-10 w-full text-xs uppercase tracking-wider",
                  !canWrite && "hidden",
                )}
              >
                {t("calendar.removeBlock")}
              </Button>
            </ReadOnlyGuard>
          )}
        </div>
      )}
    </DetailDrawer>
  );
}
