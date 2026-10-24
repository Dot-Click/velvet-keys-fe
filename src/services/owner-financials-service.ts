import { api, type Page } from "@/lib/apiClient";
import type {
  CreateReportInput,
  CreateReportResult,
  DemandHeatmap,
  FinancialQuery,
  OwnerKpis,
  PeriodView,
  PortfolioBreakdownRow,
  PropertyFinancialDetail,
  ReportListItem,
  ReportStatusDetail,
} from "@/types/owner-financials";

function query(filter: object) {
  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export const ownerFinancialsService = {
  kpis(filter: FinancialQuery = {}): Promise<OwnerKpis> {
    return api.get<OwnerKpis>("/owner/kpis", query(filter));
  },

  portfolioBreakdown(
    filter: Omit<FinancialQuery, "propertyId"> & { page?: number; pageSize?: 10 | 25 | 50 } = {},
  ): Promise<Page<PortfolioBreakdownRow>> {
    return api.get<Page<PortfolioBreakdownRow>>("/owner/portfolio-breakdown", query(filter));
  },

  demandHeatmap(view: PeriodView, propertyId?: string): Promise<DemandHeatmap> {
    return api.get<DemandHeatmap>("/owner/demand-heatmap", query({ view, propertyId }));
  },

  propertyDetail(
    propertyId: string,
    filter: Omit<FinancialQuery, "propertyId"> = {},
  ): Promise<PropertyFinancialDetail> {
    return api.get<PropertyFinancialDetail>(
      `/owner/properties/${propertyId}/detail`,
      query(filter),
    );
  },

  /** Reports generate asynchronously: poll `reportStatus` until it is ready or failed. */
  createReport(input: CreateReportInput): Promise<CreateReportResult> {
    return api.post<CreateReportResult>("/owner/reports", { format: "pdf", ...input });
  },

  listReports(page = 1, pageSize: 10 | 25 | 50 = 25): Promise<Page<ReportListItem>> {
    return api.get<Page<ReportListItem>>("/owner/reports", { page, pageSize });
  },

  reportStatus(reportId: string): Promise<ReportStatusDetail> {
    return api.get<ReportStatusDetail>(`/owner/reports/${reportId}`);
  },
};
