import { Check, Landmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CopyField } from "@/components/copy-field";
import { useSubscriptionInvoice } from "@/hooks/use-portfolio-data";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { formatDate } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import { formatRib } from "@/lib/issuer";
import { formatMoney } from "@/lib/money";
import type { InvoiceListItem } from "@/types/subscription";

/**
 * Bank transfer instructions: the Velvet Keys RIB and the invoice number to quote, each with a
 * copy button. The beneficiary and RIB now live per-invoice (`sellerSnapshot`, taken when the
 * invoice was issued) rather than on a platform-wide settings object, so the invoice to pay first
 * is fetched once more for its snapshot.
 */
export function HowToPayCard({
  invoices,
  animatedCopy = false,
}: {
  invoices: InvoiceListItem[];
  /** Copy buttons confirm with a check that draws in */
  animatedCopy?: boolean;
}) {
  const { t } = useTranslation(["billing", "common"]);
  // The invoice to pay first: overdue before sent, oldest due date first
  const toPay = invoices
    .filter((invoice) => invoice.status === "overdue" || invoice.status === "sent")
    .sort(
      (a, b) =>
        Number(b.status === "overdue") - Number(a.status === "overdue") ||
        (a.dueDate ?? "").localeCompare(b.dueDate ?? ""),
    )[0];
  const detailQuery = useSubscriptionInvoice(toPay?.id ?? null);
  const seller = detailQuery.data?.sellerSnapshot;
  const rib = seller?.rib ? formatRib(seller.rib) : "";

  return (
    <section
      aria-labelledby="how-to-pay"
      className="space-y-5 rounded-2xl border border-border/80 bg-[#141414] p-6 shadow-xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-label-caps text-primary">{t("pay.badge")}</p>
          <h2 id="how-to-pay" className="font-serif text-2xl text-[#F8F9FA]">
            {t("pay.title")}
          </h2>
        </div>
        <Landmark className="size-6 shrink-0 text-primary" aria-hidden="true" />
      </div>

      <dl className="space-y-4">
        <div className="space-y-1.5">
          <dt className="text-label-caps text-muted-foreground">{t("pay.beneficiary")}</dt>
          <dd className="text-sm text-foreground">{seller?.name || t("common:brand.name")}</dd>
        </div>
        <div className="space-y-1.5">
          <dt className="text-label-caps text-muted-foreground">{t("pay.rib")}</dt>
          <dd>
            {rib ? (
              <CopyField
                value={rib}
                copiedMessage={t("pay.ribCopied")}
                label={t("pay.copyRib")}
                animated={animatedCopy}
              />
            ) : (
              <p className="text-xs text-muted-foreground">{t("pay.ribPending")}</p>
            )}
          </dd>
        </div>
        <div className="space-y-1.5">
          <dt className="text-label-caps text-muted-foreground">{t("pay.reference")}</dt>
          <dd className="space-y-1">
            {toPay ? (
              <>
                <CopyField
                  value={toPay.number}
                  copiedMessage={t("pay.referenceCopied")}
                  label={t("pay.copyReference")}
                  animated={animatedCopy}
                />
                {toPay.dueDate && (
                  <p className="text-[0.68rem] text-muted-foreground">
                    {t("pay.referenceFor", {
                      amount: formatMoney(toPay.totalMinor, ACCOUNT_CURRENCY),
                      date: formatDate(parseDay(toPay.dueDate)),
                    })}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{t("pay.referenceHint")}</p>
            )}
          </dd>
        </div>
      </dl>

      <p className="flex items-start gap-2 rounded-xl border border-[#A2E8DD]/30 bg-[#A2E8DD]/5 p-3 text-xs leading-relaxed text-[#A2E8DD]">
        <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {t("pay.confirmation")}
      </p>
    </section>
  );
}
