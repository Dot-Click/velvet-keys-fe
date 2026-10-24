import { addDays, differenceInDays, format } from "date-fns";
import { AlertTriangle, ArrowRight, Check, Lock, RotateCcw } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { minorToInput } from "@/components/conciergerie/bookings/booking-parts";
import { DetailDrawer } from "@/components/detail-drawer";
import { InitialsAvatar } from "@/components/initials-avatar";
import { MediaImage } from "@/components/media/media-image";
import { Button } from "@/components/ui/button";
import { CustomDateRangePicker } from "@/components/ui/custom-date-range-picker";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useGuestSearch,
  usePanelMutation,
  usePortfolioProperty,
  useProperties,
} from "@/hooks/use-portfolio-data";
import { bookingErrorKey, isStayError } from "@/lib/booking-errors";
import { today } from "@/lib/clock";
import { formatDateFields } from "@/lib/currency";
import { formatMoney, parseMoneyInput } from "@/lib/money";
import { cn } from "@/lib/utils";
import { bookingsService } from "@/services/str-service";
import type { Property, Unit } from "@/types/portfolio";
import type { CreateBookingInput, DepositStatus, Guest, PaymentStatus } from "@/types/str";

type Step = 1 | 2 | 3;
const STEPS: { step: Step; key: string }[] = [
  { step: 1, key: "steps.guest" },
  { step: 2, key: "steps.stay" },
  { step: 3, key: "steps.payment" },
];
const DEPOSIT: DepositStatus[] = ["pending", "received", "returned"];
const PAYMENT: PaymentStatus[] = ["paid", "partial", "unpaid"];
const CURRENCY = "MAD";
const GUEST_SEARCH_DELAY_MS = 300;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "Add direct booking": a 560px drawer with the Guest → Stay → Payment stepper and a live
 * summary card at the top. Airbnb and Booking.com stays arrive through sync, so the source is
 * always direct.
 */
export function DirectBookingDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation("conciergerie");
  const [formKey, setFormKey] = React.useState(0);
  const close = () => {
    onClose();
    setFormKey((key) => key + 1);
  };
  return (
    <DetailDrawer
      open={open}
      onClose={close}
      title={t("bookings.addDirectBooking")}
      subtitle={t("bookings.addDirectBookingHint")}
      width="max-w-[560px]"
    >
      <DirectBookingForm key={formKey} onDone={close} />
    </DetailDrawer>
  );
}

function DirectBookingForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const create = usePanelMutation((input: CreateBookingInput) => bookingsService.create(input));
  const properties = useProperties();
  const [step, setStep] = React.useState<Step>(1);
  const [guestName, setGuestName] = React.useState("");
  const [guestEmail, setGuestEmail] = React.useState("");
  const [guestPhone, setGuestPhone] = React.useState("");
  const [picked, setPicked] = React.useState<Guest | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [propertyId, setPropertyId] = React.useState<string | null>(null);
  const [unitId, setUnitId] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<{ from: Date; to: Date }>(() => ({
    from: today(),
    to: addDays(today(), 3),
  }));
  const [guestsCount, setGuestsCount] = React.useState("2");
  const [amount, setAmount] = React.useState("");
  const [deposit, setDeposit] = React.useState<DepositStatus>("pending");
  const [payment, setPayment] = React.useState<PaymentStatus>("unpaid");
  const [notes, setNotes] = React.useState("");
  const [errors, setErrors] = React.useState<{
    name?: boolean;
    email?: boolean;
    unit?: boolean;
    guests?: boolean;
    amount?: boolean;
  }>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Properties that can take bookings: not delisted and holding at least one STR unit
  const bookable = React.useMemo(
    () =>
      (properties.data ?? []).filter(
        (property) => property.status === "active" && property.unitCounts.str > 0,
      ),
    [properties.data],
  );
  const activePropertyId = propertyId ?? (bookable.length === 1 ? (bookable[0]?.id ?? null) : null);
  const propertyDetail = usePortfolioProperty(activePropertyId);
  const strUnits = React.useMemo(
    () =>
      (propertyDetail.data?.units ?? []).filter(
        (unit) => unit.type === "STR" && unit.archivedAt === null,
      ),
    [propertyDetail.data],
  );
  const selectedProperty = bookable.find((property) => property.id === activePropertyId);
  const selectedUnit = strUnits.find((unit) => unit.id === unitId);

  // Returning-guest lookup against the backend once typing pauses
  React.useEffect(() => {
    if (picked) return;
    const handle = window.setTimeout(() => setSearchTerm(guestName), GUEST_SEARCH_DELAY_MS);
    return () => window.clearTimeout(handle);
  }, [guestName, picked]);
  const guestSearch = useGuestSearch(picked ? "" : searchTerm);
  const suggestions = picked ? [] : (guestSearch.data ?? []);

  const nights = Math.max(0, differenceInDays(range.to, range.from));
  const checkIn = format(range.from, "yyyy-MM-dd");
  const checkOut = format(range.to, "yyyy-MM-dd");

  // A conflict / validation banner describes the dates and unit that were submitted: drop it as
  // soon as any of them changes instead of leaving it until the next submit.
  const stayKey = `${activePropertyId ?? ""}|${unitId ?? ""}|${checkIn}|${checkOut}`;
  React.useEffect(() => {
    setSubmitError(null);
  }, [stayKey]);
  const amountMinor = amount.trim() === "" ? null : parseMoneyInput(amount, CURRENCY);
  const guestsNumber = Number(guestsCount);
  const suggestedMinor =
    selectedUnit?.nightlyRateMinor != null && nights > 0
      ? selectedUnit.nightlyRateMinor * nights
      : null;

  const onGuestName = (value: string) => {
    setGuestName(value);
    setPicked(null);
    setErrors((current) => ({ ...current, name: false }));
  };

  const pickGuest = (guest: Guest) => {
    setPicked(guest);
    setGuestName(guest.name);
    setGuestEmail(guest.email ?? "");
    setGuestPhone(guest.phone ?? "");
  };

  const clearPicked = () => {
    setPicked(null);
    setGuestEmail("");
    setGuestPhone("");
  };

  const guestOk = () => {
    const nameMissing = guestName.trim() === "";
    const emailBad = !picked && guestEmail.trim() !== "" && !EMAIL_PATTERN.test(guestEmail.trim());
    setErrors((current) => ({ ...current, name: nameMissing, email: emailBad }));
    return !nameMissing && !emailBad;
  };

  const stayOk = () => {
    const unitMissing = !selectedUnit;
    const guestsBad = !Number.isInteger(guestsNumber) || guestsNumber < 1;
    setErrors((current) => ({ ...current, unit: unitMissing, guests: guestsBad }));
    return !unitMissing && !guestsBad && nights > 0;
  };

  const goTo = (next: Step) => {
    if (next > 1 && !guestOk()) {
      setStep(1);
      return;
    }
    if (next > 2 && !stayOk()) {
      setStep(2);
      return;
    }
    setStep(next);
  };

  const submit = () => {
    if (!guestOk()) return setStep(1);
    if (!stayOk() || !selectedUnit) return setStep(2);
    if (amountMinor === null || amountMinor < 0) {
      setErrors((current) => ({ ...current, amount: true }));
      return;
    }
    setSubmitError(null);
    const input: CreateBookingInput = {
      unitId: selectedUnit.id,
      ...(picked
        ? { guestId: picked.id }
        : {
            guest: {
              name: guestName.trim(),
              ...(guestEmail.trim() ? { email: guestEmail.trim() } : {}),
              ...(guestPhone.trim() ? { phone: guestPhone.trim() } : {}),
            },
          }),
      checkIn,
      checkOut,
      guestsCount: guestsNumber,
      amountMinor,
      currency: CURRENCY,
      depositStatus: deposit,
      paymentStatus: payment,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
    create.mutate(input, {
      onSuccess: () => {
        toast.success(t("bookings.created"), {
          description: t("bookings.createdDesc", {
            guest: guestName.trim(),
            unit: `${selectedProperty?.name ?? ""} · ${selectedUnit.name}`,
            amount: formatMoney(amountMinor, CURRENCY),
          }),
        });
        onDone();
      },
      onError: (error) => {
        setSubmitError(bookingErrorKey(error));
        if (isStayError(error)) setStep(2);
      },
    });
  };

  const noStrUnits = properties.isSuccess && bookable.length === 0;

  return (
    <div className="space-y-6">
      {/* Live summary */}
      <section
        aria-label={t("bookings.summaryTitle")}
        className="flex gap-4 rounded-2xl border border-primary/25 bg-[linear-gradient(160deg,rgba(212,175,55,0.08),transparent_60%)] p-3"
      >
        {selectedUnit && (
          <MediaImage
            kind="unit"
            id={selectedUnit.id}
            name={selectedUnit.name}
            variant="card"
            className="h-24 w-20 shrink-0 rounded-xl"
          />
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate font-serif text-lg leading-tight text-[#F8F9FA]">
            {selectedUnit ? selectedUnit.name : "—"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{selectedProperty?.name}</p>
          <p className="flex items-center gap-2 truncate text-xs text-foreground">
            {guestName ? (
              <>
                <InitialsAvatar name={guestName} size="sm" className="size-6 text-[0.6rem]" />
                <span className="truncate">{guestName}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{t("bookings.pendingInput")}</span>
            )}
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {formatDateFields(range.from, { day: "numeric", month: "short" })} –{" "}
            {formatDateFields(range.to, { day: "numeric", month: "short" })} ·{" "}
            {t("bookings.nights", { count: nights })}
          </p>
        </div>
        <div className="shrink-0 text-end">
          <p className="text-[0.65rem] text-muted-foreground">{t("bookings.totalRevenue")}</p>
          <p dir="ltr" className="figure-serif text-2xl leading-tight text-primary rtl:text-left">
            {amountMinor !== null ? formatMoney(amountMinor, CURRENCY) : "—"}
          </p>
        </div>
      </section>

      {/* Stepper */}
      <ol className="grid grid-cols-3 gap-2" aria-label={t("bookings.stepsLabel")}>
        {STEPS.map(({ step: item, key }) => {
          const done = item < step;
          const current = item === step;
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => goTo(item)}
                aria-current={current ? "step" : undefined}
                className="group flex w-full flex-col gap-2 text-start"
              >
                <span
                  className={cn(
                    "h-1 rounded-full transition-colors",
                    item <= step ? "bg-primary" : "bg-border",
                  )}
                />
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    current ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full border text-[0.62rem] tabular-nums",
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : current
                          ? "border-primary text-primary"
                          : "border-border",
                    )}
                  >
                    {done ? <Check className="size-3" aria-hidden="true" /> : item}
                  </span>
                  {t(`bookings.${key}`)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <div className="space-y-4">
          <div className="relative space-y-1.5">
            <label htmlFor="direct-guest" className="text-label-caps text-muted-foreground">
              {t("bookings.guestName")}
            </label>
            <Input
              id="direct-guest"
              value={guestName}
              autoComplete="off"
              onChange={(event) => onGuestName(event.target.value)}
              placeholder={t("bookings.guestNamePlaceholder")}
              aria-invalid={Boolean(errors.name)}
              className="h-11 border-border/80 bg-[#121212]"
            />
            {errors.name && (
              <p role="alert" className="text-xs text-[#FF85A1]">
                {t("bookings.guestNameRequired")}
              </p>
            )}
            {picked && (
              <p className="flex items-center justify-between gap-3 text-xs text-primary">
                <span>{t("bookings.returningSelected", { name: picked.name })}</span>
                <button
                  type="button"
                  onClick={clearPicked}
                  className="shrink-0 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {t("bookings.clearGuest")}
                </button>
              </p>
            )}
            {!picked && guestName.trim().length >= 2 && suggestions.length > 0 && (
              <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 space-y-1 overflow-y-auto rounded-xl border border-primary/40 bg-[#141414] p-2 shadow-2xl">
                <p className="px-2 py-1 text-[0.62rem] uppercase tracking-wider text-primary">
                  {t("bookings.returningGuest")}
                </p>
                {suggestions.map((guest) => (
                  <button
                    key={guest.id}
                    type="button"
                    onClick={() => pickGuest(guest)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-start text-xs transition-colors hover:bg-primary/10"
                  >
                    <InitialsAvatar name={guest.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-foreground">{guest.name}</span>
                      <span className="block truncate text-[0.68rem] text-muted-foreground">
                        {[guest.email, guest.phone].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {!picked && guestSearch.isError && guestName.trim().length >= 2 && (
              <p role="alert" className="text-xs text-muted-foreground">
                {t("bookings.guestSearchFailed")}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="direct-email" className="text-label-caps text-muted-foreground">
                {t("bookings.guestEmail")}
              </label>
              <Input
                id="direct-email"
                type="email"
                value={guestEmail}
                readOnly={Boolean(picked)}
                onChange={(event) => {
                  setGuestEmail(event.target.value);
                  setErrors((current) => ({ ...current, email: false }));
                }}
                placeholder={t("bookings.guestEmailPlaceholder")}
                aria-invalid={Boolean(errors.email)}
                className="h-11 border-border/80 bg-[#121212]"
              />
              {errors.email && (
                <p role="alert" className="text-xs text-[#FF85A1]">
                  {t("bookings.guestEmailInvalid")}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="direct-phone" className="text-label-caps text-muted-foreground">
                {t("bookings.guestPhone")}
              </label>
              <Input
                id="direct-phone"
                type="tel"
                value={guestPhone}
                readOnly={Boolean(picked)}
                onChange={(event) => setGuestPhone(event.target.value)}
                placeholder={t("bookings.guestPhonePlaceholder")}
                className="h-11 border-border/80 bg-[#121212]"
              />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {properties.isPending ? (
            <div aria-busy="true" className="space-y-2">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
              <span className="sr-only">{t("common:states.loading")}</span>
            </div>
          ) : properties.isError ? (
            <RetryNote
              message={t("bookings.unitsFailed")}
              onRetry={() => void properties.refetch()}
            />
          ) : noStrUnits ? (
            <p className="rounded-xl border border-dashed border-border/70 p-4 text-xs leading-relaxed text-muted-foreground">
              {t("bookings.noStrUnits")}
            </p>
          ) : (
            <>
              {bookable.length > 1 && (
                <div className="space-y-2">
                  <p className="text-label-caps text-muted-foreground">{t("bookings.property")}</p>
                  <PropertyChoice
                    properties={bookable}
                    value={activePropertyId}
                    onChange={(id) => {
                      setPropertyId(id);
                      setUnitId(null);
                    }}
                  />
                </div>
              )}
              <div className="space-y-2">
                <p className="text-label-caps text-muted-foreground">
                  {t("bookings.residenceUnit")}
                </p>
                {!activePropertyId ? (
                  <p className="text-xs text-muted-foreground">{t("bookings.pickPropertyFirst")}</p>
                ) : propertyDetail.isError ? (
                  <RetryNote
                    message={t("bookings.unitsFailed")}
                    onRetry={() => void propertyDetail.refetch()}
                  />
                ) : propertyDetail.isPending ? (
                  <div aria-busy="true" className="space-y-1.5">
                    <Skeleton className="h-14 rounded-xl" />
                    <Skeleton className="h-14 rounded-xl" />
                    <span className="sr-only">{t("common:states.loading")}</span>
                  </div>
                ) : strUnits.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("bookings.strOnly")}</p>
                ) : (
                  <div
                    role="radiogroup"
                    aria-label={t("bookings.residenceUnit")}
                    className="max-h-64 space-y-1.5 overflow-y-auto pe-1"
                  >
                    {strUnits.map((unit) => (
                      <UnitChoice
                        key={unit.id}
                        unit={unit}
                        selected={unitId === unit.id}
                        onSelect={() => {
                          setUnitId(unit.id);
                          setErrors((current) => ({ ...current, unit: false }));
                        }}
                      />
                    ))}
                  </div>
                )}
                {errors.unit && (
                  <p role="alert" className="text-xs text-[#FF85A1]">
                    {t("bookings.unitRequired")}
                  </p>
                )}
              </div>
            </>
          )}
          <div className="space-y-2">
            <p className="text-label-caps text-muted-foreground">{t("bookings.dates")}</p>
            <div className="rounded-xl border border-border/70 bg-[#121212] p-3">
              <CustomDateRangePicker
                value={range}
                onChange={(next) =>
                  next?.from && next.to && setRange({ from: next.from, to: next.to })
                }
              />
              {nights === 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-[#FF85A1]">
                  <AlertTriangle className="size-4" aria-hidden="true" />
                  {t("bookingDrawer.datesInvalid")}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="direct-guests" className="text-label-caps text-muted-foreground">
              {t("bookings.guestsCount")}
            </label>
            <Input
              id="direct-guests"
              type="number"
              min={1}
              value={guestsCount}
              onChange={(event) => {
                setGuestsCount(event.target.value);
                setErrors((current) => ({ ...current, guests: false }));
              }}
              aria-invalid={Boolean(errors.guests)}
              className="h-11 w-32 border-border/80 bg-[#121212]"
            />
            {errors.guests && (
              <p role="alert" className="text-xs text-[#FF85A1]">
                {t("bookings.guestsInvalid")}
              </p>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <p className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              <span className="font-medium text-primary">{t("bookings.sourceName.direct")}</span>
              {" · "}
              {t("bookings.sourceFixedHint")}
            </span>
          </p>
          <div className="space-y-1.5">
            <label htmlFor="direct-amount" className="text-label-caps text-muted-foreground">
              {t("bookings.amountLabel", { currency: CURRENCY })}
            </label>
            <Input
              id="direct-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setErrors((current) => ({ ...current, amount: false }));
              }}
              aria-invalid={Boolean(errors.amount)}
              className="h-11 border-border/80 bg-[#121212]"
            />
            {errors.amount && (
              <p role="alert" className="text-xs text-[#FF85A1]">
                {t("bookings.amountInvalid")}
              </p>
            )}
            {suggestedMinor !== null && (
              <button
                type="button"
                onClick={() => {
                  setAmount(minorToInput(suggestedMinor, CURRENCY));
                  setErrors((current) => ({ ...current, amount: false }));
                }}
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                {t("bookings.useSuggestedAmount", {
                  amount: formatMoney(suggestedMinor, CURRENCY),
                  rate: formatMoney(selectedUnit?.nightlyRateMinor ?? 0, CURRENCY),
                  nights: t("bookings.nights", { count: nights }),
                })}
              </button>
            )}
          </div>
          <Choice
            label={t("bookings.depositReceived")}
            options={DEPOSIT.map((value) => ({
              value,
              label: t(`bookings.depositStatus.${value}`),
            }))}
            value={deposit}
            onChange={setDeposit}
          />
          <Choice
            label={t("bookings.paymentStatus")}
            options={PAYMENT.map((value) => ({
              value,
              label: t(`bookings.paymentStatusName.${value}`),
            }))}
            value={payment}
            onChange={setPayment}
          />
          <div className="space-y-1.5">
            <label htmlFor="direct-notes" className="text-label-caps text-muted-foreground">
              {t("bookingDrawer.internalNotes")}
            </label>
            <Textarea
              id="direct-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t("bookingDrawer.internalNotesPlaceholder")}
              rows={3}
              className="border-border/80 bg-[#121212] text-sm"
            />
          </div>
        </div>
      )}

      {submitError && (
        <p
          role="alert"
          className="rounded-lg border border-[#FF85A1]/40 bg-destructive/10 p-3 text-xs text-[#FF85A1]"
        >
          {t(submitError)}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-4">
        <Button
          variant="ghost"
          size="sm"
          disabled={step === 1}
          onClick={() => setStep((current) => (current > 1 ? ((current - 1) as Step) : current))}
          className="h-9 text-xs"
        >
          {t("common:actions.back")}
        </Button>
        {step < 3 ? (
          <Button size="sm" onClick={() => goTo((step + 1) as Step)} className="h-9 px-5">
            {t("common:actions.next")}
            <ArrowRight className="size-4 rtl-flip" aria-hidden="true" />
          </Button>
        ) : (
          <ReadOnlyGuard>
            <Button size="sm" onClick={submit} disabled={create.isPending} className="h-9 px-5">
              {create.isPending ? t("forms.saving") : t("bookings.confirmBooking")}
            </Button>
          </ReadOnlyGuard>
        )}
      </div>
    </div>
  );
}

function RetryNote({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation("common");
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs"
    >
      <span className="text-[#FF85A1]">{message}</span>
      <Button type="button" variant="ghost" size="sm" onClick={onRetry} className="h-8 text-xs">
        <RotateCcw className="size-3.5" aria-hidden="true" />
        {t("states.retry")}
      </Button>
    </div>
  );
}

function PropertyChoice({
  properties,
  value,
  onChange,
}: {
  properties: Property[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  const { t } = useTranslation("conciergerie");
  return (
    <div role="radiogroup" aria-label={t("bookings.property")} className="flex flex-wrap gap-2">
      {properties.map((property) => (
        <button
          key={property.id}
          type="button"
          role="radio"
          aria-checked={value === property.id}
          onClick={() => onChange(property.id)}
          className={cn(
            "h-9 max-w-full truncate rounded-lg border px-3 text-xs transition-colors",
            value === property.id
              ? "border-primary/70 bg-primary/10 text-primary"
              : "border-border/60 bg-[#121212] text-muted-foreground hover:text-foreground",
          )}
        >
          {property.name}
        </button>
      ))}
    </div>
  );
}

function UnitChoice({
  unit,
  selected,
  onSelect,
}: {
  unit: Unit;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border p-2 text-start transition-colors",
        selected
          ? "border-primary/70 bg-primary/10"
          : "border-border/60 bg-[#141414] hover:border-primary/40",
      )}
    >
      <MediaImage
        kind="unit"
        id={unit.id}
        name={unit.name}
        variant="thumb"
        className="size-10 shrink-0 rounded-lg"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-serif text-[0.95rem] text-foreground">
          {unit.name}
        </span>
      </span>
      {unit.nightlyRateMinor !== null && (
        <span dir="ltr" className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {formatMoney(unit.nightlyRateMinor, CURRENCY)}
        </span>
      )}
    </button>
  );
}

function Choice<T extends string>({
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
    <div role="radiogroup" aria-label={label} className="space-y-1.5">
      <p className="text-label-caps text-muted-foreground">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-9 rounded-lg border text-xs transition-colors",
              value === option.value
                ? "border-primary/70 bg-primary/12 text-primary"
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
