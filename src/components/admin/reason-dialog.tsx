import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MIN_REASON_LENGTH } from "@/lib/admin";
import { cn } from "@/lib/utils";

/** Required reason for an Admin decision, kept in the audit trail. */
export function ReasonField({
  id,
  value,
  onChange,
  showError,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  showError: boolean;
}) {
  const { t } = useTranslation("admin");
  const tooShort = value.trim().length < MIN_REASON_LENGTH;
  const invalid = showError && tooShort;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-label-caps text-muted-foreground">
        {t("reason.label")}
      </label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        dir="auto"
        placeholder={t("reason.placeholder")}
        aria-invalid={invalid}
        aria-describedby={`${id}-hint`}
        className="resize-none border-border/80 bg-[#111111] text-[13px] aria-[invalid=true]:border-destructive"
      />
      <p
        id={`${id}-hint`}
        className={cn("text-xs", invalid ? "text-[#FF85A1]" : "text-muted-foreground")}
      >
        {invalid
          ? t("reason.tooShort", { count: MIN_REASON_LENGTH })
          : t("reason.hint", { count: MIN_REASON_LENGTH })}
      </p>
    </div>
  );
}

/** Confirmation for a moderation decision, which cannot go through without a reason. */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  /** Danger for bans and delisting; restore for unbans and relisting */
  tone: "danger" | "restore";
  pending: boolean;
  onConfirm: (reason: string) => void;
}) {
  const { t } = useTranslation("admin");
  const [reason, setReason] = React.useState("");
  const [attempted, setAttempted] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setAttempted(false);
    }
  }, [open]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (reason.trim().length < MIN_REASON_LENGTH) return;
    onConfirm(reason.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-xl border-border/80 bg-[#141414] text-[13px]">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <DialogHeader className="space-y-2 text-start">
            <DialogTitle className="flex items-center gap-2 font-display text-lg uppercase tracking-[0.08em]">
              {tone === "danger" && (
                <AlertTriangle className="size-4 text-[#FF85A1]" aria-hidden="true" />
              )}
              {title}
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              {description}
            </DialogDescription>
          </DialogHeader>
          <ReasonField
            id="admin-reason"
            value={reason}
            onChange={setReason}
            showError={attempted}
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={pending}
              className={cn(
                "font-semibold",
                tone === "danger"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {pending ? t("actions.saving") : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
