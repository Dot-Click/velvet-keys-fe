import * as React from "react";
import { addDays, addMonths } from "date-fns";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
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
import { usePanelMutation } from "@/hooks/use-portfolio-data";
import { today } from "@/lib/clock";
import { formatDate } from "@/lib/currency";
import { formatMoney, parseMoneyInput } from "@/lib/money";
import { parseDay, toISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { leasesService } from "@/services/ltr-service";
import type { Lease } from "@/types/ltr";
import { DrawerField, drawerInputClassName, noSpinnerClassName } from "./drawer-field";

const DIALOG =
  "max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border-primary/30 bg-[#141414] sm:rounded-2xl";
const HEADER = "space-y-2 pe-8 text-start rtl:ps-8 sm:text-start";
const TITLE = "font-display text-xl uppercase tracking-[0.12em] text-foreground";

/** Last night of a lease whose end date is exclusive. */
function lastNight(lease: Lease) {
  return addDays(parseDay(lease.endDate), -1);
}

/** Extends the lease and optionally sets the rent for the renewed term. */
export function RenewLeaseDialog({
  lease,
  open,
  onClose,
}: {
  lease: Lease;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const currentRent = lease.monthlyRentMinor;
  const [lastDay, setLastDay] = React.useState<Date | undefined>(() =>
    addDays(addMonths(parseDay(lease.endDate), 12), -1),
  );
  const [rent, setRent] = React.useState(String(currentRent));
  const [error, setError] = React.useState<string | null>(null);
  const renew = usePanelMutation(
    (input: { newEndDate: string; newMonthlyRentMinor?: number }) =>
      leasesService.renew(lease.id, input),
  );

  function submit() {
    const amountMinor = parseMoneyInput(rent, lease.currency);
    if (!lastDay || toISODate(lastDay) < lease.endDate) {
      setError(t("leaseDetail.renewEndError"));
      return;
    }
    if (amountMinor === null || !(amountMinor > 0)) {
      setError(t("leaseForm.errors.rentInvalid"));
      return;
    }
    setError(null);
    renew.mutate(
      {
        newEndDate: toISODate(addDays(lastDay, 1)),
        ...(amountMinor !== currentRent ? { newMonthlyRentMinor: amountMinor } : {}),
      },
      {
        onSuccess: () => {
          toast.success(t("leaseDetail.renewed", { date: formatDate(lastDay) }));
          onClose();
        },
        onError: () => toast.error(t("common:states.errorBody")),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className={DIALOG}>
        <DialogHeader className={HEADER}>
          <DialogTitle className={TITLE}>{t("leaseDetail.renewTitle")}</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {t("leaseDetail.renewBody", { date: formatDate(lastNight(lease)) })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <DrawerField id="renew-end" label={t("leaseDetail.newEnd")}>
            <CustomDatePicker
              id="renew-end"
              {...(lastDay ? { value: lastDay } : {})}
              onChange={setLastDay}
              minDate={parseDay(lease.endDate)}
              placeholder={t("leaseDetail.newEnd")}
            />
          </DrawerField>
          <div className="flex flex-wrap gap-2">
            {[6, 12, 24].map((count) => (
              <Button
                key={count}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLastDay(addDays(addMonths(parseDay(lease.endDate), count), -1))}
                className="h-8 text-[0.68rem] uppercase tracking-wider"
              >
                {t("leaseDetail.plusMonths", { count })}
              </Button>
            ))}
          </div>
          <DrawerField
            id="renew-rent"
            label={t("leaseDetail.newRent")}
            hint={t("leaseDetail.newRentHint", {
              amount: formatMoney(currentRent, lease.currency),
              date: formatDate(parseDay(lease.endDate)),
            })}
          >
            <div className="relative">
              <Input
                id="renew-rent"
                type="number"
                inputMode="decimal"
                min={0}
                value={rent}
                onChange={(event) => setRent(event.target.value)}
                className={cn(drawerInputClassName, noSpinnerClassName, "pe-14 font-mono")}
              />
              <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-[0.68rem] font-semibold text-muted-foreground">
                {lease.currency}
              </span>
            </div>
          </DrawerField>
          {error && (
            <p role="alert" className="text-xs text-destructive-foreground">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            {t("common:actions.cancel")}
          </Button>
          <ReadOnlyGuard>
            <Button
              size="sm"
              disabled={renew.isPending}
              onClick={submit}
              className="btn-shimmer bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground"
            >
              {renew.isPending ? t("forms.saving") : t("leaseDetail.renew")}
            </Button>
          </ReadOnlyGuard>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Ends the lease as of a chosen day. The backend requires this date to be today or earlier
 * (it rejects ending a lease in the future), unlike the exclusive `endDate` shown elsewhere.
 */
export function EndLeaseDialog({
  lease,
  open,
  onClose,
}: {
  lease: Lease;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const now = today();
  const [day, setDay] = React.useState<Date | undefined>(() => {
    const start = parseDay(lease.startDate);
    return now < start ? start : now;
  });
  const end = usePanelMutation((endDate: string) => leasesService.end(lease.id, endDate));

  function submit() {
    if (!day) return;
    end.mutate(toISODate(day), {
      onSuccess: () => {
        toast.success(t("leaseDetail.ended", { date: formatDate(day) }));
        onClose();
      },
      onError: () => toast.error(t("common:states.errorBody")),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className={cn(DIALOG, "border-destructive/40")}>
        <DialogHeader className={HEADER}>
          <DialogTitle className={TITLE}>{t("leaseDetail.endTitle")}</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {t("leaseDetail.endBody")}
          </DialogDescription>
        </DialogHeader>
        <DrawerField id="end-last-day" label={t("leaseDetail.lastNight")}>
          <CustomDatePicker
            id="end-last-day"
            {...(day ? { value: day } : {})}
            onChange={setDay}
            minDate={parseDay(lease.startDate)}
            maxDate={now}
            placeholder={t("leaseDetail.lastNight")}
          />
        </DrawerField>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            {t("common:actions.cancel")}
          </Button>
          <ReadOnlyGuard>
            <Button
              size="sm"
              variant="destructive"
              disabled={!day || end.isPending}
              onClick={submit}
              className="text-xs font-semibold uppercase tracking-wider"
            >
              {end.isPending ? t("forms.saving") : t("leaseDetail.endConfirm")}
            </Button>
          </ReadOnlyGuard>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The contract PDF in the browser's viewer, with download and new-tab links. */
export function ContractPreviewDialog({
  url,
  fileName,
  open,
  onClose,
}: {
  url: string | null;
  fileName: string;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className={cn(DIALOG, "max-w-4xl")}>
        <DialogHeader className={HEADER}>
          <DialogTitle className={TITLE}>{t("leaseDetail.contract")}</DialogTitle>
          <DialogDescription className="break-all text-xs">{fileName}</DialogDescription>
        </DialogHeader>
        {url ? (
          <iframe
            src={url}
            title={t("leaseForm.contractPreview", { name: fileName })}
            className="h-[65vh] w-full rounded-xl border border-border/80 bg-[#F8F9FA]"
          />
        ) : (
          <div className="grid h-64 place-items-center" aria-busy="true">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
          </div>
        )}
        <DialogFooter className="gap-2">
          {url && (
            <>
              <Button variant="outline" size="sm" asChild className="text-xs">
                <a href={url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  {t("leaseDetail.openTab")}
                </a>
              </Button>
              <Button
                size="sm"
                asChild
                className="btn-shimmer bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground"
              >
                <a href={url} download={fileName}>
                  <Download className="size-3.5" aria-hidden="true" />
                  {t("leaseDetail.download")}
                </a>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
