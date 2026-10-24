import type { Booking } from "./booking";
import type { ISODate, ISODateTime, MonthKey } from "./common";
import type { Lease, LeaseRentStatus, Tenant } from "./lease";
import type { Expense, MaintenanceTicket, Worker } from "./operations";
import type { Property, Unit, UnitType } from "./property";

/** Profit and loss for a period, in MAD (see lib/portfolio). */
export interface PLSummary {
  strRevenue: number;
  ltrRevenue: number;
  grossRevenue: number;
  commission: number;
  payroll: number;
  utilities: number;
  repairs: number;
  netProfit: number;
  /** Occupied share of all unit-nights, stays and leases together */
  occupancy: number;
  /** Booked share of STR unit-nights */
  strOccupancy: number;
  adr: number;
  bookedNights: number;
}

export interface MonthlyPLPoint extends PLSummary {
  month: MonthKey;
}

export interface PropertyPerformance {
  property: Property;
  unitCount: number;
  strUnits: number;
  ltrUnits: number;
  /** LTR units with a lease running today */
  ltrLeased: number;
  pl: PLSummary;
  /** Net margin %, rounded */
  margin: number;
}

export type AttentionKind = "critical_repair" | "arrival" | "unpaid_balance" | "late_rent";

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  urgency: "critical" | "warning" | "info";
  /** Ticket title or guest / tenant name */
  subject: string;
  propertyName: string;
  unitName: string;
  at?: ISODateTime;
  amountMAD?: number;
}

export interface PortfolioOverview {
  month: MonthKey;
  current: PLSummary;
  previous: PLSummary;
  monthly: MonthlyPLPoint[];
  properties: PropertyPerformance[];
  activeUnits: number;
  /** Units running as LTR today, and how many of them have a lease running */
  ltrUnits: { leased: number; total: number };
  workerCount: number;
  attention: AttentionItem[];
}

export type FinancialPeriod = "this_month" | "last_month" | "this_quarter" | "full_year";

export interface FinancialsView {
  period: FinancialPeriod;
  from: ISODate;
  /** Exclusive */
  to: ISODate;
  current: PLSummary;
  previous: PLSummary;
  monthly: MonthlyPLPoint[];
  properties: PropertyPerformance[];
}

export interface UnitPerformance {
  unit: Unit;
  occupancy: number;
  adr: number;
  /** Current lease for LTR units */
  lease?: Lease;
  tenant?: Tenant;
  /** LTR rent status: late wins, then whether the current rent is paid */
  rentStatus?: LeaseRentStatus;
}

export interface BookingWithUnit extends Booking {
  unitName: string;
  propertyName: string;
  image: string;
}

export interface TicketView extends MaintenanceTicket {
  unitName: string;
  propertyName: string;
  propertyId: string;
  worker?: Worker;
}

export interface PropertyDetail {
  performance: PropertyPerformance;
  units: UnitPerformance[];
  monthly: MonthlyPLPoint[];
  trailingYearRevenue: number;
  recentBookings: BookingWithUnit[];
  openTickets: TicketView[];
}

export interface StatementView {
  from: ISODate;
  to: ISODate;
  pl: PLSummary;
  rows: PropertyPerformance[];
  cities: string[];
}

export interface StatementRecord {
  id: string;
  period: MonthKey;
  kind: "detailed" | "summary" | "quarterly";
  issuedAt: ISODate;
  sizeKb: number;
}

export interface DemandDay {
  date: ISODate;
  occupancy: number;
  bookedUnits: number;
  totalUnits: number;
  adr: number;
  suggestedRate: number;
  /** i18n key under owner:demand.events */
  eventKey?: string;
  isWeekend: boolean;
}

export type DayTaskKind = "check_in" | "check_out" | "housekeeping" | "repair";

export interface DayTask {
  id: string;
  kind: DayTaskKind;
  /** "HH:mm", Casablanca time */
  time: string;
  propertyName: string;
  unitName: string;
  unitId: string;
  /** Guest name for stays, ticket title for repairs; absent for turnovers */
  subject?: string;
  guests?: number;
  worker?: Worker;
  notes?: string;
  done: boolean;
}

export type UnitBoardStatus = "occupied" | "vacant_clean" | "vacant_dirty" | "blocked";

export interface UnitBoardItem {
  unitId: string;
  propertyName: string;
  unitName: string;
  status: UnitBoardStatus;
  guestName?: string;
}

export interface DayAgenda {
  date: ISODate;
  tasks: DayTask[];
  units: UnitBoardItem[];
  urgent: TicketView[];
  summary: { arrivals: number; departures: number; criticalRepairs: number };
}

export interface StrUnitSummary {
  unit: Unit;
  property: Property;
  /** Average nightly rate over the last 90 days of stays, used to quote direct bookings */
  adr: number;
}

/** A row of the operations calendar: STR units take stays, LTR units show their leases. */
export interface CalendarUnit {
  unit: Unit;
  property: Property;
  /** Type the unit runs as today */
  type: UnitType;
  /** STR: average nightly rate over the last 90 days of stays */
  adr?: number;
  /** LTR: monthly rent of the lease running today */
  monthlyRentMAD?: number;
}

export type CalendarBlockKind =
  "direct" | "airbnb" | "booking" | "housekeeping" | "maintenance" | "lease";

export interface CalendarBlock {
  id: string;
  unitId: string;
  kind: CalendarBlockKind;
  /** First day covered */
  start: ISODate;
  /** Last day covered (inclusive) */
  end: ISODate;
  /** Guest name, tenant name or ticket title; absent for turnovers */
  title?: string;
  notes?: string;
  amountMAD?: number;
  /** The stay behind a booking block */
  booking?: Booking;
  /** The lease behind a lease block */
  leaseId?: string;
}

export interface CalendarView {
  units: CalendarUnit[];
  blocks: CalendarBlock[];
}

export interface MaintenanceBoard {
  tickets: TicketView[];
  stats: {
    open: number;
    critical: number;
    /** Average hours from report to resolution over the last 90 days; null without data */
    avgResolutionHours: number | null;
    /** Cost of tickets reported this month */
    monthSpend: number;
  };
}

export interface CategoryTrend {
  currentMonth: number;
  previousMonth: number;
  delta: number | null;
  months: { month: MonthKey; amount: number }[];
}

export interface WorkerBalance {
  worker: Worker;
  owedMAD: number;
  paidYtdMAD: number;
  lastPaidAt?: ISODate;
}

export interface UtilityBill {
  expense: Expense;
  propertyName: string;
  isOverdue: boolean;
}

export interface LedgerWeek {
  /** Monday of the ISO week */
  weekStart: ISODate;
  weekEnd: ISODate;
  isoWeek: number;
  total: number;
  entries: (Expense & { propertyName: string })[];
}

export interface ExpensesOverview {
  trends: Record<Expense["category"], CategoryTrend>;
  workers: WorkerBalance[];
  utilityBills: UtilityBill[];
  ledger: LedgerWeek[];
}
