import { useTranslation } from "react-i18next";
import { formatMAD } from "@/lib/currency";

export function LedgerRows({
  items,
}: {
  items: {
    id: string;
    date: string;
    category: string;
    recipient: string;
    unit: string;
    amountMAD: number;
    status: "cleared";
  }[];
}) {
  const { t } = useTranslation("conciergerie");
  return (
    <div className="divide-y divide-border/60">
      {items.map((entry) => (
        <div
          key={entry.id}
          className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1A1814] transition-colors"
        >
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">
              {entry.date}
            </span>
            <div>
              <p className="text-xs font-semibold text-foreground">{entry.recipient}</p>
              <p className="text-[0.68rem] text-muted-foreground">
                {entry.category} · {entry.unit}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono">
            <span className="text-primary font-semibold text-sm">{formatMAD(entry.amountMAD)}</span>
            <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[0.62rem] text-success uppercase">
              {t(`expenses.status.${entry.status}`)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
