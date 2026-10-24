import { differenceInCalendarDays } from "date-fns";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { DrawerField, drawerInputClassName } from "@/components/conciergerie/drawer-field";
import { DetailDrawer } from "@/components/detail-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGuestSearch, usePanelMutation } from "@/hooks/use-portfolio-data";
import { parseDay } from "@/lib/dates";
import { formatMoney, parseMoneyInput } from "@/lib/money";
import { cn } from "@/lib/utils";
import { bookingsService, calendarService } from "@/services/str-service";
import type {
  CalendarBlockReason,
  CreateBlockInput,
  CreateBookingInput,
  DepositStatus,
  Guest,
  PaymentStatus,
} from "@/types/str";
import { calendarErrorKey } from "./calendar-errors";
import type { CalendarRow } from "./calendar-model";

export interface StayDraft {
  unitId: string;
  /** First night */
  checkIn: string;
  /** Departure day (exclusive) */
  checkOut: string;
  mode?: "stay" | "block";
}

const PAYMENT: PaymentStatus[] = ["paid", "partial", "unpaid"];
const DEPOSIT: DepositStatus[] = ["pending", "received", "returned"];
const REASONS: CalendarBlockReason[] = ["maintenance", "owner", "other"];
const CURRENCY = "MAD";

type Mode = "stay" | "block";

/** "Add direct booking" or "Block dates", opened with the unit and dates already filled in. */
export function AddStayDrawer({
  draft,
  rows,
  onClose,
}: {
  /** Null keeps the drawer closed */
  draft: StayDraft | null;
  /** Every unit on the calendar; stays are limited to the STR ones */
  rows: CalendarRow[];
  onClose: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  return (
    <DetailDrawer
      open={Boolean(draft)}
      onClose={onClose}
      title={t("calendar.addTitle")}
      subtitle={t("calendar.addBookingHint")}
    >
      {draft && (
        <DraftForms
          key={`${draft.unitId}-${draft.checkIn}-${draft.checkOut}-${draft.mode ?? "stay"}`}
          draft={draft}
          rows={rows}
          onDone={onClose}
        />
      )}
    </DetailDrawer>
  );
}

function DraftForms({
  draft,
  rows,
  onDone,
}: {
  draft: StayDraft;
  rows: CalendarRow[];
  onDone: () => void;
}) {
  const { t } = useTranslation("conciergerie");
  const [mode, setMode] = React.useState<Mode>(draft.mode ?? "stay");
  return (
    <div className="space-y-5">
      <div
        role="radiogroup"
        aria-label={t("calendar.addTitle")}
        className="flex items-center gap-0.5 rounded-lg border border-border/70 bg-[#121212] p-0.5"
      >
        {(["stay", "block"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={mode === option}
            onClick={() => setMode(option)}
            className={cn(
              "h-8 flex-1 rounded-md px-2.5 text-xs transition-colors",
              mode === option
                ? "bg-primary/15 font-medium text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`calendar.mode.${option}`)}
          </button>
        ))}
      </div>
      {mode === "stay" ? (
        <StayForm
          draft={draft}
          rows={rows.filter((row) => row.unit.type === "STR")}
          onDone={onDone}
        />
      ) : (
        <BlockForm draft={draft} rows={rows} onDone={onDone} />
      )}
    </div>
  );
}

function UnitSelect({
  id,
  value,
  rows,
  onChange,
}: {
  id: string;
  value: string;
  rows: CalendarRow[];
  onChange: (unitId: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={drawerInputClassName}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-border bg-[#141414]">
        {rows.map((row) => (
          <SelectItem key={row.unit.unitId} value={row.unit.unitId} className="text-xs">
            {row.property.propertyName} · {row.unit.unitName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StayForm({
  draft,
  rows,
  onDone,
}: {
  draft: StayDraft;
  rows: CalendarRow[];
  onDone: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const create = usePanelMutation((input: CreateBookingInput) => bookingsService.create(input));
  const [unitId, setUnitId] = React.useState(
    rows.some((row) => row.unit.unitId === draft.unitId)
      ? draft.unitId
      : (rows[0]?.unit.unitId ?? ""),
  );
  const [checkIn, setCheckIn] = React.useState(draft.checkIn);
  const [checkOut, setCheckOut] = React.useState(draft.checkOut);
  const [guestName, setGuestName] = React.useState("");
  const [picked, setPicked] = React.useState<Guest | null>(null);
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [guests, setGuests] = React.useState("2");
  const [amount, setAmount] = React.useState("");
  const [payment, setPayment] = React.useState<PaymentStatus>("unpaid");
  const [deposit, setDeposit] = React.useState<DepositStatus>("pending");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const search = useGuestSearch(picked ? "" : guestName);
  const row = rows.find((item) => item.unit.unitId === unitId);
  const nights = Math.max(0, differenceInCalendarDays(parseDay(checkOut), parseDay(checkIn)));
  const suggestions = (search.data ?? []).slice(0, 5);

  // The banner describes the unit and dates last submitted: clear it once either changes.
  React.useEffect(() => {
    setError(null);
  }, [unitId, checkIn, checkOut]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const name = (picked?.name ?? guestName).trim();
    const amountMinor = parseMoneyInput(amount.trim() === "" ? "0" : amount, CURRENCY);
    const count = Math.floor(Number(guests));
    if (!unitId) {
      setError(t("calendar.addErrors.unit"));
      return;
    }
    if (!name) {
      setError(t("calendar.addErrors.guest"));
      return;
    }
    if (nights < 1) {
      setError(t("calendar.addErrors.dates"));
      return;
    }
    if (!Number.isFinite(count) || count < 1) {
      setError(t("calendar.addErrors.guests"));
      return;
    }
    if (amountMinor === null || amountMinor < 0) {
      setError(t("calendar.addErrors.amount"));
      return;
    }
    setError(null);
    const input: CreateBookingInput = {
      unitId,
      checkIn,
      checkOut,
      guestsCount: count,
      amountMinor,
      currency: CURRENCY,
      depositStatus: deposit,
      paymentStatus: payment,
      ...(picked
        ? { guestId: picked.id }
        : {
            guest: {
              name,
              ...(email.trim() ? { email: email.trim() } : {}),
              ...(phone.trim() ? { phone: phone.trim() } : {}),
            },
          }),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
    create.mutate(input, {
      onSuccess: () => {
        toast.success(t("calendar.stayCreated"), {
          description: t("calendar.stayCreatedDesc", {
            guest: name,
            unit: row ? `${row.property.propertyName} · ${row.unit.unitName}` : "",
            amount: formatMoney(amountMinor, CURRENCY),
          }),
        });
        onDone();
      },
      onError: (caught) => setError(t(calendarErrorKey(caught))),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center justify-end text-xs tabular-nums text-muted-foreground">
        {t("calendar.nights", { count: nights })}
      </div>

      <DrawerField id="stay-unit" label={t("calendar.addFields.unit")}>
        <UnitSelect id="stay-unit" value={unitId} rows={rows} onChange={setUnitId} />
      </DrawerField>

      <div className="grid grid-cols-2 gap-3">
        <DrawerField id="stay-in" label={t("calendar.addFields.checkIn")}>
          <Input
            id="stay-in"
            type="date"
            value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)}
            className={drawerInputClassName}
          />
        </DrawerField>
        <DrawerField id="stay-out" label={t("calendar.addFields.checkOut")}>
          <Input
            id="stay-out"
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(event) => setCheckOut(event.target.value)}
            className={drawerInputClassName}
          />
        </DrawerField>
      </div>

      <DrawerField id="stay-guest" label={t("calendar.addFields.guest")}>
        <Input
          id="stay-guest"
          value={picked ? picked.name : guestName}
          onChange={(event) => {
            setPicked(null);
            setGuestName(event.target.value);
          }}
          autoComplete="off"
          className={drawerInputClassName}
        />
      </DrawerField>
      {picked ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
          <span className="min-w-0 truncate">{t("calendar.returningGuest")}</span>
          <button
            type="button"
            onClick={() => {
              setPicked(null);
              setGuestName("");
            }}
            className="shrink-0 underline-offset-2 hover:underline"
          >
            {t("calendar.newGuest")}
          </button>
        </div>
      ) : (
        suggestions.length > 0 && (
          <ul
            aria-label={t("calendar.returningGuests")}
            className="divide-y divide-border/50 overflow-hidden rounded-lg border border-border/70 bg-[#141414]"
          >
            {suggestions.map((guest) => (
              <li key={guest.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPicked(guest);
                    setEmail(guest.email ?? "");
                    setPhone(guest.phone ?? "");
                  }}
                  className="flex w-full flex-col items-start px-3 py-2 text-start text-xs hover:bg-primary/[0.06]"
                >
                  <bdi className="text-foreground">{guest.name}</bdi>
                  <span className="text-[0.68rem] text-muted-foreground">
                    {[guest.email, guest.phone].filter(Boolean).join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )
      )}
      <div className="grid grid-cols-2 gap-3">
        <DrawerField id="stay-email" label={t("calendar.addFields.email")}>
          <Input
            id="stay-email"
            type="email"
            value={email}
            disabled={Boolean(picked)}
            onChange={(event) => setEmail(event.target.value)}
            className={drawerInputClassName}
          />
        </DrawerField>
        <DrawerField id="stay-phone" label={t("calendar.addFields.phone")}>
          <Input
            id="stay-phone"
            type="tel"
            value={phone}
            disabled={Boolean(picked)}
            onChange={(event) => setPhone(event.target.value)}
            className={drawerInputClassName}
          />
        </DrawerField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DrawerField id="stay-guests" label={t("calendar.addFields.guests")}>
          <Input
            id="stay-guests"
            type="number"
            min={1}
            value={guests}
            onChange={(event) => setGuests(event.target.value)}
            className={drawerInputClassName}
          />
        </DrawerField>
        <DrawerField id="stay-amount" label={t("calendar.addFields.amount")}>
          <Input
            id="stay-amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={`${drawerInputClassName} tabular-nums`}
          />
        </DrawerField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <DrawerField id="stay-payment" label={t("calendar.addFields.payment")}>
          <Select value={payment} onValueChange={(value) => setPayment(value as PaymentStatus)}>
            <SelectTrigger id="stay-payment" className={drawerInputClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-[#141414]">
              {PAYMENT.map((value) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {t(`calendar.payment.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DrawerField>
        <DrawerField id="stay-deposit" label={t("calendar.addFields.deposit")}>
          <Select value={deposit} onValueChange={(value) => setDeposit(value as DepositStatus)}>
            <SelectTrigger id="stay-deposit" className={drawerInputClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-[#141414]">
              {DEPOSIT.map((value) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {t(`calendar.deposit.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DrawerField>
      </div>
      <DrawerField id="stay-notes" label={t("calendar.addFields.notes")}>
        <Textarea
          id="stay-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-20 border-border/80 bg-[#161616] text-xs"
        />
      </DrawerField>

      {error && (
        <p role="alert" className="text-xs text-[#FF85A1]">
          {error}
        </p>
      )}

      <ReadOnlyGuard className="flex w-full">
        <Button
          type="submit"
          disabled={create.isPending}
          className="h-11 w-full text-xs uppercase tracking-wider"
        >
          {t("calendar.addSubmit")}
        </Button>
      </ReadOnlyGuard>
    </form>
  );
}

function BlockForm({
  draft,
  rows,
  onDone,
}: {
  draft: StayDraft;
  rows: CalendarRow[];
  onDone: () => void;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const create = usePanelMutation((input: CreateBlockInput) => calendarService.createBlock(input));
  const [unitId, setUnitId] = React.useState(
    rows.some((row) => row.unit.unitId === draft.unitId)
      ? draft.unitId
      : (rows[0]?.unit.unitId ?? ""),
  );
  const [startDate, setStartDate] = React.useState(draft.checkIn);
  const [endDate, setEndDate] = React.useState(draft.checkOut);
  const [reason, setReason] = React.useState<CalendarBlockReason>("maintenance");
  const [error, setError] = React.useState<string | null>(null);
  const days = differenceInCalendarDays(parseDay(endDate), parseDay(startDate));

  React.useEffect(() => {
    setError(null);
  }, [unitId, startDate, endDate]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!unitId) {
      setError(t("calendar.addErrors.unit"));
      return;
    }
    if (days < 1) {
      setError(t("calendar.addErrors.blockDates"));
      return;
    }
    setError(null);
    create.mutate(
      { unitId, startDate, endDate, reason },
      {
        onSuccess: () => {
          toast.success(t("calendar.blockAdded"));
          onDone();
        },
        onError: (caught) => setError(t(calendarErrorKey(caught))),
      },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <DrawerField id="block-unit" label={t("calendar.addFields.unit")}>
        <UnitSelect id="block-unit" value={unitId} rows={rows} onChange={setUnitId} />
      </DrawerField>
      <div className="grid grid-cols-2 gap-3">
        <DrawerField id="block-start" label={t("calendar.blockFields.from")}>
          <Input
            id="block-start"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className={drawerInputClassName}
          />
        </DrawerField>
        <DrawerField
          id="block-end"
          label={t("calendar.blockFields.until")}
          hint={t("calendar.blockFields.untilHint")}
        >
          <Input
            id="block-end"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(event) => setEndDate(event.target.value)}
            className={drawerInputClassName}
          />
        </DrawerField>
      </div>
      <DrawerField id="block-reason" label={t("calendar.blockFields.reason")}>
        <Select value={reason} onValueChange={(value) => setReason(value as CalendarBlockReason)}>
          <SelectTrigger id="block-reason" className={drawerInputClassName}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-border bg-[#141414]">
            {REASONS.map((value) => (
              <SelectItem key={value} value={value} className="text-xs">
                {t(`calendar.blockReason.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DrawerField>

      {error && (
        <p role="alert" className="text-xs text-[#FF85A1]">
          {error}
        </p>
      )}

      <ReadOnlyGuard className="flex w-full">
        <Button
          type="submit"
          disabled={create.isPending}
          className="h-11 w-full text-xs uppercase tracking-wider"
        >
          {t("calendar.blockSubmit")}
        </Button>
      </ReadOnlyGuard>
    </form>
  );
}
