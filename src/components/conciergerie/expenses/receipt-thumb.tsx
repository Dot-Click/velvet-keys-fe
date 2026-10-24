import { FileX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useFileUrl } from "@/hooks/use-file-url";
import { formatDate } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import type { Expense } from "@/types/ops";

/**
 * Receipt for an expense: a small paper tile in the row that opens the uploaded file, with the
 * expense's details on hover. Expenses without a receipt show a muted placeholder tile.
 */
export function ReceiptThumb({ expense }: { expense: Expense }) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const file = useFileUrl(expense.receiptFileId);

  if (!expense.receiptFileId) {
    return (
      <span
        title={t("expenses.noReceipt")}
        className="grid h-10 w-8 shrink-0 place-items-center rounded-[3px] border border-dashed border-border/70 text-muted-foreground/60"
      >
        <FileX className="size-3.5" aria-hidden="true" />
        <span className="sr-only">{t("expenses.noReceipt")}</span>
      </span>
    );
  }

  const label = t("expenses.receiptFor", { payee: expense.description });
  const tile = (
    <>
      <span aria-hidden="true" className="absolute inset-x-1.5 top-1.5 space-y-1">
        <span className="block h-0.5 w-2/3 rounded-full bg-[#8B7A55]/70" />
        {[0, 1, 2].map((line) => (
          <span key={line} className="block h-px rounded-full bg-[#6B6252]/40" />
        ))}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-x-1.5 bottom-1.5 h-0.5 rounded-full bg-[#8B7A55]/70"
      />
    </>
  );
  const tileClass =
    "relative block h-10 w-8 shrink-0 overflow-hidden rounded-[3px] bg-[#EDE6D6] shadow-[0_3px_8px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5";

  return (
    <HoverCard openDelay={150} closeDelay={60}>
      <HoverCardTrigger asChild>
        {file.data ? (
          <a
            href={file.data}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            aria-label={label}
            className={tileClass}
          >
            {tile}
          </a>
        ) : (
          <span
            aria-label={
              file.isError ? t("expenses.receiptUnavailable") : t("common:states.loading")
            }
            className={`${tileClass} ${file.isError ? "opacity-50" : "animate-pulse"}`}
          >
            {tile}
          </span>
        )}
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-64 border-0 bg-transparent p-0 shadow-none">
        <div className="relative rounded-md bg-[#F3EDDF] p-4 font-sans text-[#2B2620] shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[#8B7A55]">
            {t("expenses.receiptTitle")}
          </p>
          <p className="mt-1 font-['Cormorant_Garamond',Georgia,serif] text-xl leading-tight">
            {expense.description}
          </p>
          <p className="text-[0.7rem] text-[#6B6252]">{expense.propertyName}</p>
          <dl className="mt-3 space-y-1 border-t border-dashed border-[#8B7A55]/40 pt-3 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-[#6B6252]">{t("expenses.colDate")}</dt>
              <dd>{formatDate(expense.date)}</dd>
            </div>
          </dl>
          <p
            dir="ltr"
            className="mt-3 border-t border-dashed border-[#8B7A55]/40 pt-3 text-end text-lg font-semibold tabular-nums rtl:text-left"
          >
            {formatMoney(expense.amountMinor, expense.currency)}
          </p>
          <p className="mt-2 text-[0.65rem] text-[#8B7A55]">
            {file.isError ? t("expenses.receiptUnavailable") : t("expenses.openReceipt")}
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
