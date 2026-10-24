import { differenceInCalendarDays } from "date-fns";
import { KeyRound, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ChannelMark } from "@/components/conciergerie/channel-badges";
import { InitialsAvatar } from "@/components/initials-avatar";
import { MediaImage } from "@/components/media/media-image";
import { SOURCE_PLATFORM } from "@/lib/channels";
import { formatDateFields } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import { CURRENCY_EXPONENT, formatMoney, type CurrencyCode } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Booking, PaymentStatus } from "@/types/str";

const PAYMENT_STYLE: Record<PaymentStatus, string> = {
  paid: "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]",
  partial: "border-primary/40 bg-primary/10 text-primary",
  unpaid: "border-[#FF85A1]/45 bg-destructive/20 text-[#FF85A1]",
};

export function PaymentPill({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation("conciergerie");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.68rem]",
        PAYMENT_STYLE[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {t(`bookings.paymentStatusName.${status}`)}
    </span>
  );
}

type StayState = "cancelled" | "checkedOut" | "checkedIn" | "modified" | "booked";

/** Where the stay stands, from what the backend recorded on it. */
export function stayStateOf(
  booking: Pick<Booking, "status" | "checkedInAt" | "checkedOutAt">,
): StayState {
  if (booking.status === "cancelled") return "cancelled";
  if (booking.checkedOutAt) return "checkedOut";
  if (booking.checkedInAt) return "checkedIn";
  if (booking.status === "modified") return "modified";
  return "booked";
}

const STAY_STYLE: Record<StayState, string> = {
  cancelled: "border-[#FF85A1]/45 bg-destructive/20 text-[#FF85A1]",
  checkedOut: "border-border/70 text-muted-foreground",
  checkedIn: "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]",
  modified: "border-primary/40 bg-primary/10 text-primary",
  booked: "border-border/70 text-muted-foreground",
};

export function StayStatePill({
  booking,
}: {
  booking: Pick<Booking, "status" | "checkedInAt" | "checkedOutAt">;
}) {
  const { t } = useTranslation("conciergerie");
  const state = stayStateOf(booking);
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.68rem]",
        STAY_STYLE[state],
      )}
    >
      {t(`bookings.stayState.${state}`)}
    </span>
  );
}

/** "12–17 Oct", or "28 Sept – 3 Oct" across months. */
export function stayRange(checkIn: string, checkOut: string) {
  const from = parseDay(checkIn);
  const to = parseDay(checkOut);
  if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
    return `${formatDateFields(from, { day: "numeric" })}–${formatDateFields(to, {
      day: "numeric",
      month: "short",
    })}`;
  }
  return `${formatDateFields(from, { day: "numeric", month: "short" })} – ${formatDateFields(to, {
    day: "numeric",
    month: "short",
  })}`;
}

export const nightsOfStay = (booking: Pick<Booking, "checkIn" | "checkOut">) =>
  differenceInCalendarDays(parseDay(booking.checkOut), parseDay(booking.checkIn));

/** Platform mark for channel stays, a key for direct ones. */
function SourceGlyph({ source }: { source: Booking["source"] }) {
  const { t } = useTranslation("conciergerie");
  const platform = SOURCE_PLATFORM[source];
  if (platform) return <ChannelMark platform={platform} className="size-4 text-[0.55rem]" />;
  return (
    <span
      role="img"
      aria-label={t("bookings.sourceName.direct")}
      title={t("bookings.sourceName.direct")}
      className="inline-grid size-4 shrink-0 place-items-center rounded-[4px] bg-primary/20 text-primary"
    >
      <KeyRound className="size-2.5" aria-hidden="true" />
    </span>
  );
}

/** Platform glyph with "Synced" for channel stays, "Direct" otherwise. */
export function SourceCell({ booking }: { booking: Pick<Booking, "source" | "synced"> }) {
  const { t } = useTranslation("conciergerie");
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs">
      <SourceGlyph source={booking.source} />
      {booking.synced ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#A2E8DD]/35 px-2 py-px text-[0.65rem] text-[#A2E8DD]">
          <RefreshCw className="size-2.5" aria-hidden="true" />
          {t("bookings.synced")}
        </span>
      ) : (
        <span className="text-muted-foreground">{t(`bookings.sourceName.${booking.source}`)}</span>
      )}
    </span>
  );
}

export function GuestCell({ booking }: { booking: Pick<Booking, "guest"> }) {
  const { guest } = booking;
  return (
    <span className="flex min-w-0 items-center gap-3">
      <InitialsAvatar name={guest.name} size="sm" />
      <span className="min-w-0">
        <span className="block truncate font-serif text-[0.98rem] text-[#F8F9FA]">
          {guest.name}
        </span>
        <span className="block truncate text-[0.7rem] text-muted-foreground">
          {guest.email ?? guest.phone ?? ""}
        </span>
      </span>
    </span>
  );
}

export function UnitCell({
  unitId,
  unitName,
  propertyName,
}: {
  unitId: string;
  unitName: string;
  propertyName: string;
}) {
  return (
    <span className="group flex min-w-0 items-center gap-3">
      <span className="overflow-hidden rounded-lg">
        <MediaImage
          kind="unit"
          id={unitId}
          name={unitName}
          variant="thumb"
          className="hover-zoom size-10 shrink-0 rounded-lg"
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[0.82rem] text-foreground">{unitName}</span>
        <span className="block truncate text-[0.7rem] text-muted-foreground">{propertyName}</span>
      </span>
    </span>
  );
}

/** Booking card for the cards view: unit tile, guest, dates, source, amount and payment. */
export function BookingCard({ booking, onOpen }: { booking: Booking; onOpen: () => void }) {
  const { t } = useTranslation("conciergerie");
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group hover-lift flex w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-[#141414] text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <span className="relative block h-36 overflow-hidden">
        <MediaImage
          kind="unit"
          id={booking.unitId}
          name={booking.unitName}
          variant="card"
          className="hover-zoom size-full"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
        <span className="absolute end-3 top-3 flex flex-col items-end gap-1">
          <PaymentPill status={booking.paymentStatus} />
          {stayStateOf(booking) !== "booked" && <StayStatePill booking={booking} />}
        </span>
        <span className="absolute inset-x-3 bottom-2 min-w-0">
          <span className="block truncate font-serif text-base text-[#F8F9FA]">
            {booking.unitName}
          </span>
          <span className="block truncate text-[0.7rem] text-muted-foreground">
            {booking.propertyName}
          </span>
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-3 p-4">
        <GuestCell booking={booking} />
        <span className="flex items-center justify-between gap-3 border-t border-border/50 pt-3 text-xs">
          <span className="tabular-nums text-foreground">
            {stayRange(booking.checkIn, booking.checkOut)}
            <span className="ms-1.5 text-muted-foreground">
              {t("bookings.nights", { count: nightsOfStay(booking) })}
            </span>
          </span>
          <SourceCell booking={booking} />
        </span>
        <span dir="ltr" className="figure-serif text-xl text-primary rtl:text-right">
          {formatMoney(booking.amountMinor, booking.currency)}
        </span>
      </span>
    </button>
  );
}

/** Minor units as the plain decimal text a form field shows ("20050" -> "200.50"), no floats. */
export function minorToInput(amountMinor: number, currency: string): string {
  const exponent = CURRENCY_EXPONENT[currency as CurrencyCode] ?? 2;
  if (exponent === 0) return String(amountMinor);
  const base = 10 ** exponent;
  const whole = Math.floor(amountMinor / base);
  const fraction = String(amountMinor % base).padStart(exponent, "0");
  return fraction.replace(/0+$/, "") ? `${whole}.${fraction.replace(/0+$/, "")}` : String(whole);
}
