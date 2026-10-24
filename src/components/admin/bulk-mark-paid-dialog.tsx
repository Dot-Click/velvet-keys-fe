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

const FIELD_LABEL = "text-label-caps text-muted-foreground";
const FIELD_ERROR = "text-xs text-[#FF85A1]";

/**
 * Records the same bank transfer date and reference against several invoices at once. The
 * real backend only marks one invoice paid at a time (`POST .../mark-paid`), so this sends that
 * request once per selected invoice and reports how many succeeded.
 */
export function BulkMarkPaidDialog({
  invoices,
  open,
  onOpenChange,
  onDone,
}: {
  invoices: AdminInvoiceListItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const { t } = useTranslation("admin-invoices");
  const { t: ta } = useTranslation("admin");
  const markPaid = useMarkInvoicePaid();
  const [paidOn, setPaidOn] = React.useState(() => toISODate(today()));
  const [reference, setReference] = React.useState("");
  const [attempted, setAttempted] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPaidOn(toISODate(today()));
      setReference("");
      setAttempted(false);
    }
  }, [open]);

  const referenceValid = reference.trim().length >= MIN_PAYMENT_REFERENCE_LENGTH;
  const total = invoices.reduce((sum, invoice) => sum + invoice.totalMinor, 0);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (!referenceValid || invoices.length === 0) return;

    setSaving(true);
    let results: PromiseSettledResult<unknown>[];
    try {
      results = await Promise.allSettled(
        invoices.map((invoice) =>
          markPaid.mutateAsync({
            invoiceId: invoice.id,
            paidReference: reference.trim(),
            paidAt: paidOn,
          }),
        ),
      );
    } finally {
      setSaving(false);
    }

    const done = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.length - done;
    if (failed === 0) {
      toast.success(t("bulk.done", { count: done }));
      onDone();
      onOpenChange(false);
    } else if (done > 0) {
      toast.error(t("bulk.partial", { done, failed }));
      onDone();
    } else {
      toast.error(t("bulk.failed"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-xl border-border/80 bg-[#141414] text-[13px]">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <DialogHeader className="space-y-2 text-start">
            <DialogTitle className="font-display text-lg uppercase tracking-[0.08em]">
              {t("bulk.title")}
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              {t("bulk.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-border/80 bg-[#111111] p-2.5">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              <span>{t("bulk.invoice")}</span>
              <span>{t("bulk.client")}</span>
              <span className="text-end">{t("bulk.amount")}</span>
            </div>
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="grid grid-cols-[1fr_1fr_auto] gap-2 rounded px-1 py-1 text-xs"
              >
                <span className="truncate font-medium text-foreground">{invoice.number}</span>
                <span className="truncate text-muted-foreground">{invoice.accountName}</span>
                <span className="text-end tabular-nums">
                  {formatMoney(invoice.totalMinor, ACCOUNT_CURRENCY)}
                </span>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 border-t border-border/60 px-1 pt-1.5 text-xs font-semibold">
              <span className="col-span-2">{t("bulk.total")}</span>
              <span className="text-end tabular-nums text-primary">
                {formatMoney(total, ACCOUNT_CURRENCY)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bulk-paid-on" className={FIELD_LABEL}>
              {t("bulk.paidOn")}
            </label>
            <CustomDatePicker
              id="bulk-paid-on"
              value={paidOn}
              maxDate={toISODate(today())}
              onChange={(date) => setPaidOn(date ? toISODate(date) : "")}
              className="h-9 border-border/80 bg-[#111111] text-[13px]"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bulk-reference" className={FIELD_LABEL}>
              {t("bulk.reference")}
            </label>
            <Input
              id="bulk-reference"
              value={reference}
              maxLength={MAX_PAYMENT_REFERENCE_LENGTH}
              onChange={(event) => setReference(event.target.value)}
              placeholder={t("bulk.referencePlaceholder")}
              aria-invalid={attempted && !referenceValid}
              autoComplete="off"
              dir="auto"
              className="h-9 border-border/80 bg-[#111111] text-[13px] aria-[invalid=true]:border-destructive"
            />
            {attempted && !referenceValid && (
              <p className={FIELD_ERROR}>
                {t("bulk.referenceError", { count: MIN_PAYMENT_REFERENCE_LENGTH })}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              {ta("actions.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving || invoices.length === 0}
              className="bg-primary font-semibold text-primary-foreground"
            >
              {saving ? t("bulk.saving") : t("bulk.confirm", { count: invoices.length })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
