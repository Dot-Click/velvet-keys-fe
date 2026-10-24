import * as React from "react";
import { Check, FileText } from "lucide-react";
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
import type { RentInvoice, RentScheduleRow } from "@/types/ltr";
import { RentStatusPill } from "./lease-badges";

/** Long schedules open on the months around today; the rest is one click away. */
const WINDOW_BEFORE = 3;
const WINDOW_AFTER = 8;

/** Month-by-month rent for a lease, with one-tap "Mark received" and the invoice preview. */
export function RentSchedule({
  currency,
  rows,
  onOpenInvoice,
}: {
  currency: string;
  rows: RentScheduleRow[];
  onOpenInvoice: (invoiceId: string) => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const [showAll, setShowAll] = React.useState(false);
  const [pending, setPending] = React.useState<string | null>(null);
  const markReceived = usePanelMutation((invoiceId: string) =>
    rentInvoicesService.markReceived(invoiceId),
  );

  const current = toMonthKey(today());
  const currentIndex = Math.max(
    0,
    rows.findIndex((row) => row.period >= current),
  );
  const windowRows = rows.filter(
    (row, index) =>
      (index >= currentIndex - WINDOW_BEFORE && index <= currentIndex + WINDOW_AFTER) ||
      row.status === "late" ||
      row.status === "not_yet_generated",
  );
  const visible = showAll ? rows : windowRows;

  const receive = (row: RentScheduleRow) => {
    if (!row.invoiceId) return;
    setPending(row.period);
    markReceived.mutate(row.invoiceId, {
      onSuccess: (invoice: RentInvoice) =>
        toast.success(t("today.rentReceived", { tenant: "" }), {
          description: t("today.rentReceivedDesc", {
            amount: formatMoney(invoice.amountMinor, invoice.currency),
            period: formatMonth(row.period, { style: "long", withYear: true }),
          }),
        }),
      onError: () => toast.error(t("today.rentFailed")),
      onSettled: () => setPending(null),
    });
  };

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
        {t("leaseDetail.noSchedule")}
      </p>
    );
  }

  const action = (row: RentScheduleRow) =>
    row.status === "paid" ? (
      <span className="whitespace-nowrap text-[0.68rem] text-muted-foreground" />
    ) : row.invoiceId ? (
      <ReadOnlyGuard>
        <Button
          size="sm"
          disabled={pending === row.period}
          onClick={() => receive(row)}
          className="h-8 rounded-lg border-[#A2E8DD] bg-[#A2E8DD] text-[0.68rem] font-semibold uppercase tracking-wider text-[#0B0B0B] shadow-none hover:bg-[#A2E8DD] hover:shadow-none hover:brightness-110"
        >
          <Check className="size-3.5" aria-hidden="true" />
          {t("today.markReceived")}
        </Button>
      </ReadOnlyGuard>
    ) : (
      <span className="text-[0.68rem] text-muted-foreground">{t("leaseDetail.notInvoiced")}</span>
    );

  const invoiceLink = (row: RentScheduleRow) =>
    row.invoiceId ? (
      <button
        type="button"
        onClick={() => onOpenInvoice(row.invoiceId!)}
        className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-primary hover:underline"
      >
        <FileText className="size-3.5" aria-hidden="true" />
        {t("leaseDetail.invoicePdf")}
      </button>
    ) : (
      <span className="text-[0.68rem] text-muted-foreground">{t("leaseDetail.notInvoiced")}</span>
    );

  return (
    <div className="space-y-3">
      {/* Phones: one card per month */}
      <ul className="space-y-3 md:hidden">
        {visible.map((row) => (
          <li
            key={row.period}
            className={cn(
              "space-y-3 rounded-xl border p-4",
              row.status === "late"
                ? "border-destructive/50 bg-[#1C1215]"
                : "border-border/70 bg-[#161616]",
              row.period === current && "ring-1 ring-primary/40",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-serif text-base font-semibold text-foreground">
                  {formatMonth(row.period, { style: "long", withYear: true })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("leaseDrawer.dueOn", { date: formatDate(parseDay(row.dueDate)) })}
                </p>
              </div>
              <RentStatusPill status={row.status} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
              <span className="font-mono text-sm font-semibold text-foreground">
                {formatMoney(row.amountMinor, currency)}
              </span>
              {invoiceLink(row)}
              {action(row)}
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="relative hidden overflow-x-auto rounded-xl border border-primary/20 bg-[#141414] md:block">
        <table className="w-full whitespace-nowrap text-sm">
          <thead className="border-b border-border/80 bg-[#111111]/95 text-[0.68rem] uppercase tracking-[0.15em] text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t("leaseDetail.colMonth")}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t("leaseDetail.colAmount")}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t("leaseDetail.colDue")}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t("leaseDetail.colStatus")}
              </th>
              <th scope="col" className="px-4 py-3 text-start font-medium">
                {t("leaseDetail.colInvoice")}
              </th>
              <th scope="col" className="px-4 py-3 text-end font-medium">
                <span className="sr-only">{t("leaseDetail.colAction")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {visible.map((row) => (
              <tr
                key={row.period}
                className={cn(
                  row.status === "late" && "bg-destructive/10",
                  row.period === current && "bg-primary/5",
                )}
              >
                <td className="px-4 py-3 font-serif text-base text-foreground">
                  {formatMonth(row.period, { style: "long", withYear: true })}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-foreground">
                  {formatMoney(row.amountMinor, currency)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(parseDay(row.dueDate))}
                </td>
                <td className="px-4 py-3">
                  <RentStatusPill status={row.status} />
                </td>
                <td className="px-4 py-3">{invoiceLink(row)}</td>
                <td className="px-4 py-3 text-end">{action(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {windowRows.length < rows.length && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll((value) => !value)}
          className="text-xs text-primary"
        >
          {showAll ? t("leaseDetail.showFewer") : t("leaseDetail.showAll", { count: rows.length })}
        </Button>
      )}
    </div>
  );
}
