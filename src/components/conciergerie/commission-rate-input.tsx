import type { TFunction } from "i18next";
import { useEffect, useState } from "react";
import { Check, Loader2, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { SuccessCheck } from "@/components/motion/success-check";
import { Input } from "@/components/ui/input";
import { usePanelMutation } from "@/hooks/use-portfolio-data";
import { useReadOnly } from "@/hooks/use-read-only";
import { hasErrorCode } from "@/lib/apiClient";
import { formatPercent } from "@/lib/currency";
import { propertiesService } from "@/services/portfolio-service";
import type { Property } from "@/types/portfolio";
import { noSpinnerClassName } from "./drawer-field";
import { cn } from "@/lib/utils";

/** What the editors need from a property. */
export type CommissionProperty = Pick<Property, "id" | "name" | "commissionPct">;

/** Localized message for a failed commission write. */
export function commissionErrorMessage(t: TFunction, error: unknown): string {
  if (hasErrorCode(error, "COMMISSION_OUT_OF_RANGE")) {
    return t("conciergerie:forms.errors.commissionRange");
  }
  if (hasErrorCode(error, "COMMISSION_NOT_APPLICABLE")) {
    return t("conciergerie:commission.errors.notApplicable");
  }
  if (hasErrorCode(error, "ACCOUNT_READ_ONLY")) {
    return t("conciergerie:commission.errors.readOnly");
  }
  return t("common:states.errorBody");
}

function validPct(value: string): number | null {
  const pct = Number(value);
  return value.trim() === "" || Number.isNaN(pct) || pct < 0 || pct > 100 ? null : pct;
}

function useSaveCommission(property: CommissionProperty) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const save = usePanelMutation((pct: number) => propertiesService.setCommission(property.id, pct));
  const commit = (pct: number, handlers: { onSuccess?: () => void; onError?: () => void }) =>
    save.mutate(pct, {
      onSuccess: (saved) => {
        handlers.onSuccess?.();
        toast.success(
          t("commission.updated", {
            name: saved.name,
            pct: formatPercent(saved.commissionPct ?? pct),
          }),
          { description: t("commission.appliesGeneral") },
        );
      },
      onError: (error) => {
        handlers.onError?.();
        toast.error(commissionErrorMessage(t, error));
      },
    });
  return { save, commit };
}

/**
 * Inline commission % editor. Saves on Enter or blur; the new rate applies from the next
 * booking or rent period, so figures already earned do not change.
 */
export function CommissionRateInput({
  property,
  className,
}: {
  property: CommissionProperty;
  className?: string;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const current = property.commissionPct;
  const [value, setValue] = useState(String(current ?? ""));
  const [invalid, setInvalid] = useState(false);
  const { save, commit: write } = useSaveCommission(property);

  useEffect(() => setValue(String(current ?? "")), [current]);

  // Solo owners pay no commission
  if (current === null) return <span className="text-sm text-muted-foreground">—</span>;

  function commit() {
    const pct = validPct(value);
    if (pct === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (pct === current) return;
    write(pct, { onError: () => setValue(String(current)) });
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className="relative w-28">
        <ReadOnlyGuard className="flex w-full">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step={0.5}
            value={value}
            aria-label={t("commission.rateFor", { name: property.name })}
            aria-invalid={invalid}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") setValue(String(current));
            }}
            className={cn(
              "h-9 border-border/80 bg-[#161616] pe-12 font-mono text-sm font-semibold text-primary aria-[invalid=true]:border-destructive",
              noSpinnerClassName,
            )}
          />
        </ReadOnlyGuard>
        <span className="pointer-events-none absolute end-3 top-2 flex items-center gap-1 text-xs text-muted-foreground">
          {save.isPending ? (
            <Loader2 className="size-3.5 animate-spin text-primary" />
          ) : save.isSuccess ? (
            <Check className="size-3.5 text-[#A2E8DD]" />
          ) : null}
          %
        </span>
      </div>
      {invalid && (
        <p className="text-[0.66rem] text-destructive-foreground">
          {t("forms.errors.commissionRange")}
        </p>
      )}
    </div>
  );
}

/**
 * Commission % in a table cell: shows the rate, turns into an input on click, saves on Enter or
 * blur (Escape cancels) and confirms with a check that draws in.
 */
export function InlineCommissionCell({ property }: { property: CommissionProperty }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const { isReadOnly } = useReadOnly();
  const current = property.commissionPct;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(current ?? ""));
  const [invalid, setInvalid] = useState(false);
  const [saved, setSaved] = useState(false);
  const { save, commit: write } = useSaveCommission(property);

  useEffect(() => setValue(String(current ?? "")), [current]);
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 1600);
    return () => clearTimeout(timer);
  }, [saved]);

  if (current === null) return <span className="text-sm text-muted-foreground">—</span>;

  function commit() {
    const pct = validPct(value);
    if (pct === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setEditing(false);
    if (pct === current) return;
    write(pct, {
      onSuccess: () => setSaved(true),
      onError: () => setValue(String(current)),
    });
  }

  if (editing) {
    return (
      <span
        className="inline-flex flex-col items-end gap-1"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="relative inline-flex w-24" dir="ltr">
          <Input
            autoFocus
            onFocus={(event) => event.currentTarget.select()}
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step={0.5}
            value={value}
            aria-label={t("commission.rateFor", { name: property.name })}
            aria-invalid={invalid}
            onChange={(event) => setValue(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              }
              if (event.key === "Escape") {
                setValue(String(current));
                setInvalid(false);
                setEditing(false);
              }
            }}
            className={cn(
              "h-8 border-primary/50 bg-[#161616] pe-7 text-sm tabular-nums text-primary aria-[invalid=true]:border-destructive",
              noSpinnerClassName,
            )}
          />
          <span className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            %
          </span>
        </span>
        {invalid && (
          <span className="text-[0.65rem] text-[#FF85A1]">{t("forms.errors.commissionRange")}</span>
        )}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isReadOnly}
      onClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
      aria-label={t("commission.editRate", { name: property.name })}
      className="group/cell inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 tabular-nums text-primary transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {save.isPending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : saved ? (
        <SuccessCheck className="size-3.5 text-[#A2E8DD]" />
      ) : (
        <Pencil
          className="size-3 opacity-0 transition-opacity group-hover/cell:opacity-70"
          aria-hidden="true"
        />
      )}
      {formatPercent(current)}
    </button>
  );
}
