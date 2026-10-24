import { Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { useDueSoonInvoice } from "@/hooks/use-overdue-invoice";
import { useReadOnly } from "@/hooks/use-read-only";
import { formatDate } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import { billingRoute } from "@/lib/navigation";

/**
 * Gold reminder for the account holder from day 5 to day 7 after an invoice is issued, before
 * the account turns read-only on day 8.
 */
export function PaymentDueBanner() {
  const { t } = useTranslation("common");
  const { session } = useAuth();
  const { isAccountReadOnly } = useReadOnly();
  const { data: invoice } = useDueSoonInvoice();
  // From day 8 the ruby read-only banner takes over
  if (!session || !invoice || !invoice.dueDate || isAccountReadOnly) return null;

  return (
    <div role="status" className="border-b border-primary/60 bg-primary text-primary-foreground">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-8 lg:px-12">
        <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-xs font-medium sm:text-sm">
          {t("paymentDue.banner", {
            number: invoice.number,
            date: formatDate(parseDay(invoice.dueDate)),
          })}
        </p>
        <Button
          size="sm"
          variant="outline"
          asChild
          className="h-8 border-primary-foreground/40 bg-transparent text-primary-foreground shadow-none hover:-translate-y-0 hover:border-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <Link to={billingRoute(session.profile)}>{t("paymentDue.viewBilling")}</Link>
        </Button>
      </div>
    </div>
  );
}
