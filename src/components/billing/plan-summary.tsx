import { addMonths, startOfMonth } from "date-fns";
import { Cable, Home, KeyRound, Receipt } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { today } from "@/lib/clock";
import { formatDate, formatMonth, formatPercent } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BillingSummary } from "@/types/subscription";

/**
 * Units on the plan at their monthly price, and the invoice expected on the 1st of next month.
 * The estimate covers the month in progress; the backend has no explicit "period" field for it,
 * so the current calendar month (and next month's 1st) are derived from the clock.
 */
export function PlanSummary({
  summary,
  operations = false,
}: {
  summary: BillingSummary;
  /** Operations panel layout: no section heading, the next invoice as a large serif figure */
  operations?: boolean;
}) {
  const { t } = useTranslation("billing");
  const { estimatedNextInvoice: estimate } = summary;
  const hasFreeMonths = estimate.lines.some((line) => line.type === "offer");
  const period = today();
  const issueDay = startOfMonth(addMonths(period, 1));
  const vatRate = estimate.subtotalMinor > 0 ? estimate.vatMinor / estimate.subtotalMinor : null;

  if (operations)
    return (
      <OperationsPlan
        summary={summary}
        issueDay={issueDay}
        period={period}
        hasFreeMonths={hasFreeMonths}
        vatRate={vatRate}
      />
    );

  return (
    <section aria-labelledby="plan-summary" className="space-y-4">
      <div>
        <p className="text-label-caps text-primary">{t("screen.planBadge")}</p>
        <h2
          id="plan-summary"
          className="font-display text-2xl uppercase tracking-[0.1em] text-[#F8F9FA]"
        >
          {t("screen.planTitle")}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UnitCard
          icon={<Home className="size-4" aria-hidden="true" />}
          label={t("screen.strUnits")}
          count={summary.strUnits}
          priceMinor={summary.strPriceMinor}
          accent="gold"
        />
        <UnitCard
          icon={<KeyRound className="size-4" aria-hidden="true" />}
          label={t("screen.ltrUnits")}
          count={summary.ltrUnits}
          priceMinor={summary.ltrPriceMinor}
          accent="jade"
        />
        <UnitCard
          icon={<Cable className="size-4" aria-hidden="true" />}
          label={t("screen.syncedUnits")}
          count={summary.syncedUnits}
          priceMinor={summary.syncPriceMinor}
          accent="muted"
        />

        <div className="space-y-3 rounded-2xl border border-primary/40 bg-gradient-to-b from-[#1A1712] to-[#141414] p-5 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <p className="text-label-caps text-primary">{t("screen.nextInvoice")}</p>
            <Receipt className="size-4 text-primary" aria-hidden="true" />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("screen.nextInvoicePeriod", {
              month: formatMonth(period, { style: "long", withYear: true }),
              date: formatDate(issueDay),
            })}
          </p>
          <dl className="space-y-1.5 font-mono text-xs">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <dt className="font-sans text-muted-foreground">{t("screen.exclVat")}</dt>
              <dd className="whitespace-nowrap text-foreground">
                {formatMoney(estimate.subtotalMinor, ACCOUNT_CURRENCY)}
              </dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <dt className="font-sans text-muted-foreground">
                {vatRate !== null
                  ? t("screen.vat", { rate: formatPercent(vatRate * 100, { decimals: 0 }) })
                  : t("screen.vatGeneric")}
              </dt>
              <dd className="whitespace-nowrap text-foreground">
                {formatMoney(estimate.vatMinor, ACCOUNT_CURRENCY)}
              </dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-border/60 pt-2 text-sm">
              <dt className="font-sans font-semibold text-foreground">
                {t("screen.totalInclVat")}
              </dt>
              <dd className="whitespace-nowrap font-bold text-primary">
                {formatMoney(estimate.totalMinor, ACCOUNT_CURRENCY)}
              </dd>
            </div>
          </dl>
          {hasFreeMonths && (
            <p className="text-[0.68rem] text-[#A2E8DD]">{t("screen.includesFreeMonths")}</p>
          )}
        </div>
      </div>
    </section>
  );
}

const ACCENTS = {
  gold: "border-primary/30 text-primary",
  jade: "border-[#A2E8DD]/30 text-[#A2E8DD]",
  muted: "border-border/80 text-foreground",
} as const;

function UnitCard({
  icon,
  label,
  count,
  priceMinor,
  accent,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  priceMinor: number;
  accent: keyof typeof ACCENTS;
}) {
  const { t } = useTranslation("billing");
  return (
    <div
      className={cn("space-y-3 rounded-2xl border bg-[#141414] p-5", ACCENTS[accent].split(" ")[0])}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-label-caps text-muted-foreground">{label}</p>
        <span className={ACCENTS[accent].split(" ")[1]}>{icon}</span>
      </div>
      <p className="font-serif text-3xl font-light text-[#F8F9FA]">
        {t("screen.unitsTimesPrice", { count, price: formatMoney(priceMinor, ACCOUNT_CURRENCY) })}
      </p>
      <p className="font-mono text-xs text-muted-foreground">
        {t("screen.perMonth", { amount: formatMoney(count * priceMinor, ACCOUNT_CURRENCY) })}
      </p>
    </div>
  );
}

/** Operations layout: three unit cards with icons and the estimated next invoice in large serif. */
function OperationsPlan({
  summary,
  issueDay,
  period,
  hasFreeMonths,
  vatRate,
}: {
  summary: BillingSummary;
  issueDay: Date;
  period: Date;
  hasFreeMonths: boolean;
  vatRate: number | null;
}) {
  const { t } = useTranslation("billing");
  const { estimatedNextInvoice: estimate } = summary;
  const cards = [
    {
      id: "str",
      icon: Home,
      label: t("screen.strUnits"),
      count: summary.strUnits,
      priceMinor: summary.strPriceMinor,
      tone: "text-primary border-primary/30",
    },
    {
      id: "ltr",
      icon: KeyRound,
      label: t("screen.ltrUnits"),
      count: summary.ltrUnits,
      priceMinor: summary.ltrPriceMinor,
      tone: "text-[#A2E8DD] border-[#A2E8DD]/30",
    },
    {
      id: "sync",
      icon: Cable,
      label: t("screen.syncedUnits"),
      count: summary.syncedUnits,
      priceMinor: summary.syncPriceMinor,
      tone: "text-foreground border-border/70",
    },
  ];
  return (
    <section aria-label={t("screen.planTitle")} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
        {cards.map((card) => (
          <div
            key={card.id}
            className="group hover-lift space-y-3 rounded-2xl border border-border/70 bg-[#141414] p-5"
          >
            <span
              className={cn(
                "grid size-10 place-items-center rounded-xl border bg-[#161616]",
                card.tone,
              )}
            >
              <card.icon className="icon-nudge size-5" aria-hidden="true" />
            </span>
            <p className="text-[0.7rem] text-muted-foreground">{card.label}</p>
            <p className="figure-serif text-3xl leading-none text-[#F8F9FA]">
              {t("screen.unitsTimesPrice", {
                count: card.count,
                price: formatMoney(card.priceMinor, ACCOUNT_CURRENCY),
              })}
            </p>
            <p dir="ltr" className="text-xs tabular-nums text-muted-foreground rtl:text-right">
              {t("screen.perMonth", {
                amount: formatMoney(card.count * card.priceMinor, ACCOUNT_CURRENCY),
              })}
            </p>
          </div>
        ))}
      </div>
      <div className="hover-lift flex flex-col justify-between gap-4 rounded-2xl border border-primary/35 bg-[linear-gradient(160deg,rgba(212,175,55,0.10),transparent_65%),#141414] p-5 lg:col-span-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[0.7rem] text-primary">{t("screen.nextInvoice")}</p>
            <p className="text-xs text-muted-foreground">
              {t("screen.nextInvoicePeriod", {
                month: formatMonth(period, { style: "long", withYear: true }),
                date: formatDate(issueDay),
              })}
            </p>
          </div>
          <Receipt className="size-5 text-primary" aria-hidden="true" />
        </div>
        <p dir="ltr" className="figure-serif text-5xl leading-none text-primary rtl:text-right">
          {formatMoney(estimate.totalMinor, ACCOUNT_CURRENCY)}
        </p>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          <div className="flex gap-1.5">
            <dt>{t("screen.exclVat")}</dt>
            <dd dir="ltr" className="tabular-nums text-foreground">
              {formatMoney(estimate.subtotalMinor, ACCOUNT_CURRENCY)}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt>
              {vatRate !== null
                ? t("screen.vat", { rate: formatPercent(vatRate * 100, { decimals: 0 }) })
                : t("screen.vatGeneric")}
            </dt>
            <dd dir="ltr" className="tabular-nums text-foreground">
              {formatMoney(estimate.vatMinor, ACCOUNT_CURRENCY)}
            </dd>
          </div>
        </dl>
        {hasFreeMonths && (
          <p className="text-[0.7rem] text-[#A2E8DD]">{t("screen.includesFreeMonths")}</p>
        )}
      </div>
    </section>
  );
}
