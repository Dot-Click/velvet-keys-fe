import { useTranslation } from "react-i18next";
import { DeltaBadge, KpiCard } from "@/components/admin/kpi-card";
import { formatNumber } from "@/lib/currency";
import type { CommandCenter } from "@/types/admin-overview";
import { money, signedMoney, signedNumber } from "./format";

const STR = "#D4AF37";
const LTR = "#8F8F8F";
const SYNC = "#A2E8DD";

/** STR / LTR / synced as a mini stacked bar with its own legend. */
function UnitsBar({ str, ltr, synced }: { str: number; ltr: number; synced: number }) {
  const { t } = useTranslation("admin-overview");
  const total = Math.max(1, str + ltr);
  const syncedOnly = Math.min(synced, str);
  const parts = [
    { key: "syncedStr", value: syncedOnly, color: SYNC, label: t("kpi.synced") },
    { key: "str", value: str - syncedOnly, color: STR, label: t("kpi.str") },
    { key: "ltr", value: ltr, color: LTR, label: t("kpi.ltr") },
  ];
  return (
    <div className="space-y-1.5">
      <div
        dir="ltr"
        role="img"
        aria-label={t("kpi.unitsLabel", { str, ltr, synced })}
        className="flex h-2 overflow-hidden rounded-full bg-[#1C1C1C]"
      >
        {parts.map((part) =>
          part.value > 0 ? (
            <span
              key={part.key}
              style={{ width: `${(part.value / total) * 100}%`, backgroundColor: part.color }}
            />
          ) : null,
        )}
      </div>
      <p className="flex flex-wrap gap-x-3 text-[0.7rem] tabular-nums text-muted-foreground">
        <span className="whitespace-nowrap">
          <i
            className="me-1 inline-block size-1.5 rounded-sm align-middle"
            style={{ backgroundColor: STR }}
          />
          {t("kpi.str")} {str}
        </span>
        <span className="whitespace-nowrap">
          <i
            className="me-1 inline-block size-1.5 rounded-sm align-middle"
            style={{ backgroundColor: LTR }}
          />
          {t("kpi.ltr")} {ltr}
        </span>
        <span className="whitespace-nowrap">
          <i
            className="me-1 inline-block size-1.5 rounded-sm align-middle"
            style={{ backgroundColor: SYNC }}
          />
          {t("kpi.synced")} {synced}
        </span>
      </p>
    </div>
  );
}

/** Free sync slots used, as a radial gauge. */
function SlotsGauge({ used, total }: { used: number; total: number }) {
  const { t } = useTranslation("admin-overview");
  const share = total > 0 ? Math.min(1, used / total) : 0;
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 40 40" className="size-12 shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#1C1C1C" strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="#D4AF37"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${share * c} ${c}`}
        />
      </svg>
      <p className="text-xs text-muted-foreground">
        {t("kpi.slotsLeft", { count: Math.max(0, total - used) })}
      </p>
    </div>
  );
}

export function KpiRow({ data }: { data: CommandCenter }) {
  const { t } = useTranslation("admin-overview");
  const vsLast = t("kpi.vsLastMonth");
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard
        label={t("kpi.mrr")}
        value={money(data.mrr.value)}
        highlight
        delta={
          <DeltaBadge
            value={data.mrr.delta}
            text={signedMoney(data.mrr.delta ?? 0)}
            suffix={vsLast}
          />
        }
        detail={t("kpi.mrrDetail")}
        spark={data.mrr.spark}
      />
      <KpiCard
        label={t("kpi.clients")}
        value={formatNumber(data.clients.value)}
        delta={
          <DeltaBadge
            value={data.clients.delta}
            text={signedNumber(data.clients.delta ?? 0)}
            suffix={vsLast}
          />
        }
        detail={t("kpi.newThisMonth", { count: data.clients.newThisMonth })}
        spark={data.clients.spark}
      />
      <KpiCard
        label={t("kpi.units")}
        value={formatNumber(data.units.str + data.units.ltr)}
        delta={
          <DeltaBadge
            value={data.units.delta}
            text={signedNumber(data.units.delta ?? 0)}
            suffix={vsLast}
          />
        }
        visual={<UnitsBar str={data.units.str} ltr={data.units.ltr} synced={data.units.synced} />}
      />
      <KpiCard
        label={t("kpi.outstanding")}
        value={money(data.outstanding.value)}
        tone={data.outstanding.overdueCount > 0 ? "danger" : "default"}
        delta={
          <DeltaBadge
            value={data.outstanding.delta}
            text={signedMoney(data.outstanding.delta ?? 0)}
            goodWhen="down"
            suffix={vsLast}
          />
        }
        detail={
          data.outstanding.overdueCount > 0 ? (
            <span className="text-[#FF85A1]">
              {t("kpi.overdueCount", {
                count: data.outstanding.overdueCount,
                amount: money(data.outstanding.overdueAmountMinor),
              })}
            </span>
          ) : (
            t("kpi.noOverdue")
          )
        }
        spark={data.outstanding.spark}
      />
      <KpiCard
        label={t("kpi.freeSync")}
        value={
          <span dir="ltr">
            {formatNumber(data.freeSync.used)}
            <span className="text-sm font-normal text-muted-foreground">
              {" / "}
              {formatNumber(data.freeSync.total)}
            </span>
          </span>
        }
        visual={<SlotsGauge used={data.freeSync.used} total={data.freeSync.total} />}
      />
    </div>
  );
}
