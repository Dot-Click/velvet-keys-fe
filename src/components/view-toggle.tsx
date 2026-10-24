import { LayoutGrid, Rows3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type ListView = "table" | "cards";

/** Table / Cards switch for lists that offer both. */
export function ViewToggle({
  value,
  onChange,
  labels,
  className,
}: {
  value: ListView;
  onChange: (value: ListView) => void;
  /** Overrides "Table" / "Cards", e.g. "List" / "Board" */
  labels?: { table: string; cards: string };
  className?: string;
}) {
  const { t } = useTranslation("common");
  const options = [
    { value: "table" as const, icon: Rows3, label: labels?.table ?? t("listControls.viewTable") },
    {
      value: "cards" as const,
      icon: LayoutGrid,
      label: labels?.cards ?? t("listControls.viewCards"),
    },
  ];
  return (
    <div
      role="radiogroup"
      aria-label={t("listControls.viewLabel")}
      className={cn(
        "flex items-center gap-0.5 rounded-lg border border-border/70 bg-[#121212] p-0.5",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          aria-label={option.label}
          title={option.label}
          onClick={() => onChange(option.value)}
          className={cn(
            "grid size-8 place-items-center rounded-md transition-colors",
            value === option.value
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <option.icon className="size-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
