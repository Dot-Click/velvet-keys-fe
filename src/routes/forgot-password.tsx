import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, KeyRound, MailCheck, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import {
  AuthAlert,
  AuthField,
  authInputClassName,
  fieldErrorId,
} from "@/components/auth/auth-field";
import { AuthHeading, AuthLayout, authPrimaryButtonClassName } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/auth-validation";
import type { PasswordResetReceipt } from "@/types/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title: "Forgot password — Velvet Keys" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const { requestPasswordReset } = useAuth();
  const [receipt, setReceipt] = useState<PasswordResetReceipt | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [formError, setFormError] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  useRedirectIfAuthenticated();

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(false);
    try {
      setReceipt(await requestPasswordReset(values.email));
    } catch {
      setFormError(true);
    }
  }

  async function handleResend() {
    if (!receipt) return;
    setIsResending(true);
    try {
      setReceipt(await requestPasswordReset(receipt.email));
      toast.success(t("forgot.resent"));
    } catch {
      toast.error(t("login.errors.generic"));
    } finally {
      setIsResending(false);
    }
  }

  if (receipt) {
    return (
      <AuthLayout>
        <div className="space-y-8">
          <AuthHeading
            icon={
              <div className="grid size-16 place-items-center rounded-full border border-primary/40 bg-primary/10 shadow-[0_0_32px_rgba(212,175,55,0.18)]">
                <MailCheck className="size-7 text-primary" />
              </div>
            }
            eyebrow={t("forgot.eyebrow")}
            title={t("forgot.sentTitle")}
            description={t("forgot.sentBody", { email: receipt.email })}
          />
          <p className="rounded-xl border border-border/60 bg-[#121212] p-4 text-xs leading-relaxed text-muted-foreground">
            {t("forgot.spamHint")}
          </p>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isResending}
              onClick={() => void handleResend()}
              className="h-12 w-full rounded-xl text-xs uppercase tracking-[0.16em]"
            >
              <RotateCcw className="size-4 me-2" />
              {isResending ? t("forgot.submitting") : t("forgot.resend")}
            </Button>
            <button
              type="button"
              onClick={() => setReceipt(null)}
              className="w-full text-center text-xs text-muted-foreground hover:text-primary"
            >
              {t("forgot.useDifferentEmail")}
            </button>
          </div>

          <BackToSignIn />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeading
        icon={
          <div className="grid size-14 place-items-center rounded-full border border-primary/30 bg-[#141414]">
            <KeyRound className="size-6 text-primary" />
          </div>
        }
        eyebrow={t("forgot.eyebrow")}
        title={t("forgot.title")}
        description={t("forgot.subtitle")}
      />

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && <AuthAlert>{t("login.errors.generic")}</AuthAlert>}
        <AuthField
          id="email"
          label={t("fields.email")}
          error={errors.email?.message ? t(errors.email.message) : undefined}
        >
          <Input
            id="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            autoFocus
            placeholder={t("fields.emailPlaceholder")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? fieldErrorId("email") : undefined}
            className={authInputClassName}
            {...register("email")}
          />
        </AuthField>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className={authPrimaryButtonClassName}
        >
          <span>{isSubmitting ? t("forgot.submitting") : t("forgot.submit")}</span>
          <ArrowRight className="size-4 ms-2 rtl-flip" />
        </Button>
      </form>

      <BackToSignIn />
    </AuthLayout>
  );
}

function BackToSignIn() {
  const { t } = useTranslation("auth");
  return (
    <Link
      to="/login"
      className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-primary"
    >
      <ArrowLeft className="size-3.5 rtl-flip" />
      {t("forgot.backToSignIn")}
    </Link>
  );
}
