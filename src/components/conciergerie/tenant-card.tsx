import { Mail, Phone, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Button } from "@/components/ui/button";
import { usePanelMutation } from "@/hooks/use-portfolio-data";
import { hasErrorCode } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import { leasesService } from "@/services/ltr-service";
import type { Tenant } from "@/types/ltr";

/**
 * "Resend invite" for the lease's tenant. The backend has no field saying whether a tenant has
 * already joined the portal (unlike the old mock's `userId`), so this always offers to resend
 * and surfaces the backend's "tenant already active" error if they have.
 */
export function ResendInviteButton({ leaseId, className }: { leaseId: string; className?: string }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const resend = usePanelMutation((_: void) => leasesService.resendTenantInvite(leaseId));

  return (
    <ReadOnlyGuard className="flex">
      <Button
        variant="outlineGold"
        size="sm"
        disabled={resend.isPending}
        onClick={() =>
          resend.mutate(undefined, {
            onSuccess: (invite) =>
              toast.success(t("tenantCard.resent", { email: invite.email }), {
                description: t("owners.resentBody"),
              }),
            onError: (error) =>
              toast.error(
                hasErrorCode(error, "VALIDATION_FAILED")
                  ? t("tenantCard.alreadyJoined")
                  : t("common:states.errorBody"),
              ),
          })
        }
        className={cn("h-9", className)}
      >
        <Send className="size-3.5 rtl-flip" aria-hidden="true" />
        {t("tenantCard.resend")}
      </Button>
    </ReadOnlyGuard>
  );
}

/** Tenant contact details for the lease. */
export function TenantCard({
  tenant,
  leaseId,
  className,
  showResend = true,
}: {
  tenant: Tenant;
  leaseId: string;
  className?: string;
  showResend?: boolean;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);

  return (
    <section
      className={cn("space-y-4 rounded-2xl border border-border/80 bg-[#141414] p-5", className)}
    >
      <div className="flex items-center gap-3">
        <InitialsAvatar name={tenant.name} size="md" tone="jade" />
        <div className="min-w-0">
          <p className="text-label-caps text-muted-foreground">{t("leaseDrawer.tenant")}</p>
          <p className="break-words font-serif text-lg font-semibold leading-tight text-foreground">
            {tenant.name}
          </p>
        </div>
      </div>

      <ul className="space-y-2 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <Mail className="size-3.5 shrink-0" aria-hidden="true" />
          <a href={`mailto:${tenant.email}`} className="truncate hover:text-foreground" dir="ltr">
            {tenant.email}
          </a>
        </li>
        {tenant.phone && (
          <li className="flex items-center gap-2">
            <Phone className="size-3.5 shrink-0" aria-hidden="true" />
            <a
              href={`tel:${tenant.phone.replace(/\s/g, "")}`}
              className="hover:text-foreground"
              dir="ltr"
            >
              {tenant.phone}
            </a>
          </li>
        )}
      </ul>

      {showResend && (
        <div className="border-t border-border/60 pt-4">
          <ResendInviteButton leaseId={leaseId} />
        </div>
      )}
    </section>
  );
}
