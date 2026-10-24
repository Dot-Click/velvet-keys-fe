import { api, type Page } from "@/lib/apiClient";
import type {
  BillingSummary,
  InvoiceDetail,
  InvoiceListFilter,
  InvoiceListItem,
} from "@/types/subscription";

function query(filter: object) {
  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export const subscriptionService = {
  summary(): Promise<BillingSummary> {
    return api.get<BillingSummary>("/billing/summary");
  },

  listInvoices(filter: InvoiceListFilter = {}): Promise<Page<InvoiceListItem>> {
    return api.get<Page<InvoiceListItem>>("/billing/invoices", query(filter));
  },

  getInvoice(id: string): Promise<InvoiceDetail> {
    return api.get<InvoiceDetail>(`/billing/invoices/${id}`);
  },

  /** Rejects with PDF_NOT_YET_AVAILABLE (HTTP 501) until PDF generation exists. */
  getInvoicePdf(id: string): Promise<unknown> {
    return api.get(`/billing/invoices/${id}/pdf`);
  },
};
