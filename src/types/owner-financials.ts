/** Owner financial dashboard, heatmap and reports (velvet-keys-be/app/schemas/financials.py). */

export type PeriodView = "month" | "quarter" | "year";
export type ReportStatus = "queued" | "ready" | "failed";

export interface KpiTrend {
  grossRevenueChangePct: number | null;
  netProfitChangePct: number | null;
  occupancyChangePct: number | null;
}

export interface OwnerKpis {
  grossRevenueMinor: number;
  netProfitMinor: number;
  payrollMinor: number;
  utilitiesMinor: number;
  repairsMinor: number;
  commissionMinor: number;
  occupancyPct: number;
  strRevenueMinor: number;
  ltrRevenueMinor: number;
  trend: KpiTrend;
}

export interface PortfolioBreakdownRow {
  propertyId: string;
  propertyName: string;
  grossRevenueMinor: number;
  expensesMinor: number;
  netProfitMinor: number;
  occupancyPct: number;
  marginPct: number;
}

export interface MonthlyTrendPoint {
  /** "YYYY-MM" */
  period: string;
  grossRevenueMinor: number;
  netProfitMinor: number;
  occupancyPct: number;
}

export interface TopExpenseLine {
  id: string;
  category: string;
  description: string;
  amountMinor: number;
  date: string;
}

export interface PropertyFinancialDetail extends PortfolioBreakdownRow {
  monthlyTrend: MonthlyTrendPoint[];
  topExpenses: TopExpenseLine[];
}

export interface DemandHeatmapDay {
  date: string;
  occupancyPct: number;
}

export interface DemandHeatmap {
  view: PeriodView;
  data: DemandHeatmapDay[];
}

export interface FinancialQuery {
  period?: PeriodView;
  from?: string;
  to?: string;
  propertyId?: string;
}

/** Either a named period ("2026-03") or an explicit range. */
export type ReportPeriod = string | { from: string; to: string };

export interface CreateReportInput {
  period: ReportPeriod;
  propertyId?: string | null;
}

export interface CreateReportResult {
  reportId: string;
  status: ReportStatus;
}

export interface ReportListItem {
  id: string;
  period: string;
  propertyId: string | null;
  status: ReportStatus;
  createdAt: string;
  readyAt: string | null;
}

export interface ReportStatusDetail {
  id: string;
  status: ReportStatus;
  createdAt: string;
  readyAt: string | null;
  downloadUrl: string | null;
  errorMessage: string | null;
}

export interface SendReportToOwnerResult {
  sent: boolean;
  ownerEmail: string;
}
