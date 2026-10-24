import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Globe, KeyRound, LogOut, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import {
  AuthAlert,
  AuthField,
  authInputClassName,
  fieldErrorId,
} from "@/components/auth/auth-field";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { LanguageSwitcher } from "@/components/language-switcher";
import { TenantPage } from "@/components/tenant/tenant-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateTenantProfile } from "@/hooks/use-tenant-portal";
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordValues,
  type ProfileValues,
} from "@/lib/auth-validation";
import type { AuthProfile } from "@/types/auth";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";

export const Route = createFileRoute("/tenant/profile")({
  component: TenantProfilePage,
});

function TenantProfilePage() {
  const { t } = useTranslation("tenant");
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  if (!session) return null;

  async function handleSignOut() {
    signOut();
    await navigate({ to: "/login", replace: true });
  }

  return (
    <TenantPage
      eyebrow={t("profile.eyebrow")}
      title={t("profile.title")}
      subtitle={t("profile.subtitle")}
    >
      <DetailsForm profile={session.profile} />

      <ProfileSection icon={<Globe className="size-4" />} title={t("profile.languageTitle")}>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("profile.languageBody")}</p>
        <LanguageSwitcher variant="segmented" />
      </ProfileSection>

      <PasswordForm />

      <Button
        variant="outline"
        onClick={() => void handleSignOut()}
        className="w-full border-destructive/50 text-xs uppercase tracking-wider text-destructive-foreground hover:border-destructive hover:bg-destructive/20 hover:text-destructive-foreground sm:w-auto"
      >
        <LogOut className="size-4 rtl-flip" aria-hidden="true" />
        {t("profile.signOut")}
      </Button>
    </TenantPage>
  );
}

function ProfileSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5 rounded-2xl border border-border/80 bg-[#141414] p-6 shadow-xl sm:p-8">
      <h2 className="flex items-center gap-2.5 font-serif text-xl text-[#F8F9FA]">
        <span className="grid size-9 place-items-center rounded-full border border-primary/30 bg-primary/5 text-primary">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function DetailsForm({ profile }: { profile: AuthProfile }) {
  const { t } = useTranslation(["tenant", "auth"]);
  const save = useUpdateTenantProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: profile.displayName, phone: profile.phone ?? "" },
  });

  function onSubmit(values: ProfileValues) {
    save.mutate(
      { displayName: values.fullName, phone: values.phone },
      {
        onSuccess: (saved) => {
          reset({ fullName: saved.displayName, phone: saved.phone ?? "" });
          toast.success(t("profile.saved"));
        },
      },
    );
  }

  return (
    <ProfileSection icon={<UserRound className="size-4" />} title={t("profile.detailsTitle")}>
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {save.isError && <AuthAlert>{t("profile.saveFailed")}</AuthAlert>}
        <AuthField
          id="fullName"
          label={t("auth:fields.fullName")}
          error={errors.fullName?.message ? t(`auth:${errors.fullName.message}`) : undefined}
        >
          <Input
            id="fullName"
            autoComplete="name"
            dir="auto"
            className={authInputClassName}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? fieldErrorId("fullName") : undefined}
            {...register("fullName")}
          />
        </AuthField>
        <AuthField
          id="phone"
          label={t("auth:fields.phone")}
          error={errors.phone?.message ? t(`auth:${errors.phone.message}`) : undefined}
        >
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder={t("auth:fields.phonePlaceholder")}
            className={`${authInputClassName} rtl:text-right`}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? fieldErrorId("phone") : undefined}
            {...register("phone")}
          />
        </AuthField>
        <div className="space-y-2">
          <p className="text-label-caps text-muted-foreground">{t("auth:fields.email")}</p>
          <p
            className="rounded-xl border border-border/60 bg-[#111111] px-4 py-3 text-sm text-muted-foreground"
            dir="ltr"
          >
            {profile.email}
          </p>
          <p className="text-[0.68rem] text-muted-foreground">{t("profile.emailHint")}</p>
        </div>
        <ReadOnlyGuard className="flex w-full sm:w-auto">
          <Button
            type="submit"
            disabled={!isDirty || save.isPending}
            className="btn-shimmer w-full bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground sm:w-auto"
          >
            {save.isPending ? t("profile.saving") : t("profile.save")}
          </Button>
        </ReadOnlyGuard>
      </form>
    </ProfileSection>
  );
}

function PasswordForm() {
  const { t } = useTranslation(["tenant", "auth"]);
  const { changePassword } = useAuth();
  const [failed, setFailed] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ChangePasswordValues) {
    setFailed(false);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.password,
      });
      reset();
      toast.success(t("profile.passwordChanged"));
    } catch {
      setFailed(true);
    }
  }

  const message = (key: string | undefined) => (key ? t(`auth:${key}`) : undefined);

  return (
    <ProfileSection icon={<KeyRound className="size-4" />} title={t("profile.passwordTitle")}>
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {failed && <AuthAlert>{t("profile.passwordFailed")}</AuthAlert>}
        <AuthField
          id="currentPassword"
          label={t("auth:fields.currentPassword")}
          error={message(errors.currentPassword?.message)}
        >
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.currentPassword)}
            aria-describedby={errors.currentPassword ? fieldErrorId("currentPassword") : undefined}
            {...register("currentPassword")}
          />
        </AuthField>
        <AuthField
          id="password"
          label={t("auth:fields.newPassword")}
          error={message(errors.password?.message)}
          hint={<PasswordStrengthMeter id="password-strength" password={watch("password")} />}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder={t("auth:fields.passwordPlaceholder")}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? fieldErrorId("password") : "password-strength"}
            {...register("password")}
          />
        </AuthField>
        <AuthField
          id="confirmPassword"
          label={t("auth:fields.confirmPassword")}
          error={message(errors.confirmPassword?.message)}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder={t("auth:fields.confirmPasswordPlaceholder")}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? fieldErrorId("confirmPassword") : undefined}
            {...register("confirmPassword")}
          />
        </AuthField>
        <ReadOnlyGuard className="flex w-full sm:w-auto">
          <Button
            type="submit"
            variant="outline"
            disabled={isSubmitting}
            className="w-full text-xs uppercase tracking-wider sm:w-auto"
          >
            {isSubmitting ? t("profile.updatingPassword") : t("profile.updatePassword")}
          </Button>
        </ReadOnlyGuard>
      </form>
    </ProfileSection>
  );
}
