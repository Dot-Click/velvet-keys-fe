import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMonth } from "@/lib/currency";
import { money } from "./format";
import type { MrrPoint } from "@/types/admin-overview";

const GOLD = "#D4AF37";

/** MRR excl. VAT over the last 12 months; hover shows the STR / LTR / sync split. */
export function MrrChart({ history }: { history: MrrPoint[] }) {
  const { t, i18n } = useTranslation("admin-overview");
  const data = history.map((point) => ({
    ...point,
    total: point.totalMinor / 100,
    label: formatMonth(point.month, { style: "short" }),
  }));
  return (
    <div dir="ltr" role="img" aria-label={t("mrrChart.label")} className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="mrr-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
              <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
            </linearGradient>
          </defs>
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
            cursor={{ stroke: GOLD, strokeOpacity: 0.3 }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as (typeof data)[number] | undefined;
              if (!active || !row) return null;
              return (
                <div
                  dir={i18n.dir()}
                  className="space-y-1 rounded-lg border border-primary/40 bg-[#141414] p-3 text-xs tabular-nums shadow-2xl"
                >
                  <p className="font-semibold text-muted-foreground">
                    {formatMonth(row.month, { style: "long", withYear: true })}
                  </p>
                  <p className="text-sm font-semibold text-primary">{money(row.totalMinor)}</p>
                  <div className="space-y-0.5 border-t border-border/60 pt-1 text-muted-foreground">
                    <p>STR: {money(row.strMinor)}</p>
                    <p>LTR: {money(row.ltrMinor)}</p>
                    <p>
                      {t("mrrChart.sync")}: {money(row.syncMinor)}
                    </p>
                  </div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={GOLD}
            strokeWidth={2}
            fill="url(#mrr-fill)"
            activeDot={{ r: 4, fill: GOLD, stroke: "#0B0B0B" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
