import { useTranslation } from "react-i18next";
import type { UnitType } from "@/types/portfolio";
import { cn } from "@/lib/utils";

const PILL =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider";

/** STR in gold, LTR in jade. */
export function UnitTypeBadge({ type, className }: { type: UnitType; className?: string }) {
  const { t } = useTranslation("conciergerie");
  return (
    <span
      title={t(`units.typeName.${type}`)}
      className={cn(
        PILL,
        "font-mono",
        type === "STR"
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]",
        className,
      )}
    >
      {type}
    </span>
  );
}

/** Shown on a unit that was removed: it stays for history but is no longer active. */
export function UnitArchivedBadge({ className }: { className?: string }) {
  const { t } = useTranslation("conciergerie");
  return (
    <span className={cn(PILL, "border-border/80 bg-[#161616] text-muted-foreground", className)}>
      {t("units.archived")}
    </span>
  );
}
