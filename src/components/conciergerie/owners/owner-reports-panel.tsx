import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Download, Loader2, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useReportsPage } from "@/hooks/use-portfolio-data";
import { ownerFinancialsService } from "@/services/owner-financials-service";
import { formatDate, formatMonth } from "@/lib/currency";
import type { ReportListItem, ReportStatus } from "@/types/owner-financials";

/** "2026-09" or "2026-09-03..2026-09-17" (the backend's report period label) as display text. */
function reportPeriodLabel(period: string) {
  if (/^\d{4}-\d{2}$/.test(period)) return formatMonth(period, { style: "long", withYear: true });
  const [from, to] = period.split("..");
  return from && to ? `${formatDate(from)} – ${formatDate(to)}` : period;
}

function statusBadgeClass(status: ReportStatus) {
  if (status === "ready") return "border-success/30 bg-success/10 text-success";
  if (status === "failed")
    return "border-destructive/40 bg-destructive/15 text-destructive-foreground";
  return "border-primary/30 bg-primary/10 text-primary";
}

/**
 * This owner's reports, reusing the account's report list (the backend has no
 * per-owner report list endpoint) filtered down to reports scoped to one of
 * their properties -- a whole-portfolio report (propertyId null) is left out
 * here, since on a multi-owner account it can't be attributed to this owner
 * without generating one for this owner's properties specifically.
 */
export function OwnerReportsPanel({ propertyIds }: { propertyIds: string[] }) {
  const { t } = useTranslation(["conciergerie", "owner", "common"]);
  const reportsQuery = useReportsPage(1, 25);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const propertySet = new Set(propertyIds);
  const ownerReports = (reportsQuery.data?.items ?? []).filter(
    (report) => report.propertyId !== null && propertySet.has(report.propertyId),
  );

  const sendMutation = useMutation({
    mutationFn: (reportId: string) => ownerFinancialsService.sendToOwner(reportId),
  });

  const handleSend = (report: ReportListItem) => {
    sendMutation.mutate(report.id, {
      onSuccess: (result) => {
        toast.success(t("owners.reports.sentToast"), {
          description: t("owners.reports.sentDesc", { email: result.ownerEmail }),
        });
      },
      onError: () => toast.error(t("common:states.errorBody")),
    });
  };

  const handleDownload = async (report: ReportListItem) => {
    setDownloadingId(report.id);
    try {
      const detail = await ownerFinancialsService.reportStatus(report.id);
      if (detail.downloadUrl) {
        globalThis.open(detail.downloadUrl, "_blank", "noopener,noreferrer");
      } else {
        toast.error(t("common:states.errorBody"));
      }
    } catch {
      toast.error(t("common:states.errorBody"));
    } finally {
      setDownloadingId(null);
    }
  };

  if (reportsQuery.isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="gold-skeleton h-14 w-full" />
        ))}
      </div>
    );
  }

  if (ownerReports.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
        {t("owners.reports.empty")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {ownerReports.map((report) => {
        const sending = sendMutation.isPending && sendMutation.variables === report.id;
        return (
          <div
            key={report.id}
            className="rounded-lg border border-border/60 bg-[#161616] p-3 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#F8F9FA]">
                {reportPeriodLabel(report.period)}
              </p>
              <span
                className={`ms-2 shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] uppercase font-mono ${statusBadgeClass(report.status)}`}
              >
                {report.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-[0.68rem] text-muted-foreground">
              <span>{formatDate(report.createdAt)}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={report.status !== "ready" || downloadingId === report.id}
                  onClick={() => void handleDownload(report)}
                  className="text-primary hover:underline flex items-center gap-1 font-mono disabled:opacity-40 disabled:no-underline"
                >
                  {downloadingId === report.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Download className="size-3" />
                  )}
                  <span>{t("owner:reports.download")}</span>
                </button>
                <button
                  type="button"
                  disabled={report.status !== "ready" || sending}
                  onClick={() => handleSend(report)}
                  className="text-primary hover:underline flex items-center gap-1 font-mono disabled:opacity-40 disabled:no-underline"
                >
                  {sending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Mail className="size-3" />
                  )}
                  <span>{t("owners.reports.sendToOwner")}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
