import { useTranslation } from "react-i18next";
import type { ComputedLeaseStatus, RentInvoiceStatus, RentScheduleStatus } from "@/types/ltr";
import { cn } from "@/lib/utils";

const PILL =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider";

const STATE_STYLES: Record<ComputedLeaseStatus, string> = {
  active: "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]",
  ending_soon: "border-primary/50 bg-primary/15 text-primary",
  ended: "border-border/80 bg-[#161616] text-muted-foreground",
};

/** Active / Ending soon / Ended, as the backend computes it from dates. */
export function LeaseStatePill({
  state,
  className,
}: {
  state: ComputedLeaseStatus;
  className?: string;
}) {
  const { t } = useTranslation("conciergerie");
  return (
    <span className={cn(PILL, STATE_STYLES[state], className)}>{t(`leases.state.${state}`)}</span>
  );
}

const RENT_STYLES: Record<RentScheduleStatus, string> = {
  paid: "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]",
  unpaid: "border-primary/40 bg-primary/10 text-primary",
  late: "border-destructive/70 bg-destructive/25 text-destructive-foreground",
  not_yet_generated: "border-border/80 bg-[#161616] text-muted-foreground",
};

const RENT_DOTS: Record<RentScheduleStatus, string> = {
  paid: "bg-[#A2E8DD]",
  unpaid: "bg-primary",
  late: "bg-[#FF85A1]",
  not_yet_generated: "bg-muted-foreground/50",
};

/** Rent status: paid jade, unpaid gold, late ruby; schedule rows can also be "not generated". */
export function RentStatusPill({
  status,
  className,
}: {
  status: RentInvoiceStatus | RentScheduleStatus;
  className?: string;
}) {
  const { t } = useTranslation("conciergerie");
  return (
    <span className={cn(PILL, RENT_STYLES[status], className)}>
      <span className={cn("size-1.5 rounded-full", RENT_DOTS[status])} aria-hidden="true" />
      {t(`leases.rentStatus.${status}`)}
    </span>
  );
}
