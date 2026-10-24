import { addDays, differenceInCalendarDays } from "date-fns";
import { CalendarClock, Mail, Phone, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DetailDrawer } from "@/components/detail-drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaImage } from "@/components/media/media-image";
import { useLeaseDetailView } from "@/hooks/use-portfolio-data";
import { today } from "@/lib/clock";
import { formatDate, formatMonth } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { parseDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { LeaseDetail, ComputedLeaseStatus, RentScheduleRow, RentScheduleStatus } from "@/types/ltr";
import { LeaseStatePill, RentStatusPill } from "./lease-badges";

/** How many recent rent periods the drawer lists. */
const RECENT_RENTS = 4;

/** Lease summary opened from the calendar: tenant, terms and the latest rent periods. */
export function LeaseDrawer({ leaseId, onClose }: { leaseId: string | null; onClose: () => void }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const query = useLeaseDetailView(leaseId);
  const detail = query.data && query.data.id === leaseId ? query.data : undefined;

  return (
    <DetailDrawer
      open={Boolean(leaseId)}
      onClose={onClose}
      title={detail?.tenant.name ?? t("leaseDrawer.title")}
      subtitle={detail ? `${detail.propertyName} · ${detail.unitName}` : ""}
      badge={
        detail && (
          <LeaseStatePill state={detail.computedStatus as ComputedLeaseStatus} />
        )
      }
    >
      {query.isError ? (
        <div
          role="alert"
          className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
        >
          <p className="text-foreground">{t("leaseDrawer.error")}</p>
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            <RotateCcw className="size-3.5" aria-hidden="true" />
            {t("common:states.retry")}
          </Button>
        </div>
      ) : !detail ? (
        <div className="space-y-4" aria-busy="true" aria-label={t("common:states.loading")}>
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : (
        <LeaseBody detail={detail} />
      )}
    </DetailDrawer>
  );
}

function LeaseBody({ detail }: { detail: LeaseDetail }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const { tenant } = detail;
  const lastDay = addDays(parseDay(detail.endDate), -1);
  const daysLeft = differenceInCalendarDays(parseDay(detail.endDate), today());
  const endingSoon = detail.computedStatus !== "ended" && daysLeft > 0 && daysLeft <= 60;
  const recent = [...detail.rentSchedule].reverse().slice(0, RECENT_RENTS);

  return (
    <div className="space-y-6">
      <div className="relative h-40 w-full overflow-hidden rounded-xl border border-[#A2E8DD]/30">
        <MediaImage kind="unit" id={detail.unitId} name={detail.unitName} variant="card" className="size-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
      </div>

      {endingSoon && (
        <p className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-xs text-primary">
          <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
          {t("leaseDrawer.endsIn", { count: daysLeft })}
        </p>
      )}

      <section className="space-y-2 rounded-lg border border-border/80 bg-[#161616] p-4">
        <h4 className="text-label-caps text-muted-foreground">{t("leaseDrawer.tenant")}</h4>
        <p className="font-serif text-base font-semibold text-foreground">{tenant.name}</p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="size-3.5 shrink-0" aria-hidden="true" />
          <a href={`mailto:${tenant.email}`} className="truncate hover:text-foreground">
            {tenant.email}
          </a>
        </p>
        {tenant.phone && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="size-3.5 shrink-0" aria-hidden="true" />
            <a href={`tel:${tenant.phone.replace(/\s/g, "")}`} dir="ltr" className="hover:text-foreground">
              {tenant.phone}
            </a>
          </p>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-border/80 bg-[#161616] p-4">
        <h4 className="text-label-caps text-muted-foreground">{t("leaseDrawer.terms")}</h4>
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div className="col-span-2 space-y-0.5">
            <dt className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {t("leaseDrawer.period")}
            </dt>
            <dd className="text-sm text-foreground">
              {t("leaseDrawer.range", {
                from: formatDate(parseDay(detail.startDate)),
                to: formatDate(lastDay),
              })}
            </dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {t("leaseDrawer.monthlyRent")}
            </dt>
            <dd className="font-mono text-sm font-semibold text-[#A2E8DD]">
              {formatMoney(detail.monthlyRentMinor, detail.currency)}
            </dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
              {t("leaseDrawer.deposit")}
            </dt>
            <dd className="font-mono text-sm text-foreground">
              {formatMoney(detail.depositMinor, detail.currency)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h4 className="text-label-caps text-muted-foreground">{t("leaseDrawer.rent")}</h4>
        {recent.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
            {t("leaseDrawer.noInvoices")}
          </p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/80 bg-[#161616]">
            {recent.map((row: RentScheduleRow) => (
              <li key={row.period} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="text-sm text-foreground">
                    {formatMonth(row.period, { style: "long", withYear: true })}
                  </p>
                  <p className="text-[0.68rem] text-muted-foreground">
                    {t("leaseDrawer.dueOn", { date: formatDate(parseDay(row.dueDate)) })}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-xs text-foreground">
                    {formatMoney(row.amountMinor, detail.currency)}
                  </span>
                  <span className={cn("inline-flex")}>
                    <RentStatusPill status={row.status as RentScheduleStatus} />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
