import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { ImageUploadField } from "@/components/conciergerie/image-upload-field";
import { DetailDrawer } from "@/components/detail-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePanelMutation } from "@/hooks/use-portfolio-data";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { parseMoneyInput } from "@/lib/money";
import { portfolioErrorKey } from "@/lib/portfolio-errors";
import { cn } from "@/lib/utils";
import { unitsService } from "@/services/portfolio-service";
import type { Unit, UnitType } from "@/types/portfolio";
import { DrawerField, drawerInputClassName } from "./drawer-field";

interface UnitFormDrawerProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  /** Edit this unit; add a new one when absent */
  unit?: Unit | null;
}

type Errors = Partial<Record<"name" | "bedrooms" | "rate", string>>;

type UnitDraft = {
  name: string;
  type: UnitType;
  bedrooms: string;
  rate: string;
  imageFileId: string | null;
};

/** Minor units as the plain decimal text an input shows, e.g. 20050 -> "200.5". */
function rateText(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return "";
  const whole = Math.trunc(minor / 100);
  const fraction = String(minor % 100)
    .padStart(2, "0")
    .replace(/0$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}

function draftOf(unit: Unit | null | undefined): UnitDraft {
  return {
    name: unit?.name ?? "",
    type: unit?.type ?? "STR",
    bedrooms: String(unit?.bedrooms ?? 1),
    rate: rateText(unit?.nightlyRateMinor),
    imageFileId: unit?.imageFileId ?? null,
  };
}

/** Add or edit a unit: name, rental type, bedrooms and nightly rate. */
export function UnitFormDrawer({ open, onClose, propertyId, unit }: UnitFormDrawerProps) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const isEdit = Boolean(unit);
  const [draft, setDraft] = useState<UnitDraft>(() => draftOf(unit));
  const [errors, setErrors] = useState<Errors>({});
  const [uploading, setUploading] = useState(false);
  const save = usePanelMutation((input: { draft: UnitDraft; rateMinor: number | null }) => {
    const fields = {
      name: input.draft.name.trim(),
      bedrooms: Number(input.draft.bedrooms),
    };
    // Only short-term units have a nightly rate
    if (unit) {
      return unitsService.update(unit.id, {
        ...fields,
        ...(input.draft.imageFileId !== unit.imageFileId
          ? { imageFileId: input.draft.imageFileId }
          : {}),
        ...(unit.type === "STR" ? { nightlyRateMinor: input.rateMinor } : {}),
      });
    }
    return unitsService.create(propertyId, {
      ...fields,
      type: input.draft.type,
      ...(input.draft.imageFileId ? { imageFileId: input.draft.imageFileId } : {}),
      ...(input.draft.type === "STR" && input.rateMinor !== null
        ? { nightlyRateMinor: input.rateMinor }
        : {}),
    });
  });

  useEffect(() => {
    if (open) {
      setDraft(draftOf(unit));
      setErrors({});
      setUploading(false);
    }
  }, [open, unit]);

  const update = (patch: Partial<UnitDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const hasRate = draft.type === "STR";

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const bedrooms = Number(draft.bedrooms);
    const next: Errors = {};
    if (!draft.name.trim()) next.name = t("forms.errors.unitNameRequired");
    if (!Number.isInteger(bedrooms) || bedrooms < 0 || bedrooms > 20) {
      next.bedrooms = t("forms.errors.bedroomsRange");
    }
    let rateMinor: number | null = null;
    if (hasRate && draft.rate.trim() !== "") {
      rateMinor = parseMoneyInput(draft.rate, ACCOUNT_CURRENCY);
      if (rateMinor === null || rateMinor < 0) next.rate = t("forms.errors.rateInvalid");
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    save.mutate(
      { draft, rateMinor },
      {
        onSuccess: (saved) => {
          toast.success(t(isEdit ? "units.updated" : "units.added", { name: saved.name }));
          onClose();
        },
        onError: (error) => {
          const key = portfolioErrorKey(error);
          toast.error(key ? t(key) : t("common:states.errorBody"));
        },
      },
    );
  }

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={isEdit ? t("units.editUnit") : t("units.addUnit")}
      subtitle={isEdit ? (unit?.name ?? "") : t("units.addUnitSubtitle")}
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <DrawerField id="unit-name" label={t("forms.unitName")} error={errors.name}>
          <Input
            id="unit-name"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder={t("forms.unitNamePlaceholder")}
            aria-invalid={Boolean(errors.name)}
            className={drawerInputClassName}
          />
        </DrawerField>

        <DrawerField
          id="unit-type"
          label={t("forms.rentalType")}
          hint={isEdit ? t("forms.rentalTypeEditHint") : t("forms.rentalTypeHint")}
        >
          <div
            id="unit-type"
            role="radiogroup"
            aria-label={t("forms.rentalType")}
            className="grid grid-cols-2 gap-1 rounded-lg border border-border/70 bg-[#141414] p-1"
          >
            {(["STR", "LTR"] as const).map((type) => {
              const active = draft.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={isEdit}
                  onClick={() => update({ type })}
                  className={cn(
                    "rounded-md px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed",
                    active
                      ? type === "STR"
                        ? "bg-primary/20 text-primary"
                        : "bg-[#A2E8DD]/20 text-[#A2E8DD]"
                      : "text-muted-foreground hover:text-foreground disabled:opacity-50",
                  )}
                >
                  {t(`units.typeName.${type}`)}
                </button>
              );
            })}
          </div>
        </DrawerField>

        <DrawerField id="unit-bedrooms" label={t("forms.bedrooms")} error={errors.bedrooms}>
          <Input
            id="unit-bedrooms"
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            value={draft.bedrooms}
            onChange={(e) => update({ bedrooms: e.target.value })}
            aria-invalid={Boolean(errors.bedrooms)}
            className={`${drawerInputClassName} font-mono`}
          />
        </DrawerField>

        {hasRate && (
          <DrawerField
            id="unit-rate"
            label={t("forms.nightlyRate", { currency: ACCOUNT_CURRENCY })}
            error={errors.rate}
            hint={t("forms.nightlyRateHint")}
          >
            <Input
              id="unit-rate"
              inputMode="decimal"
              dir="ltr"
              value={draft.rate}
              onChange={(e) => update({ rate: e.target.value })}
              aria-invalid={Boolean(errors.rate)}
              className={`${drawerInputClassName} font-mono`}
            />
          </DrawerField>
        )}

        <ImageUploadField
          id="unit-image"
          label={t("forms.unitPhoto")}
          purpose="unit_image"
          value={draft.imageFileId}
          onChange={(imageFileId) => update({ imageFileId })}
          onUploadingChange={setUploading}
        />

        <ReadOnlyGuard className="flex w-full">
          <Button
            type="submit"
            disabled={save.isPending || uploading}
            className="w-full btn-shimmer bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider h-11"
          >
            {save.isPending
              ? t("forms.saving")
              : isEdit
                ? t("forms.saveChanges")
                : t("units.addUnit")}
          </Button>
        </ReadOnlyGuard>
      </form>
    </DetailDrawer>
  );
}
