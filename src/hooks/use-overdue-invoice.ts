import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays } from "date-fns";
import { useAuth } from "@/components/auth-provider";
import { subscriptionService } from "@/services/subscription-service";
import { useReadOnly } from "@/hooks/use-read-only";
import type { InvoiceListItem } from "@/types/subscription";

/** The soonest-due invoice with this status, or null when there is none. */
async function earliestInvoice(status: InvoiceListItem["status"]): Promise<InvoiceListItem | null> {
  const page = await subscriptionService.listInvoices({ status, page: 1 });
  if (page.items.length === 0) return null;
  return [...page.items].sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))[0] ?? null;
}

/** The overdue invoice behind read-only mode; idle while the account is active. */
export function useOverdueInvoice() {
  const { session } = useAuth();
  const userId = session?.profile.id ?? "";
  const { isAccountReadOnly, accountId } = useReadOnly();
  return useQuery({
    queryKey: ["billing", "overdue-invoice", accountId, userId],
    queryFn: () => earliestInvoice("overdue"),
    enabled: isAccountReadOnly && Boolean(accountId),
    staleTime: 60_000,
  });
}

/** An unpaid invoice issued 5+ days ago (read-only starts at day 8); only the holder is asked to pay. */
export function useDueSoonInvoice() {
  const { session } = useAuth();
  const { isAccountReadOnly, accountId } = useReadOnly();
  const isHolder = Boolean(session?.profile.isAccountHolder);
  return useQuery({
    queryKey: ["panel-data", accountId, session?.profile.id ?? "", "billing", "due-soon"],
    queryFn: async () => {
      const invoice = await earliestInvoice("sent");
      if (!invoice?.issuedAt) return null;
      return differenceInCalendarDays(new Date(), new Date(invoice.issuedAt)) >= 5 ? invoice : null;
    },
    enabled: isHolder && !isAccountReadOnly && Boolean(accountId),
    staleTime: 60_000,
  });
}
