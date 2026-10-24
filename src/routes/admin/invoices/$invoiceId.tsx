import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Copy, Mail } from "lucide-react";
import type { ReactNode } from "react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AdminPage, AdminSection } from "@/components/admin/admin-page";
import { MarkPaidDialog } from "@/components/admin/mark-paid-dialog";
import { ReasonDialog } from "@/components/admin/reason-dialog";
import { InvoiceStatusPill } from "@/components/billing/invoice-status-pill";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  useAdminInvoices,
  useRemindInvoice,
  useVoidInvoice,
} from "@/hooks/use-admin-data";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { formatDate } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { parseDay } from "@/lib/dates";
import type { AdminInvoiceListItem } from "@/types/platform-admin";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";

export const Route = createFileRoute("/admin/invoices/$invoiceId")({
  component: AdminInvoicePage,
});

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-1.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </div>
  );
}

function isPayable(invoice: AdminInvoiceListItem) {
  return invoice.status === "sent" || invoice.status === "overdue";
}

/**
 * Note: the mock version of this screen rendered the full invoice document (line items, seller
 * and billed-to snapshots, a payment-schedule timeline, prior reminders) from a mock-only
 * `GET /admin/billing/invoices/{id}` endpoint. The real `admin.py` has no such route -- only
 * list/generate/mark-paid/void/remind -- so this page looks the invoice up in the already-loaded
 * admin invoices list (the first page, unfiltered) instead of fetching a detail record. When the
 * invoice is not on that first page (e.g. opened directly by URL, or buried deep in a long list),
 * it shows a "not found here" message pointing back to the filterable list. Only summary fields
 * `AdminInvoiceListItem` actually carries are shown; the document preview and timeline are dropped.
 */
function AdminInvoicePage() {
  const { invoiceId } = Route.useParams();
  const query = useAdminInvoices({ pageSize: 50 });
  const invoice = query.data?.items.find((item) => item.id === invoiceId);

  if (query.isPending) return null;
  if (!invoice) return <NotFound />;
  return <InvoiceContent invoice={invoice} />;
}

function NotFound() {
  const { t: ti } = useTranslation("admin-invoices");
  const navigate = useNavigate();
  return (
    <AdminPage
      breadcrumb={[{ label: ti("detail.breadcrumb"), to: "/admin/invoices" }, { label: "—" }]}
      title={ti("detail.breadcrumb")}
    >
      <EmptyState
        illustration="ledger"
        title={ti("detail.breadcrumb")}
        description=""
        action={ti("detail.breadcrumb")}
        onAction={() => void navigate({ to: "/admin/invoices" })}
        className="min-h-72"
      />
    </AdminPage>
  );
}

function InvoiceContent({ invoice }: { invoice: AdminInvoiceListItem }) {
  const { t } = useTranslation("admin");
  const { t: ti } = useTranslation("admin-invoices");
  const remindInvoice = useRemindInvoice();
  const voidInvoice = useVoidInvoice();
  const [paying, setPaying] = React.useState(false);
  const [voiding, setVoiding] = React.useState(false);
  const overdue = invoice.status === "overdue";

  return (
    <AdminPage
      breadcrumb={[
        { label: ti("detail.breadcrumb"), to: "/admin/invoices" },
        { label: invoice.number },
      ]}
      title={<span className="tabular-nums tracking-[0.06em]">{invoice.number}</span>}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <InvoiceStatusPill status={invoice.status} />
          <Link
            to="/admin/clients/$clientId"
            params={{ clientId: invoice.accountId }}
            className="hover:text-primary"
          >
            {invoice.accountName}
          </Link>
        </span>
      }
      actions={
        <>
          {isPayable(invoice) && (
            <ReadOnlyGuard>
              <Button
                size="sm"
                onClick={() => setPaying(true)}
                className="h-8 bg-primary text-xs font-semibold text-primary-foreground"
              >
                {t("invoice.markPaid")}
              </Button>
            </ReadOnlyGuard>
          )}
          {isPayable(invoice) && (
            <Button
              variant="outline"
              size="sm"
              disabled={remindInvoice.isPending}
              onClick={() =>
                remindInvoice.mutate(invoice.id, {
                  onSuccess: () =>
                    toast.success(ti("actions.reminderSent", { client: "", number: invoice.number })),
                  onError: () => toast.error(t("errors.saveFailed")),
                })
              }
              className="h-8 text-xs"
            >
              <Mail className="size-3.5" aria-hidden="true" />
              {ti("detail.sendReminder")}
            </Button>
          )}
          {invoice.status !== "void" && (
            <ReadOnlyGuard>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiding(true)}
                className="h-8 text-xs text-[#FF85A1]"
              >
                {ti("void.action", { defaultValue: "Void" })}
              </Button>
            </ReadOnlyGuard>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard
                .writeText(invoice.number)
                .then(() => toast.success(ti("actions.copied", { reference: invoice.number })))
                .catch(() => toast.error(ti("actions.copyFailed")));
            }}
            className="h-8 text-xs"
          >
            <Copy className="size-3.5" aria-hidden="true" />
            {ti("detail.copyReference")}
          </Button>
        </>
      }
    >
      <AdminSection title={t("invoice.summaryTitle")}>
        <dl className="max-w-xl divide-y divide-border/50 rounded-lg border border-border/80 bg-[#121212] px-4 py-2">
          <Row label={t("invoice.client")}>
            <Link
              to="/admin/clients/$clientId"
              params={{ clientId: invoice.accountId }}
              className="font-medium hover:text-primary"
            >
              {invoice.accountName}
            </Link>
          </Row>
          <Row label={t("invoice.total")}>
            <span className="tabular-nums font-semibold text-primary">
              {formatMoney(invoice.totalMinor, ACCOUNT_CURRENCY)}
            </span>
          </Row>
          <Row label={t("invoice.due")}>
            <span className={overdue ? "text-[#FF85A1]" : undefined}>
              {invoice.dueDate ? formatDate(parseDay(invoice.dueDate)) : "—"}
            </span>
          </Row>
          <Row label={t("invoice.kind")}>
            {t(invoice.proForma ? "invoice.kindProForma" : "invoice.kindFinal")}
          </Row>
        </dl>
      </AdminSection>

      <MarkPaidDialog invoice={paying ? invoice : null} onOpenChange={(open) => setPaying(open)} />
      <ReasonDialog
        open={voiding}
        onOpenChange={setVoiding}
        title={ti("void.title", { defaultValue: "Void invoice" })}
        description={ti("void.description", {
          defaultValue: "This invoice will no longer be payable.",
        })}
        confirmLabel={ti("void.confirm", { defaultValue: "Void" })}
        tone="danger"
        pending={voidInvoice.isPending}
        onConfirm={(reason) =>
          voidInvoice.mutate(
            { invoiceId: invoice.id, reason },
            {
              onSuccess: () => {
                toast.success(ti("void.done", { defaultValue: "Invoice voided." }));
                setVoiding(false);
              },
              onError: () => toast.error(t("errors.saveFailed")),
            },
          )
        }
      />
    </AdminPage>
  );
}
