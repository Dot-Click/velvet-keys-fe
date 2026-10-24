import { useTranslation } from "react-i18next";
import type { InviteStatus } from "@/types/portfolio";
import { cn } from "@/lib/utils";

/** Invite state of an Owner: invited until they accept, then active. */
export function OwnerStatusBadge({ status }: { status: InviteStatus }) {
  const { t } = useTranslation("conciergerie");
  const invited = status === "invited";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider",
        invited
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          invited ? "bg-primary animate-pulse" : "bg-[#A2E8DD]",
        )}
      />
      {t(`owners.status.${status}`)}
    </span>
  );
}
