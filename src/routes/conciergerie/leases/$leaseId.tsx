import { createFileRoute } from "@tanstack/react-router";
import { addDays } from "date-fns";
import { CalendarClock, CalendarPlus, CalendarX2, ChevronDown, Download, Eye } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { LeaseStatePill, RentStatusPill } from "@/components/conciergerie/lease-badges";
import {
  ContractPreviewDialog,
  EndLeaseDialog,
  RenewLeaseDialog,
} from "@/components/conciergerie/lease-dialogs";
import { RentInvoicePreviewDialog } from "@/components/conciergerie/rent-invoice-preview-dialog";
import { RentSchedule } from "@/components/conciergerie/rent-schedule";
import { RentStrip } from "@/components/conciergerie/rent-strip";
import { ResendInviteButton, TenantCard } from "@/components/conciergerie/tenant-card";
import { MediaImage } from "@/components/media/media-image";
import { PageHeader } from "@/components/page-header";
import { QueryView } from "@/components/panel-states";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useContractFile } from "@/hooks/use-contract-file";
import { useLeaseDetailView, useRentInvoicesPage } from "@/hooks/use-portfolio-data";
import { formatDate } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { parseDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { LeaseDetail, RentInvoice } from "@/types/ltr";

export const Route = createFileRoute("/conciergerie/leases/$leaseId")({
  component: LeaseDetailPage,
});

function LeaseDetailPage() {
  const { leaseId } = Route.useParams();
  const query = useLeaseDetailView(leaseId);
  return (
    <QueryView query={query} skeleton="split">
      {(detail) => <LeaseDetailContent detail={detail} />}
    </QueryView>
  );
}

function LeaseDetailContent({ detail }: { detail: LeaseDetail }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const [dialog, setDialog] = React.useState<"renew" | "end" | "contract" | null>(null);
  const [previewInvoice, setPreviewInvoice] = React.useState<RentInvoice | null>(null);
  const [allMonths, setAllMonths] = React.useState(false);
  const contract = useContractFile(detail.contractFileId);
  const invoicesQuery = useRentInvoicesPage({ leaseId: detail.id, pageSize: 50 });
  const invoiceById = React.useMemo(
    () => new Map((invoicesQuery.data?.items ?? []).map((row) => [row.id, row])),
    [invoicesQuery.data],
  );
  const lastDay = addDays(parseDay(detail.endDate), -1);
  const ended = detail.computedStatus === "ended";
  const daysLeft = Math.ceil(
    (parseDay(detail.endDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );

  const openInvoice = (invoiceId: string) => setPreviewInvoice(invoiceById.get(invoiceId) ?? null);

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumb={[
          { label: t("common:nav.group.longTerm") },
          { label: t("common:nav.leases"), to: "/conciergerie/leases" },
          { label: detail.unitName },
        ]}
        title={detail.unitName}
        description={`${detail.propertyName} · ${detail.tenant.name}`}
        actions={
          <>
            <ResendInviteButton leaseId={detail.id} />
            {!ended && (
              <>
                <ReadOnlyGuard>
                  <Button
                    variant="outlineRuby"
                    size="sm"
                    onClick={() => setDialog("end")}
                    className="h-9"
                  >
                    <CalendarX2 className="size-4" aria-hidden="true" />
                    {t("leaseDetail.end")}
                  </Button>
                </ReadOnlyGuard>
                <ReadOnlyGuard>
                  <Button size="sm" onClick={() => setDialog("renew")} className="h-9">
                    <CalendarPlus className="size-4" aria-hidden="true" />
                    {t("leaseDetail.renew")}
                  </Button>
                </ReadOnlyGuard>
              </>
            )}
          </>
        }
      />

      {detail.computedStatus === "ending_soon" && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-xl border border-primary/45 border-s-[3px] border-s-primary bg-primary/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="font-serif text-lg leading-tight tracking-normal text-foreground">
                {t("leaseDetail.renewalTitle", { count: daysLeft })}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("leaseDetail.renewalBody", {
                  date: formatDate(lastDay),
                  tenant: detail.tenant.name,
                })}
              </p>
            </div>
          </div>
          <ReadOnlyGuard>
            <Button size="sm" onClick={() => setDialog("renew")} className="h-9 shrink-0">
              {t("leaseDetail.renewNow")}
            </Button>
          </ReadOnlyGuard>
        </div>
      )}

      {/* Hero: unit photo with the term, and the tenant */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <section className="group relative h-64 overflow-hidden rounded-2xl border border-border/70 lg:col-span-7 lg:h-auto lg:min-h-64">
          <MediaImage
            kind="unit"
            id={detail.unitId}
            name={detail.unitName}
            variant="card"
            loading="eager"
            className="hover-zoom absolute inset-0 size-full"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/45 to-transparent" />
          <div className="absolute inset-x-5 bottom-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <LeaseStatePill state={detail.computedStatus} />
              {detail.nextDueStatus && <RentStatusPill status={detail.nextDueStatus} />}
            </div>
          </div>
        </section>
        <TenantCard tenant={detail.tenant} leaseId={detail.id} showResend={false} className="lg:col-span-5" />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <section className="space-y-4 rounded-2xl border border-border/70 bg-[#141414] p-5 lg:col-span-7">
          <h2 className="font-serif text-xl tracking-normal text-[#F8F9FA]">
            {t("leaseDrawer.terms")}
          </h2>
          <dl className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
            <Term label={t("leaseDrawer.period")}>
              {t("leases.range", {
                from: formatDate(parseDay(detail.startDate)),
                to: formatDate(lastDay),
              })}
            </Term>
            <Term label={t("leaseDrawer.monthlyRent")}>
              <span dir="ltr" className="figure-serif text-xl text-[#A2E8DD]">
                {formatMoney(detail.monthlyRentMinor, detail.currency)}
              </span>
            </Term>
            <Term label={t("leaseDrawer.deposit")}>
              <span dir="ltr" className="tabular-nums">
                {formatMoney(detail.depositMinor, detail.currency)}
              </span>
            </Term>
            <Term label={t("leaseDetail.dueDay")}>
              {t("leases.dueDayLabel", { day: detail.rentDueDay })}
            </Term>
          </dl>
        </section>

        <section className="space-y-3 rounded-2xl border border-border/70 bg-[#141414] p-5 lg:col-span-5">
          <h2 className="font-serif text-xl tracking-normal text-[#F8F9FA]">
            {t("leaseDetail.contract")}
          </h2>
          {detail.contractFileId ? (
            <div className="flex items-center gap-4">
              <button
                type="button"
                disabled={!contract.url}
                onClick={() => setDialog("contract")}
                aria-label={t("leaseDetail.openContract")}
                className="group relative h-36 w-28 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-[#EDE6D6] shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span aria-hidden="true" className="absolute inset-x-3 top-3 space-y-1.5">
                  <span className="block h-1.5 w-2/3 rounded-full bg-[#8B7A55]/60" />
                  {Array.from({ length: 9 }, (_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "block h-1 rounded-full bg-[#6B6252]/25",
                        index % 3 === 2 ? "w-3/4" : "w-full",
                      )}
                    />
                  ))}
                </span>
                <span className="absolute bottom-2 start-2 rounded bg-[#8B002B] px-1 text-[0.55rem] font-semibold text-white">
                  PDF
                </span>
                <span className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/60 bg-[#141414]/90 px-3 py-1 text-xs text-primary">
                    <Eye className="size-3.5" aria-hidden="true" />
                    {t("leaseDetail.open")}
                  </span>
                </span>
              </button>
              <div className="min-w-0 space-y-3">
                <p className="break-all text-sm text-foreground">{contract.fileName}</p>
                {contract.url && (
                  <Button variant="outlineGold" size="sm" asChild className="h-9 text-xs">
                    <a href={contract.url} download={contract.fileName}>
                      <Download className="size-3.5" aria-hidden="true" />
                      {t("leaseDetail.download")}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
              {t("leaseDetail.notInvoiced")}
            </p>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-serif text-2xl tracking-normal text-[#F8F9FA]">
            {t("leaseDetail.scheduleTitle")}
          </h2>
          <ul className="flex flex-wrap gap-3 text-[0.68rem] text-muted-foreground">
            {(
              [
                ["paid", "bg-[#A2E8DD]"],
                ["unpaid", "bg-primary"],
                ["late", "bg-[#FF85A1]"],
                ["not_yet_generated", "bg-muted-foreground/50"],
              ] as const
            ).map(([state, dot]) => (
              <li key={state} className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-full", dot)} aria-hidden="true" />
                {t(`leases.rentStatus.${state}`)}
              </li>
            ))}
          </ul>
        </div>
        <RentStrip currency={detail.currency} rows={detail.rentSchedule} onOpenInvoice={openInvoice} />
        {detail.rentSchedule.length > 0 && (
          <Collapsible open={allMonths} onOpenChange={setAllMonths}>
            <CollapsibleTrigger className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
              {t("leaseDetail.allMonths", { count: detail.rentSchedule.length })}
              <ChevronDown
                className={cn("size-3.5 transition-transform", allMonths && "rotate-180")}
                aria-hidden="true"
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <RentSchedule currency={detail.currency} rows={detail.rentSchedule} onOpenInvoice={openInvoice} />
            </CollapsibleContent>
          </Collapsible>
        )}
      </section>

      {!ended && dialog === "renew" && (
        <RenewLeaseDialog lease={detail} open onClose={() => setDialog(null)} />
      )}
      {!ended && dialog === "end" && (
        <EndLeaseDialog lease={detail} open onClose={() => setDialog(null)} />
      )}
      <ContractPreviewDialog
        url={contract.url}
        fileName={contract.fileName}
        open={dialog === "contract"}
        onClose={() => setDialog(null)}
      />
      <RentInvoicePreviewDialog invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />
    </div>
  );
}

function Term({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-[0.7rem] text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
