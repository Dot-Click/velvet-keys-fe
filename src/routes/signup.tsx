import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth-provider";
import { AccountTypeCards } from "@/components/auth/account-type-cards";
import {
  AuthAlert,
  AuthField,
  authInputClassName,
  fieldErrorId,
} from "@/components/auth/auth-field";
import { AuthHeading, AuthLayout, authPrimaryButtonClassName } from "@/components/auth/auth-layout";
import { AuthStepper } from "@/components/auth/auth-stepper";
import { LanguageSelect } from "@/components/auth/language-select";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated";
import { signupDetailsSchema, type SignupDetailsValues } from "@/lib/auth-validation";
import { getInitialLanguage } from "@/lib/i18n";
import { roleDestination } from "@/lib/roles";
import { isAuthError } from "@/services/auth-service";
import type { AuthProfile, SignupRole } from "@/types/auth";

export const Route = createFileRoute("/signup")({
  // A link such as /signup?type=conciergerie opens the form with that account type already chosen
  validateSearch: (search: Record<string, unknown>): { type?: SignupRole } => {
    const type = search["type"];
    return type === "owner" || type === "conciergerie" ? { type } : {};
  },
  head: () => ({
    meta: [{ title: "Create your account — Velvet Keys" }],
  }),
  component: SignupPage,
});

type Step = 1 | 2 | 3;

function SignupPage() {
  const { t } = useTranslation("auth");
  const [step, setStep] = useState<Step>(1);
  const { type } = Route.useSearch();
  const [role, setRole] = useState<SignupRole | null>(type ?? null);
  const [account, setAccount] = useState<AuthProfile | null>(null);

  useRedirectIfAuthenticated();

  const steps = [t("signup.steps.type"), t("signup.steps.details"), t("signup.steps.welcome")];

  return (
    <AuthLayout width="wide" quote={t("signup.quote")} quoteSub={t("signup.quoteSub")}>
      <div className="space-y-6">
        <AuthStepper steps={steps} current={step} label={t("signup.stepsLabel")} />
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
          {t("signup.stepCounter", { current: step, total: steps.length })}
        </p>
      </div>

      {step === 1 && (
        <AccountTypeStep role={role} onRoleChange={setRole} onContinue={() => setStep(2)} />
      )}
      {step === 2 && role && (
        <DetailsStep
          role={role}
          onBack={() => setStep(1)}
          onCreated={(profile) => {
            setAccount(profile);
            setStep(3);
          }}
        />
      )}
      {step === 3 && account && <SuccessStep account={account} />}
    </AuthLayout>
  );
}

function AccountTypeStep({
  role,
  onRoleChange,
  onContinue,
}: {
  role: SignupRole | null;
  onRoleChange: (role: SignupRole) => void;
  onContinue: () => void;
}) {
  const { t } = useTranslation("auth");

  return (
    <div className="space-y-6">
      <AuthHeading
        eyebrow={t("signup.eyebrow")}
        title={t("signup.typeTitle")}
        description={t("signup.typeSubtitle")}
      />
      <AccountTypeCards value={role} onChange={onRoleChange} />
      <Button
        type="button"
        size="lg"
        disabled={!role}
        onClick={onContinue}
        className={authPrimaryButtonClassName}
      >
        <span>{t("signup.continue")}</span>
        <ArrowRight className="size-4 ms-2 rtl-flip" />
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {t("signup.haveAccount")}{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline underline-offset-4">
          {t("signup.signIn")}
        </Link>
      </p>
    </div>
  );
}

function DetailsStep({
  role,
  onBack,
  onCreated,
}: {
  role: SignupRole;
  onBack: () => void;
  onCreated: (profile: AuthProfile) => void;
}) {
  const { t } = useTranslation("auth");
  const { signUp } = useAuth();
  const [formError, setFormError] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupDetailsValues>({
    resolver: zodResolver(signupDetailsSchema),
    defaultValues: {
      role,
      fullName: "",
      companyName: "",
      email: "",
      phone: "",
      password: "",
      language: getInitialLanguage(),
      acceptTerms: false,
    },
  });

  const password = watch("password");
  const message = (key: string | undefined) => (key ? t(key) : undefined);
  const describedBy = (id: string, hasError: boolean) => (hasError ? fieldErrorId(id) : undefined);

  async function onSubmit(values: SignupDetailsValues) {
    setFormError(false);
    try {
      const profile = await signUp({
        role: values.role,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        language: values.language,
        acceptTerms: values.acceptTerms,
        ...(values.role === "conciergerie" ? { companyName: values.companyName } : {}),
      });
      onCreated(profile);
    } catch (caught) {
      if (isAuthError(caught) && caught.code === "email_taken") {
        setError("email", { message: "validation.emailTaken" }, { shouldFocus: true });
      } else if (isAuthError(caught) && caught.code === "weak_password") {
        setError("password", { message: "validation.passwordWeak" }, { shouldFocus: true });
      } else {
        setFormError(true);
      }
    }
  }

  return (
    <div className="space-y-6">
      <AuthHeading
        eyebrow={t("signup.eyebrow")}
        title={t("signup.detailsTitle")}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-2">
            <span>
              {role === "owner"
                ? t("signup.detailsSubtitleOwner")
                : t("signup.detailsSubtitleConciergerie")}
            </span>
            <button
              type="button"
              onClick={onBack}
              className="font-semibold text-primary hover:underline underline-offset-4"
            >
              {t("signup.changeType")}
            </button>
          </span>
        }
      />

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && <AuthAlert>{t("login.errors.generic")}</AuthAlert>}

        <AuthField
          id="fullName"
          label={t("fields.fullName")}
          error={message(errors.fullName?.message)}
        >
          <Input
            id="fullName"
            autoComplete="name"
            placeholder={t("fields.fullNamePlaceholder")}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={describedBy("fullName", Boolean(errors.fullName))}
            className={authInputClassName}
            {...register("fullName")}
          />
        </AuthField>

        {role === "conciergerie" && (
          <AuthField
            id="companyName"
            label={t("fields.companyName")}
            error={message(errors.companyName?.message)}
          >
            <Input
              id="companyName"
              autoComplete="organization"
              placeholder={t("fields.companyNamePlaceholder")}
              aria-invalid={Boolean(errors.companyName)}
              aria-describedby={describedBy("companyName", Boolean(errors.companyName))}
              className={authInputClassName}
              {...register("companyName")}
            />
          </AuthField>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField id="email" label={t("fields.email")} error={message(errors.email?.message)}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              placeholder={t("fields.emailPlaceholder")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy("email", Boolean(errors.email))}
              className={authInputClassName}
              {...register("email")}
            />
          </AuthField>

          <AuthField id="phone" label={t("fields.phone")} error={message(errors.phone?.message)}>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder={t("fields.phonePlaceholder")}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={describedBy("phone", Boolean(errors.phone))}
              className={authInputClassName}
              {...register("phone")}
            />
          </AuthField>
        </div>

        <AuthField
          id="password"
          label={t("fields.password")}
          error={message(errors.password?.message)}
          hint={<PasswordStrengthMeter id="password-strength" password={password} />}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder={t("fields.passwordPlaceholder")}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? fieldErrorId("password") : "password-strength"}
            {...register("password")}
          />
        </AuthField>

        <AuthField id="language" label={t("fields.language")}>
          <Controller
            control={control}
            name="language"
            render={({ field }) => (
              <LanguageSelect id="language" value={field.value} onChange={field.onChange} />
            )}
          />
        </AuthField>

        <div className="space-y-2">
          <Controller
            control={control}
            name="acceptTerms"
            render={({ field }) => (
              <label htmlFor="acceptTerms" className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  id="acceptTerms"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  onBlur={field.onBlur}
                  aria-invalid={Boolean(errors.acceptTerms)}
                  aria-describedby={describedBy("acceptTerms", Boolean(errors.acceptTerms))}
                  className="mt-0.5"
                />
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {t("signup.termsLabel")}
                </span>
              </label>
            )}
          />
          {errors.acceptTerms?.message && (
            <p
              id={fieldErrorId("acceptTerms")}
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/15 px-2.5 py-1.5 text-xs text-destructive-foreground"
            >
              {t(errors.acceptTerms.message)}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            className="h-12 rounded-xl text-xs uppercase tracking-[0.16em] sm:w-auto"
          >
            <ArrowLeft className="size-4 me-2 rtl-flip" />
            {t("common:actions.back")}
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className={authPrimaryButtonClassName}
          >
            <span>{isSubmitting ? t("signup.submitting") : t("signup.submit")}</span>
            <ArrowRight className="size-4 ms-2 rtl-flip" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function SuccessStep({ account }: { account: AuthProfile }) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();

  return (
    <div className="space-y-8 text-center">
      <div className="mx-auto grid size-20 place-items-center rounded-full border border-primary/40 bg-primary/10 shadow-[0_0_40px_rgba(212,175,55,0.2)]">
        <CheckCircle2 className="size-9 text-primary" />
      </div>
      <div className="space-y-3">
        <p className="text-label-caps text-primary">{t("signup.successEyebrow")}</p>
        <h2 className="font-display text-3xl uppercase tracking-[0.14em] text-[#F8F9FA]">
          {t("signup.successTitle", { name: account.displayName.split(" ")[0] })}
        </h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          {account.role === "owner" ? t("signup.successOwner") : t("signup.successConciergerie")}
        </p>
      </div>
      <div className="gold-rule mx-auto w-24 opacity-80" />
      <Button
        type="button"
        size="lg"
        onClick={() => void navigate({ to: roleDestination(account.role), replace: true })}
        className={authPrimaryButtonClassName}
      >
        <span>{t("signup.enterPanel")}</span>
        <ArrowRight className="size-4 ms-2 rtl-flip" />
      </Button>
    </div>
  );
}
