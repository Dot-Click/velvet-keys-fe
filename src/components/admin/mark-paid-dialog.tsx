import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMarkInvoicePaid } from "@/hooks/use-admin-data";
import { MAX_PAYMENT_REFERENCE_LENGTH, MIN_PAYMENT_REFERENCE_LENGTH } from "@/lib/admin";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { today } from "@/lib/clock";
import { formatMoney } from "@/lib/money";
import { toISODate } from "@/lib/dates";
import type { AdminInvoiceListItem } from "@/types/platform-admin";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";

const FIELD_LABEL = "text-label-caps text-muted-foreground";
const FIELD_ERROR = "text-xs text-[#FF85A1]";

/**
 * Records a bank transfer against an invoice: the bank reference and when it arrived.
 *
 * Note: the mock version also took a free-text note and showed whether paying this invoice
 * restored the client's team from read-only to active. `MarkInvoicePaidRequest` only accepts
 * `paidReference` and an optional `paidAt`, and `AdminInvoiceListItem` carries no account-status
 * information, so both are dropped here.
 */
export function MarkPaidDialog({
  invoice,
  onOpenChange,
}: {
  invoice: AdminInvoiceListItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("admin");
  const markPaid = useMarkInvoicePaid();
  const [paidOn, setPaidOn] = React.useState(() => toISODate(today()));
  const [reference, setReference] = React.useState("");
  const [attempted, setAttempted] = React.useState(false);
  const invoiceId = invoice?.id;

  React.useEffect(() => {
    if (invoiceId) {
      setPaidOn(toISODate(today()));
      setReference("");
      setAttempted(false);
    }
  }, [invoiceId]);

  if (!invoice) return <Dialog open={false} />;
  const referenceValid = reference.trim().length >= MIN_PAYMENT_REFERENCE_LENGTH;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (!referenceValid || !invoice) return;
    markPaid.mutate(
      { invoiceId: invoice.id, paidReference: reference.trim(), paidAt: paidOn },
      {
        onSuccess: () => {
          toast.success(t("markPaid.done", { number: invoice.number, client: "" }));
          onOpenChange(false);
        },
        onError: () => toast.error(t("errors.saveFailed")),
      },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-xl border-border/80 bg-[#141414] text-[13px]">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <DialogHeader className="space-y-2 text-start">
            <DialogTitle className="font-display text-lg uppercase tracking-[0.08em]">
              {t("markPaid.title")}
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              {t("markPaid.description", { number: invoice.number })}
            </DialogDescription>
          </DialogHeader>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg border border-border/80 bg-[#111111] px-3.5 py-3">
            <dt className="text-xs text-muted-foreground">{t("markPaid.invoice")}</dt>
            <dd className="tabular-nums text-xs">{invoice.number}</dd>
            <dt className="text-xs text-muted-foreground">{t("markPaid.amount")}</dt>
            <dd className="tabular-nums font-semibold text-primary">
              {formatMoney(invoice.totalMinor, ACCOUNT_CURRENCY)}
            </dd>
          </dl>

          <div className="space-y-1.5">
            <label htmlFor="paid-on" className={FIELD_LABEL}>
              {t("markPaid.paidOn")}
            </label>
            <CustomDatePicker
              id="paid-on"
              value={paidOn}
              maxDate={toISODate(today())}
              onChange={(date) => setPaidOn(date ? toISODate(date) : "")}
              className="h-9 border-border/80 bg-[#111111] text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="paid-reference" className={FIELD_LABEL}>
              {t("markPaid.reference")}
            </label>
            <Input
              id="paid-reference"
              value={reference}
              maxLength={MAX_PAYMENT_REFERENCE_LENGTH}
              onChange={(event) => setReference(event.target.value)}
              placeholder={t("markPaid.referencePlaceholder")}
              aria-invalid={attempted && !referenceValid}
              autoComplete="off"
              dir="auto"
              className="h-9 border-border/80 bg-[#111111] text-[13px] aria-[invalid=true]:border-destructive"
            />
            {attempted && !referenceValid && (
              <p className={FIELD_ERROR}>
                {t("markPaid.referenceError", { count: MIN_PAYMENT_REFERENCE_LENGTH })}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={markPaid.isPending}
              onClick={() => onOpenChange(false)}
            >
              {t("actions.cancel")}
            </Button>
            <ReadOnlyGuard>
              <Button
                type="submit"
                size="sm"
                disabled={markPaid.isPending}
                className="bg-primary font-semibold text-primary-foreground"
              >
                {markPaid.isPending ? t("actions.saving") : t("markPaid.confirm")}
              </Button>
            </ReadOnlyGuard>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
