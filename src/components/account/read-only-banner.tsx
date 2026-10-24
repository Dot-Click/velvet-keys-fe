import { Link } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { useOverdueInvoice } from "@/hooks/use-overdue-invoice";
import { useReadOnly } from "@/hooks/use-read-only";
import { billingRoute } from "@/lib/navigation";

/** Persistent ruby banner across the panel while the account is read-only, linking to Billing. */
export function ReadOnlyBanner() {
  const { t } = useTranslation("common");
  const { session } = useAuth();
  const { isAccountReadOnly } = useReadOnly();
  const { data: invoice, isLoading } = useOverdueInvoice();

  if (!isAccountReadOnly || !session) return null;
  // Billing is the account holder's screen; the rest of the team is told who can pay
  const isHolder = session.profile.isAccountHolder;

  return (
    <div
      role="status"
      className="border-b border-destructive bg-destructive text-destructive-foreground"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-8 lg:px-12">
        <LockKeyhole className="size-4 shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-xs font-medium sm:text-sm">
          <span>{t("readOnly.bannerTitle")}</span>{" "}
          {isLoading ? (
            <span
              className="gold-skeleton inline-block h-3.5 w-36 align-middle"
              aria-hidden="true"
            />
          ) : (
            <span>
              {invoice
                ? t("readOnly.bannerInvoice", { number: invoice.number })
                : t("readOnly.bannerInvoiceUnknown")}
            </span>
          )}
          {!isHolder && <span> {t("readOnly.holderPays")}</span>}
        </p>
        {isHolder && (
          <Button
            size="sm"
            variant="outline"
            asChild
            className="h-8 border-destructive-foreground/40 bg-transparent text-destructive-foreground hover:border-destructive-foreground hover:bg-destructive-foreground/10 hover:text-destructive-foreground"
          >
            <Link to={billingRoute(session.profile)}>{t("readOnly.goToBilling")}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
