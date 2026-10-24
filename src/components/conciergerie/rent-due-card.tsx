import * as React from "react";
import { differenceInCalendarDays } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Banknote, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { SwipeRow } from "@/components/swipe-row";
import { Button } from "@/components/ui/button";
import { usePanelMutation } from "@/hooks/use-portfolio-data";
import { today } from "@/lib/clock";
import { formatMAD, formatMonth } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import { LUXURY_EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { rentInvoicesService } from "@/services/leases-service";
import type { RentDueItem } from "@/types/lease";

const keyOf = (item: Pick<RentDueItem, "leaseId" | "period">) => `${item.leaseId}:${item.period}`;

const STATE_RANK: Record<RentDueItem["state"], number> = { late: 0, due_today: 1, upcoming: 2 };
const LIMIT = 3;

/**
 * The three most pressing LTR rents (late first), each one tap — or one swipe on a phone — from
 * received, with a link to every rent invoice.
 */
export function RentDueCard({
  items,
  highlighted = false,
  id,
}: {
  items: RentDueItem[];
  /** Gold rim while the Rent due KPI tile is selected */
  highlighted?: boolean;
  id?: string;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  // Hidden as soon as they are tapped, while the write and refresh are in flight
  const [received, setReceived] = React.useState<Set<string>>(() => new Set());
  const markReceived = usePanelMutation((item: RentDueItem, scope) =>
    rentInvoicesService.markReceived(scope, { leaseId: item.leaseId, period: item.period }),
  );
  const markOutstanding = usePanelMutation((invoiceId: string, scope) =>
    rentInvoicesService.markOutstanding(scope, invoiceId),
  );
  const visible = items
    .filter((item) => !received.has(keyOf(item)))
    .sort(
      (a, b) => STATE_RANK[a.state] - STATE_RANK[b.state] || a.dueDate.localeCompare(b.dueDate),
    );
  const shown = visible.slice(0, LIMIT);
  const lateCount = visible.filter((item) => item.state === "late").length;
  const total = visible.reduce((sum, item) => sum + item.amountMAD, 0);
  const now = today();

  const setHidden = (key: string, hidden: boolean) =>
    setReceived((prev) => {
      const next = new Set(prev);
      if (hidden) next.add(key);
      else next.delete(key);
      return next;
    });

  const receive = (item: RentDueItem) => {
    const key = keyOf(item);
    setHidden(key, true);
    markReceived.mutate(item, {
      onSuccess: (invoice) => {
        toast.success(t("today.rentReceived", { tenant: item.tenantName }), {
          description: t("today.rentReceivedDesc", {
            amount: formatMAD(item.amountMAD),
            period: formatMonth(item.period, { style: "long", withYear: true }),
          }),
          action: {
            label: t("today.undo"),
            onClick: () =>
              markOutstanding.mutate(invoice.id, {
                onSuccess: () => {
                  setHidden(key, false);
                  toast.info(t("today.rentReopened", { tenant: item.tenantName }));
                },
                onError: () => toast.error(t("today.rentFailed")),
              }),
          },
        });
      },
      onError: () => {
        setHidden(key, false);
        toast.error(t("today.rentFailed"));
      },
    });
  };

  const dueLabel = (item: RentDueItem) => {
    const days = differenceInCalendarDays(parseDay(item.dueDate), now);
    if (item.state === "late") return t("today.rentLate", { count: -days });
    if (item.state === "due_today") return t("today.rentDueToday");
    return t("today.rentDueIn", { count: days });
  };

  return (
    <section
      id={id}
      aria-labelledby="rent-due-title"
      className={cn(
        "rounded-2xl border bg-[#141414] p-4 transition-shadow",
        highlighted
          ? "border-primary/70 shadow-[0_0_0_1px_rgba(212,175,55,0.35)]"
          : lateCount > 0
            ? "border-[#FF85A1]/25"
            : "border-border/70",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3
          id="rent-due-title"
          className="flex items-center gap-2 font-serif text-lg tracking-normal text-[#F8F9FA]"
        >
          <Banknote className="size-4 text-[#A2E8DD]" aria-hidden="true" />
          {t("today.rentDue")}
        </h3>
        {visible.length > 0 && (
          <span dir="ltr" className="text-xs font-medium tabular-nums text-muted-foreground">
            {formatMAD(total)}
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">{t("today.noRentDue")}</p>
      ) : (
        <ul className="divide-y divide-border/50">
          <AnimatePresence initial={false}>
            {shown.map((item) => {
              const late = item.state === "late";
              return (
                <motion.li
                  key={keyOf(item)}
                  layout
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: LUXURY_EASE }}
                >
                  <SwipeRow onSwipe={() => receive(item)} label={t("today.markReceived")}>
                    <div className="flex items-center gap-3 bg-[#141414] py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-[0.95rem] text-[#F8F9FA]">
                          {item.tenantName}
                        </p>
                        <p className="truncate text-[0.7rem] text-muted-foreground">
                          <span className={late ? "text-[#FF85A1]" : undefined}>
                            {dueLabel(item)}
                          </span>
                          {" · "}
                          {item.unitName} ·{" "}
                          {t("today.rentPeriod", {
                            month: formatMonth(item.period, { style: "long" }),
                          })}
                        </p>
                      </div>
                      <span
                        dir="ltr"
                        className={cn(
                          "shrink-0 text-xs font-medium tabular-nums",
                          late ? "text-[#FF85A1]" : "text-foreground",
                        )}
                      >
                        {formatMAD(item.amountMAD)}
                      </span>
                      <ReadOnlyGuard>
                        <Button
                          size="sm"
                          variant="outlineGold"
                          onClick={() => receive(item)}
                          aria-label={`${t("today.markReceived")} · ${item.tenantName}`}
                          className="h-9 shrink-0 px-2.5 text-[0.7rem]"
                        >
                          <Check className="size-3.5 md:hidden" aria-hidden="true" />
                          <span className="hidden md:inline">{t("today.markReceived")}</span>
                        </Button>
                      </ReadOnlyGuard>
                    </div>
                  </SwipeRow>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <Link
        to="/conciergerie/rent-invoices"
        className="group mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        {visible.length > LIMIT
          ? t("today.viewAllCount", { count: visible.length })
          : t("today.viewAll")}
        <ArrowRight
          className="size-3.5 rtl-flip transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </section>
  );
}
