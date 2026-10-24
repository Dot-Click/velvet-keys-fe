import type { ISODate, ISODateTime, MAD } from "./common";

export interface Worker {
  id: string;
  accountId: string;
  name: string;
  specialty: string;
  phone: string;
}

export type TicketUrgency = "low" | "medium" | "critical";
export type TicketStatus = "reported" | "assigned" | "in_progress" | "resolved";

export interface MaintenanceTicket {
  id: string;
  unitId: string;
  title: string;
  description: string;
  urgency: TicketUrgency;
  status: TicketStatus;
  workerId?: string;
  costMAD: MAD;
  photos: string[];
  reportedAt: ISODateTime;
  resolvedAt?: ISODateTime;
  /** Days the unit is taken off the calendar for the work (exclusive end). */
  blockedFrom?: ISODate;
  blockedUntil?: ISODate;
}

export type ExpenseCategory = "workerPay" | "utility" | "other";
export type UtilityType = "electricity" | "water" | "internet" | "gas";
export type ExpenseStatus = "pending" | "paid";

export interface Expense {
  id: string;
  accountId: string;
  /** Property the cost belongs to; absent for account-wide costs. */
  propertyId?: string;
  unitId?: string;
  category: ExpenseCategory;
  /** Worker, utility provider or supplier */
  payee: string;
  workerId?: string;
  utilityType?: UtilityType;
  description: string;
  amountMAD: MAD;
  /** When the cost was incurred (or the bill issued) */
  date: ISODate;
  dueDate?: ISODate;
  status: ExpenseStatus;
  paidAt?: ISODate;
}
