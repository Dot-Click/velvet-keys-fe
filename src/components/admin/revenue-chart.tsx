import { useTranslation } from "react-i18next";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { formatMonth, formatPercent } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import type { RevenueMonth } from "@/types/platform-admin";

const STR = "#D4AF37";
const LTR = "#8F8F8F";
const SYNC = "#5C5C5C";
const COLLECTED = "#A2E8DD";

/** Subscription revenue by product (excl. VAT) with the collected amount (incl. VAT) overlaid. */
export function RevenueChart({ months }: { months: RevenueMonth[] }) {
  const { t, i18n } = useTranslation("admin-overview");
  const peak = Math.max(
    1,
    ...months.map((month) => month.strMinor + month.ltrMinor + month.syncMinor),
  );
  const data = months.map((month) => ({
    ...month,
    str: month.strMinor,
    ltr: month.ltrMinor,
    sync: month.syncMinor,
    billed: month.billedMinor,
    collected: month.collectedMinor,
    label: formatMonth(month.month, { style: "short" }),
    // Months with no invoices keep a slim stub so the axis never shows a blank gap
    stub: month.invoices === 0 ? peak * 0.015 : 0,
    collectedLine: month.invoices === 0 ? null : month.collectedMinor,
  }));

  const legend = [
    { color: STR, label: "STR" },
    { color: LTR, label: "LTR" },
    { color: SYNC, label: t("revenueChart.sync") },
    { color: COLLECTED, label: t("revenueChart.collected") },
  ];

  return (
    <div className="space-y-3 rounded-lg border border-border/80 bg-[#121212] px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t("revenueChart.title")}</h3>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {legend.map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <div dir="ltr" role="img" aria-label={t("revenueChart.label")} className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#666"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#262626" }}
            />
            <YAxis
              stroke="#666"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
            />
            <RechartsTooltip
              cursor={{ fill: "rgba(212, 175, 55, 0.06)" }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as (typeof data)[number] | undefined;
                if (!active || !row) return null;
                const rate = row.billed > 0 ? (row.collected / row.billed) * 100 : 0;
                return (
                  <div
                    dir={i18n.dir()}
                    className="space-y-1 rounded-lg border border-primary/40 bg-[#141414] p-3 text-xs tabular-nums shadow-2xl"
                  >
                    <p className="font-semibold text-muted-foreground">
                      {formatMonth(row.month, { style: "long", withYear: true })}
                    </p>
                    {row.invoices === 0 ? (
                      <p className="text-muted-foreground">{t("revenueChart.noInvoices")}</p>
                    ) : (
                      <>
                        <p style={{ color: STR }}>STR: {formatMoney(row.str, ACCOUNT_CURRENCY)}</p>
                        <p style={{ color: LTR }}>LTR: {formatMoney(row.ltr, ACCOUNT_CURRENCY)}</p>
                        <p className="text-[#9A9A9A]">
                          {t("revenueChart.sync")}: {formatMoney(row.sync, ACCOUNT_CURRENCY)}
                        </p>
                        <p className="border-t border-border/60 pt-1" style={{ color: COLLECTED }}>
                          {t("revenueChart.collected")}:{" "}
                          {formatMoney(row.collected, ACCOUNT_CURRENCY)}
                        </p>
                        <p className="text-muted-foreground">
                          {t("revenueChart.rate", { rate: formatPercent(rate, { decimals: 0 }) })}
                        </p>
                      </>
                    )}
                  </div>
                );
              }}
            />
            <Bar dataKey="str" stackId="rev" fill={STR} maxBarSize={28} />
            <Bar dataKey="ltr" stackId="rev" fill={LTR} maxBarSize={28} />
            <Bar dataKey="sync" stackId="rev" fill={SYNC} radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Bar
              dataKey="stub"
              stackId="rev"
              fill="#262626"
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
            <Line
              type="monotone"
              dataKey="collectedLine"
              stroke={COLLECTED}
              strokeWidth={2}
              dot={{ r: 3, fill: COLLECTED, strokeWidth: 0 }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
