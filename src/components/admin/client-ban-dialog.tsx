import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useSetClientBanned } from "@/hooks/use-admin-data";
import type { Account } from "@/types/account";
import { ReasonDialog } from "./reason-dialog";

/** Ban or unban confirmation. A reason is required and goes into the audit trail. */
export function ClientBanDialog({
  account,
  onClose,
}: {
  /** The client being banned or restored; the dialog is open while set */
  account: Pick<Account, "id" | "name" | "status"> | null;
  onClose: () => void;
}) {
  const { t } = useTranslation("admin");
  const setBanned = useSetClientBanned();
  const banned = account?.status === "banned";

  function confirm(reason: string) {
    if (!account) return;
    setBanned.mutate(
      { accountId: account.id, banned: !banned, reason },
      {
        onSuccess: () => {
          toast.success(t(banned ? "ban.unbanned" : "ban.banned", { client: account.name }));
          onClose();
        },
        onError: () => toast.error(t("errors.saveFailed")),
      },
    );
  }

  return (
    <ReasonDialog
      open={account !== null}
      onOpenChange={(open) => !open && onClose()}
      title={t(banned ? "ban.unbanTitle" : "ban.banTitle", { client: account?.name ?? "" })}
      description={t(banned ? "ban.unbanBody" : "ban.banBody")}
      confirmLabel={t(banned ? "client.unban" : "client.ban")}
      tone={banned ? "restore" : "danger"}
      pending={setBanned.isPending}
      onConfirm={confirm}
    />
  );
}
