import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/**
 * Shared by the real account Billing screen (types/subscription's `SubscriptionInvoiceStatus`,
 * which adds "void") and the Admin screens still on the old mock shape (types/billing's status,
 * a subset without "void") -- a local union keeps this component decoupled from either.
 */
type AnyInvoiceStatus = "paid" | "sent" | "overdue" | "draft" | "free" | "void";

const STYLES: Record<AnyInvoiceStatus, string> = {
  paid: "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]",
  sent: "border-primary/40 bg-primary/10 text-primary",
  overdue: "border-destructive/70 bg-destructive/25 text-destructive-foreground",
  draft: "border-border/80 bg-[#161616] text-muted-foreground",
  free: "border-border/80 bg-[#1A1A1A] text-muted-foreground",
  void: "border-border/80 bg-[#161616] text-muted-foreground line-through",
};

const DOTS: Record<AnyInvoiceStatus, string> = {
  paid: "bg-[#A2E8DD]",
  sent: "bg-primary",
  overdue: "bg-[#FF85A1]",
  draft: "bg-muted-foreground/50",
  free: "bg-muted-foreground/70",
  void: "bg-muted-foreground/40",
};

/** Paid jade, sent gold, overdue ruby, void struck through. */
export function InvoiceStatusPill({
  status,
  className,
}: {
  status: AnyInvoiceStatus;
  className?: string;
}) {
  const { t } = useTranslation("billing");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider",
        STYLES[status],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOTS[status])} aria-hidden="true" />
      {t(`invoiceStatus.${status}`)}
    </span>
  );
}
