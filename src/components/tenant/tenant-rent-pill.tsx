import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { RentInvoiceStatus } from "@/types/ltr";

const STYLES: Record<RentInvoiceStatus, string> = {
  paid: "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]",
  unpaid: "border-primary/40 bg-primary/10 text-primary",
  late: "border-destructive/70 bg-destructive/25 text-destructive-foreground",
};

const DOTS: Record<RentInvoiceStatus, string> = {
  paid: "bg-[#A2E8DD]",
  unpaid: "bg-primary",
  late: "bg-[#FF85A1]",
};

/** Paid jade, unpaid gold, late ruby. */
export function TenantRentPill({
  status,
  className,
}: {
  status: RentInvoiceStatus;
  className?: string;
}) {
  const { t } = useTranslation("tenant");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider",
        STYLES[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOTS[status])} aria-hidden="true" />
      {t(`rentStatus.${status}`)}
    </span>
  );
}
