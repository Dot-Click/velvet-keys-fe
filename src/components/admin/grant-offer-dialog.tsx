import { addDays, addMonths } from "date-fns";
import { Gift, Minus, Plus } from "lucide-react";
import * as React from "react";
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
import { useGrantManualOffer } from "@/hooks/use-admin-data";
import { MAX_GRANT_MONTHS, MIN_REASON_LENGTH } from "@/lib/admin";
import { today } from "@/lib/clock";
import { formatDate } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import type { BillingProduct } from "@/types/subscription";
import type { ClientSummary } from "@/types/platform-admin";
import { ReasonField } from "./reason-dialog";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";

const PRODUCTS: BillingProduct[] = ["str", "ltr", "sync"];
const NO_MONTHS: Record<BillingProduct, number> = { str: 0, ltr: 0, sync: 0 };

/**
 * Grants extra free months per product. Months run from today, or from the end of a free period
 * still running, and the required reason goes into the audit trail.
 */
export function GrantOfferDialog({
  client,
  open,
  onOpenChange,
}: {
  client: ClientSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("admin");
  const grant = useGrantManualOffer();
  const [months, setMonths] = React.useState(NO_MONTHS);
  const [reason, setReason] = React.useState("");
  const [attempted, setAttempted] = React.useState(false);
  const now = today();
  const total = months.str + months.ltr + months.sync;

  React.useEffect(() => {
    if (open) {
      setMonths(NO_MONTHS);
      setReason("");
      setAttempted(false);
    }
  }, [open]);

  /** Last free day after the grant, following the same rule as the service. */
  function newLastDay(product: BillingProduct) {
    const running = client.freeUntil[product] ? parseDay(client.freeUntil[product]) : undefined;
    const from = running && running > now ? running : now;
    return addDays(addMonths(from, months[product]), -1);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (total === 0 || reason.trim().length < MIN_REASON_LENGTH) return;
    grant.mutate(
      { accountId: client.id, months, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(t("grant.granted", { client: client.name }));
          onOpenChange(false);
        },
        onError: () => toast.error(t("errors.saveFailed")),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-xl border-border/80 bg-[#141414] text-[13px]">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <DialogHeader className="space-y-2 text-start">
            <DialogTitle className="flex items-center gap-2 font-display text-lg uppercase tracking-[0.08em]">
              <Gift className="size-4 text-primary" aria-hidden="true" />
              {t("grant.title")}
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              {t("grant.description", { client: client.name })}
            </DialogDescription>
          </DialogHeader>

          <fieldset className="space-y-2">
            <legend className="text-label-caps text-muted-foreground">{t("grant.months")}</legend>
            <div className="divide-y divide-border/60 rounded-lg border border-border/80 bg-[#111111]">
              {PRODUCTS.map((product) => {
                const running = client.freeUntil[product];
                return (
                  <div
                    key={product}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{t(`products.${product}`)}</p>
                      <p className="text-xs text-muted-foreground">
                        {months[product] > 0
                          ? t("grant.freeUntil", { date: formatDate(newLastDay(product)) })
                          : running && parseDay(running) > now
                            ? t("grant.currentlyUntil", {
                                date: formatDate(addDays(parseDay(running), -1)),
                              })
                            : t("grant.notFree")}
                      </p>
                    </div>
                    <MonthStepper
                      label={t(`products.${product}`)}
                      value={months[product]}
                      onChange={(value) =>
                        setMonths((current) => ({ ...current, [product]: value }))
                      }
                    />
                  </div>
                );
              })}
            </div>
            {attempted && total === 0 && (
              <p className="text-xs text-[#FF85A1]">{t("grant.pickMonths")}</p>
            )}
          </fieldset>

          <ReasonField
            id="grant-reason"
            value={reason}
            onChange={setReason}
            showError={attempted}
          />

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={grant.isPending}
              onClick={() => onOpenChange(false)}
            >
              {t("actions.cancel")}
            </Button>
            <ReadOnlyGuard>
              <Button
                type="submit"
                size="sm"
                disabled={grant.isPending}
                className="bg-primary font-semibold text-primary-foreground"
              >
                {grant.isPending ? t("actions.saving") : t("grant.confirm", { count: total })}
              </Button>
            </ReadOnlyGuard>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MonthStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const { t } = useTranslation("admin");
  return (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label={label}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-7"
        disabled={value === 0}
        onClick={() => onChange(value - 1)}
        aria-label={t("grant.fewer", { product: label })}
      >
        <Minus className="size-3" aria-hidden="true" />
      </Button>
      <output aria-live="polite" className="w-16 text-center tabular-nums text-sm tabular-nums">
        {t("grant.monthCount", { count: value })}
      </output>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-7"
        disabled={value >= MAX_GRANT_MONTHS}
        onClick={() => onChange(value + 1)}
        aria-label={t("grant.more", { product: label })}
      >
        <Plus className="size-3" aria-hidden="true" />
      </Button>
    </div>
  );
}
