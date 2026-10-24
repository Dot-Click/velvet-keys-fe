import { useTranslation } from "react-i18next";
import { scorePassword, type PasswordStrengthLevel } from "@/lib/auth-validation";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<PasswordStrengthLevel, { bar: string; text: string }> = {
  empty: { bar: "bg-border", text: "text-muted-foreground" },
  weak: { bar: "bg-destructive", text: "text-destructive-foreground" },
  fair: { bar: "bg-primary/50", text: "text-primary/80" },
  good: { bar: "bg-primary", text: "text-primary" },
  strong: { bar: "bg-[#A2E8DD]", text: "text-[#A2E8DD]" },
};

export function PasswordStrengthMeter({ password, id }: { password: string; id?: string }) {
  const { t } = useTranslation("auth");
  const { score, level } = scorePassword(password);
  const style = LEVEL_STYLES[level];

  return (
    <div id={id} className="space-y-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={cn(
              "h-1 rounded-full transition-colors duration-300",
              segment <= score ? style.bar : "bg-border",
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-[0.68rem]">
        <span className="text-muted-foreground">
          {t("passwordStrength.label")}:{" "}
          <span className={cn("font-semibold", style.text)}>{t(`passwordStrength.${level}`)}</span>
        </span>
        {level !== "strong" && (
          <span className="text-muted-foreground/80">{t("passwordStrength.hint")}</span>
        )}
      </div>
    </div>
  );
}
