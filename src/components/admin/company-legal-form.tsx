import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveCompanyLegal } from "@/hooks/use-admin-data";
import { checkCompanyLegal, normalizeCompanyLegal } from "@/lib/admin";
import { ICE_DIGITS, RIB_DIGITS, digitsOnly, isValidIce, isValidRib } from "@/lib/issuer";
import type { CompanyLegal } from "@/types/platform-admin";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";

const LABEL = "text-label-caps text-muted-foreground";
const INPUT =
  "h-9 border-border/80 bg-[#111111] text-[13px] aria-[invalid=true]:border-destructive";

type Field = keyof CompanyLegal;

/** RIB grouped as you type: 3 · 3 · 16 · 2 digits. */
function groupRib(text: string) {
  const digits = digitsOnly(text).slice(0, RIB_DIGITS);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 22), digits.slice(22)]
    .filter(Boolean)
    .join(" ");
}

/** Fields that only take digits. */
const NUMERIC: readonly Field[] = ["ice", "if", "rc", "patente"];

/** The placeholder and the error that fit each field's format. */
const FORMAT: Record<Field, { hint?: string; invalid?: string }> = {
  name: {},
  address: {},
  ice: { hint: "ice", invalid: "ice" },
  if: { hint: "code", invalid: "code" },
  rc: { hint: "code", invalid: "code" },
  patente: { hint: "code", invalid: "code" },
  rib: { hint: "rib", invalid: "rib" },
};

/**
 * The company details printed on every subscription invoice. Fields may stay empty, which keeps
 * invoices Pro-forma, but a field that is filled in must be in the right format to be saved.
 */
export function CompanyLegalForm({
  value,
  onChange,
  saved,
}: {
  value: CompanyLegal;
  onChange: (value: CompanyLegal) => void;
  saved: CompanyLegal;
}) {
  const { t } = useTranslation("admin");
  const { t: tp } = useTranslation("admin-pricing");
  const save = useSaveCompanyLegal();
  const [touched, setTouched] = React.useState<ReadonlySet<Field>>(new Set());

  const issues = checkCompanyLegal(value);
  const hasInvalid = Object.values(issues).includes("invalid");
  const dirty = JSON.stringify(normalizeCompanyLegal(value)) !== JSON.stringify(saved);

  /** Why a filled-in field can't be saved, shown as soon as it's typed. */
  function problem(name: Field): string | undefined {
    const text = value[name].trim();
    if (!text) return undefined;
    if (name === "ice" && !isValidIce(text))
      return tp("settings.errors.ice", { entered: digitsOnly(text).length, total: ICE_DIGITS });
    if (name === "rib" && !isValidRib(text))
      return tp("settings.errors.rib", { entered: digitsOnly(text).length, total: RIB_DIGITS });
    if (NUMERIC.includes(name) && !/^\d+$/.test(text)) return tp("settings.errors.digits");
    if (issues[name] === "invalid") return t(`settings.form.invalid.${FORMAT[name].invalid}`);
    return undefined;
  }
  const hasProblem = (Object.keys(value) as Field[]).some((name) => problem(name));

  const touch = (field: Field) => setTouched((current) => new Set(current).add(field));
  const set = (field: Field, text: string) => {
    // Numbers drop anything that isn't a digit, and the RIB groups itself while typing
    let next = text;
    if (field === "rib") next = groupRib(text);
    else if (NUMERIC.includes(field))
      next = digitsOnly(text).slice(0, field === "ice" ? ICE_DIGITS : 24);
    onChange({ ...value, [field]: next });
  };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(new Set(Object.keys(value) as Field[]));
    if (hasInvalid || hasProblem || !dirty) return;
    save.mutate(value, {
      onSuccess: (result) => {
        onChange(result.companyLegal);
        setTouched(new Set());
        toast.success(
          t(
            !result.complete
              ? "settings.form.saved"
              : result.reissued > 0
                ? "settings.form.savedFinalReissued"
                : "settings.form.savedFinal",
          ),
        );
      },
      onError: () => toast.error(t("errors.saveFailed")),
    });
  }

  function field(name: Field, options: { multiline?: boolean; mono?: boolean } = {}) {
    const id = `legal-${name}`;
    const format = FORMAT[name];
    const error = problem(name);
    const shared = {
      id,
      value: value[name],
      onBlur: () => touch(name),
      "aria-invalid": Boolean(error),
      "aria-describedby": error ? `${id}-error` : undefined,
      placeholder: format.hint ? t(`settings.form.hint.${format.hint}`) : undefined,
    };
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className={LABEL}>
          {t(`settings.form.fields.${name}`)}
        </label>
        {options.multiline ? (
          <Textarea
            {...shared}
            onChange={(event) => set(name, event.target.value)}
            rows={2}
            dir="auto"
            className="resize-none border-border/80 bg-[#111111] text-[13px] aria-[invalid=true]:border-destructive"
          />
        ) : (
          <Input
            {...shared}
            onChange={(event) => set(name, event.target.value)}
            autoComplete="off"
            inputMode={options.mono ? "numeric" : undefined}
            {...(options.mono ? { dir: "ltr" as const } : { dir: "auto" as const })}
            className={`${INPUT} ${options.mono ? "tabular-nums" : ""}`}
          />
        )}
        {error && (
          <p id={`${id}-error`} className="text-xs text-[#FF85A1]">
            {error}
          </p>
        )}
      </div>
    );
  }

  function discard() {
    onChange(saved);
    setTouched(new Set());
  }

  return (
    <>
      <form
        id="company-legal-form"
        onSubmit={submit}
        noValidate
        className="space-y-4 rounded-lg border border-border/80 bg-[#121212] px-4 py-4"
      >
        {field("name")}
        {field("address", { multiline: true })}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field("ice", { mono: true })}
          {field("if", { mono: true })}
          {field("rc", { mono: true })}
          {field("patente", { mono: true })}
        </div>
        {field("rib", { mono: true })}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <ReadOnlyGuard>
            <Button
              type="submit"
              size="sm"
              disabled={!dirty || hasProblem || save.isPending}
              className="bg-primary font-semibold text-primary-foreground"
            >
              {save.isPending ? t("actions.saving") : t("settings.form.save")}
            </Button>
          </ReadOnlyGuard>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!dirty || save.isPending}
            onClick={discard}
            className="text-xs text-muted-foreground"
          >
            {t("settings.form.reset")}
          </Button>
        </div>
      </form>

      {dirty && (
        <div
          role="region"
          aria-label={tp("settings.unsaved.title")}
          className="fixed inset-x-0 bottom-24 lg:bottom-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-xl items-center gap-3 rounded-lg border border-primary/50 bg-[#141414]/95 px-4 py-2.5 text-[13px] shadow-lg backdrop-blur"
        >
          <span className="flex-1 font-medium text-primary">{tp("settings.unsaved.title")}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={save.isPending}
            onClick={discard}
            className="text-xs text-muted-foreground"
          >
            {tp("settings.unsaved.discard")}
          </Button>
          <Button
            type="submit"
            form="company-legal-form"
            size="sm"
            disabled={hasProblem || save.isPending}
            className="bg-primary font-semibold text-primary-foreground"
          >
            {save.isPending ? t("actions.saving") : tp("settings.unsaved.save")}
          </Button>
        </div>
      )}
    </>
  );
}
