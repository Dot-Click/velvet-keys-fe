import * as React from "react";
import { Loader2, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePanelMutation } from "@/hooks/use-portfolio-data";
import { rentInvoicesService } from "@/services/ltr-service";
import type { RentInvoice } from "@/types/ltr";

/** "Share via Email" for a rent invoice: confirm/edit the recipient, then send. */
export function RentInvoiceShareEmailDialog({
  invoice,
  onClose,
}: {
  invoice: RentInvoice | null;
  onClose: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const [email, setEmail] = React.useState("");

  React.useEffect(() => {
    if (invoice) setEmail(invoice.tenantEmail);
  }, [invoice]);

  const share = usePanelMutation((input: { id: string; email: string }) =>
    rentInvoicesService.shareEmail(input.id, input.email),
  );

  const handleSend = () => {
    if (!invoice) return;
    share.mutate(
      { id: invoice.id, email },
      {
        onSuccess: (result) => {
          toast.success(
            t(result.attachedPdf ? "rentInvoices.shareEmailSentWithPdf" : "rentInvoices.shareEmailSent", {
              number: invoice.number,
              email: result.to,
            }),
          );
          onClose();
        },
        onError: () => toast.error(t("common:states.errorBody")),
      },
    );
  };

  return (
    <Dialog open={Boolean(invoice)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl border-primary/30 bg-[#141414]">
        <DialogHeader>
          <DialogTitle className="font-display text-lg uppercase tracking-[0.1em] text-foreground">
            {t("rentInvoices.shareEmailDialogTitle", { number: invoice?.number ?? "" })}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("rentInvoices.shareEmailDialogBody")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="share-email-address" className="text-xs text-muted-foreground">
            {t("rentInvoices.shareEmailAddress")}
          </Label>
          <Input
            id="share-email-address"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10 border-border/80 bg-[#161616] text-sm"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            {t("common:actions.cancel")}
          </Button>
          <Button
            size="sm"
            disabled={!email.trim() || share.isPending}
            onClick={handleSend}
            className="btn-shimmer bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground"
          >
            {share.isPending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Mail className="size-3.5" aria-hidden="true" />
            )}
            {t("rentInvoices.shareEmailSend")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
