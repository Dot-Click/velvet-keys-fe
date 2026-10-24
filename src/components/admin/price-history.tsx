import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { formatDate, formatMonth } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BillingProduct } from "@/types/subscription";
import type { AdminPricing } from "@/types/platform-admin";
import { AdminTable, Td, Th } from "./admin-table";

const PRODUCTS: BillingProduct[] = ["str", "ltr", "sync"];

const TAG =
  "rounded-full border px-1.5 py-px text-[0.58rem] font-semibold uppercase tracking-wider";

/** Every price change, newest first, with the ones still to take effect marked as scheduled. */
export function PriceHistory({ pricing }: { pricing: AdminPricing }) {
  const { t } = useTranslation("admin");
  const { history, currentPeriod } = pricing;
  // The change behind each product's price today: the newest one that has already taken effect
  const inForce = new Set(
    PRODUCTS.map(
      (product) =>
        history.find(
          (change) => change.product === product && change.effectiveFrom <= currentPeriod,
        )?.id,
    ),
  );

  return (
    <AdminTable>
      <thead>
        <tr>
          <Th>{t("pricing.history.colDate")}</Th>
          <Th>{t("pricing.history.colProduct")}</Th>
          <Th>{t("pricing.history.colChange")}</Th>
          <Th>{t("pricing.history.colEffective")}</Th>
          <Th>{t("pricing.history.colBy")}</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60">
        {history.map((change) => {
          const scheduled = change.effectiveFrom > currentPeriod;
          return (
            <tr key={change.id}>
              <Td className="text-muted-foreground">{formatDate(change.changedAt)}</Td>
              <Td className="font-medium">{t(`products.${change.product}`)}</Td>
              <Td>
                <span dir="ltr" className="flex items-center gap-2 text-xs tabular-nums">
                  {change.fromMinor === null ? (
                    <span className="font-sans text-muted-foreground" dir="auto">
                      {t("pricing.history.initial")}
                    </span>
                  ) : (
                    <>
                      <span className="text-muted-foreground">
                        {formatMoney(change.fromMinor, ACCOUNT_CURRENCY)}
                      </span>
                      <ArrowRight className="size-3 text-muted-foreground" aria-hidden="true" />
                    </>
                  )}
                  <span className="font-semibold text-foreground">
                    {formatMoney(change.toMinor, ACCOUNT_CURRENCY)}
                  </span>
                </span>
              </Td>
              <Td>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {formatMonth(change.effectiveFrom, { style: "long", withYear: true })}
                  </span>
                  {scheduled && (
                    <span className={cn(TAG, "border-primary/40 bg-primary/10 text-primary")}>
                      {t("pricing.history.scheduled")}
                    </span>
                  )}
                  {inForce.has(change.id) && (
                    <span className={cn(TAG, "border-[#A2E8DD]/40 bg-[#A2E8DD]/10 text-[#A2E8DD]")}>
                      {t("pricing.history.current")}
                    </span>
                  )}
                </span>
              </Td>
              <Td className="text-muted-foreground">{change.changedBy}</Td>
            </tr>
          );
        })}
      </tbody>
    </AdminTable>
  );
}
