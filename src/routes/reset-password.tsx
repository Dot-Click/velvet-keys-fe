import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth-provider";
import { AuthAlert, AuthField, fieldErrorId } from "@/components/auth/auth-field";
import { AuthHeading, AuthLayout, authPrimaryButtonClassName } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/auth-validation";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): { token?: string } =>
    typeof search["token"] === "string" ? { token: search["token"] } : {},
  head: () => ({
    meta: [{ title: "Reset password — Velvet Keys" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation("auth");
  const { token } = Route.useSearch();
  const [isDone, setIsDone] = useState(false);

  useRedirectIfAuthenticated();

  if (isDone) {
    return (
      <AuthLayout>
        <ResetSuccess />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {!token ? <InvalidResetLink /> : <ResetForm token={token} onDone={() => setIsDone(true)} />}
    </AuthLayout>
  );
}

function ResetForm({ token, onDone }: { token: string; onDone: () => void }) {
  const { t } = useTranslation("auth");
  const { resetPassword } = useAuth();
  const [linkExpired, setLinkExpired] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setLinkExpired(false);
    try {
      await resetPassword({ token, password: values.password });
      onDone();
    } catch {
      setLinkExpired(true);
    }
  }

  return (
    <>
      <AuthHeading
        icon={
          <div className="grid size-14 place-items-center rounded-full border border-primary/30 bg-[#141414]">
            <LockKeyhole className="size-6 text-primary" />
          </div>
        }
        eyebrow={t("reset.eyebrow")}
        title={t("reset.title")}
        description={t("reset.subtitleNoEmail")}
      />
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {linkExpired && (
          <AuthAlert title={t("reset.invalidTitle")}>{t("reset.invalidBody")}</AuthAlert>
        )}
        <AuthField
          id="password"
          label={t("fields.newPassword")}
          error={errors.password?.message ? t(errors.password.message) : undefined}
          hint={<PasswordStrengthMeter id="password-strength" password={watch("password")} />}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            autoFocus
            placeholder={t("fields.passwordPlaceholder")}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? fieldErrorId("password") : "password-strength"}
            {...register("password")}
          />
        </AuthField>
        <AuthField
          id="confirmPassword"
          label={t("fields.confirmPassword")}
          error={errors.confirmPassword?.message ? t(errors.confirmPassword.message) : undefined}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder={t("fields.confirmPasswordPlaceholder")}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? fieldErrorId("confirmPassword") : undefined}
            {...register("confirmPassword")}
          />
        </AuthField>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className={authPrimaryButtonClassName}
        >
          <span>{isSubmitting ? t("reset.submitting") : t("reset.submit")}</span>
          <ArrowRight className="size-4 ms-2 rtl-flip" />
        </Button>
      </form>
    </>
  );
}

function InvalidResetLink() {
  const { t } = useTranslation("auth");
  return (
    <div className="space-y-8">
      <AuthHeading
        icon={
          <div className="grid size-14 place-items-center rounded-full border border-destructive/50 bg-destructive/15">
            <ShieldAlert className="size-6 text-destructive-foreground" />
          </div>
        }
        eyebrow={t("reset.eyebrow")}
        title={t("reset.invalidTitle")}
        description={t("reset.invalidBody")}
      />
      <Button asChild size="lg" className={authPrimaryButtonClassName}>
        <Link to="/forgot-password">
          <span>{t("reset.requestNew")}</span>
          <ArrowRight className="size-4 ms-2 rtl-flip" />
        </Link>
      </Button>
      <Link
        to="/login"
        className="block text-center text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-primary"
      >
        {t("forgot.backToSignIn")}
      </Link>
    </div>
  );
}

function ResetSuccess() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  return (
    <div className="space-y-8 text-center">
      <div className="mx-auto grid size-20 place-items-center rounded-full border border-primary/40 bg-primary/10 shadow-[0_0_40px_rgba(212,175,55,0.2)]">
        <CheckCircle2 className="size-9 text-primary" />
      </div>
      <div className="space-y-3">
        <p className="text-label-caps text-primary">{t("reset.eyebrow")}</p>
        <h2 className="font-display text-3xl uppercase tracking-[0.14em] text-[#F8F9FA]">
          {t("reset.successTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("reset.successBody")}</p>
      </div>
      <Button
        type="button"
        size="lg"
        onClick={() => void navigate({ to: "/login", replace: true })}
        className={authPrimaryButtonClassName}
      >
        <span>{t("reset.signIn")}</span>
        <ArrowRight className="size-4 ms-2 rtl-flip" />
      </Button>
    </div>
  );
}
