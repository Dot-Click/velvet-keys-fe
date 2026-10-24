import { createFileRoute } from "@tanstack/react-router";
import { addDays } from "date-fns";
import { Download, FileX, Mail, MapPin, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { NoLeaseState, TenantPortalView } from "@/components/tenant/tenant-page";
import { Button } from "@/components/ui/button";
import { useTenantContract } from "@/hooks/use-portfolio-data";
import { useTenantPortal, type TenantPortalTuple } from "@/hooks/use-tenant-portal";
import { isApiError } from "@/lib/apiClient";
import { formatDate } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { parseDay } from "@/lib/dates";
import type { TenantLease } from "@/types/ltr";

export const Route = createFileRoute("/tenant/lease")({
  component: TenantLeasePage,
});

/** The backend's tenant-lease view has no `currency` field (unlike the rest of the LTR API),
 *  so this falls back to the app's default currency for the amounts it shows. */
const FALLBACK_CURRENCY = "MAD";

function TenantLeasePage() {
  const { t } = useTranslation("tenant");
  const query = useTenantPortal();
  return (
    <TenantPortalView
      query={query}
      eyebrow={t("lease.eyebrow")}
      title={t("lease.title")}
      subtitle={t("lease.subtitle")}
    >
      {(portal) => <LeaseOrEmpty portal={portal} />}
    </TenantPortalView>
  );
}

function LeaseOrEmpty({ portal }: { portal: TenantPortalTuple }) {
  const [, lease] = portal;
  return lease ? <LeaseContent lease={lease} /> : <NoLeaseState />;
}

function LeaseContent({ lease }: { lease: TenantLease }) {
  const { t } = useTranslation("tenant");
  const lastDay = addDays(parseDay(lease.endDate), -1);

  return (
    <>
      <section className="flex flex-col gap-5 rounded-2xl border border-border/80 bg-[#141414] p-5 shadow-xl sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0 flex-1 space-y-1.5">
          <h2 className="font-serif text-2xl text-[#F8F9FA]">{lease.unitName}</h2>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary/80" aria-hidden="true" />
            <span>{lease.propertyAddress}</span>
          </p>
        </div>
      </section>

      <section aria-labelledby="lease-terms" className="space-y-4">
        <h2 id="lease-terms" className="text-label-caps text-primary">
          {t("lease.terms")}
        </h2>
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border/80 bg-border/60 sm:grid-cols-2">
          <Term label={t("lease.startDate")}>{formatDate(parseDay(lease.startDate))}</Term>
          <Term label={t("lease.endDate")}>{formatDate(lastDay)}</Term>
          <Term label={t("lease.monthlyRent")}>
            <span className="font-mono">{formatMoney(lease.monthlyRentMinor, FALLBACK_CURRENCY)}</span>
          </Term>
          <Term label={t("lease.deposit")}>
            <span className="font-mono">{formatMoney(lease.depositMinor, FALLBACK_CURRENCY)}</span>
          </Term>
        </dl>
        <ContractDownload />
      </section>

      <ManagerCard managerName={lease.managerName} managerContact={lease.managerContact} />
    </>
  );
}

/**
 * Download button for the lease contract. A 404 from the contract endpoint means the manager has
 * not uploaded one yet, so the button is replaced by a notice instead of failing silently.
 * Any other failure (network, expired link, storage down) surfaces as a toast.
 */
function ContractDownload() {
  const { t } = useTranslation("tenant");
  const contract = useTenantContract();
  const [busy, setBusy] = useState(false);
  const missing =
    (contract.isError && isApiError(contract.error) && contract.error.status === 404) ||
    (contract.isSuccess && !contract.data?.contractFileId);

  if (missing) {
    return (
      <p
        role="status"
        className="flex items-center gap-2 rounded-xl border border-border/80 bg-[#141414] px-4 py-3 text-sm text-muted-foreground"
      >
        <FileX className="size-4 shrink-0 text-primary/80" aria-hidden="true" />
        {t("lease.noContract")}
      </p>
    );
  }

  async function download() {
    setBusy(true);
    try {
      // A fresh request each time: the signed download link is short-lived.
      const result = await contract.refetch();
      if (result.error && isApiError(result.error) && result.error.status === 404) return;
      const url = result.data?.downloadUrl;
      if (!url) {
        toast.error(t("lease.contractUnavailable"), {
          description: result.data?.note ?? undefined,
        });
        return;
      }
      const link = document.createElement("a");
      link.href = url;
      link.download = "contract.pdf";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error(t("lease.contractDownloadFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      onClick={() => void download()}
      disabled={busy || contract.isPending}
      className="btn-shimmer w-full bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground sm:w-auto"
    >
      <Download className="size-4" aria-hidden="true" />
      {t("lease.downloadContract")}
    </Button>
  );
}

function Term({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1 bg-[#141414] p-5">
      <dt className="text-label-caps text-muted-foreground">{label}</dt>
      <dd className="text-base text-[#F8F9FA]">{children}</dd>
    </div>
  );
}

/** Who the tenant rents from. The backend only exposes a name and one free-form contact string
 *  (usually an email), not separate phone/email fields like the old mock. */
function ManagerCard({
  managerName,
  managerContact,
}: {
  managerName: string;
  managerContact: string | null;
}) {
  const { t } = useTranslation("tenant");
  return (
    <section
      aria-labelledby="lease-manager"
      className="space-y-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-[#1A1712] via-[#141414] to-[#121212] p-6 shadow-xl"
    >
      <div className="space-y-1">
        <h2 id="lease-manager" className="text-label-caps text-primary">
          {t("lease.managedBy")}
        </h2>
        <p dir="auto" className="font-serif text-2xl text-[#F8F9FA] rtl:text-right">
          {managerName}
        </p>
      </div>
      {managerContact && (
        <ul className="space-y-3 text-sm">
          <li className="flex items-center gap-3">
            <Mail className="size-4 shrink-0 text-primary/80" aria-hidden="true" />
            <a
              href={`mailto:${managerContact}`}
              dir="ltr"
              className="break-all text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              {managerContact}
            </a>
          </li>
        </ul>
      )}
      {!managerContact && (
        <p className="flex items-center gap-3 text-sm text-muted-foreground">
          <UserRound className="size-4 shrink-0 text-primary/80" aria-hidden="true" />
          {managerName}
        </p>
      )}
    </section>
  );
}
