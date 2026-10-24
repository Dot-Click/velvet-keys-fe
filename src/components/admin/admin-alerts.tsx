import { Link } from "@tanstack/react-router";
import { BellRing, CalendarClock, CheckCircle2, LockKeyhole, ReceiptText } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MarkPaidDialog } from "@/components/admin/mark-paid-dialog";
import { Button } from "@/components/ui/button";
import { useRemindInvoice } from "@/hooks/use-admin-data";
import { formatDate } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { AdminInvoiceListItem } from "@/types/platform-admin";
import { moneyExact } from "@/components/admin/overview/format";
import type { AttentionItem, AttentionKind } from "@/types/admin-overview";

const GROUPS: { kind: AttentionKind; icon: React.ReactNode; tone: string }[] = [
  {
    kind: "overdue",
    icon: <ReceiptText className="size-3.5" aria-hidden="true" />,
    tone: "text-[#FF85A1]",
  },
  {
    kind: "read_only",
    icon: <LockKeyhole className="size-3.5" aria-hidden="true" />,
    tone: "text-[#FF85A1]",
  },
  {
    kind: "ending",
    icon: <CalendarClock className="size-3.5" aria-hidden="true" />,
    tone: "text-primary",
  },
];

const ACTION = "h-7 gap-1 px-2 text-xs [&_svg]:size-3.5";

/** What needs the Admin's attention, with a one-click action on every line. */
export function AdminAlerts({ items }: { items: AttentionItem[] }) {
  const { t } = useTranslation("admin-overview");
  const reminder = useRemindInvoice();
  const [payRow, setPayRow] = React.useState<AdminInvoiceListItem | null>(null);
  const [reminded, setReminded] = React.useState<ReadonlySet<string>>(new Set());

  const remind = (item: AttentionItem) => {
    const invoiceId = item.invoice?.id;
    if (!invoiceId) return;
    reminder.mutate(invoiceId, {
      onSuccess: () => {
        setReminded((prev) => new Set(prev).add(item.id));
        toast.success(t("alerts.reminderSent", { client: item.clientName }));
      },
      onError: () => toast.error(t("alerts.reminderFailed")),
    });
  };

  return (
    <>
      <div className="divide-y divide-border/70 rounded-lg border border-border/80 bg-[#121212]">
        {GROUPS.map((group) => {
          const list = items.filter((item) => item.kind === group.kind);
          return (
            <section
              key={group.kind}
              aria-labelledby={`alerts-${group.kind}`}
              className="px-4 py-3"
            >
              <h3
                id={`alerts-${group.kind}`}
                className={cn(
                  "flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em]",
                  group.tone,
                )}
              >
                {group.icon}
                {t(`alerts.${group.kind}`)}
                <span className="rounded-full bg-[#1C1C1C] px-1.5 tabular-nums text-[0.65rem] text-muted-foreground">
                  {list.length}
                </span>
              </h3>
              {list.length === 0 ? (
                <p className="pt-2 text-xs text-muted-foreground">{t("alerts.none")}</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {list.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
                    >
                      <div className="min-w-0">
                        <Link
                          to="/admin/clients/$clientId"
                          params={{ clientId: item.accountId }}
                          className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                        >
                          {item.clientName}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          <AttentionDetail item={item} />
                        </p>
                      </div>
                      <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">
                        {item.kind === "overdue" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={ACTION}
                            disabled={reminder.isPending || reminded.has(item.id)}
                            onClick={() => remind(item)}
                          >
                            {reminded.has(item.id) ? <CheckCircle2 /> : <BellRing />}
                            {reminded.has(item.id)
                              ? t("alerts.reminded")
                              : t("alerts.sendReminder")}
                          </Button>
                        )}
                        {item.invoice && item.kind !== "ending" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={ACTION}
                            onClick={() => setPayRow(item.invoice ?? null)}
                          >
                            {t("alerts.markPaid")}
                          </Button>
                        )}
                        <Button asChild variant="ghost" size="sm" className={ACTION}>
                          <Link to="/admin/clients/$clientId" params={{ clientId: item.accountId }}>
                            {t("alerts.openClient")}
                          </Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      <MarkPaidDialog invoice={payRow} onOpenChange={(open) => !open && setPayRow(null)} />
    </>
  );
}

function AttentionDetail({ item }: { item: AttentionItem }) {
  const { t } = useTranslation("admin-overview");
  switch (item.kind) {
    case "overdue":
      return (
        <>
          <span className="tabular-nums">{item.invoice?.number}</span> ·{" "}
          {moneyExact(item.amountMinor ?? 0)} ·{" "}
          <span className="text-[#FF85A1]">
            {t("alerts.daysOverdue", { count: item.daysOverdue ?? 0 })}
          </span>
        </>
      );
    case "read_only":
      return item.invoice ? (
        <>{t("alerts.readOnlySince", { amount: moneyExact(item.amountMinor ?? 0) })}</>
      ) : (
        <>{t("alerts.readOnlyNoInvoice")}</>
      );
    case "ending":
      return (
        <>
          {t("alerts.freeEnds", {
            product: t(`upcoming.product.${item.product ?? "str"}`),
            date: item.lastDay ? formatDate(parseDay(item.lastDay)) : "",
          })}{" "}
          <span className="tabular-nums text-primary">
            {item.daysLeft === 0
              ? t("alerts.lastDayToday")
              : t("alerts.daysLeft", { count: item.daysLeft ?? 0 })}
          </span>
        </>
      );
  }
}
