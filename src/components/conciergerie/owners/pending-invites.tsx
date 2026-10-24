import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { CopyField } from "@/components/copy-field";
import { Button } from "@/components/ui/button";
import { usePanelMutation, usePendingInvites } from "@/hooks/use-portfolio-data";
import { hasErrorCode } from "@/lib/apiClient";
import { formatDate } from "@/lib/currency";
import { ownersService } from "@/services/portfolio-service";
import type { PendingInvite } from "@/types/portfolio";

/** Owner invitations still waiting to be accepted, with their link so it can be shared by hand. */
export function PendingInvites() {
  const { t } = useTranslation(["conciergerie", "common"]);
  const query = usePendingInvites();
  const invites = query.data ?? [];
  if (invites.length === 0) return null;

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5">
      <div>
        <h2 className="font-serif text-lg">{t("owners.pendingInvites.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("owners.pendingInvites.description")}</p>
      </div>
      <ul className="divide-y divide-border">
        {invites.map((invite) => (
          <PendingInviteRow key={invite.id} invite={invite} />
        ))}
      </ul>
    </section>
  );
}

function PendingInviteRow({ invite }: { invite: PendingInvite }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const resend = usePanelMutation(() => ownersService.resendInvite(invite.id));

  return (
    <li className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium" dir="ltr">
          {invite.email}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("owners.pendingInvites.expires", { date: formatDate(invite.expiresAt) })}
        </p>
      </div>
      {invite.inviteUrl ? (
        <CopyField
          value={invite.inviteUrl}
          label={t("owners.pendingInvites.copyLink")}
          copiedMessage={t("owners.pendingInvites.copied")}
          className="sm:max-w-md"
        />
      ) : (
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-xs text-muted-foreground">{t("owners.pendingInvites.noLink")}</p>
          <ReadOnlyGuard>
            <Button
              variant="outline"
              size="sm"
              disabled={resend.isPending}
              onClick={() =>
                resend.mutate(undefined, {
                  onSuccess: () => toast.success(t("owners.resent", { email: invite.email })),
                  onError: (error) =>
                    toast.error(
                      hasErrorCode(error, "ACCOUNT_READ_ONLY")
                        ? t("owners.errors.readOnly")
                        : t("common:states.errorBody"),
                    ),
                })
              }
              className="h-9"
            >
              {t("owners.pendingInvites.resend")}
            </Button>
          </ReadOnlyGuard>
        </div>
      )}
    </li>
  );
}
