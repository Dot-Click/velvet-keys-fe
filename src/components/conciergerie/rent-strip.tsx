import { Check, FileText } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { Button } from "@/components/ui/button";
import { usePanelMutation } from "@/hooks/use-portfolio-data";
import { today } from "@/lib/clock";
import { formatDate, formatMonth } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { parseDay, toMonthKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { rentInvoicesService } from "@/services/ltr-service";
import type { RentInvoice, RentScheduleRow, RentScheduleStatus } from "@/types/ltr";
import { RentStatusPill } from "./lease-badges";

const MONTHS = 12;

/** Paid jade, due gold, late ruby, not yet invoiced muted. */
const TILE: Record<RentScheduleStatus, string> = {
  paid: "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]",
  unpaid: "border-primary/50 bg-primary/10 text-primary",
  late: "border-[#FF85A1]/55 bg-destructive/20 text-[#FF85A1]",
  not_yet_generated: "border-border/60 bg-[#151515] text-muted-foreground",
};

/** Paid invoices do not carry their paid-at day in the schedule row, so only the due date shows. */

/**
 * Twelve months of rent as tiles around today. Choosing a month shows its details below, with
 * "Mark received" when it is outstanding; a month with an invoice opens its preview too.
 */
export function RentStrip({
  currency,
  rows,
  onOpenInvoice,
}: {
  currency: string;
  rows: RentScheduleRow[];
  onOpenInvoice: (invoiceId: string) => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const current = toMonthKey(today());
  const currentIndex = Math.max(
    0,
    rows.findIndex((row) => row.period >= current),
  );
  const first = Math.max(0, Math.min(currentIndex - 3, rows.length - MONTHS));
  const tiles = rows.slice(first, first + MONTHS);
  const [selected, setSelected] = React.useState<string | null>(
    () => rows[currentIndex]?.period ?? null,
  );
  const row = rows.find((item) => item.period === selected);
  const markReceived = usePanelMutation((invoiceId: string) =>
    rentInvoicesService.markReceived(invoiceId),
  );

  const choose = (item: RentScheduleRow) => {
    setSelected(item.period);
    if (item.invoiceId) onOpenInvoice(item.invoiceId);
  };

  const receive = (item: RentScheduleRow) => {
    if (!item.invoiceId) return;
    const month = formatMonth(item.period, { style: "long", withYear: true });
    markReceived.mutate(item.invoiceId, {
      onSuccess: (invoice: RentInvoice) =>
        toast.success(t("today.rentReceived", { tenant: "" }), {
          description: t("today.rentReceivedDesc", {
            amount: formatMoney(invoice.amountMinor, invoice.currency),
            period: month,
          }),
        }),
      onError: () => toast.error(t("today.rentFailed")),
    });
  };

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
        {t("leaseDetail.noSchedule")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ol className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
        {tiles.map((item) => (
          <li key={item.period}>
            <button
              type="button"
              onClick={() => choose(item)}
              aria-pressed={selected === item.period}
              aria-label={`${formatMonth(item.period, { style: "long", withYear: true })} · ${t(
                `leases.rentStatus.${item.status}`,
              )}`}
              className={cn(
                "flex w-full flex-col items-start gap-1 rounded-xl border px-2.5 py-2 text-start transition-[transform,box-shadow] hover:-translate-y-0.5",
                TILE[item.status],
                selected === item.period &&
                  "ring-2 ring-primary/60 ring-offset-2 ring-offset-[#0B0B0B]",
                item.period === current &&
                  "outline outline-1 outline-offset-2 outline-[#A2E8DD]/40",
              )}
            >
              <span className="text-[0.62rem] uppercase tracking-wider opacity-80">
                {formatMonth(item.period, { style: "short" })}
              </span>
              <span dir="ltr" className="text-[0.72rem] tabular-nums text-foreground/90">
                {formatMoney(item.amountMinor, currency, { hideDecimals: true })}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {row && (
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-[#141414] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="font-serif text-lg text-[#F8F9FA]">
              {formatMonth(row.period, { style: "long", withYear: true })}
            </p>
            <p className="text-xs text-muted-foreground">
              <span dir="ltr" className="tabular-nums text-foreground">
                {formatMoney(row.amountMinor, currency)}
              </span>
              {" · "}
              {t("leaseDrawer.dueOn", { date: formatDate(parseDay(row.dueDate)) })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RentStatusPill status={row.status} />
            {row.invoiceId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenInvoice(row.invoiceId!)}
                className="h-9 text-xs text-primary"
              >
                <FileText className="size-3.5" aria-hidden="true" />
                {t("leaseDetail.invoicePdf")}
              </Button>
            )}
            {row.status !== "paid" && row.status !== "not_yet_generated" && (
              <ReadOnlyGuard>
                <Button
                  variant="outlineGold"
                  size="sm"
                  disabled={markReceived.isPending}
                  onClick={() => receive(row)}
                  className="h-9 text-xs"
                >
                  <Check className="size-3.5" aria-hidden="true" />
                  {t("today.markReceived")}
                </Button>
              </ReadOnlyGuard>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
