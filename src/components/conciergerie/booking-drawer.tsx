import * as React from "react";
import { Check, KeyRound, Lock, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { useAuth } from "@/components/auth-provider";
import {
  nightsOfStay,
  minorToInput,
  StayStatePill,
} from "@/components/conciergerie/bookings/booking-parts";
import { GuestPoliceDetailsSection } from "@/components/conciergerie/bookings/guest-police-details";
import { ChannelMark, SyncedBadge } from "@/components/conciergerie/channel-badges";
import { DetailDrawer } from "@/components/detail-drawer";
import { InitialsAvatar } from "@/components/initials-avatar";
import { MediaImage } from "@/components/media/media-image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useBookingDetail, usePanelMutation } from "@/hooks/use-portfolio-data";
import { bookingErrorKey } from "@/lib/booking-errors";
import { SOURCE_PLATFORM } from "@/lib/channels";
import { formatDate, formatDateFields } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import { formatMoney, parseMoneyInput } from "@/lib/money";
import { hasCapability } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { bookingsService } from "@/services/str-service";
import type {
  Booking,
  DepositStatus,
  PaymentStatus,
  StayEvent,
  UpdateBookingInput,
} from "@/types/str";

const DEPOSIT_STATUSES: DepositStatus[] = ["pending", "received", "returned"];
const PAYMENT_STATUSES: PaymentStatus[] = ["paid", "partial", "unpaid"];
const STAY_EVENTS: StayEvent[] = ["booked", "checkedIn", "checkedOut", "cancelled"];

/**
 * Stay details. Direct bookings can be edited; bookings synced from Airbnb / Booking.com are
 * managed on the platform, so only their internal notes and deposit change here. The stay
 * timeline and the check-in, check-out and cancel actions come from the backend.
 */
export function BookingDrawer({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const platform = booking ? SOURCE_PLATFORM[booking.source] : undefined;
  const synced = Boolean(booking?.synced && platform);

  return (
    <DetailDrawer
      open={Boolean(booking)}
      onClose={onClose}
      title={booking?.guest.name ?? ""}
      subtitle={booking ? `${booking.propertyName} · ${booking.unitName}` : ""}
      badge={
        booking &&
        (synced ? (
          <SyncedBadge {...(platform ? { platform } : {})} />
        ) : (
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[0.62rem] uppercase tracking-wider text-primary">
            {t(`bookings.sourceName.${booking.source}`)}
          </span>
        ))
      }
    >
      {booking && <BookingBody key={booking.id} initial={booking} onClose={onClose} />}
    </DetailDrawer>
  );
}

function BookingBody({ initial, onClose }: { initial: Booking; onClose: () => void }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const { session } = useAuth();
  const canWrite = session ? hasCapability(session.profile, "operations") : false;
  const detail = useBookingDetail(initial.id);
  // The list row shows at once; the detail replaces it (and refreshes after every action)
  const booking: Booking = detail.data ?? initial;
  const timeline = detail.data?.stayTimeline;

  const platform = SOURCE_PLATFORM[booking.source];
  const cancelled = booking.status === "cancelled";
  const synced = booking.synced;
  const fullEdit = canWrite && !synced && !cancelled;
  const notesEdit = canWrite && !cancelled;
  const nights = nightsOfStay(booking);

  const [checkIn, setCheckIn] = React.useState(initial.checkIn);
  const [checkOut, setCheckOut] = React.useState(initial.checkOut);
  const [guestsCount, setGuestsCount] = React.useState(String(initial.guestsCount));
  const [amount, setAmount] = React.useState(minorToInput(initial.amountMinor, initial.currency));
  const [depositStatus, setDepositStatus] = React.useState<DepositStatus>(initial.depositStatus);
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>(initial.paymentStatus);
  const [notes, setNotes] = React.useState(initial.notes ?? "");
  const [cancelOpen, setCancelOpen] = React.useState(false);

  const save = usePanelMutation((patch: UpdateBookingInput) =>
    bookingsService.update(booking.id, patch),
  );
  const checkInAction = usePanelMutation((_input: void) => bookingsService.checkIn(booking.id));
  const checkOutAction = usePanelMutation((_input: void) => bookingsService.checkOut(booking.id));
  const cancelAction = usePanelMutation((_input: void) => bookingsService.cancel(booking.id));
  const busy =
    save.isPending || checkInAction.isPending || checkOutAction.isPending || cancelAction.isPending;

  const amountMinor = parseMoneyInput(amount, booking.currency);
  const guestsNumber = Number(guestsCount);
  const guestsValid = Number.isInteger(guestsNumber) && guestsNumber >= 1;
  const datesValid = checkIn !== "" && checkOut !== "" && checkOut > checkIn;
  const amountValid = amountMinor !== null && amountMinor >= 0;

  // Only what changed goes in the request: a synced booking accepts notes and deposit alone
  const patch: UpdateBookingInput = {};
  if (notesEdit && notes.trim() !== (booking.notes ?? "")) patch.notes = notes.trim();
  if (notesEdit && depositStatus !== booking.depositStatus) patch.depositStatus = depositStatus;
  if (fullEdit) {
    if (checkIn !== booking.checkIn) patch.checkIn = checkIn;
    if (checkOut !== booking.checkOut) patch.checkOut = checkOut;
    if (guestsValid && guestsNumber !== booking.guestsCount) patch.guestsCount = guestsNumber;
    if (amountValid && amountMinor !== booking.amountMinor) patch.amountMinor = amountMinor;
    if (paymentStatus !== booking.paymentStatus) patch.paymentStatus = paymentStatus;
  }
  const changed = Object.keys(patch).length > 0;
  const formValid = !fullEdit || (guestsValid && datesValid && amountValid);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!changed || !formValid) return;
    save.mutate(patch, {
      onSuccess: () => {
        toast.success(t(synced ? "bookingDrawer.notesSaved" : "bookingDrawer.saved"));
        onClose();
      },
      onError: (error) => toast.error(t(bookingErrorKey(error))),
    });
  }

  function run(action: typeof checkInAction, doneKey: string) {
    action.mutate(undefined, {
      onSuccess: () => toast.success(t(doneKey)),
      onError: (error) => toast.error(t(bookingErrorKey(error))),
    });
  }

  const canCheckIn = canWrite && !cancelled && !booking.checkedInAt;
  const canCheckOut =
    canWrite && !cancelled && Boolean(booking.checkedInAt) && !booking.checkedOutAt;
  const canCancel = canWrite && !cancelled && !synced;

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="relative h-44 w-full overflow-hidden rounded-xl border border-primary/25">
        <MediaImage
          kind="unit"
          id={booking.unitId}
          name={booking.unitName}
          variant="card"
          className="size-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent" />
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-serif text-xl text-[#F8F9FA]">{booking.unitName}</p>
            <p className="truncate text-xs text-muted-foreground">{booking.propertyName}</p>
          </div>
          {synced && platform ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#A2E8DD]/40 bg-[#0F1A18]/90 px-2.5 py-1 text-[0.65rem] text-[#A2E8DD] backdrop-blur">
              <ChannelMark platform={platform} className="size-3.5 text-[0.5rem]" />
              {t("bookings.syncedFrom", { platform: t(`channels.platform.${platform}`) })}
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/40 bg-[#17150F]/90 px-2.5 py-1 text-[0.65rem] text-primary backdrop-blur">
              <KeyRound className="size-3" aria-hidden="true" />
              {t("bookings.sourceName.direct")}
            </span>
          )}
        </div>
      </div>

      {synced && platform && (
        <p className="flex items-start gap-2.5 rounded-lg border border-[#A2E8DD]/30 bg-[#A2E8DD]/[0.06] p-3 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-[#A2E8DD]" aria-hidden="true" />
          {t("bookingDrawer.syncedNote", { platform: t(`channels.platform.${platform}`) })}
        </p>
      )}
      {cancelled && (
        <p
          role="status"
          className="rounded-lg border border-[#FF85A1]/40 bg-destructive/10 p-3 text-xs leading-relaxed text-[#FF85A1]"
        >
          {t("bookingDrawer.cancelledNote")}
        </p>
      )}

      {/* Guest card */}
      <section
        aria-label={t("bookingDrawer.guest")}
        className="space-y-4 rounded-xl border border-border/70 bg-[#161616] p-4"
      >
        <div className="flex items-center gap-3">
          <InitialsAvatar name={booking.guest.name} size="lg" />
          <div className="min-w-0">
            <p className="text-label-caps text-muted-foreground">{t("bookingDrawer.guest")}</p>
            <p className="truncate font-serif text-xl leading-tight text-[#F8F9FA]">
              {booking.guest.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {[booking.guest.email, booking.guest.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </section>

      {/* Police declaration (fiche de police) -- fields and generate/send action */}
      {!cancelled && (
        <GuestPoliceDetailsSection
          key={booking.guest.id}
          bookingId={booking.id}
          guest={booking.guest}
          canWrite={canWrite}
        />
      )}

      {/* Stay */}
      <section
        aria-label={t("bookingDrawer.stay")}
        className="space-y-4 rounded-xl border border-border/70 bg-[#161616] p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-label-caps text-muted-foreground">{t("bookingDrawer.stay")}</h4>
          <span className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
            <StayStatePill booking={booking} />
            {t("bookings.nights", { count: nights })}
          </span>
        </div>

        {fullEdit ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledInput
              id="booking-check-in"
              type="date"
              label={t("bookingDrawer.checkIn")}
              value={checkIn}
              onChange={setCheckIn}
            />
            <LabeledInput
              id="booking-check-out"
              type="date"
              label={t("bookingDrawer.checkOut")}
              value={checkOut}
              onChange={setCheckOut}
              invalid={!datesValid}
              {...(!datesValid ? { error: t("bookingDrawer.datesInvalid") } : {})}
            />
            <LabeledInput
              id="booking-guests"
              type="number"
              label={t("bookings.guestsCount")}
              value={guestsCount}
              onChange={setGuestsCount}
              invalid={!guestsValid}
              {...(!guestsValid ? { error: t("bookings.guestsInvalid") } : {})}
            />
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <Field
              label={t("bookingDrawer.checkIn")}
              value={formatDateFields(parseDay(booking.checkIn), {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
            <Field
              label={t("bookingDrawer.checkOut")}
              value={formatDateFields(parseDay(booking.checkOut), {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
            <Field
              label={t("bookings.guestsCount")}
              value={t("bookingDrawer.guests", { count: booking.guestsCount })}
            />
          </dl>
        )}

        {/* Stay timeline, as recorded by the backend */}
        <div className="border-t border-border/60 pt-4">
          {detail.isError ? (
            <div role="alert" className="flex items-center justify-between gap-3 text-xs">
              <span className="text-[#FF85A1]">{t("bookingDrawer.timelineFailed")}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void detail.refetch()}
                className="h-8 text-xs"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                {t("common:states.retry")}
              </Button>
            </div>
          ) : !timeline ? (
            <div aria-busy="true" className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
              <span className="sr-only">{t("common:states.loading")}</span>
            </div>
          ) : (
            <ol className="space-y-3">
              {[...timeline]
                .sort((a, b) => STAY_EVENTS.indexOf(a.event) - STAY_EVENTS.indexOf(b.event))
                .map((item) => (
                  <li key={`${item.event}-${item.at}`} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full border",
                        item.event === "cancelled"
                          ? "border-[#FF85A1] bg-destructive/20 text-[#FF85A1]"
                          : "border-[#A2E8DD] bg-[#A2E8DD]/15 text-[#A2E8DD]",
                      )}
                    >
                      <Check className="size-3" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 text-xs text-foreground">
                      {t(`bookingDrawer.timeline.${item.event}`)}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatDate(item.at, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
            </ol>
          )}
        </div>

        {(canCheckIn || canCheckOut) && (
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            {canCheckIn && (
              <ReadOnlyGuard>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(checkInAction, "bookingDrawer.checkedInDone")}
                  className="h-9 border-[#A2E8DD]/50 text-[#A2E8DD]"
                >
                  {t("bookingDrawer.checkInAction")}
                </Button>
              </ReadOnlyGuard>
            )}
            {canCheckOut && (
              <ReadOnlyGuard>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(checkOutAction, "bookingDrawer.checkedOutDone")}
                  className="h-9 border-primary/50 text-primary"
                >
                  {t("bookingDrawer.checkOutAction")}
                </Button>
              </ReadOnlyGuard>
            )}
          </div>
        )}
      </section>

      {/* Payment */}
      <section
        aria-label={t("bookingDrawer.payment")}
        className="space-y-3 rounded-xl border border-border/70 bg-[#161616] p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-label-caps text-muted-foreground">{t("bookingDrawer.payment")}</h4>
          <span dir="ltr" className="figure-serif text-xl text-primary">
            {formatMoney(booking.amountMinor, booking.currency)}
          </span>
        </div>
        {fullEdit && (
          <LabeledInput
            id="booking-amount"
            type="text"
            inputMode="decimal"
            label={t("bookings.amountLabel", { currency: booking.currency })}
            value={amount}
            onChange={setAmount}
            invalid={!amountValid}
            {...(!amountValid ? { error: t("bookings.amountInvalid") } : {})}
          />
        )}
        {notesEdit ? (
          <div className="space-y-4">
            <Segmented
              label={t("bookings.depositReceived")}
              options={DEPOSIT_STATUSES.map((value) => ({
                value,
                label: t(`bookings.depositStatus.${value}`),
              }))}
              value={depositStatus}
              onChange={setDepositStatus}
            />
            {fullEdit ? (
              <Segmented
                label={t("bookings.paymentStatus")}
                options={PAYMENT_STATUSES.map((value) => ({
                  value,
                  label: t(`bookings.paymentStatusName.${value}`),
                }))}
                value={paymentStatus}
                onChange={setPaymentStatus}
              />
            ) : (
              <dl className="text-xs">
                <Field
                  label={t("bookings.paymentStatus")}
                  value={t(`bookings.paymentStatusName.${booking.paymentStatus}`)}
                />
              </dl>
            )}
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <Field
              label={t("bookings.depositReceived")}
              value={t(`bookings.depositStatus.${booking.depositStatus}`)}
            />
            <Field
              label={t("bookings.paymentStatus")}
              value={t(`bookings.paymentStatusName.${booking.paymentStatus}`)}
            />
          </dl>
        )}
      </section>

      <section className="space-y-2">
        <label htmlFor="booking-notes" className="text-label-caps text-muted-foreground">
          {t("bookingDrawer.internalNotes")}
        </label>
        <Textarea
          id="booking-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={t("bookingDrawer.internalNotesPlaceholder")}
          rows={3}
          readOnly={!notesEdit}
          className="border-border/80 bg-[#161616] text-sm"
        />
        <p className="text-[0.68rem] text-muted-foreground">
          {t("bookingDrawer.internalNotesHint")}
        </p>
      </section>

      {canWrite && !cancelled && (
        <div className="flex items-center justify-between gap-3 border-t border-border/80 pt-4">
          {canCancel ? (
            <ReadOnlyGuard>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => setCancelOpen(true)}
                className="h-9 text-[#FF85A1] hover:text-[#FF85A1]"
              >
                {t("bookingDrawer.cancelBooking")}
              </Button>
            </ReadOnlyGuard>
          ) : (
            <span />
          )}
          <ReadOnlyGuard>
            <Button
              type="submit"
              size="sm"
              disabled={busy || !changed || !formValid}
              className="h-9 px-5"
            >
              {save.isPending
                ? t("forms.saving")
                : synced
                  ? t("bookingDrawer.saveNotes")
                  : t("forms.saveChanges")}
            </Button>
          </ReadOnlyGuard>
        </div>
      )}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bookingDrawer.cancelTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bookingDrawer.cancelBody", { guest: booking.guest.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("bookingDrawer.keepBooking")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                cancelAction.mutate(undefined, {
                  onSuccess: () => {
                    toast.success(t("bookingDrawer.cancelledDone"));
                    onClose();
                  },
                  onError: (error) => toast.error(t(bookingErrorKey(error))),
                })
              }
            >
              {t("bookingDrawer.cancelConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <dt className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm text-foreground">{value}</dd>
    </div>
  );
}

function LabeledInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  invalid = false,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "decimal" | "numeric" | "text";
  invalid?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        {...(inputMode ? { inputMode } : {})}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        {...(error ? { "aria-describedby": `${id}-error` } : {})}
        className="h-10 border-border/80 bg-[#121212] text-sm"
      />
      {error && (
        <p id={`${id}-error`} className="text-[0.7rem] text-[#FF85A1]">
          {error}
        </p>
      )}
    </div>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5" role="radiogroup" aria-label={label}>
      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg border py-2 text-[0.7rem] font-semibold uppercase tracking-wider transition-colors",
              value === option.value
                ? "border-primary bg-primary/15 text-primary"
                : "border-border/60 bg-[#121212] text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
