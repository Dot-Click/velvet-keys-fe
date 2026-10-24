import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { usePanelMutation } from "@/hooks/use-portfolio-data";
import { portfolioErrorKey } from "@/lib/portfolio-errors";
import { unitsService } from "@/services/portfolio-service";
import type { Unit, UnitType, UnitWithHistory } from "@/types/portfolio";
import { UnitTypeHistory } from "./unit-type-history";

/**
 * "Switch to LTR / STR". The backend decides whether the unit can change type (stays or a lease
 * ahead block it), so the request is simply sent after confirmation and a refusal is explained.
 * The switch response carries the type history and prorated amount; it cannot be fetched again,
 * so it is shown right after the switch.
 */
export function SwitchUnitTypeButton({
  unit,
  size = "sm",
}: {
  unit: Unit;
  size?: "sm" | "default";
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<UnitWithHistory | null>(null);
  const switchType = usePanelMutation((type: UnitType) => unitsService.switchType(unit.id, type));
  const target: UnitType = unit.type === "STR" ? "LTR" : "STR";
  const label = t("units.switchTo", { type: target });

  function confirm() {
    switchType.mutate(target, {
      onSuccess: (saved) => {
        setOpen(false);
        setResult(saved);
        toast.success(t("units.switched", { name: saved.name, type: target }));
      },
      onError: (error) => {
        setOpen(false);
        const key = portfolioErrorKey(error);
        toast.error(key ? t(key) : t("units.switchFailed"));
      },
    });
  }

  return (
    <>
      <ReadOnlyGuard>
        <Button
          type="button"
          variant="outline"
          size={size}
          onClick={() => setOpen(true)}
          className="text-[0.68rem] uppercase tracking-wider"
        >
          <ArrowLeftRight className="size-3.5 rtl-flip" />
          {label}
        </Button>
      </ReadOnlyGuard>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="border-primary/30 bg-[#141414]">
          <AlertDialogHeader className="text-start sm:text-start">
            <AlertDialogTitle className="font-display uppercase tracking-[0.12em]">
              {t("units.switchTitle", { name: unit.name, type: target })}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              {t("units.switchEffectiveTomorrow")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {target === "LTR" && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("units.switchDisconnects")}
            </p>
          )}
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs">{t("common:actions.cancel")}</AlertDialogCancel>
            <Button
              type="button"
              onClick={confirm}
              disabled={switchType.isPending}
              className="btn-shimmer bg-primary text-primary-foreground text-xs uppercase tracking-wider font-semibold"
            >
              {switchType.isPending ? t("forms.saving") : label}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={result !== null} onOpenChange={(next) => !next && setResult(null)}>
        <AlertDialogContent className="border-primary/30 bg-[#141414]">
          <AlertDialogHeader className="text-start sm:text-start">
            <AlertDialogTitle className="font-display uppercase tracking-[0.12em]">
              {t("units.history.title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              {t("units.switchResultBody", { name: result?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {result && <UnitTypeHistory history={result.typeHistory} />}
          <AlertDialogFooter>
            <AlertDialogAction className="text-xs">{t("common:actions.close")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
