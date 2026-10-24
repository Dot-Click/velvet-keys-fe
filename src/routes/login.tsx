import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth-provider";
import { AuthLayout, AuthHeading, authPrimaryButtonClassName } from "@/components/auth/auth-layout";
import { AuthAlert, AuthField, authInputClassName } from "@/components/auth/auth-field";
import { PasswordInput } from "@/components/auth/password-input";
import { LogoMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useRedirectIfAuthenticated } from "@/hooks/use-redirect-if-authenticated";
import { roleDestination } from "@/lib/roles";
import { isAuthError } from "@/services/auth-service";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Private Access — Velvet Keys" },
      {
        name: "description",
        content: "Private client workspace for estate owners and conciergerie leadership.",
      },
      { property: "og:title", content: "Private Access — Velvet Keys" },
      {
        property: "og:description",
        content: "Private client workspace for estate owners and conciergerie leadership.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

type LoginError = "invalid" | "banned" | "rateLimited" | "network" | "generic";

function errorKind(caught: unknown): LoginError {
  if (!isAuthError(caught)) return "generic";
  if (caught.code === "account_banned") return "banned";
  if (caught.code === "invalid_credentials") return "invalid";
  if (caught.code === "rate_limited") return "rateLimited";
  if (caught.code === "network") return "network";
  return "generic";
}

function LoginPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate({ from: "/login" });
  const { signIn, verifyMfa } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Set when the account has two-step verification: the code is entered in a second step
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [code, setCode] = useState("");

  useRedirectIfAuthenticated();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await signIn({ email, password });
      if (result.status === "mfa") {
        setMfaToken(result.mfaToken);
        setIsSubmitting(false);
        return;
      }
      await navigate({ to: roleDestination(result.profile.role), replace: true });
    } catch (caught) {
      setError(errorKind(caught));
      setIsSubmitting(false);
    }
  }

  async function handleMfaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mfaToken) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const profile = await verifyMfa({ mfaToken, code });
      await navigate({ to: roleDestination(profile.role), replace: true });
    } catch (caught) {
      setError(
        isAuthError(caught) && caught.code === "mfa_invalid" ? "invalid" : errorKind(caught),
      );
      setCode("");
      setIsSubmitting(false);
    }
  }

  if (mfaToken) {
    return (
      <AuthLayout>
        <AuthHeading
          icon={<ShieldCheck className="size-7 text-primary" />}
          eyebrow={t("auth:clientWorkspace")}
          title={t("auth:login.mfa.title")}
          description={t("auth:login.mfa.description")}
        />

        <form className="space-y-6" onSubmit={handleMfaSubmit} noValidate>
          {error === "invalid" && <AuthAlert>{t("auth:login.errors.mfaInvalid")}</AuthAlert>}
          {error && error !== "invalid" && (
            <AuthAlert>{t(`auth:login.errors.${errorMessageKey(error)}`)}</AuthAlert>
          )}

          <AuthField id="mfa-code" label={t("auth:login.mfa.codeLabel")}>
            <InputOTP
              id="mfa-code"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={setCode}
              autoFocus
              dir="ltr"
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </AuthField>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || code.length !== 6}
            className={authPrimaryButtonClassName}
          >
            <span>
              {isSubmitting ? t("auth:login.mfa.submitting") : t("auth:login.mfa.submit")}
            </span>
            <ArrowRight className="size-4 ms-2 rtl-flip" />
          </Button>

          <button
            type="button"
            onClick={() => {
              setMfaToken(null);
              setCode("");
              setError(null);
            }}
            className="w-full text-center text-xs font-semibold text-primary hover:underline underline-offset-4"
          >
            {t("auth:login.mfa.back")}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHeading
        icon={<LogoMark size="lg" />}
        eyebrow={t("auth:clientWorkspace")}
        title={t("auth:signIn")}
        description={t("auth:enterCredentials")}
      />

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        {error === "banned" && (
          <AuthAlert title={t("auth:login.errors.bannedTitle")}>
            {t("auth:login.errors.banned")}
          </AuthAlert>
        )}
        {error && error !== "banned" && (
          <AuthAlert>{t(`auth:login.errors.${errorMessageKey(error)}`)}</AuthAlert>
        )}

        <AuthField id="email" label={t("auth:emailLabel")}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth:emailPlaceholder")}
            className={authInputClassName}
          />
        </AuthField>

        <AuthField
          id="password"
          label={t("auth:passkeyLabel")}
          labelAction={
            <Link
              to="/forgot-password"
              className="text-[0.68rem] tracking-wider uppercase text-primary/80 hover:text-primary"
            >
              {t("auth:login.forgotPassword")}
            </Link>
          }
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth:passkeyPlaceholder")}
          />
        </AuthField>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || !email || !password}
          className={authPrimaryButtonClassName}
        >
          <span>{isSubmitting ? t("auth:authenticating") : t("auth:accessWorkspace")}</span>
          <ArrowRight className="size-4 ms-2 rtl-flip" />
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        {t("auth:login.noAccount")}{" "}
        <Link
          to="/signup"
          className="font-semibold text-primary hover:underline underline-offset-4"
        >
          {t("auth:login.createAccount")}
        </Link>
      </p>

      <div className="text-center">
        <p className="text-[0.68rem] text-muted-foreground/80 tracking-wider">
          {t("auth:protectedNotice")}
        </p>
      </div>
    </AuthLayout>
  );
}

/** i18n key under auth:login.errors for each failure kind. */
function errorMessageKey(error: LoginError) {
  if (error === "invalid") return "invalidCredentials";
  if (error === "rateLimited") return "rateLimited";
  if (error === "network") return "network";
  return "generic";
}
