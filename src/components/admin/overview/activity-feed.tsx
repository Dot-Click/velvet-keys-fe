import { Link } from "@tanstack/react-router";
import {
  Ban,
  BadgeCheck,
  BellRing,
  EyeOff,
  Eye,
  Gift,
  Receipt,
  Tag,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatRelativeTime } from "@/lib/currency";
import { money } from "./format";
import { cn } from "@/lib/utils";
import type { ActivityEntry, ActivityKind } from "@/types/admin-overview";

const ICONS: Record<ActivityKind, { icon: LucideIcon; tone: string }> = {
  signup: { icon: UserPlus, tone: "text-[#A2E8DD]" },
  payment: { icon: Receipt, tone: "text-[#A2E8DD]" },
  offer: { icon: Gift, tone: "text-primary" },
  ban: { icon: Ban, tone: "text-[#FF85A1]" },
  unban: { icon: BadgeCheck, tone: "text-[#A2E8DD]" },
  delist: { icon: EyeOff, tone: "text-[#FF85A1]" },
  relist: { icon: Eye, tone: "text-[#A2E8DD]" },
  price: { icon: Tag, tone: "text-primary" },
  reminder: { icon: BellRing, tone: "text-muted-foreground" },
};

function Target({ entry, children }: { entry: ActivityEntry; children: React.ReactNode }) {
  const cls = "font-medium text-foreground underline-offset-4 hover:text-primary hover:underline";
  if (entry.invoiceId) {
    return (
      <Link to="/admin/invoices/$invoiceId" params={{ invoiceId: entry.invoiceId }} className={cls}>
        {children}
      </Link>
    );
  }
  if (entry.accountId) {
    return (
      <Link to="/admin/clients/$clientId" params={{ clientId: entry.accountId }} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/admin/pricing" className={cls}>
      {children}
    </Link>
  );
}

/** Signups, payments, offers, moderation and price changes, newest first. */
export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  const { t } = useTranslation("admin-overview");
  const now = new Date();
  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("activity.empty")}</p>;
  }
  return (
    <ul className="divide-y divide-border/60 rounded-lg border border-border/80 bg-[#121212]">
      {entries.map((entry) => {
        const { icon: Icon, tone } = ICONS[entry.kind];
        const target =
          entry.kind === "price"
            ? t("activity.priceTarget", {
                product: t(`upcoming.product.${entry.product ?? "str"}`),
              })
            : entry.invoiceNumber && entry.kind !== "signup"
              ? `${entry.invoiceNumber} · ${entry.clientName}`
              : (entry.clientName ?? "");
        return (
          <li key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full bg-[#1C1C1C]",
                tone,
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <p className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
              {entry.kind === "signup" ? (
                <Target entry={entry}>{entry.actor}</Target>
              ) : (
                <span className="text-foreground">{entry.actor || t("activity.someone")}</span>
              )}{" "}
              {t(`activity.${entry.kind}`)}
              {entry.kind !== "signup" && (
                <>
                  {" "}
                  <Target entry={entry}>{target}</Target>
                </>
              )}
              {entry.priceMinor !== undefined && (
                <span className="tabular-nums"> · {money(entry.priceMinor)}</span>
              )}
            </p>
            <time
              dateTime={entry.at}
              title={entry.at.slice(0, 16).replace("T", " ")}
              className="shrink-0 text-xs tabular-nums text-muted-foreground"
            >
              {formatRelativeTime(entry.at, now)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
