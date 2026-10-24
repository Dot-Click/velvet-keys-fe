import * as React from "react";
import { useTranslation } from "react-i18next";
import { DrawerField, drawerInputClassName } from "@/components/conciergerie/drawer-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { parseMoneyInput } from "@/lib/money";
import type { Ticket } from "@/types/ops";

/** Marking a repair resolved: the final cost is optional and, once given, is booked as an expense. */
export function ResolveDialog({
  ticket,
  onCancel,
  onConfirm,
}: {
  ticket: Ticket | null;
  onCancel: () => void;
  onConfirm: (ticket: Ticket, actualCostMinor: number | null) => void;
}) {
  const { t } = useTranslation("conciergerie");
  const [cost, setCost] = React.useState("");
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    setCost("");
    setError(false);
  }, [ticket?.id]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ticket) return;
    if (cost.trim() === "") {
      onConfirm(ticket, null);
      return;
    }
    const minor = parseMoneyInput(cost, ticket.currency);
    if (minor === null || minor < 0) {
      setError(true);
      return;
    }
    onConfirm(ticket, minor);
  }

  return (
    <Dialog open={Boolean(ticket)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md border-border bg-[#0F0F0F]">
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogTitle>{t("maintenance.resolveTitle")}</DialogTitle>
          <DialogDescription>{ticket?.title}</DialogDescription>
          <DrawerField
            id="resolve-cost"
            label={`${t("maintenance.actualCostLabel")} (${ticket?.currency ?? ""})`}
            hint={t("maintenance.resolveHint")}
            {...(error ? { error: t("maintenance.invalidAmount") } : {})}
          >
            <Input
              id="resolve-cost"
              dir="ltr"
              inputMode="decimal"
              value={cost}
              onChange={(event) => {
                setCost(event.target.value);
                setError(false);
              }}
              aria-invalid={error}
              className={drawerInputClassName}
            />
          </DrawerField>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              {t("maintenance.cancel")}
            </Button>
            <Button type="submit" size="sm">
              {t("maintenance.markResolved")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
