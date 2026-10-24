import { ImagePlus, Loader2, X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { DrawerField, drawerInputClassName } from "@/components/conciergerie/drawer-field";
import { DetailDrawer } from "@/components/detail-drawer";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { usePanelMutation, usePortfolioProperty, useProperties } from "@/hooks/use-portfolio-data";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { parseMoneyInput } from "@/lib/money";
import { cn } from "@/lib/utils";
import { filesService, ticketsService } from "@/services/ops-service";
import type { TicketUrgency } from "@/types/ops";
import { maintenanceErrorKey } from "./maintenance-errors";
import { useAllWorkers } from "./use-all-workers";
import { URGENCY_META } from "./ticket-parts";

const URGENCIES: TicketUrgency[] = ["low", "medium", "critical"];
const MAX_PHOTOS = 6;

interface RepairInput {
  unitId: string;
  title: string;
  description: string;
  urgency: TicketUrgency;
  workerId: string | null;
  estCostMinor: number | null;
  files: File[];
}

/** A picked file with a local preview that is released when it is removed or the form closes. */
function useFilePreviews(files: File[]) {
  const [previews, setPreviews] = React.useState<string[]>([]);
  React.useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);
  return previews;
}

/**
 * "Log repair": photos dropped into a marching-border zone with a preview grid (uploaded straight
 * to storage when the repair is saved), urgency as three large tiles, the worker picked by
 * avatar, and the estimated cost.
 */
export function LogRepairDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation("conciergerie");
  const [formKey, setFormKey] = React.useState(0);
  const close = () => {
    onClose();
    setFormKey((key) => key + 1);
  };
  return (
    <DetailDrawer
      open={open}
      onClose={close}
      title={t("maintenance.newTicket")}
      subtitle={t("maintenance.drawerSubtitle")}
      width="max-w-[560px]"
    >
      <RepairForm key={formKey} onDone={close} />
    </DetailDrawer>
  );
}

function RepairForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const properties = useProperties();
  const workers = useAllWorkers();
  const uploaded = React.useRef(new Map<File, string>());
  const create = usePanelMutation(async (input: RepairInput) => {
    // Each photo goes browser -> storage directly; a retry skips the ones already uploaded
    const photoFileIds: string[] = [];
    for (const file of input.files) {
      let fileId = uploaded.current.get(file);
      if (!fileId) {
        fileId = await filesService.upload(file, "ticket_photo");
        uploaded.current.set(file, fileId);
      }
      photoFileIds.push(fileId);
    }
    return ticketsService.create({
      unitId: input.unitId,
      title: input.title,
      description: input.description,
      urgency: input.urgency,
      workerId: input.workerId,
      estCostMinor: input.estCostMinor,
      ...(photoFileIds.length > 0 ? { photoFileIds } : {}),
    });
  });
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [title, setTitle] = React.useState("");
  const [propertyChoice, setPropertyChoice] = React.useState("");
  const [unitChoice, setUnitChoice] = React.useState("");
  const [urgency, setUrgency] = React.useState<TicketUrgency>("medium");
  const [workerId, setWorkerId] = React.useState<string | null>(null);
  const [cost, setCost] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [over, setOver] = React.useState(false);
  const [titleError, setTitleError] = React.useState(false);
  const [descriptionError, setDescriptionError] = React.useState(false);
  const [costError, setCostError] = React.useState(false);
  const previews = useFilePreviews(files);

  const activeProperties = (properties.data ?? []).filter(
    (property) => property.status === "active",
  );
  const propertyId =
    activeProperties.find((property) => property.id === propertyChoice)?.id ??
    activeProperties[0]?.id ??
    null;
  const detail = usePortfolioProperty(propertyId);
  const units = (detail.data?.units ?? []).filter((unit) => unit.archivedAt === null);
  const unitId = units.find((unit) => unit.id === unitChoice)?.id ?? units[0]?.id ?? "";

  function addFiles(list: FileList | File[]) {
    const picked = [...list].filter((file) => file.type.startsWith("image/"));
    setFiles((current) => [...current, ...picked].slice(0, MAX_PHOTOS));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const estCostMinor = cost.trim() === "" ? null : parseMoneyInput(cost, ACCOUNT_CURRENCY);
    const invalidCost = cost.trim() !== "" && (estCostMinor === null || estCostMinor < 0);
    setTitleError(!trimmedTitle);
    setDescriptionError(!trimmedDescription);
    setCostError(invalidCost);
    if (!trimmedTitle || !trimmedDescription || invalidCost || !unitId) return;
    const worker = workers.data?.find((item) => item.id === workerId);
    create.mutate(
      {
        unitId,
        title: trimmedTitle,
        description: trimmedDescription,
        urgency,
        workerId: worker?.id ?? null,
        estCostMinor,
        files,
      },
      {
        onSuccess: () => {
          toast.success(t("maintenance.ticketCreated"), {
            description: worker
              ? t("maintenance.ticketCreatedBody", { title: trimmedTitle, worker: worker.name })
              : trimmedTitle,
          });
          onDone();
        },
        onError: (error) => toast.error(t(maintenanceErrorKey(error))),
      },
    );
  }

  if (properties.isError) {
    return (
      <LoadFailed
        onRetry={() => {
          void properties.refetch();
          void workers.refetch();
        }}
      />
    );
  }
  if (properties.isPending) return <FormSkeleton />;
  if (activeProperties.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
        {t("maintenance.emptyUnitsLine")}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <DrawerField
        id="repair-title"
        label={t("maintenance.fieldTitle")}
        {...(titleError ? { error: t("maintenance.titleRequired") } : {})}
      >
        <Input
          id="repair-title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setTitleError(false);
          }}
          placeholder={t("maintenance.titlePlaceholder")}
          aria-invalid={titleError}
          className={drawerInputClassName}
        />
      </DrawerField>

      <div className="grid gap-4 sm:grid-cols-2">
        <DrawerField id="repair-property" label={t("maintenance.fieldPropertyOnly")}>
          <Select
            value={propertyId ?? ""}
            onValueChange={(value) => {
              setPropertyChoice(value);
              setUnitChoice("");
            }}
          >
            <SelectTrigger id="repair-property" className={drawerInputClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-[#141414]">
              {activeProperties.map((property) => (
                <SelectItem key={property.id} value={property.id} className="text-xs">
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DrawerField>

        <DrawerField
          id="repair-unit"
          label={t("maintenance.fieldUnit")}
          {...(detail.isError ? { error: t("common:states.errorBody") } : {})}
          {...(!detail.isError && !detail.isPending && units.length === 0
            ? { error: t("maintenance.noUnits") }
            : {})}
        >
          {detail.isPending ? (
            <Skeleton className="h-11 w-full" />
          ) : (
            <Select value={unitId} onValueChange={setUnitChoice} disabled={units.length === 0}>
              <SelectTrigger id="repair-unit" className={drawerInputClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-[#141414]">
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id} className="text-xs">
                    {unit.name} · {unit.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </DrawerField>
      </div>

      <div className="space-y-1.5">
        <p className="text-label-caps text-muted-foreground">{t("maintenance.fieldPhotos")}</p>
        <div
          role="button"
          tabIndex={0}
          data-over={over}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setOver(false);
            addFiles(event.dataTransfer.files);
          }}
          className={cn(
            "dash-march flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-6 text-center transition-colors",
            over ? "bg-primary/10" : "bg-[#121212] hover:bg-primary/[0.04]",
          )}
        >
          {create.isPending ? (
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
          ) : (
            <ImagePlus className="size-6 text-primary" aria-hidden="true" />
          )}
          <p className="text-sm text-foreground">{t("maintenance.dropPhotos")}</p>
          <p className="text-[0.7rem] text-muted-foreground">
            {t("maintenance.dropPhotosHint", { count: MAX_PHOTOS })}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        {files.length > 0 && (
          <ul className="grid grid-cols-3 gap-2 pt-1">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.lastModified}-${index}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border/70"
              >
                {previews[index] && (
                  <img
                    src={previews[index]}
                    alt={t("forms.imagePreview")}
                    className="size-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setFiles((current) => current.filter((_, item) => item !== index))}
                  aria-label={t("forms.removeImage")}
                  className="absolute end-1 top-1 grid size-6 place-items-center rounded-full bg-black/70 text-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-1.5" role="radiogroup" aria-label={t("maintenance.fieldUrgency")}>
        <p className="text-label-caps text-muted-foreground">{t("maintenance.fieldUrgency")}</p>
        <div className="grid grid-cols-3 gap-2">
          {URGENCIES.map((value) => {
            const meta = URGENCY_META[value];
            const selected = urgency === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setUrgency(value)}
                className={cn(
                  "group flex flex-col items-center gap-2 rounded-xl border px-2 py-4 text-sm transition-all",
                  selected
                    ? cn(meta.tile, "shadow-[0_8px_24px_rgba(0,0,0,0.4)]")
                    : "border-border/60 bg-[#121212] text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                <meta.icon
                  className={cn("size-6", value === "critical" ? "icon-wiggle" : "icon-nudge")}
                  aria-hidden="true"
                />
                {t(`common:urgency.${value}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5" role="radiogroup" aria-label={t("maintenance.fieldWorker")}>
        <p className="text-label-caps text-muted-foreground">{t("maintenance.fieldWorker")}</p>
        {workers.isError ? (
          <div
            role="alert"
            className="flex items-center justify-between gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs"
          >
            <span>{t("common:states.errorBody")}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void workers.refetch()}
            >
              {t("common:states.retry")}
            </Button>
          </div>
        ) : workers.isPending ? (
          <Skeleton className="h-14 w-full rounded-xl" />
        ) : (
          <div className="max-h-48 space-y-1.5 overflow-y-auto pe-1">
            {workers.data.map((worker) => (
              <button
                key={worker.id}
                type="button"
                role="radio"
                aria-checked={workerId === worker.id}
                onClick={() => setWorkerId(worker.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-2 text-start transition-colors",
                  workerId === worker.id
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/60 bg-[#121212] hover:border-primary/30",
                )}
              >
                <InitialsAvatar name={worker.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{worker.name}</span>
                  <span className="block truncate text-[0.7rem] text-muted-foreground">
                    {worker.role}
                  </span>
                </span>
              </button>
            ))}
            <button
              type="button"
              role="radio"
              aria-checked={workerId === null}
              onClick={() => setWorkerId(null)}
              className={cn(
                "w-full rounded-xl border border-dashed px-3 py-2 text-start text-xs transition-colors",
                workerId === null
                  ? "border-primary/60 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {t("maintenance.assignLater")}
            </button>
          </div>
        )}
      </div>

      <DrawerField
        id="repair-cost"
        label={t("maintenance.estCost")}
        {...(costError ? { error: t("maintenance.invalidAmount") } : {})}
      >
        <div className="relative" dir="ltr">
          <Input
            id="repair-cost"
            inputMode="decimal"
            value={cost}
            onChange={(event) => {
              setCost(event.target.value);
              setCostError(false);
            }}
            aria-invalid={costError}
            className={cn(drawerInputClassName, "pe-14 tabular-nums")}
          />
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {ACCOUNT_CURRENCY}
          </span>
        </div>
      </DrawerField>

      <DrawerField
        id="repair-description"
        label={t("maintenance.fieldDescription")}
        {...(descriptionError ? { error: t("maintenance.descriptionRequired") } : {})}
      >
        <Textarea
          id="repair-description"
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            setDescriptionError(false);
          }}
          placeholder={t("maintenance.descriptionPlaceholder")}
          aria-invalid={descriptionError}
          rows={3}
          className="border-border/80 bg-[#121212] text-sm"
        />
      </DrawerField>

      <ReadOnlyGuard className="flex w-full">
        <Button
          type="submit"
          disabled={create.isPending || detail.isPending || units.length === 0}
          className="h-11 w-full"
        >
          {create.isPending
            ? files.length > 0
              ? t("maintenance.uploading")
              : t("forms.saving")
            : t("maintenance.logRepair")}
        </Button>
      </ReadOnlyGuard>
    </form>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true">
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

function LoadFailed({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("common");
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-10 text-center"
    >
      <p className="text-sm text-muted-foreground">{t("states.errorBody")}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t("states.retry")}
      </Button>
    </div>
  );
}
