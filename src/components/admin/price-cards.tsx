import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
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
import { useSavePrices } from "@/hooks/use-admin-data";
import { MAX_UNIT_PRICE, MIN_REASON_LENGTH } from "@/lib/admin";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { formatMonth } from "@/lib/currency";
import { formatMoney, parseMoneyInput } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BillingProduct } from "@/types/subscription";
import type { AdminPricing } from "@/types/platform-admin";
import { ReasonField } from "./reason-dialog";

const PRODUCTS: BillingProduct[] = ["str", "ltr", "sync"];

const MINOR_FIELD: Record<BillingProduct, keyof AdminPricing["prices"]> = {
  str: "strPriceMinor",
  ltr: "ltrPriceMinor",
  sync: "syncPriceMinor",
};

const MAX_MINOR = MAX_UNIT_PRICE * 100;

/** Input text per product, starting from today's price (in major units, e.g. "220"). */
function draftsOf(prices: AdminPricing["prices"]) {
  return Object.fromEntries(
    PRODUCTS.map((product) => [product, String(prices[MINOR_FIELD[product]] / 100)]),
  ) as Record<BillingProduct, string>;
}

/**
 * Editable unit prices. A change only applies to the next billing period, and the backend
 * requires a reason (same rule as moderation decisions) so it goes into the audit trail.
 *
 * Note: the mock version of this screen showed a live "price impact" preview (clients affected,
 * MRR before/after) computed by a mock-only endpoint. The real backend has no such endpoint, so
 * that preview is dropped; only the before/after prices themselves are shown before confirming.
 */
export function PriceCards({ pricing }: { pricing: AdminPricing }) {
  const { t } = useTranslation("admin");
  const save = useSavePrices();
  const [drafts, setDrafts] = React.useState(() => draftsOf(pricing.prices));
  const [reason, setReason] = React.useState("");
  const [attempted, setAttempted] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  const rows = PRODUCTS.map((product) => {
    const currentMinor = pricing.prices[MINOR_FIELD[product]];
    const parsed = parseMoneyInput(drafts[product] ?? "", ACCOUNT_CURRENCY);
    const valid = parsed !== null && parsed > 0 && parsed <= MAX_MINOR;
    return {
      product,
      currentMinor,
      parsed,
      valid,
      changed: valid && parsed !== currentMinor,
      error: valid ? null : t("pricing.prices.invalid"),
    };
  });
  const changes = rows.filter((row) => row.changed);
  const canSave = changes.length > 0 && rows.every((row) => row.valid);
  const effective = formatMonth(pricing.nextPeriod, { style: "long", withYear: true });
  const pristine = rows.every((row) => row.valid && !row.changed);

  function openConfirm() {
    setReason("");
    setAttempted(false);
    setConfirming(true);
  }

  function confirm(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (!canSave || reason.trim().length < MIN_REASON_LENGTH) return;
    const prices: Partial<Record<BillingProduct, number>> = {};
    for (const row of changes) if (row.parsed !== null) prices[row.product] = row.parsed;
    save.mutate(
      { prices, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(t("pricing.saved", { month: effective }));
          setConfirming(false);
        },
        onError: () => toast.error(t("errors.saveFailed")),
      },
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {rows.map(({ product, currentMinor, changed, valid, error }) => (
          <div
            key={product}
            className={cn(
              "space-y-3 rounded-lg border bg-[#121212] px-4 py-4 transition-colors",
              changed ? "border-primary/50" : "border-border/80",
            )}
          >
            <div>
              <p className="text-label-caps text-muted-foreground">{t(`products.${product}`)}</p>
              <p className="text-xs text-muted-foreground/80">
                {t(`pricing.prices.hint.${product}`)}
              </p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-primary">
                {formatMoney(currentMinor, ACCOUNT_CURRENCY)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("pricing.prices.inForce")} · {t("pricing.prices.perUnit")}
              </p>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor={`price-${product}`}
                className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {t("pricing.prices.newPrice")}
              </label>
              {/* Figures read left to right in every language, so the suffix sits with them */}
              <div dir="ltr" className="relative">
                <Input
                  id={`price-${product}`}
                  inputMode="decimal"
                  autoComplete="off"
                  value={drafts[product]}
                  onChange={(event) =>
                    setDrafts((current) => ({ ...current, [product]: event.target.value }))
                  }
                  aria-invalid={!valid}
                  aria-describedby={valid ? undefined : `price-${product}-error`}
                  className="h-9 border-border/80 bg-[#111111] pe-12 tabular-nums text-[13px] aria-[invalid=true]:border-destructive"
                />
                <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {ACCOUNT_CURRENCY}
                </span>
              </div>
              {!valid && (
                <p id={`price-${product}-error`} className="text-xs text-[#FF85A1]">
                  {error}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ReadOnlyGuard>
          <Button
            size="sm"
            disabled={!canSave}
            onClick={openConfirm}
            className="bg-primary font-semibold text-primary-foreground"
          >
            {t("pricing.prices.save")}
          </Button>
        </ReadOnlyGuard>
        <Button
          variant="ghost"
          size="sm"
          disabled={pristine}
          onClick={() => setDrafts(draftsOf(pricing.prices))}
          className="text-xs text-muted-foreground"
        >
          {t("pricing.prices.reset")}
        </Button>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-xl border-border/80 bg-[#141414] text-[13px]">
          <form onSubmit={confirm} noValidate className="space-y-5">
            <DialogHeader className="space-y-2 text-start">
              <DialogTitle className="font-display text-lg uppercase tracking-[0.08em]">
                {t("pricing.confirm.title")}
              </DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
                <strong className="font-semibold text-foreground">
                  {t("pricing.confirm.body")}
                </strong>{" "}
                {t("pricing.confirm.effective", { month: effective })}
              </DialogDescription>
            </DialogHeader>
            <ul className="divide-y divide-border/60 rounded-lg border border-border/80 bg-[#111111]">
              {changes.map(({ product, currentMinor, parsed }) => (
                <li key={product} className="flex items-center gap-3 px-3.5 py-2.5">
                  <span className="w-14 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t(`products.${product}`)}
                  </span>
                  <span dir="ltr" className="flex items-center gap-2 text-sm tabular-nums">
                    <span className="text-muted-foreground">
                      {formatMoney(currentMinor, ACCOUNT_CURRENCY)}
                    </span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className="font-semibold text-primary">
                      {formatMoney(parsed ?? 0, ACCOUNT_CURRENCY)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <ReasonField
              id="pricing-reason"
              value={reason}
              onChange={setReason}
              showError={attempted}
            />
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={save.isPending}
                onClick={() => setConfirming(false)}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={save.isPending}
                className="bg-primary font-semibold text-primary-foreground"
              >
                {save.isPending ? t("actions.saving") : t("pricing.confirm.confirm")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
