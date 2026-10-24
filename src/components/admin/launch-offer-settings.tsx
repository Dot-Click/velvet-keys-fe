import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { CustomTimePicker } from "@/components/ui/custom-time-picker";
import { useSaveLaunchDeadline } from "@/hooks/use-admin-data";
import { FREE_MONTHS } from "@/lib/billing";
import { formatCasablancaTime, formatDate, formatNumber } from "@/lib/currency";
import { casablancaDateTime, casablancaParts, parseDay, toISODate } from "@/lib/dates";
import { differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";
import type { OfferProduct } from "@/types/account";
import { AdminTable, Td, Th } from "./admin-table";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";

type Rule = {
  id: "str" | "ltr" | "str_ltr" | "str_sync_ltr" | "sync";
  free: Partial<Record<OfferProduct, number>>;
};

/** What each kind of signup gets, read from the same constants billing uses. */
const RULES: Rule[] = [
  { id: "str", free: { str: FREE_MONTHS.str } },
  { id: "ltr", free: { ltr: FREE_MONTHS.ltr } },
  { id: "str_ltr", free: { str: FREE_MONTHS.str, ltr: FREE_MONTHS.ltr } },
  { id: "str_sync_ltr", free: { str: FREE_MONTHS.str, ltr: FREE_MONTHS.ltrWithSyncBundle } },
  { id: "sync", free: { sync: FREE_MONTHS.sync } },
];

const PRODUCTS: OfferProduct[] = ["str", "ltr", "sync"];

const LABEL = "text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground";

/** "31 Jan 2027, 23:59 (Casablanca, GMT+1)" whatever time zone the browser is in. */
function casablancaMoment(iso: string) {
  const at = new Date(iso);
  const { offset } = casablancaParts(iso);
  return `${formatDate(at, { timeZone: "Africa/Casablanca" })}, ${formatCasablancaTime(at)} (Casablanca, ${offset})`;
}

/**
 * The signup deadline (set on the Casablanca clock) and the read-only table of offer rules.
 *
 * Note: the mock version counted how many accounts are on each rule today, via a mock-only
 * endpoint. The real backend has no such breakdown, so the "clients" column is dropped.
 */
export function LaunchOfferSettings({
  deadline,
  freeSyncTotal,
}: {
  deadline: string;
  freeSyncTotal: number;
}) {
  const { t } = useTranslation("admin");
  const { t: tp } = useTranslation("admin-pricing");
  const save = useSaveLaunchDeadline();
  const saved = casablancaParts(deadline);
  const [day, setDay] = React.useState(saved.day);
  const [time, setTime] = React.useState(saved.time);

  React.useEffect(() => {
    setDay(saved.day);
    setTime(saved.time);
  }, [saved.day, saved.time]);

  const dirty = day !== saved.day || time !== saved.time;
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(day) && /^\d{2}:\d{2}$/.test(time);
  const open = Date.parse(deadline) > Date.now();
  // Whole days between today and the deadline on the Casablanca calendar
  const daysLeft = differenceInCalendarDays(
    parseDay(saved.day),
    parseDay(casablancaParts(new Date().toISOString()).day),
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || !dirty) return;
    save.mutate(casablancaDateTime(day, time), {
      onSuccess: () => toast.success(t("pricing.launch.saved")),
      onError: () => toast.error(t("errors.saveFailed")),
    });
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
      <form
        onSubmit={submit}
        noValidate
        className="space-y-4 rounded-lg border border-border/80 bg-[#121212] px-4 py-4 xl:col-span-5"
      >
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("pricing.launch.description")}
        </p>
        <p
          className={cn(
            "rounded-md border px-2.5 py-1.5 text-xs",
            open
              ? "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]"
              : "border-destructive/40 bg-destructive/10 text-[#FF85A1]",
          )}
        >
          {t(open ? "pricing.launch.open" : "pricing.launch.closed", {
            date: casablancaMoment(deadline),
          })}
        </p>
        <p className="flex items-baseline gap-2" aria-live="polite">
          <span className="text-2xl font-semibold tabular-nums text-primary">
            {open ? formatNumber(Math.max(daysLeft, 0)) : "0"}
          </span>
          <span className="text-xs text-muted-foreground">
            {open
              ? tp("launch.daysLeft", {
                  count: Math.max(daysLeft, 0),
                  days: formatNumber(Math.max(daysLeft, 0)),
                })
              : tp("launch.ended")}
          </span>
        </p>

        <fieldset className="space-y-1.5">
          <legend className={LABEL}>
            {t("pricing.launch.deadline")}
            <span className="ms-2 font-normal normal-case tracking-normal">
              {t("pricing.launch.zone", { offset: saved.offset })}
            </span>
          </legend>
          <div className="grid grid-cols-[1fr_8rem] gap-2">
            <div className="space-y-1">
              <label htmlFor="launch-date" className="sr-only">
                {t("pricing.launch.date")}
              </label>
              <CustomDatePicker
                id="launch-date"
                value={day}
                onChange={(date) => date && setDay(toISODate(date))}
                className="h-9 border-border/80 bg-[#111111] text-[13px]"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="launch-time" className="sr-only">
                {t("pricing.launch.time")}
              </label>
              <CustomTimePicker
                id="launch-time"
                value={time}
                onChange={setTime}
                invalid={!valid}
                className="h-9 border-border/80 bg-[#111111] text-[13px]"
              />
            </div>
          </div>
          {!valid && <p className="text-xs text-[#FF85A1]">{t("pricing.launch.invalid")}</p>}
        </fieldset>

        <ReadOnlyGuard>
          <Button
            type="submit"
            size="sm"
            disabled={!dirty || !valid || save.isPending}
            className="bg-primary font-semibold text-primary-foreground"
          >
            {save.isPending ? t("actions.saving") : t("pricing.launch.save")}
          </Button>
        </ReadOnlyGuard>
      </form>

      <div className="space-y-2 xl:col-span-7">
        <AdminTable>
          <caption className="sr-only">{t("pricing.launch.rulesTitle")}</caption>
          <thead>
            <tr>
              <Th>{t("pricing.launch.colSignup")}</Th>
              <Th>{t("pricing.launch.colFree")}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {RULES.map((rule) => (
              <tr key={rule.id}>
                <Td className="whitespace-normal">
                  {t(`pricing.launch.rules.${rule.id}`, { total: freeSyncTotal })}
                </Td>
                <Td>
                  <span dir="ltr" className="flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums">
                    {PRODUCTS.filter((product) => rule.free[product]).map((product) => (
                      <span key={product}>
                        <span className="text-muted-foreground">{t(`products.${product}`)}</span>{" "}
                        <span className="font-semibold text-primary">{rule.free[product]}</span>
                      </span>
                    ))}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
        <p className="text-xs text-muted-foreground">{t("pricing.launch.rulesNote")}</p>
      </div>
    </div>
  );
}
