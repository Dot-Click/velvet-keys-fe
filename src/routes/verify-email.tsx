import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth-provider";
import { AuthHeading, AuthLayout, authPrimaryButtonClassName } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { roleDestination } from "@/lib/roles";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>): { token?: string } =>
    typeof search["token"] === "string" ? { token: search["token"] } : {},
  head: () => ({
    meta: [{ title: "Verify your email — Velvet Keys" }],
  }),
  component: VerifyEmailPage,
});

/** Landing page for the link in the verification email: confirms the token on arrival. */
function VerifyEmailPage() {
  const { t } = useTranslation("auth");
  const { token } = Route.useSearch();
  const { verifyEmail, session } = useAuth();

  const verification = useQuery({
    queryKey: ["auth", "verify-email", token],
    queryFn: async () => {
      await verifyEmail(token ?? "");
      return true;
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
    // Tokens are single-use: never reuse a cached result.
    gcTime: 0,
  });

  const continueTo = session ? roleDestination(session.profile.role) : "/login";

  return (
    <AuthLayout>
      {token && verification.isPending ? (
        <div className="space-y-6" aria-busy="true" aria-label={t("verify.verifying")}>
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <p className="sr-only">{t("verify.verifying")}</p>
        </div>
      ) : !token || verification.isError ? (
        <div className="space-y-8">
          <AuthHeading
            icon={
              <div className="grid size-14 place-items-center rounded-full border border-destructive/40 bg-destructive/10">
                <ShieldAlert className="size-6 text-destructive-foreground" />
              </div>
            }
            eyebrow={t("verify.eyebrow")}
            title={t("verify.invalidTitle")}
            description={t("verify.invalidBody")}
          />
          <Button asChild size="lg" className={authPrimaryButtonClassName}>
            <Link to="/login">
              <span>{t("verify.continue")}</span>
              <ArrowRight className="size-4 ms-2 rtl-flip" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full border border-primary/40 bg-primary/10 shadow-[0_0_40px_rgba(212,175,55,0.2)]">
            <CheckCircle2 className="size-9 text-primary" />
          </div>
          <div className="space-y-3">
            <p className="text-label-caps text-primary">{t("verify.eyebrow")}</p>
            <h2 className="font-display text-3xl uppercase tracking-[0.14em] text-[#F8F9FA]">
              {t("verify.successTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("verify.successBody")}</p>
          </div>
          <Button asChild size="lg" className={authPrimaryButtonClassName}>
            <Link to={continueTo}>
              <span>{t("verify.continue")}</span>
              <ArrowRight className="size-4 ms-2 rtl-flip" />
            </Link>
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
