import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { addDays, addMonths, differenceInCalendarMonths } from "date-fns";
import { BedDouble, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { DetailDrawer } from "@/components/detail-drawer";
import { Button } from "@/components/ui/button";
import { CustomDateRangePicker } from "@/components/ui/custom-date-range-picker";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaImage } from "@/components/media/media-image";
import { useAvailableLtrUnits, usePanelMutation } from "@/hooks/use-portfolio-data";
import { hasErrorCode } from "@/lib/apiClient";
import { today } from "@/lib/clock";
import { formatDate } from "@/lib/currency";
import { parseMoneyInput, formatMoney } from "@/lib/money";
import { toISODate, toMonthKey } from "@/lib/dates";
import { DEFAULT_RENT_DUE_DAY, MAX_RENT_DUE_DAY, rentDueDate } from "@/lib/rent";
import { cn } from "@/lib/utils";
import { leasesService } from "@/services/ltr-service";
import type { CreateLeaseInput } from "@/types/ltr";
import { type ContractFile, ContractUploadField } from "./contract-upload-field";
import { DrawerField, drawerInputClassName, noSpinnerClassName } from "./drawer-field";

const STEPS = ["unit", "tenant", "terms", "contract", "review"] as const;
type Step = (typeof STEPS)[number];
const CURRENCY = "MAD";

type Errors = Partial<
  Record<"unit" | "name" | "email" | "phone" | "dates" | "rent" | "deposit" | "dueDay", string>
>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DURATIONS = [6, 12, 24] as const;

/** Long-term rental units with no active lease. The backend has no dedicated "available units"
 *  endpoint, so this loads every property's units and filters to LTR ones here; the backend
 *  still rejects an overlapping lease at submit time (LEASE_OVERLAP). */

/** Five-step lease intake: unit, tenant, terms, contract, review. */
export function NewLeaseDrawer({
  open,
  onClose,
  initialUnitId = null,
}: {
  open: boolean;
  onClose: () => void;
  /** Preselects the unit, e.g. when adding a lease from the calendar */
  initialUnitId?: string | null;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const [formKey, setFormKey] = React.useState(0);
  const close = () => {
    onClose();
    setFormKey((key) => key + 1);
  };
  return (
    <DetailDrawer
      open={open}
      onClose={close}
      title={t("leaseForm.title")}
      subtitle={t("leaseForm.subtitle")}
      width="max-w-[560px]"
    >
      <NewLeaseForm
        key={`${formKey}-${initialUnitId ?? ""}`}
        onDone={close}
        initialUnitId={initialUnitId}
      />
    </DetailDrawer>
  );
}

function NewLeaseForm({
  onDone,
  initialUnitId,
}: {
  onDone: () => void;
  initialUnitId: string | null;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const navigate = useNavigate();
  const units = useAvailableLtrUnits();
  const createLease = usePanelMutation((input: CreateLeaseInput) => leasesService.create(input));

  const [step, setStep] = React.useState<Step>("unit");
  const [errors, setErrors] = React.useState<Errors>({});
  const [unitId, setUnitId] = React.useState<string | null>(initialUnitId);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  // A one-year lease starting today until the manager picks other dates
  const [range, setRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>(
    () => ({ from: today(), to: addDays(addMonths(today(), 12), -1) }),
  );
  const [rent, setRent] = React.useState("");
  const [deposit, setDeposit] = React.useState("");
  const [dueDay, setDueDay] = React.useState(String(DEFAULT_RENT_DUE_DAY));
  const [contract, setContract] = React.useState<ContractFile | null>(null);
  const [uploading, setUploading] = React.useState(false);

  const stepIndex = STEPS.indexOf(step);
  const selectedUnit = units.data?.find((row) => row.unit.id === unitId);
  const rentMinor = parseMoneyInput(rent, CURRENCY);
  const depositMinor = parseMoneyInput(deposit, CURRENCY);
  const dueDayNumber = Number(dueDay);
  const months =
    range.from && range.to ? differenceInCalendarMonths(addDays(range.to, 1), range.from) : 0;

  function validate(current: Step): Errors {
    const next: Errors = {};
    if (current === "unit" && !unitId) next.unit = t("leaseForm.errors.unitRequired");
    if (current === "tenant") {
      if (!name.trim()) next.name = t("forms.errors.nameRequired");
      if (!EMAIL_PATTERN.test(email.trim())) next.email = t("forms.errors.emailInvalid");
      if (phone.replace(/\D/g, "").length < 8) next.phone = t("leaseForm.errors.phoneInvalid");
    }
    if (current === "terms") {
      if (!range.from || !range.to) next.dates = t("leaseForm.errors.datesRequired");
      else if (toISODate(addDays(range.to, 1)) <= toISODate(today())) {
        next.dates = t("leaseForm.errors.endInPast");
      }
      if (rentMinor === null || !(rentMinor > 0)) next.rent = t("leaseForm.errors.rentInvalid");
      if (depositMinor === null || depositMinor < 0 || deposit.trim() === "") {
        next.deposit = t("leaseForm.errors.depositInvalid");
      }
      if (!Number.isInteger(dueDayNumber) || dueDayNumber < 1 || dueDayNumber > MAX_RENT_DUE_DAY) {
        next.dueDay = t("leaseForm.errors.dueDayInvalid", { max: MAX_RENT_DUE_DAY });
      }
    }
    return next;
  }

  function goNext() {
    const next = validate(step);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setStep(STEPS[Math.min(stepIndex + 1, STEPS.length - 1)]!);
  }

  function goTo(target: Step) {
    // Earlier steps are always open; later ones only once every step before them is valid
    const targetIndex = STEPS.indexOf(target);
    for (const earlier of STEPS.slice(0, targetIndex)) {
      const found = validate(earlier);
      if (Object.keys(found).length > 0) {
        setErrors(found);
        setStep(earlier);
        return;
      }
    }
    setErrors({});
    setStep(target);
  }

  function submit() {
    if (!unitId || !range.from || !range.to || rentMinor === null || depositMinor === null) return;
    const input: CreateLeaseInput = {
      unitId,
      tenant: { name: name.trim(), email: email.trim(), phone: phone.trim() },
      startDate: toISODate(range.from),
      endDate: toISODate(addDays(range.to, 1)),
      monthlyRentMinor: rentMinor,
      depositMinor,
      currency: CURRENCY,
      rentDueDay: dueDayNumber,
      ...(contract ? { contractFileId: contract.fileId } : {}),
    };
    createLease.mutate(input, {
      onSuccess: (lease) => {
        toast.success(t("leaseForm.created"), {
          description: `${selectedUnit?.property.name ?? ""} · ${selectedUnit?.unit.name ?? ""}`,
        });
        onDone();
        void navigate({ to: "/conciergerie/leases/$leaseId", params: { leaseId: lease.id } });
      },
      onError: (error) => {
        if (hasErrorCode(error, "LEASE_OVERLAP", "UNIT_NOT_LTR", "UNIT_NOT_FOUND")) {
          setErrors({ unit: t("leaseForm.errors.unitTaken") });
          setStep("unit");
        } else {
          toast.error(t("common:states.errorBody"));
        }
      },
    });
  }

  const firstDue =
    range.from && dueDayNumber >= 1 && dueDayNumber <= MAX_RENT_DUE_DAY
      ? rentDueDate(toMonthKey(range.from), dueDayNumber)
      : null;

  return (
    <div className="space-y-6">
      <ol className="grid grid-cols-5 gap-1.5" aria-label={t("leaseForm.progress")}>
        {STEPS.map((item, index) => (
          <li key={item}>
            <button
              type="button"
              onClick={() => goTo(item)}
              aria-current={item === step ? "step" : undefined}
              className="flex w-full flex-col gap-1.5 text-start"
            >
              <span
                className={cn(
                  "h-1 rounded-full transition-colors",
                  index <= stepIndex ? "bg-primary" : "bg-border",
                )}
              />
              <span
                className={cn(
                  "truncate text-[0.6rem] uppercase tracking-wider",
                  item === step ? "text-primary" : "text-muted-foreground",
                )}
              >
                {index + 1}. {t(`leaseForm.steps.${item}`)}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {step === "unit" && (
        <section className="space-y-4">
          <StepHeading title={t("leaseForm.unitTitle")} hint={t("leaseForm.unitHint")} />
          {units.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : units.isError ? (
            <RetryBox onRetry={() => void units.refetch()} />
          ) : units.data.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 p-6 text-center text-xs leading-relaxed text-muted-foreground">
              {t("leaseForm.noUnits")}
            </p>
          ) : (
            <div role="radiogroup" aria-label={t("leaseForm.unitTitle")} className="space-y-2">
              {units.data.map(({ unit, property }) => (
                <ChoiceCard
                  key={unit.id}
                  checked={unitId === unit.id}
                  onSelect={() => setUnitId(unit.id)}
                >
                  <MediaImage
                    kind="unit"
                    id={unit.id}
                    name={unit.name}
                    variant="thumb"
                    fileId={unit.imageFileId}
                    className="size-12 shrink-0 rounded-lg border border-primary/20"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-base font-semibold text-foreground">
                      {unit.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {property.name} · {property.city}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[0.68rem] text-muted-foreground">
                    <BedDouble className="size-3.5" aria-hidden="true" />
                    {unit.bedrooms}
                  </span>
                </ChoiceCard>
              ))}
            </div>
          )}
          {errors.unit && <FieldError message={errors.unit} />}
        </section>
      )}

      {step === "tenant" && (
        <section className="space-y-4">
          <StepHeading title={t("leaseForm.tenantTitle")} hint={t("leaseForm.tenantHint")} />
          <div className="space-y-4">
            <DrawerField id="tenant-name" label={t("forms.fullName")} error={errors.name}>
              <Input
                id="tenant-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("leaseForm.tenantNamePlaceholder")}
                aria-invalid={Boolean(errors.name)}
                className={drawerInputClassName}
              />
            </DrawerField>
            <DrawerField id="tenant-email" label={t("forms.email")} error={errors.email}>
              <Input
                id="tenant-email"
                type="email"
                dir="ltr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("leaseForm.tenantEmailPlaceholder")}
                aria-invalid={Boolean(errors.email)}
                className={drawerInputClassName}
              />
            </DrawerField>
            <DrawerField id="tenant-phone" label={t("leaseForm.phone")} error={errors.phone}>
              <Input
                id="tenant-phone"
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+212 6 00 00 00 00"
                aria-invalid={Boolean(errors.phone)}
                className={drawerInputClassName}
              />
            </DrawerField>
            <p className="text-[0.68rem] leading-relaxed text-muted-foreground">
              {t("leaseForm.tenantReuseNote")}
            </p>
          </div>
        </section>
      )}

      {step === "terms" && (
        <section className="space-y-5">
          <StepHeading title={t("leaseForm.termsTitle")} hint={t("leaseForm.termsHint")} />
          <DrawerField
            id="lease-dates"
            label={t("leaseForm.period")}
            error={errors.dates}
            hint={months > 0 ? t("leaseForm.months", { count: months }) : undefined}
          >
            <CustomDateRangePicker
              id="lease-dates"
              value={{ from: range.from, to: range.to }}
              onChange={(value) => setRange({ from: value?.from, to: value?.to })}
              placeholder={t("leaseForm.periodPlaceholder")}
            />
          </DrawerField>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((count) => (
              <Button
                key={count}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const from = range.from ?? today();
                  setRange({ from, to: addDays(addMonths(from, count), -1) });
                }}
                className="h-8 text-[0.68rem] uppercase tracking-wider"
              >
                {t("leaseForm.months", { count })}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DrawerField id="lease-rent" label={t("leaseForm.monthlyRent")} error={errors.rent}>
              <AmountInput
                id="lease-rent"
                value={rent}
                onChange={setRent}
                invalid={Boolean(errors.rent)}
              />
            </DrawerField>
            <DrawerField
              id="lease-deposit"
              label={t("leaseForm.deposit")}
              error={errors.deposit}
              hint={
                rentMinor && rentMinor > 0
                  ? t("leaseForm.depositHint", { amount: formatMoney(rentMinor * 2, CURRENCY) })
                  : undefined
              }
            >
              <AmountInput
                id="lease-deposit"
                value={deposit}
                onChange={setDeposit}
                invalid={Boolean(errors.deposit)}
              />
            </DrawerField>
          </div>
          <DrawerField
            id="lease-due-day"
            label={t("leaseForm.dueDay")}
            error={errors.dueDay}
            hint={firstDue ? t("leaseForm.firstDue", { date: formatDate(firstDue) }) : undefined}
          >
            <Input
              id="lease-due-day"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_RENT_DUE_DAY}
              value={dueDay}
              onChange={(event) => setDueDay(event.target.value)}
              aria-invalid={Boolean(errors.dueDay)}
              className={cn(drawerInputClassName, noSpinnerClassName, "w-28")}
            />
          </DrawerField>
        </section>
      )}

      {step === "contract" && (
        <section className="space-y-4">
          <StepHeading
            title={t("leaseForm.contractTitle")}
            hint={t("leaseForm.contractStepHint")}
          />
          <ContractUploadField
            id="lease-contract"
            value={contract}
            onChange={setContract}
            onUploadingChange={setUploading}
          />
        </section>
      )}

      {step === "review" && (
        <section className="space-y-4">
          <StepHeading title={t("leaseForm.reviewTitle")} hint={t("leaseForm.reviewHint")} />
          <dl className="divide-y divide-border/60 rounded-xl border border-border/80 bg-[#161616] text-sm">
            <ReviewRow label={t("leaseForm.steps.unit")} onEdit={() => goTo("unit")}>
              {selectedUnit ? `${selectedUnit.property.name} · ${selectedUnit.unit.name}` : ""}
            </ReviewRow>
            <ReviewRow label={t("leaseForm.steps.tenant")} onEdit={() => goTo("tenant")}>
              {name}
              <span className="block text-xs text-muted-foreground" dir="ltr">
                {email}
              </span>
            </ReviewRow>
            <ReviewRow label={t("leaseForm.period")} onEdit={() => goTo("terms")}>
              {range.from && range.to
                ? t("leases.range", { from: formatDate(range.from), to: formatDate(range.to) })
                : ""}
              <span className="block text-xs text-muted-foreground">
                {t("leaseForm.months", { count: months })}
              </span>
            </ReviewRow>
            <ReviewRow label={t("leaseForm.monthlyRent")} onEdit={() => goTo("terms")}>
              <span className="font-mono">
                {rentMinor !== null ? formatMoney(rentMinor, CURRENCY) : ""}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t("leases.dueDayLabel", { day: dueDayNumber })}
              </span>
            </ReviewRow>
            <ReviewRow label={t("leaseForm.deposit")} onEdit={() => goTo("terms")}>
              <span className="font-mono">
                {depositMinor !== null ? formatMoney(depositMinor, CURRENCY) : ""}
              </span>
            </ReviewRow>
            <ReviewRow label={t("leaseForm.contractTitle")} onEdit={() => goTo("contract")}>
              <span className="break-all">
                {contract?.name ?? t("leaseForm.contractNone")}
              </span>
            </ReviewRow>
          </dl>
          <p className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
            {t("leaseForm.inviteNote", { email: email.trim() })}
          </p>
        </section>
      )}

      <div className="flex justify-between gap-2 border-t border-border/80 pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={stepIndex === 0}
          onClick={() => setStep(STEPS[Math.max(stepIndex - 1, 0)]!)}
          className="text-xs"
        >
          {t("common:actions.back")}
        </Button>
        {step === "review" ? (
          <ReadOnlyGuard>
            <Button
              type="button"
              size="sm"
              disabled={createLease.isPending}
              onClick={submit}
              className="btn-shimmer bg-primary px-6 text-xs font-semibold uppercase tracking-wider text-primary-foreground"
            >
              {createLease.isPending ? t("forms.saving") : t("leaseForm.create")}
            </Button>
          </ReadOnlyGuard>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={step === "contract" && uploading}
            onClick={goNext}
            className="btn-shimmer bg-primary px-6 text-xs font-semibold uppercase tracking-wider text-primary-foreground"
          >
            {t("common:actions.next")}
          </Button>
        )}
      </div>
    </div>
  );
}

function StepHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="space-y-1">
      <h3 className="font-display text-lg uppercase tracking-wider text-foreground">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}

function ChoiceCard({
  checked,
  onSelect,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-colors",
        checked
          ? "border-primary bg-primary/10"
          : "border-border/70 bg-[#161616] hover:border-primary/40",
      )}
    >
      {children}
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
        aria-hidden="true"
      >
        {checked && <Check className="size-3" />}
      </span>
    </button>
  );
}

function AmountInput({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={100}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        className={cn(drawerInputClassName, noSpinnerClassName, "pe-14 font-mono")}
      />
      <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-[0.68rem] font-semibold text-muted-foreground">
        {CURRENCY}
      </span>
    </div>
  );
}

function ReviewRow({
  label,
  onEdit,
  children,
}: {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-start justify-between gap-4 p-3">
      <div className="min-w-0 space-y-0.5">
        <dt className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className="text-foreground">{children}</dd>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs text-primary hover:underline"
      >
        {t("actions.edit")}
      </button>
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p role="alert" className="text-xs text-destructive-foreground">
      {message}
    </p>
  );
}

function RetryBox({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("common");
  return (
    <div
      role="alert"
      className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-xs"
    >
      <p className="text-foreground">{t("states.errorBody")}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t("states.retry")}
      </Button>
    </div>
  );
}
