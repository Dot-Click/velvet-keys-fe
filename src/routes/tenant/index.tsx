import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, FileText, MapPin, ReceiptText, ScrollText } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth-provider";
import { PayRentCard } from "@/components/tenant/pay-rent-card";
import { TenantInvoiceDialog } from "@/components/tenant/tenant-invoice-dialog";
import { TenantPortalView } from "@/components/tenant/tenant-page";
import { TenantRentPill } from "@/components/tenant/tenant-rent-pill";
import { Button } from "@/components/ui/button";
import { useTenantPortal, type TenantPortalTuple } from "@/hooks/use-tenant-portal";
import { casablancaClock } from "@/lib/clock";
import { formatDate, formatMonth } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { parseDay } from "@/lib/dates";
import type { RentInvoice, TenantHome } from "@/types/ltr";

export const Route = createFileRoute("/tenant/")({
  component: TenantHomePage,
});

/** Morning until noon, afternoon until 6 pm, Casablanca time. */
function partOfDay(): "morning" | "afternoon" | "evening" {
  const hour = Number(casablancaClock().slice(0, 2));
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

function TenantHomePage() {
  const { t } = useTranslation("tenant");
  const { session } = useAuth();
  const query = useTenantPortal();
  const firstName = session?.profile.displayName.split(" ")[0] ?? "";

  return (
    <TenantPortalView
      query={query}
      eyebrow={t("home.eyebrow")}
      title={t(`home.greeting.${partOfDay()}`, { name: firstName })}
      subtitle={t("home.subtitle")}
      requiresLease={false}
    >
      {(portal) => <HomeContent portal={portal} />}
    </TenantPortalView>
  );
}

function HomeContent({ portal }: { portal: TenantPortalTuple }) {
  const [preview, setPreview] = React.useState<RentInvoice | null>(null);
  const [home, lease, invoicesPage] = portal;
  const nextInvoice = home.nextRent
    ? invoicesPage.items.find(
        (row) => row.dueDate === home.nextRent?.dueDate && row.amountMinor === home.nextRent.amountMinor,
      )
    : undefined;
  const unpaid = invoicesPage.items.filter((row) => row.status !== "paid").length;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <MyHomeCard home={home} />
        <NextRentCard home={home} onOpenInvoice={nextInvoice ? () => setPreview(nextInvoice) : undefined} />
      </div>

      {home.nextRent && (
        <PayRentCard
          payeeName={lease?.managerName}
          rib={home.issuerRib}
          reference={nextInvoice?.number}
          amountMinor={home.nextRent.amountMinor}
          currency={home.nextRent.currency}
          dueDate={home.nextRent.dueDate}
        />
      )}

      <Shortcuts unpaid={unpaid} />

      <TenantInvoiceDialog
        invoice={preview}
        managerName={lease?.managerName ?? ""}
        issuerRib={home.issuerRib}
        onClose={() => setPreview(null)}
      />
    </>
  );
}

function MyHomeCard({ home }: { home: TenantHome }) {
  const { t } = useTranslation("tenant");
  return (
    <section
      aria-labelledby="my-home"
      className="overflow-hidden rounded-2xl border border-border/80 bg-[#141414] shadow-xl"
    >
      <div className="relative aspect-[16/10] bg-[#111111]" />
      <div className="space-y-2 p-6">
        <p className="text-label-caps text-primary">{t("home.myHome")}</p>
        <h2 id="my-home" className="font-serif text-2xl text-[#F8F9FA]">
          {home.unitName}
        </h2>
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary/80" aria-hidden="true" />
          <span>{home.propertyAddress}</span>
        </p>
      </div>
    </section>
  );
}

function NextRentCard({
  home,
  onOpenInvoice,
}: {
  home: TenantHome;
  onOpenInvoice: (() => void) | undefined;
}) {
  const { t } = useTranslation("tenant");
  const { nextRent } = home;

  return (
    <section
      aria-labelledby="next-rent"
      className="flex flex-col justify-between gap-6 rounded-2xl border border-primary/30 bg-[#141414] p-6 shadow-xl"
    >
      <div className="space-y-1.5">
        <h2 id="next-rent" className="text-label-caps text-primary">
          {t("home.nextRent")}
        </h2>
        {nextRent && (
          <p className="text-xs text-muted-foreground">
            {t("home.rentFor", {
              month: formatMonth(nextRent.dueDate, { style: "long", withYear: true }),
            })}
          </p>
        )}
      </div>

      {nextRent ? (
        <div className="space-y-4">
          <p className="font-serif text-4xl font-light text-[#F8F9FA] sm:text-5xl">
            {formatMoney(nextRent.amountMinor, nextRent.currency)}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <TenantRentPill status={nextRent.status} />
            <p className="text-sm text-muted-foreground">
              {t("home.dueOn", { date: formatDate(parseDay(nextRent.dueDate)) })}
            </p>
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2.5 font-serif text-xl text-[#A2E8DD]">
          <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
          {t("home.allPaid")}
        </p>
      )}

      {onOpenInvoice && (
        <Button
          variant="outline"
          onClick={onOpenInvoice}
          className="w-full text-xs uppercase tracking-wider sm:w-auto sm:self-start"
        >
          <FileText className="size-3.5" aria-hidden="true" />
          {t("home.viewInvoice")}
        </Button>
      )}
    </section>
  );
}

function Shortcuts({ unpaid }: { unpaid: number }) {
  const { t } = useTranslation("tenant");
  const shortcuts = [
    {
      to: "/tenant/lease" as const,
      icon: ScrollText,
      title: t("home.shortcutLease"),
      body: t("home.shortcutLeaseBody"),
    },
    {
      to: "/tenant/invoices" as const,
      icon: ReceiptText,
      title: t("home.shortcutInvoices"),
      body: unpaid > 0 ? t("home.unpaidCount", { count: unpaid }) : t("home.shortcutInvoicesBody"),
    },
  ];

  return (
    <nav aria-label={t("home.shortcuts")} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {shortcuts.map((shortcut) => (
        <Link
          key={shortcut.to}
          to={shortcut.to}
          className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-[#141414] p-5 transition-colors hover:border-primary/50"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/5 text-primary">
            <shortcut.icon className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 space-y-0.5">
            <span className="block font-serif text-lg text-[#F8F9FA]">{shortcut.title}</span>
            <span className="block text-xs text-muted-foreground">{shortcut.body}</span>
          </span>
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground transition-transform rtl-flip group-hover:translate-x-0.5 group-hover:text-primary rtl:group-hover:-translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      ))}
    </nav>
  );
}
