import { Info, Landmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CopyField } from "@/components/copy-field";
import { formatDate } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { parseDay } from "@/lib/dates";
import { formatRib } from "@/lib/issuer";
import { cn } from "@/lib/utils";

/**
 * How to pay a rent: the manager's RIB and the invoice number to quote, each with a copy button.
 * The full card sits on Home; the inline version under each unpaid invoice. The backend does not
 * expose the issuer's full profile to a tenant (only `issuerRib`), so there is no beneficiary
 * name to print here beyond the manager's own name.
 */
export function PayRentCard({
  payeeName,
  rib,
  reference,
  amountMinor,
  currency,
  dueDate,
  variant = "card",
  className,
}: {
  /** The manager's name, shown as who the rent is paid to */
  payeeName: string | undefined;
  /** The issuer's RIB, or null until the manager sets one */
  rib: string | null;
  /** Invoice number; absent until the manager issues the invoice */
  reference: string | undefined;
  amountMinor: number;
  currency: string;
  dueDate: string;
  variant?: "card" | "inline";
  className?: string;
}) {
  const { t } = useTranslation("tenant");
  const formattedRib = rib ? formatRib(rib) : "";
  const inline = variant === "inline";

  const fields = (
    <dl className="space-y-4">
      <div className="space-y-1.5">
        <dt className="text-label-caps text-muted-foreground">{t("pay.rib")}</dt>
        <dd>
          {formattedRib ? (
            <CopyField
              value={formattedRib}
              label={t("pay.copyRib")}
              copiedMessage={t("pay.ribCopied")}
            />
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">{t("pay.ribMissing")}</p>
          )}
        </dd>
      </div>
      <div className="space-y-1.5">
        <dt className="text-label-caps text-muted-foreground">{t("pay.reference")}</dt>
        <dd>
          {reference ? (
            <CopyField
              value={reference}
              label={t("pay.copyReference")}
              copiedMessage={t("pay.referenceCopied")}
            />
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("pay.referencePending")}
            </p>
          )}
        </dd>
      </div>
    </dl>
  );

  if (inline) {
    return (
      <div
        className={cn("space-y-4 rounded-xl border border-primary/25 bg-primary/5 p-4", className)}
      >
        <p className="flex items-center gap-2 text-label-caps text-primary">
          <Landmark className="size-3.5" aria-hidden="true" />
          {t("pay.title")}
        </p>
        {fields}
      </div>
    );
  }

  return (
    <section
      aria-labelledby="tenant-how-to-pay"
      className={cn(
        "space-y-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-[#1A1712] via-[#141414] to-[#121212] p-6 shadow-xl sm:p-8",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-label-caps text-primary">{t("pay.badge")}</p>
          <h2 id="tenant-how-to-pay" className="font-serif text-2xl text-[#F8F9FA]">
            {t("pay.title")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("pay.instruction", {
              amount: formatMoney(amountMinor, currency),
              name: payeeName || t("pay.yourManager"),
              date: formatDate(parseDay(dueDate)),
            })}
          </p>
        </div>
        <Landmark className="size-6 shrink-0 text-primary" aria-hidden="true" />
      </div>
      {fields}
      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
        {t("pay.note")}
      </p>
    </section>
  );
}
