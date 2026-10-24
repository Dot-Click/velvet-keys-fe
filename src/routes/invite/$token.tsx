import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, CalendarClock, MailX, MapPin, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth-provider";
import {
  AuthAlert,
  AuthField,
  authInputClassName,
  fieldErrorId,
} from "@/components/auth/auth-field";
import { AuthHeading, AuthLayout, authPrimaryButtonClassName } from "@/components/auth/auth-layout";
import { LanguageSelect } from "@/components/auth/language-select";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrengthMeter } from "@/components/auth/password-strength-meter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { acceptInvitationSchema, type AcceptInvitationValues } from "@/lib/auth-validation";
import { formatDate } from "@/lib/currency";
import { getInitialLanguage } from "@/lib/i18n";
import { roleDestination } from "@/lib/roles";
import { isAuthError } from "@/services/auth-service";
import type { Invitation } from "@/types/auth";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({
    meta: [{ title: "Accept invitation — Velvet Keys" }],
  }),
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const { token } = Route.useParams();
  const { t } = useTranslation("auth");
  const { getInvitation } = useAuth();

  const invitation = useQuery({
    queryKey: ["auth", "invitation", token],
    queryFn: () => getInvitation(token),
    retry: false,
    staleTime: Infinity,
    // Tokens are single-use: check again on every visit.
    gcTime: 0,
  });

  const failure = invitation.error;

  return (
    <AuthLayout quote={t("invite.quote")} quoteSub={t("invite.quoteSub")}>
      {invitation.isPending ? (
        <InvitationSkeleton />
      ) : isAuthError(failure) && failure.code === "invitation_expired" ? (
        <InvitationProblem
          icon={<CalendarClock className="size-6 text-destructive-foreground" />}
          title={t("invite.expiredTitle")}
          body={t("invite.expiredBody", { name: t("invite.theInviter") })}
          action="home"
        />
      ) : isAuthError(failure) && failure.code === "invitation_accepted" ? (
        <InvitationProblem
          icon={<ShieldAlert className="size-6 text-primary" />}
          title={t("invite.acceptedTitle")}
          body={t("invite.acceptedBody")}
          action="login"
        />
      ) : invitation.isError || !invitation.data ? (
        <InvitationProblem
          icon={<MailX className="size-6 text-destructive-foreground" />}
          title={t("invite.notFoundTitle")}
          body={t("invite.notFoundBody")}
          action="home"
        />
      ) : (
        <InvitationForm invitation={invitation.data} />
      )}
    </AuthLayout>
  );
}

function InvitationSummary({ invitation }: { invitation: Invitation }) {
  const { t } = useTranslation(["auth", "common"]);
  const initials = invitation.inviterName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="space-y-4 rounded-2xl border border-primary/25 bg-[#121212] p-5">
      <div className="flex items-center gap-3">
        <Avatar className="size-11 border border-primary/40 ring-1 ring-primary/20">
          <AvatarFallback className="bg-[#1C1A14] text-xs font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{invitation.inviterName}</p>
          <p className="truncate text-xs text-muted-foreground">{invitation.accountName}</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {t("auth:invite.invitedYou", { name: invitation.inviterName })}
      </p>

      <dl className="grid gap-3 rounded-xl border border-border/70 bg-[#0E0E0E] p-4 text-xs sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-muted-foreground">{t("auth:invite.role")}</dt>
          <dd>
            <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
              {t(`common:roles.${invitation.role}`)}
            </span>
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-muted-foreground">{t("auth:invite.account")}</dt>
          <dd className="flex items-center gap-1.5 font-medium text-foreground">
            <Building2 className="size-3.5 shrink-0 text-primary" />
            <span className="truncate">{invitation.accountName}</span>
          </dd>
        </div>
        {invitation.properties && invitation.properties.length > 0 && (
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-muted-foreground">{t("auth:invite.property")}</dt>
            <dd className="flex flex-wrap gap-1.5">
              {invitation.properties.map((property) => (
                <span
                  key={property.id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-[#161616] px-2 py-1 font-medium text-foreground"
                >
                  <MapPin className="size-3.5 shrink-0 text-primary" />
                  {property.name}
                </span>
              ))}
            </dd>
          </div>
        )}
      </dl>

      <p className="text-[0.68rem] text-muted-foreground/80">
        {t("auth:invite.expires", { date: formatDate(invitation.expiresAt) })}
      </p>
    </div>
  );
}

function InvitationForm({ invitation }: { invitation: Invitation }) {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { acceptInvitation } = useAuth();
  const [formError, setFormError] = useState<"unavailable" | "generic" | null>(null);
  const {
    control,
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { name: "", password: "", confirmPassword: "", language: getInitialLanguage() },
  });

  async function onSubmit(values: AcceptInvitationValues) {
    setFormError(null);
    try {
      const profile = await acceptInvitation({
        token: invitation.token,
        name: values.name,
        password: values.password,
        language: values.language,
      });
      await navigate({ to: roleDestination(profile.role), replace: true });
    } catch (caught) {
      if (isAuthError(caught) && caught.code === "invalid_credentials") {
        setError("password", { message: "validation.passwordWrongForInvite" });
        setFormError(null);
      } else if (isAuthError(caught) && caught.code === "weak_password") {
        setError("password", { message: "validation.passwordWeak" });
        setFormError(null);
      } else {
        setFormError(isAuthError(caught) ? "unavailable" : "generic");
      }
    }
  }

  return (
    <>
      <AuthHeading eyebrow={t("invite.eyebrow")} title={t("invite.titleGeneric")} />

      <InvitationSummary invitation={invitation} />

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="text-label-caps text-foreground">{t("invite.setupTitle")}</p>
        {formError === "unavailable" && (
          <AuthAlert title={t("invite.unavailableTitle")}>{t("invite.unavailableBody")}</AuthAlert>
        )}
        {formError === "generic" && <AuthAlert>{t("login.errors.generic")}</AuthAlert>}

        <AuthField
          id="name"
          label={t("invite.nameLabel")}
          error={errors.name?.message ? t(errors.name.message) : undefined}
        >
          <Input
            id="name"
            autoComplete="name"
            placeholder={t("fields.fullNamePlaceholder")}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? fieldErrorId("name") : undefined}
            className={authInputClassName}
            {...register("name")}
          />
        </AuthField>

        <AuthField id="email" label={t("fields.email")}>
          <Input
            id="email"
            type="email"
            dir="ltr"
            value={invitation.email}
            readOnly
            aria-readonly="true"
            className={`${authInputClassName} cursor-default text-muted-foreground`}
          />
        </AuthField>

        <AuthField
          id="password"
          label={t("fields.password")}
          error={errors.password?.message ? t(errors.password.message) : undefined}
          hint={<PasswordStrengthMeter id="password-strength" password={watch("password")} />}
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

        <AuthField id="language" label={t("fields.language")}>
          <Controller
            control={control}
            name="language"
            render={({ field }) => (
              <LanguageSelect id="language" value={field.value} onChange={field.onChange} />
            )}
          />
        </AuthField>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className={authPrimaryButtonClassName}
        >
          <span>{isSubmitting ? t("invite.submitting") : t("invite.submit")}</span>
          <ArrowRight className="size-4 ms-2 rtl-flip" />
        </Button>
      </form>
    </>
  );
}

function InvitationSkeleton() {
  const { t } = useTranslation("auth");
  return (
    <div className="space-y-6" aria-busy="true" aria-label={t("invite.loading")}>
      <div className="space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-8 w-60" />
      </div>
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <p className="sr-only">{t("invite.loading")}</p>
    </div>
  );
}

function InvitationProblem({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action: "home" | "login";
}) {
  const { t } = useTranslation("auth");
  return (
    <div className="space-y-8">
      <AuthHeading
        icon={
          <div className="grid size-14 place-items-center rounded-full border border-destructive/40 bg-destructive/10">
            {icon}
          </div>
        }
        eyebrow={t("invite.eyebrow")}
        title={title}
        description={body}
      />
      <Button asChild size="lg" className={authPrimaryButtonClassName}>
        {action === "login" ? (
          <Link to="/login">
            <span>{t("invite.goToSignIn")}</span>
            <ArrowRight className="size-4 ms-2 rtl-flip" />
          </Link>
        ) : (
          <Link to="/">
            <span>{t("invite.backHome")}</span>
            <ArrowRight className="size-4 ms-2 rtl-flip" />
          </Link>
        )}
      </Button>
      {action === "home" && (
        <Link
          to="/login"
          className="block text-center text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-primary"
        >
          {t("invite.goToSignIn")}
        </Link>
      )}
    </div>
  );
}
