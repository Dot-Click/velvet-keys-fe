import * as React from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSaveFreeSyncTotal } from "@/hooks/use-admin-data";
import { MAX_FREE_SYNC_SLOTS } from "@/lib/admin";
import { formatNumber } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { FreeSync } from "@/types/platform-admin";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";

/** Used / total as a ring: gold for the share taken, with the figures in the middle. */
function RadialGauge({ used, total, label }: { used: number; total: number; label: string }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const share = total > 0 ? Math.min(1, used / total) : 0;
  return (
    <div dir="ltr" className="flex items-center justify-center">
      <svg viewBox="0 0 100 100" role="img" aria-label={label} className="size-32">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#1C1C1C" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#D4AF37"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${circumference * share} ${circumference}`}
          transform="rotate(-90 50 50)"
        />
        <text
          x="50"
          y="49"
          textAnchor="middle"
          className="fill-[#F8F9FA] text-[15px] font-semibold"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatNumber(used)} / {formatNumber(total)}
        </text>
        <text x="50" y="63" textAnchor="middle" className="fill-[#9CA3AF] text-[7px]">
          {Math.round(share * 100)}%
        </text>
      </svg>
    </div>
  );
}

/**
 * The platform's free channel sync slots: how many exist and how many are used.
 *
 * Note: the mock version also listed every unit currently using a free slot, via a mock-only
 * endpoint. `FreeSync` from the real backend only carries the total/used counts, so that
 * per-unit table is dropped here.
 */
export function FreeSyncSettings({ freeSync }: { freeSync: FreeSync }) {
  const { t } = useTranslation("admin");
  const save = useSaveFreeSyncTotal();
  const { total, used } = freeSync;
  const [draft, setDraft] = React.useState(String(total));

  React.useEffect(() => setDraft(String(total)), [total]);

  const next = /^\d+$/.test(draft.trim()) ? Number(draft.trim()) : null;
  const valid = next !== null && next >= used && next <= MAX_FREE_SYNC_SLOTS;
  const dirty = next !== total;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || !dirty || next === null) return;
    save.mutate(next, {
      onSuccess: () => toast.success(t("pricing.freeSync.saved", { total: formatNumber(next) })),
      onError: () => toast.error(t("errors.saveFailed")),
    });
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
      <form
        onSubmit={submit}
        noValidate
        className="space-y-4 rounded-lg border border-border/80 bg-[#121212] px-4 py-4 xl:col-span-6"
      >
        <div className="space-y-2">
          <p className="text-2xl font-semibold tabular-nums text-primary">
            <Trans
              t={t}
              i18nKey="pricing.freeSync.used"
              values={{ used: formatNumber(used), total: formatNumber(total) }}
              components={{ figures: <span dir="ltr" /> }}
            />
          </p>
          <RadialGauge used={used} total={total} label={t("pricing.freeSync.slots")} />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="free-sync-total"
            className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {t("pricing.freeSync.total")}
          </label>
          <Input
            id="free-sync-total"
            inputMode="numeric"
            autoComplete="off"
            dir="ltr"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-invalid={!valid}
            aria-describedby="free-sync-total-hint"
            className="h-9 border-border/80 bg-[#111111] tabular-nums text-[13px] aria-[invalid=true]:border-destructive"
          />
          <p
            id="free-sync-total-hint"
            className={cn("text-xs", valid ? "text-muted-foreground" : "text-[#FF85A1]")}
          >
            {valid
              ? t("pricing.freeSync.totalHint", { used: formatNumber(used) })
              : t("pricing.freeSync.invalid", { min: formatNumber(used) })}
          </p>
        </div>

        <ReadOnlyGuard>
          <Button
            type="submit"
            size="sm"
            disabled={!dirty || !valid || save.isPending}
            className="bg-primary font-semibold text-primary-foreground"
          >
            {save.isPending ? t("actions.saving") : t("pricing.freeSync.save")}
          </Button>
        </ReadOnlyGuard>
      </form>
    </div>
  );
}
