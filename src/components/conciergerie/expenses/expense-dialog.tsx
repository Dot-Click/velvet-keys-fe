import { Loader2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { drawerInputClassName, DrawerField } from "@/components/conciergerie/drawer-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePanelMutation,
  usePortfolioProperty,
  useProperties,
  useWorkerList,
} from "@/hooks/use-portfolio-data";
import { isApiError } from "@/lib/apiClient";
import { toISODate } from "@/lib/dates";
import { CURRENCY_EXPONENT, parseMoneyInput, type CurrencyCode } from "@/lib/money";
import { expensesService, filesService } from "@/services/ops-service";
import type {
  CreateExpenseInput,
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  UpdateExpenseInput,
  UtilityType,
} from "@/types/ops";

const NONE = "none";
const DEFAULT_CURRENCY = "MAD";
const CATEGORIES: ExpenseCategory[] = ["worker_pay", "utility", "other"];
const UTILITY_TYPES: UtilityType[] = ["electricity", "water", "internet", "gas"];
const STATUSES: ExpenseStatus[] = ["due", "paid"];

/** Backend error codes the expense screens explain in the user's language. */
const EXPLAINED_CODES = [
  "EXPENSE_NOT_FOUND",
  "UTILITY_TYPE_REQUIRED",
  "PROPERTY_NOT_FOUND",
  "UNIT_NOT_FOUND",
  "WORKER_NOT_FOUND",
  "FILE_TOO_LARGE",
  "FILE_TYPE_NOT_ALLOWED",
  "UPLOAD_NOT_FOUND",
  "R2_NOT_CONFIGURED",
  "ACCOUNT_READ_ONLY",
  "VALIDATION_FAILED",
];

/** Locale key (conciergerie namespace) explaining a failed expense request. */
export function expenseErrorKey(error: unknown): string {
  if (isApiError(error) && EXPLAINED_CODES.includes(error.code)) {
    return `conciergerie:expenses.errors.${error.code}`;
  }
  return "conciergerie:expenses.errors.generic";
}

/** "200.50" for 20050 minor units, using integer arithmetic only. */
function minorToInput(minor: number, currency: string): string {
  const exponent = CURRENCY_EXPONENT[currency as CurrencyCode] ?? 2;
  if (exponent === 0) return String(minor);
  const base = 10 ** exponent;
  const fraction = String(minor % base).padStart(exponent, "0");
  return `${Math.floor(minor / base)}.${fraction}`;
}

interface FormState {
  propertyId: string;
  unitId: string;
  category: ExpenseCategory;
  utilityType: UtilityType;
  description: string;
  amount: string;
  date: string;
  dueDate: string;
  status: ExpenseStatus;
  workerId: string;
}

function initialState(expense: Expense | null): FormState {
  if (!expense) {
    return {
      propertyId: "",
      unitId: NONE,
      category: "other",
      utilityType: "electricity",
      description: "",
      amount: "",
      date: toISODate(new Date()),
      dueDate: "",
      status: "due",
      workerId: NONE,
    };
  }
  return {
    propertyId: expense.propertyId,
    unitId: expense.unitId ?? NONE,
    category: expense.category,
    utilityType: expense.utilityType ?? "electricity",
    description: expense.description,
    amount: minorToInput(expense.amountMinor, expense.currency),
    date: expense.date,
    dueDate: expense.dueDate ?? "",
    status: expense.status === "overdue" ? "due" : expense.status,
    workerId: expense.workerId ?? NONE,
  };
}

interface SaveInput {
  create: CreateExpenseInput | null;
  update: UpdateExpenseInput | null;
  file: File | null;
}

/** Add an expense, or edit one (property, unit and category are fixed once recorded). */
export function ExpenseDialog({
  open,
  expense,
  onClose,
}: {
  open: boolean;
  /** The expense to edit; null adds a new one. */
  expense: Expense | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border-primary/30 bg-[#141414] sm:rounded-2xl">
        {open && <ExpenseForm expense={expense} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function ExpenseForm({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const editing = expense !== null;
  const [form, setForm] = React.useState<FormState>(() => initialState(expense));
  const [file, setFile] = React.useState<File | null>(null);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [failure, setFailure] = React.useState<string | null>(null);

  const properties = useProperties();
  const property = usePortfolioProperty(form.propertyId || null);
  const workers = useWorkerList();
  const currency = expense?.currency ?? DEFAULT_CURRENCY;
  const units = (property.data?.units ?? []).filter(
    (unit) => unit.archivedAt === null || unit.id === expense?.unitId,
  );

  const save = usePanelMutation(async ({ create, update, file: receipt }: SaveInput) => {
    const receiptFileId = receipt ? await filesService.upload(receipt, "receipt") : undefined;
    if (editing && update) {
      return expensesService.update(expense.id, {
        ...update,
        ...(receiptFileId ? { receiptFileId } : {}),
      });
    }
    if (create) {
      return expensesService.create({ ...create, ...(receiptFileId ? { receiptFileId } : {}) });
    }
    throw new Error("Nothing to save");
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: Partial<Record<keyof FormState, string>> = {};
    const amountMinor = parseMoneyInput(form.amount, currency);
    if (!form.propertyId) next.propertyId = t("expenses.form.errors.property");
    if (!form.description.trim()) next.description = t("expenses.form.errors.description");
    if (amountMinor === null || amountMinor < 0) next.amount = t("expenses.form.errors.amount");
    if (!form.date) next.date = t("expenses.form.errors.date");
    setErrors(next);
    if (Object.keys(next).length > 0 || amountMinor === null) return;

    const workerId =
      form.category === "worker_pay" && form.workerId !== NONE ? form.workerId : null;
    const input: SaveInput = editing
      ? {
          create: null,
          file,
          update: {
            description: form.description.trim(),
            // Repair expenses take their cost from the maintenance ticket
            ...(expense.ticketId ? {} : { amountMinor }),
            date: form.date,
            dueDate: form.dueDate || null,
            status: form.status,
            ...(expense.category === "worker_pay" ? { workerId } : {}),
          },
        }
      : {
          update: null,
          file,
          create: {
            propertyId: form.propertyId,
            unitId: form.unitId === NONE ? null : form.unitId,
            category: form.category,
            utilityType: form.category === "utility" ? form.utilityType : null,
            description: form.description.trim(),
            amountMinor,
            currency,
            date: form.date,
            dueDate: form.dueDate || null,
            status: form.status,
            workerId,
          },
        };

    setFailure(null);
    save.mutate(input, {
      onSuccess: () => {
        toast.success(t(editing ? "expenses.form.updated" : "expenses.form.created"));
        onClose();
      },
      onError: (error) => setFailure(t(expenseErrorKey(error))),
    });
  }

  const fixed = editing;
  const amountLocked = Boolean(expense?.ticketId);

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <DialogHeader className="space-y-1.5 pe-8 text-start rtl:ps-8 sm:text-start">
        <DialogTitle className="font-serif text-2xl normal-case tracking-normal text-foreground">
          {t(editing ? "expenses.form.editTitle" : "expenses.form.addTitle")}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          {t("expenses.form.description")}
        </DialogDescription>
      </DialogHeader>

      <DrawerField
        id="expense-property"
        label={t("expenses.colProperty")}
        error={errors.propertyId}
      >
        <Select
          value={form.propertyId}
          onValueChange={(value) => {
            set("propertyId", value);
            set("unitId", NONE);
          }}
          disabled={fixed}
        >
          <SelectTrigger id="expense-property" className={drawerInputClassName}>
            <SelectValue placeholder={t("expenses.form.propertyPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {(properties.data ?? []).map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DrawerField>

      {form.propertyId && (
        <DrawerField id="expense-unit" label={t("expenses.form.unit")}>
          <Select
            value={form.unitId}
            onValueChange={(value) => set("unitId", value)}
            disabled={fixed || property.isPending}
          >
            <SelectTrigger id="expense-unit" className={drawerInputClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>{t("expenses.form.wholeProperty")}</SelectItem>
              {units.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DrawerField>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DrawerField id="expense-category" label={t("expenses.form.category")}>
          <Select
            value={form.category}
            onValueChange={(value) => set("category", value as ExpenseCategory)}
            disabled={fixed}
          >
            <SelectTrigger id="expense-category" className={drawerInputClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(fixed ? [...CATEGORIES, "repair" as const] : CATEGORIES).map((item) => (
                <SelectItem key={item} value={item}>
                  {t(`expenses.categoryName.${item}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DrawerField>

        {form.category === "utility" && (
          <DrawerField id="expense-utility" label={t("expenses.form.utilityType")}>
            <Select
              value={form.utilityType}
              onValueChange={(value) => set("utilityType", value as UtilityType)}
              disabled={fixed}
            >
              <SelectTrigger id="expense-utility" className={drawerInputClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UTILITY_TYPES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`expenses.utility.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DrawerField>
        )}

        {form.category === "worker_pay" && (
          <DrawerField id="expense-worker" label={t("expenses.form.worker")}>
            <Select value={form.workerId} onValueChange={(value) => set("workerId", value)}>
              <SelectTrigger id="expense-worker" className={drawerInputClassName}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("expenses.form.noWorker")}</SelectItem>
                {(workers.data?.items ?? []).map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DrawerField>
        )}
      </div>

      <DrawerField
        id="expense-description"
        label={t("expenses.form.descriptionLabel")}
        error={errors.description}
      >
        <Input
          id="expense-description"
          value={form.description}
          aria-invalid={Boolean(errors.description)}
          onChange={(event) => set("description", event.target.value)}
          className={drawerInputClassName}
        />
      </DrawerField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DrawerField
          id="expense-amount"
          label={t("expenses.form.amount", { currency })}
          error={errors.amount}
          hint={amountLocked ? t("expenses.form.amountLocked") : undefined}
        >
          <Input
            id="expense-amount"
            inputMode="decimal"
            dir="ltr"
            value={form.amount}
            disabled={amountLocked}
            aria-invalid={Boolean(errors.amount)}
            onChange={(event) => set("amount", event.target.value)}
            className={drawerInputClassName}
          />
        </DrawerField>

        <DrawerField id="expense-status" label={t("expenses.form.status")}>
          <Select
            value={form.status}
            onValueChange={(value) => set("status", value as ExpenseStatus)}
          >
            <SelectTrigger id="expense-status" className={drawerInputClassName}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(`expenses.status.${item}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DrawerField>

        <DrawerField id="expense-date" label={t("expenses.form.date")} error={errors.date}>
          <Input
            id="expense-date"
            type="date"
            value={form.date}
            aria-invalid={Boolean(errors.date)}
            onChange={(event) => set("date", event.target.value)}
            className={drawerInputClassName}
          />
        </DrawerField>

        <DrawerField id="expense-due" label={t("expenses.form.dueDate")}>
          <Input
            id="expense-due"
            type="date"
            value={form.dueDate}
            onChange={(event) => set("dueDate", event.target.value)}
            className={drawerInputClassName}
          />
        </DrawerField>
      </div>

      <DrawerField
        id="expense-receipt"
        label={t("expenses.form.receipt")}
        hint={
          expense?.receiptFileId && !file
            ? t("expenses.form.receiptReplace")
            : t("expenses.form.receiptHint")
        }
      >
        <Input
          id="expense-receipt"
          type="file"
          accept="image/*,application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className={`${drawerInputClassName} file:me-3 file:text-xs`}
        />
      </DrawerField>

      {failure && (
        <p
          role="alert"
          className="rounded-xl border border-[#FF85A1]/40 bg-destructive/15 p-3 text-xs text-[#FF85A1]"
        >
          {failure}
        </p>
      )}

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
          {t("common:actions.cancel")}
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending && <Loader2 className="me-1.5 size-4 animate-spin" aria-hidden="true" />}
          {t("common:actions.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
