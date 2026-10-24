import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  ImagePlus,
  Loader2,
  PlusCircle,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { DetailDrawer } from "@/components/detail-drawer";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePanelMutation, useTicketDetail } from "@/hooks/use-portfolio-data";
import { formatDate, formatRelativeTime } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { filesService, ticketsService } from "@/services/ops-service";
import type { Ticket, TicketDetail, TicketEvent, TicketStatus } from "@/types/ops";
import { maintenanceErrorKey } from "./maintenance-errors";
import { useAllWorkers } from "./use-all-workers";
import { TicketPhotoImage, UrgencyPill } from "./ticket-parts";

const NEXT: Partial<Record<TicketStatus, TicketStatus>> = {
  reported: "assigned",
  assigned: "in_progress",
  in_progress: "resolved",
};
const UNASSIGNED = "none";
const STATUSES: readonly string[] = ["reported", "assigned", "in_progress", "resolved"];

/** Ticket details: photo gallery with a lightbox, the activity so far, cost and the next step. */
export function TicketDrawer({
  ticket,
  canWrite,
  onClose,
  onMove,
}: {
  /** The ticket as the board or list shows it; the drawer loads the rest */
  ticket: Ticket | null;
  canWrite: boolean;
  onClose: () => void;
  onMove: (ticket: Ticket, status: TicketStatus) => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const detail = useTicketDetail(ticket?.id ?? null);
  // The board is the source of truth for status (it updates optimistically)
  const current: Ticket | null = ticket
    ? { ...(detail.data ?? ticket), status: ticket.status, workerName: ticket.workerName }
    : null;
  const next = current ? NEXT[current.status] : undefined;

  return (
    <DetailDrawer
      open={Boolean(ticket)}
      onClose={onClose}
      title={current?.title ?? ""}
      subtitle={current ? `${current.propertyName} · ${current.unitName}` : ""}
      badge={current && <UrgencyPill urgency={current.urgency} />}
      width="max-w-[560px]"
      footer={
        current &&
        canWrite && (
          <div className="flex justify-end gap-2">
            {current.status === "resolved" && (
              <ReadOnlyGuard>
                <Button
                  variant="outlineGold"
                  size="sm"
                  onClick={() => onMove(current, "in_progress")}
                  className="h-9"
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  {t("maintenance.reopen")}
                </Button>
              </ReadOnlyGuard>
            )}
            {next && next !== "resolved" && (
              <ReadOnlyGuard>
                <Button
                  variant="outlineGold"
                  size="sm"
                  onClick={() => onMove(current, next)}
                  className="h-9"
                >
                  {t("maintenance.moveTo", { status: t(`maintenance.status.${next}`) })}
                </Button>
              </ReadOnlyGuard>
            )}
            {next && (
              <ReadOnlyGuard>
                <Button size="sm" onClick={() => onMove(current, "resolved")} className="h-9">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  {t("maintenance.markResolved")}
                </Button>
              </ReadOnlyGuard>
            )}
          </div>
        )
      }
    >
      {current && detail.isError && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-10 text-center"
        >
          <p className="text-sm text-muted-foreground">{t(maintenanceErrorKey(detail.error))}</p>
          <Button variant="outline" size="sm" onClick={() => void detail.refetch()}>
            {t("common:states.retry")}
          </Button>
        </div>
      )}
      {current && !detail.isError && !detail.data && (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      )}
      {current && detail.data && (
        <TicketBody ticket={current} detail={detail.data} canWrite={canWrite} />
      )}
    </DetailDrawer>
  );
}

function TicketBody({
  ticket,
  detail,
  canWrite,
}: {
  ticket: Ticket;
  detail: TicketDetail;
  canWrite: boolean;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const [lightbox, setLightbox] = React.useState<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const workers = useAllWorkers();
  const assign = usePanelMutation((workerId: string | null) =>
    ticketsService.update(ticket.id, {
      workerId,
      ...(workerId && ticket.status === "reported" ? { status: "assigned" as const } : {}),
    }),
  );
  const addPhotos = usePanelMutation(async (files: File[]) => {
    const fileIds: string[] = [];
    for (const file of files) fileIds.push(await filesService.upload(file, "ticket_photo"));
    return ticketsService.addPhotos(ticket.id, fileIds);
  });
  const worker = workers.data?.find((item) => item.id === ticket.workerId);
  const shownCost = ticket.actualCostMinor ?? ticket.estCostMinor;

  const onAssign = (value: string) =>
    assign.mutate(value === UNASSIGNED ? null : value, {
      onSuccess: () => toast.success(t("maintenance.workerUpdated")),
      onError: (error) => toast.error(t(maintenanceErrorKey(error))),
    });
  const onPhotos = (list: FileList) => {
    const files = [...list].filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) return;
    addPhotos.mutate(files, {
      onSuccess: () => toast.success(t("maintenance.photosAdded")),
      onError: (error) => toast.error(t(maintenanceErrorKey(error))),
    });
  };

  return (
    <div className="space-y-5">
      {detail.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {detail.photos.map((photo, index) => (
            <button
              key={photo.fileId}
              type="button"
              onClick={() => setLightbox(index)}
              aria-label={t("maintenance.openPhoto", { number: index + 1 })}
              className={cn(
                "group overflow-hidden rounded-lg border border-border/60",
                index === 0 ? "col-span-3 h-44" : "h-24",
              )}
            >
              <TicketPhotoImage
                photo={photo}
                alt={t("maintenance.photoOf", { number: index + 1, count: detail.photos.length })}
                className="hover-zoom size-full"
              />
            </button>
          ))}
        </div>
      )}
      {canWrite && (
        <>
          <ReadOnlyGuard>
            <Button
              variant="outlineGold"
              size="sm"
              disabled={addPhotos.isPending}
              onClick={() => inputRef.current?.click()}
              className="h-9"
            >
              {addPhotos.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="size-4" aria-hidden="true" />
              )}
              {addPhotos.isPending ? t("maintenance.uploading") : t("maintenance.addPhotos")}
            </Button>
          </ReadOnlyGuard>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) onPhotos(event.target.files);
              event.target.value = "";
            }}
          />
        </>
      )}

      <p className="whitespace-pre-line rounded-xl border border-border/70 bg-[#161616] p-4 text-sm leading-relaxed text-foreground">
        {ticket.description}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/70 bg-[#161616] p-4">
          <p className="text-[0.7rem] text-muted-foreground">{t("maintenance.fieldWorker")}</p>
          {canWrite ? (
            <div className="mt-1.5">
              <Select
                value={ticket.workerId ?? UNASSIGNED}
                onValueChange={onAssign}
                disabled={assign.isPending || workers.isPending || workers.isError}
              >
                <SelectTrigger aria-label={t("maintenance.assignWorker")} className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-[#141414]">
                  <SelectItem value={UNASSIGNED} className="text-xs">
                    {t("maintenance.unassigned")}
                  </SelectItem>
                  {(workers.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={item.id} className="text-xs">
                      {item.name} · {item.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {workers.isError && (
                <p role="alert" className="mt-1 text-[0.7rem] text-destructive-foreground">
                  {t("common:states.errorBody")}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-1.5 flex items-center gap-2 text-sm text-foreground">
              {ticket.workerName ? (
                <>
                  <InitialsAvatar name={ticket.workerName} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate">{ticket.workerName}</span>
                    {worker && (
                      <span className="block truncate text-[0.7rem] text-muted-foreground">
                        {worker.role}
                      </span>
                    )}
                  </span>
                </>
              ) : (
                t("maintenance.unassigned")
              )}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border/70 bg-[#161616] p-4">
          <p className="text-[0.7rem] text-muted-foreground">
            {ticket.actualCostMinor !== null
              ? t("maintenance.actualCostLabel")
              : t("maintenance.estCost")}
          </p>
          <p dir="ltr" className="figure-serif mt-1 text-2xl text-primary rtl:text-right">
            {shownCost === null ? "—" : formatMoney(shownCost, ticket.currency)}
          </p>
          {ticket.actualCostMinor !== null && ticket.estCostMinor !== null && (
            <p dir="ltr" className="mt-1 text-[0.7rem] text-muted-foreground rtl:text-right">
              {t("maintenance.estCost")}: {formatMoney(ticket.estCostMinor, ticket.currency)}
            </p>
          )}
        </div>
      </div>

      <section aria-label={t("maintenance.activity")} className="space-y-3">
        <h4 className="text-label-caps text-muted-foreground">{t("maintenance.activity")}</h4>
        <ActivityTimeline events={detail.activity} />
      </section>

      <Lightbox detail={detail} title={ticket.title} index={lightbox} onChange={setLightbox} />
    </div>
  );
}

function eventLabel(event: TicketEvent, t: ReturnType<typeof useTranslation>["t"]) {
  if (event.type === "status_changed") {
    const target = event.note?.split("->").pop()?.trim() ?? "";
    return STATUSES.includes(target)
      ? t("maintenance.eventStatusChanged", { status: t(`maintenance.status.${target}`) })
      : t("maintenance.eventUpdated");
  }
  if (event.type === "created") return t("maintenance.activityReported");
  if (event.type === "photos_added") return t("maintenance.eventPhotosAdded");
  return t("maintenance.eventUpdated");
}

function ActivityTimeline({ events }: { events: TicketEvent[] }) {
  const { t } = useTranslation("conciergerie");
  if (events.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("maintenance.noActivity")}</p>;
  }
  const icons: Record<string, typeof Flag> = {
    created: Flag,
    status_changed: UserCheck,
    photos_added: PlusCircle,
  };
  return (
    <ol className="relative space-y-4 ps-8">
      <span aria-hidden="true" className="absolute inset-y-2 start-3 w-px bg-border" />
      {events.map((event, index) => {
        const Icon = icons[event.type] ?? Flag;
        const latest = index === events.length - 1;
        return (
          <li key={`${event.at}-${index}`} className="relative">
            <span
              className={cn(
                "absolute -start-8 top-0 grid size-6 place-items-center rounded-full border bg-[#141414]",
                latest ? "border-primary text-primary" : "border-[#A2E8DD]/60 text-[#A2E8DD]",
              )}
            >
              <Icon className="size-3" aria-hidden="true" />
            </span>
            <p className="text-sm text-foreground">{eventLabel(event, t)}</p>
            <p className="text-[0.7rem] text-muted-foreground" dir="auto">
              {formatDate(event.at)} · {formatRelativeTime(event.at)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function Lightbox({
  detail,
  title,
  index,
  onChange,
}: {
  detail: TicketDetail;
  title: string;
  index: number | null;
  onChange: (index: number | null) => void;
}) {
  const { t } = useTranslation("conciergerie");
  const count = detail.photos.length;
  const photo = index === null ? undefined : detail.photos[index];
  const step = (delta: number) => index !== null && onChange((index + delta + count) % count);
  return (
    <Dialog open={index !== null} onOpenChange={(open) => !open && onChange(null)}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-4xl border-border bg-[#0B0B0B] p-3 sm:rounded-2xl"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          {t("maintenance.photoOf", { number: (index ?? 0) + 1, count })}
        </DialogDescription>
        {index !== null && photo && (
          <div className="relative">
            <TicketPhotoImage
              photo={photo}
              alt={t("maintenance.photoOf", { number: index + 1, count })}
              className="aspect-[16/10] w-full rounded-xl"
            />
            {count > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => step(-1)}
                  aria-label={t("maintenance.previousPhoto")}
                  className="absolute start-2 top-1/2 size-10 -translate-y-1/2 rounded-full bg-black/60"
                >
                  <ChevronLeft className="size-5 rtl-flip" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => step(1)}
                  aria-label={t("maintenance.nextPhoto")}
                  className="absolute end-2 top-1/2 size-10 -translate-y-1/2 rounded-full bg-black/60"
                >
                  <ChevronRight className="size-5 rtl-flip" />
                </Button>
              </>
            )}
            <p className="absolute bottom-2 start-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs tabular-nums text-foreground">
              {index + 1} / {count}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
