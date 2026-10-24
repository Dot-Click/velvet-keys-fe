import { Pencil, Plus } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { DrawerField, drawerInputClassName } from "@/components/conciergerie/drawer-field";
import { DetailDrawer } from "@/components/detail-drawer";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePanelMutation } from "@/hooks/use-portfolio-data";
import { workersService } from "@/services/ops-service";
import type { Worker } from "@/types/ops";
import { maintenanceErrorKey } from "./maintenance-errors";
import { useAllWorkers } from "./use-all-workers";

/** Everyone who can be assigned to a repair: list, add and edit (writes need operations). */
export function WorkersDrawer({
  open,
  canWrite,
  onClose,
}: {
  open: boolean;
  canWrite: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={t("maintenance.workers.title")}
      subtitle={t("maintenance.workers.subtitle")}
      width="max-w-[480px]"
    >
      <WorkersBody canWrite={canWrite} />
    </DetailDrawer>
  );
}

type Editing = { kind: "new" } | { kind: "edit"; worker: Worker } | null;

function WorkersBody({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const workers = useAllWorkers();
  const [editing, setEditing] = React.useState<Editing>(null);

  if (workers.isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-10 text-center"
      >
        <p className="text-sm text-muted-foreground">{t("common:states.errorBody")}</p>
        <Button variant="outline" size="sm" onClick={() => void workers.refetch()}>
          {t("common:states.retry")}
        </Button>
      </div>
    );
  }
  if (workers.isPending) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canWrite && !editing && (
        <ReadOnlyGuard>
          <Button size="sm" onClick={() => setEditing({ kind: "new" })} className="h-9">
            <Plus className="size-4" aria-hidden="true" />
            {t("maintenance.workers.add")}
          </Button>
        </ReadOnlyGuard>
      )}
      {editing && (
        <WorkerForm
          key={editing.kind === "edit" ? editing.worker.id : "new"}
          worker={editing.kind === "edit" ? editing.worker : null}
          onDone={() => setEditing(null)}
        />
      )}
      {workers.data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
          {t("maintenance.workers.empty")}
        </p>
      ) : (
        <ul className="space-y-2">
          {workers.data.map((worker) => (
            <li
              key={worker.id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-[#121212] p-3"
            >
              <InitialsAvatar name={worker.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">{worker.name}</span>
                <span className="block truncate text-[0.7rem] text-muted-foreground">
                  {worker.role}
                  {worker.phone ? (
                    <>
                      {" · "}
                      <span dir="ltr">{worker.phone}</span>
                    </>
                  ) : null}
                </span>
              </span>
              {canWrite && (
                <ReadOnlyGuard>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing({ kind: "edit", worker })}
                    aria-label={t("maintenance.workers.edit", { name: worker.name })}
                    className="size-8"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                </ReadOnlyGuard>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WorkerForm({ worker, onDone }: { worker: Worker | null; onDone: () => void }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const [name, setName] = React.useState(worker?.name ?? "");
  const [role, setRole] = React.useState(worker?.role ?? "");
  const [phone, setPhone] = React.useState(worker?.phone ?? "");
  const [nameError, setNameError] = React.useState(false);
  const [roleError, setRoleError] = React.useState(false);
  const save = usePanelMutation((input: { name: string; role: string; phone: string | null }) =>
    worker ? workersService.update(worker.id, input) : workersService.create(input),
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedRole = role.trim();
    setNameError(!trimmedName);
    setRoleError(!trimmedRole);
    if (!trimmedName || !trimmedRole) return;
    save.mutate(
      { name: trimmedName, role: trimmedRole, phone: phone.trim() || null },
      {
        onSuccess: () => {
          toast.success(t(worker ? "maintenance.workers.saved" : "maintenance.workers.created"));
          onDone();
        },
        onError: (error) => toast.error(t(maintenanceErrorKey(error))),
      },
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="space-y-4 rounded-xl border border-primary/30 bg-[#141414] p-4"
    >
      <DrawerField
        id="worker-name"
        label={t("maintenance.workers.name")}
        {...(nameError ? { error: t("maintenance.workers.nameRequired") } : {})}
      >
        <Input
          id="worker-name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setNameError(false);
          }}
          aria-invalid={nameError}
          className={drawerInputClassName}
        />
      </DrawerField>
      <DrawerField
        id="worker-role"
        label={t("maintenance.workers.role")}
        {...(roleError ? { error: t("maintenance.workers.roleRequired") } : {})}
      >
        <Input
          id="worker-role"
          value={role}
          onChange={(event) => {
            setRole(event.target.value);
            setRoleError(false);
          }}
          placeholder={t("maintenance.workers.rolePlaceholder")}
          aria-invalid={roleError}
          className={drawerInputClassName}
        />
      </DrawerField>
      <DrawerField id="worker-phone" label={t("maintenance.workers.phone")}>
        <Input
          id="worker-phone"
          type="tel"
          dir="ltr"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={drawerInputClassName}
        />
      </DrawerField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          {t("maintenance.cancel")}
        </Button>
        <ReadOnlyGuard>
          <Button type="submit" size="sm" disabled={save.isPending}>
            {save.isPending ? t("forms.saving") : t("maintenance.workers.save")}
          </Button>
        </ReadOnlyGuard>
      </div>
    </form>
  );
}
