import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatMoney } from "@/lib/money";
import type { AttentionItem } from "./today-items";

const LIMIT = 4;

/**
 * Today's open arrivals that are not fully paid and open departures still holding a deposit,
 * with a jump link to the row in the day list.
 */
export function NeedsAttention({
  items,
  onShowInList,
}: {
  items: AttentionItem[];
  onShowInList: (itemId: string) => void;
}) {
  const { t } = useTranslation("conciergerie");
  const shown = items.slice(0, LIMIT);

  return (
    <section
      aria-labelledby="needs-attention-title"
      className="group rounded-2xl border border-border/70 bg-[#141414] p-4"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3
          id="needs-attention-title"
          className="flex items-center gap-2 font-serif text-lg tracking-normal text-[#F8F9FA]"
        >
          <Bell className="icon-wiggle size-4 text-[#FF85A1]" aria-hidden="true" />
          {t("today.attention.title")}
        </h3>
        {items.length > 0 && (
          <span className="rounded-full bg-destructive/25 px-2 text-[0.65rem] font-semibold leading-5 tabular-nums text-[#FF85A1]">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">{t("today.noUrgent")}</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {shown.map(({ itemId, reason, booking }) => (
            <li key={itemId} className="flex items-start gap-3 py-2.5">
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0 text-[#FF85A1]"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-[0.82rem] font-medium text-foreground">
                  {t(`today.attention.reason.${reason}`, { name: booking.guest.name })}
                </p>
                <p className="truncate text-[0.7rem] text-muted-foreground">
                  {booking.propertyName} · {booking.unitName}
                </p>
                <p className="text-[0.7rem] tabular-nums text-muted-foreground">
                  {reason === "unpaid_arrival"
                    ? `${t(`today.attention.payment.${booking.paymentStatus}`)} · `
                    : ""}
                  <span dir="ltr">{formatMoney(booking.amountMinor, booking.currency)}</span>
                </p>
                <button
                  type="button"
                  onClick={() => onShowInList(itemId)}
                  className="group/link inline-flex items-center gap-1 text-[0.7rem] text-primary hover:underline"
                >
                  {t("today.attention.inList")}
                  <ArrowRight
                    className="size-3 rtl-flip transition-transform group-hover/link:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <Link
          to="/conciergerie/bookings"
          className="group/link mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {t("today.attention.viewBookings")}
          <ArrowRight
            className="size-3.5 rtl-flip transition-transform group-hover/link:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      )}
    </section>
  );
}
