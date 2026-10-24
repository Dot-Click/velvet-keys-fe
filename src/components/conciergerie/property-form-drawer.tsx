import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { ImageUploadField } from "@/components/conciergerie/image-upload-field";
import { DetailDrawer } from "@/components/detail-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsSoloOwner } from "@/hooks/use-is-solo-owner";
import { useAllOwners, usePanelMutation } from "@/hooks/use-portfolio-data";
import { MOROCCAN_CITIES } from "@/lib/cities";
import { portfolioErrorKey } from "@/lib/portfolio-errors";
import { propertiesService } from "@/services/portfolio-service";
import type { Property, PropertyInput, PropertyPatch } from "@/types/portfolio";
import { DrawerField, drawerInputClassName, noSpinnerClassName } from "./drawer-field";

interface PropertyFormDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Edit this property (name, address, city and cover photo); add a new one when absent */
  property?: Property | null;
}

type Errors = Partial<Record<"name" | "address" | "commission", string>>;

/** Sentinel for "no owner": Radix Select cannot hold an empty value. */
const NO_OWNER = "none";

/** Owner picker fed by the account's real owners. Only a Conciergerie has owners to pick. */
function OwnerField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useTranslation("conciergerie");
  const owners = useAllOwners();
  const rows = owners.data ?? [];
  const hint = owners.isError
    ? t("forms.ownersLoadFailed")
    : owners.isSuccess && rows.length === 0
      ? t("forms.noOwnersHint")
      : t("forms.ownerOptionalHint");

  return (
    <DrawerField id="property-owner" label={t("forms.owner")} hint={hint}>
      <Select value={value} onValueChange={onChange} disabled={owners.isPending}>
        <SelectTrigger id="property-owner" className="h-10 border-border/80 bg-[#161616] text-xs">
          <SelectValue placeholder={t("forms.ownerPlaceholder")} />
        </SelectTrigger>
        <SelectContent className="border-border bg-[#141414]">
          <SelectItem value={NO_OWNER} className="text-xs py-2">
            {t("properties.noOwner")}
          </SelectItem>
          {rows.map((owner) => (
            <SelectItem key={owner.userId} value={owner.userId} className="text-xs py-2">
              {owner.name}
              {owner.inviteStatus === "invited" ? ` · ${t("owners.status.pending")}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </DrawerField>
  );
}

export function PropertyFormDrawer({ open, onClose, property }: PropertyFormDrawerProps) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const navigate = useNavigate();
  // A solo owner adds their own properties: no owner to pick and no commission to set
  const solo = useIsSoloOwner();
  const createProperty = usePanelMutation((input: PropertyInput) =>
    propertiesService.create(input),
  );
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState<string>(MOROCCAN_CITIES[0]);
  const [ownerId, setOwnerId] = useState(NO_OWNER);
  const [commission, setCommission] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [imageFileId, setImageFileId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const isEdit = Boolean(property);
  const updateProperty = usePanelMutation((input: { id: string; patch: PropertyPatch }) =>
    propertiesService.update(input.id, input.patch),
  );
  const pending = createProperty.isPending || updateProperty.isPending;

  // Opening in edit mode starts from the stored values
  useEffect(() => {
    if (open && property) {
      setName(property.name);
      setAddress(property.address);
      setCity(property.city);
      setImageFileId(property.imageFileId);
      setErrors({});
      setUploading(false);
    }
  }, [open, property]);

  function reset() {
    setName("");
    setAddress("");
    setCity(MOROCCAN_CITIES[0]);
    setOwnerId(NO_OWNER);
    setCommission("");
    setErrors({});
    setImageFileId(null);
    setUploading(false);
  }

  function close() {
    reset();
    onClose();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const pct = Number(commission);
    const next: Errors = {};
    if (!name.trim()) next.name = t("forms.errors.nameRequired");
    if (!address.trim()) next.address = t("forms.errors.addressRequired");
    if (!solo && commission.trim() !== "" && (Number.isNaN(pct) || pct < 0 || pct > 100)) {
      next.commission = t("forms.errors.commissionRange");
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (property) {
      const patch: PropertyPatch = {};
      if (name.trim() !== property.name) patch.name = name.trim();
      if (address.trim() !== property.address) patch.address = address.trim();
      if (city !== property.city) patch.city = city;
      if (imageFileId !== property.imageFileId) patch.imageFileId = imageFileId;
      if (Object.keys(patch).length === 0) {
        close();
        return;
      }
      updateProperty.mutate(
        { id: property.id, patch },
        {
          onSuccess: (saved) => {
            toast.success(t("properties.updated", { name: saved.name }));
            close();
          },
          onError: (error) => {
            const key = portfolioErrorKey(error);
            toast.error(key ? t(key) : t("common:states.errorBody"));
          },
        },
      );
      return;
    }

    const input: PropertyInput = { name: name.trim(), address: address.trim(), city };
    if (!solo && ownerId !== NO_OWNER) input.ownerUserId = ownerId;
    // Left empty, the backend applies the account's default commission
    if (!solo && commission.trim() !== "") input.commissionPct = pct;
    if (imageFileId) input.imageFileId = imageFileId;

    createProperty.mutate(input, {
      onSuccess: (property) => {
        toast.success(t("properties.added", { name: property.name }));
        close();
        void navigate({
          to: "/conciergerie/properties/$propertyId",
          params: { propertyId: property.id },
        });
      },
      onError: (error) => {
        const key = portfolioErrorKey(error);
        toast.error(key ? t(key) : t("common:states.errorBody"));
      },
    });
  }

  return (
    <DetailDrawer
      open={open}
      onClose={close}
      title={isEdit ? t("properties.editProperty") : t("properties.addProperty")}
      subtitle={isEdit ? (property?.name ?? "") : t("properties.addPropertySubtitle")}
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <DrawerField id="property-name" label={t("forms.propertyName")} error={errors.name}>
          <Input
            id="property-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("forms.propertyNamePlaceholder")}
            aria-invalid={Boolean(errors.name)}
            className={drawerInputClassName}
          />
        </DrawerField>

        <DrawerField id="property-address" label={t("forms.address")} error={errors.address}>
          <Input
            id="property-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("forms.addressPlaceholder")}
            aria-invalid={Boolean(errors.address)}
            className={drawerInputClassName}
          />
        </DrawerField>

        <DrawerField id="property-city" label={t("forms.city")}>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger
              id="property-city"
              className="h-10 border-border/80 bg-[#161616] text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-[#141414]">
              {MOROCCAN_CITIES.map((option) => (
                <SelectItem key={option} value={option} className="text-xs py-2">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DrawerField>

        {!solo && !isEdit && open && <OwnerField value={ownerId} onChange={setOwnerId} />}

        {!solo && !isEdit && (
          <DrawerField
            id="property-commission"
            label={t("forms.commission")}
            error={errors.commission}
            hint={t("forms.commissionDefaultHint")}
          >
            <div className="relative">
              <Input
                id="property-commission"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step={0.5}
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                aria-invalid={Boolean(errors.commission)}
                className={`${drawerInputClassName} ${noSpinnerClassName} pe-10 font-mono font-semibold text-primary`}
              />
              <span className="pointer-events-none absolute end-3.5 top-3 text-xs font-semibold text-muted-foreground">
                %
              </span>
            </div>
          </DrawerField>
        )}

        <ImageUploadField
          id="property-image"
          label={t("forms.propertyPhoto")}
          purpose="property_image"
          value={imageFileId}
          onChange={setImageFileId}
          onUploadingChange={setUploading}
        />

        <ReadOnlyGuard className="flex w-full">
          <Button
            type="submit"
            disabled={pending || uploading}
            className="w-full btn-shimmer bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider h-11"
          >
            {pending
              ? t("forms.saving")
              : isEdit
                ? t("forms.saveChanges")
                : t("properties.addProperty")}
          </Button>
        </ReadOnlyGuard>
      </form>
    </DetailDrawer>
  );
}
