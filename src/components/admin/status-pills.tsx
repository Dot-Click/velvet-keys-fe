import { useTranslation } from "react-i18next";
import type { AccountStatus } from "@/types/auth";
import type { PropertyStatus } from "@/types/property";
import { cn } from "@/lib/utils";

const PILL =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider";

const ACCOUNT_STYLES: Record<AccountStatus, string> = {
  active: "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]",
  readonly: "border-destructive/60 bg-destructive/15 text-[#FF85A1]",
  banned: "border-destructive bg-destructive text-destructive-foreground",
};

/** Active jade, read-only ruby outline, banned solid ruby. */
export function AccountStatusPill({
  status,
  className,
}: {
  status: AccountStatus;
  className?: string;
}) {
  const { t } = useTranslation("admin");
  return (
    <span className={cn(PILL, ACCOUNT_STYLES[status], className)}>
      {t(`accountStatus.${status}`)}
    </span>
  );
}

/** Listed properties need no badge; delisted ones get a muted ruby one. */
export function ListingBadge({
  status,
  className,
}: {
  status: PropertyStatus;
  className?: string;
}) {
  const { t } = useTranslation("admin");
  return status === "delisted" ? (
    <span
      className={cn(PILL, "border-destructive/40 bg-destructive/10 text-[#FF85A1]/80", className)}
    >
      {t("properties.delisted")}
    </span>
  ) : (
    <span className={cn(PILL, "border-border/80 bg-[#161616] text-muted-foreground", className)}>
      {t("properties.listed")}
    </span>
  );
}
