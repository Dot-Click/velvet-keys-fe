/**
 * Operations shapes exactly as the backend returns them (velvet-keys-be/app/schemas/maintenance.py,
 * expenses.py, files.py). Amounts are integer minor units + currency.
 */

export type TicketUrgency = "low" | "medium" | "critical";
export type TicketStatus = "reported" | "assigned" | "in_progress" | "resolved";

export interface Ticket {
  id: string;
  unitId: string;
  unitName: string;
  propertyName: string;
  title: string;
  description: string;
  urgency: TicketUrgency;
  status: TicketStatus;
  workerId: string | null;
  workerName: string | null;
  estCostMinor: number | null;
  actualCostMinor: number | null;
  currency: string;
  reportedAt: string;
  resolvedAt: string | null;
  photoCount: number;
}

export interface TicketPhoto {
  fileId: string;
  /** Presigned download URL; null when storage is not configured. */
  url: string | null;
  note: string | null;
}

export interface TicketEvent {
  type: string;
  note: string | null;
  at: string;
  byUserId: string | null;
}

export interface TicketDetail extends Ticket {
  photos: TicketPhoto[];
  activity: TicketEvent[];
}

/** GET /maintenance/tickets?view=board */
export interface TicketBoard {
  reported: Ticket[];
  assigned: Ticket[];
  inProgress: Ticket[];
  resolved: Ticket[];
}

export interface TicketListFilter {
  page?: number;
  pageSize?: 10 | 25 | 50;
  status?: TicketStatus;
  urgency?: TicketUrgency;
  unitId?: string;
  propertyId?: string;
  q?: string;
}

export interface CreateTicketInput {
  unitId: string;
  title: string;
  description: string;
  urgency: TicketUrgency;
  workerId?: string | null;
  estCostMinor?: number | null;
  photoFileIds?: string[];
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  urgency?: TicketUrgency;
  status?: TicketStatus;
  workerId?: string | null;
  estCostMinor?: number | null;
  actualCostMinor?: number | null;
}

export interface MaintenanceSummary {
  openCount: number;
  criticalCount: number;
  avgResolutionHours: number | null;
  monthRepairSpendMinor: number;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  phone: string | null;
}

export interface WorkerInput {
  name: string;
  role: string;
  phone?: string | null;
}

export type ExpenseCategory = "worker_pay" | "utility" | "repair" | "other";
export type UtilityType = "electricity" | "water" | "internet" | "gas";
export type ExpenseStatus = "paid" | "due" | "overdue";

export interface Expense {
  id: string;
  propertyId: string;
  propertyName: string;
  unitId: string | null;
  category: ExpenseCategory;
  utilityType: UtilityType | null;
  description: string;
  amountMinor: number;
  currency: string;
  /** ISO date */
  date: string;
  dueDate: string | null;
  status: ExpenseStatus;
  workerId: string | null;
  workerName: string | null;
  ticketId: string | null;
  receiptFileId: string | null;
}

export interface ExpenseListFilter {
  page?: number;
  pageSize?: 10 | 25 | 50;
  category?: ExpenseCategory;
  propertyId?: string;
  status?: ExpenseStatus;
  from?: string;
  to?: string;
  q?: string;
}

export interface CreateExpenseInput {
  propertyId: string;
  unitId?: string | null;
  category: ExpenseCategory;
  utilityType?: UtilityType | null;
  description: string;
  amountMinor: number;
  currency?: string;
  date: string;
  dueDate?: string | null;
  status?: ExpenseStatus;
  workerId?: string | null;
  receiptFileId?: string | null;
}

export interface UpdateExpenseInput {
  description?: string;
  amountMinor?: number;
  date?: string;
  dueDate?: string | null;
  status?: ExpenseStatus;
  workerId?: string | null;
  receiptFileId?: string | null;
}

export interface ExpenseMonthPoint {
  /** "YYYY-MM" */
  month: string;
  totalMinor: number;
}

export interface ExpenseSummary {
  monthTotalMinor: number;
  lastMonthTotalMinor: number;
  changePercent: number | null;
  sixMonthSeries: ExpenseMonthPoint[];
}

export interface UtilityRow {
  unitId: string;
  unitName: string;
  utilityType: UtilityType;
  lastBillAmountMinor: number;
  lastBillDate: string;
  dueDate: string | null;
  status: ExpenseStatus;
}

export interface OwnerExpenseKpis {
  workerPayMinor: number;
  utilityMinor: number;
  repairMinor: number;
  otherMinor: number;
  totalMinor: number;
}

export type FilePurpose =
  | "property_image"
  | "unit_image"
  | "ticket_photo"
  | "receipt"
  | "contract"
  | "invoice_pdf"
  | "report_pdf"
  | "avatar";

export interface UploadUrl {
  fileId: string;
  uploadUrl: string;
  expiresAt: string;
}

export interface FileUrl {
  url: string;
  expiresAt: string;
}
