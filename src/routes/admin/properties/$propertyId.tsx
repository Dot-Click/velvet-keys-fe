import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, EyeOff, RotateCcw } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { AdminPage, AdminSection } from "@/components/admin/admin-page";
import { ClientAvatar } from "@/components/admin/client-avatar";
import { ReasonDialog } from "@/components/admin/reason-dialog";
import { ListingBadge } from "@/components/admin/status-pills";
import { QueryView } from "@/components/panel-states";
import { Button } from "@/components/ui/button";
import { useAdminPropertyRow, useSetPropertyListed } from "@/hooks/use-admin-data";
import { formatDate } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { AdminPropertyRow } from "@/types/platform-admin";

export const Route = createFileRoute("/admin/properties/$propertyId")({
  component: AdminPropertyPage,
});

/**
 * Note: the mock version of this screen showed a full property profile: a hero image, address,
 * commission rate, signup date, a unit-by-unit table (type, bedrooms, channel-sync status,
 * current occupant) and the full moderation history, all from a mock-only
 * `GET /admin/properties/{id}` endpoint. The real backend has no per-property detail route --
 * only `GET /admin/properties` (the full list, used by the index page) plus delist/relist -- so
 * this page is rebuilt from that same list (`useAdminPropertyRow` finds the row by id in the
 * cached list query) and only shows what `AdminPropertyRow` actually carries: name, city,
 * client/owner, unit counts, status and the single most recent moderation action.
 */
function AdminPropertyPage() {
  const { propertyId } = Route.useParams();
  const query = useAdminPropertyRow(propertyId);
  return (
    <QueryView query={query} skeleton="split">
      {(row) => (row ? <PropertyContent property={row} /> : <NotFound />)}
    </QueryView>
  );
}

function NotFound() {
  const { t } = useTranslation("admin-properties");
  return (
    <AdminPage
      breadcrumb={[{ label: t("breadcrumbRoot"), to: "/admin/properties" }, { label: "—" }]}
      title={t("notFoundTitle")}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border border-dashed border-border/70 p-12 text-center">
        <Building2 className="size-8 text-primary/70" aria-hidden />
        <p className="text-sm text-muted-foreground">{t("notFoundBody")}</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/properties">{t("backToList")}</Link>
        </Button>
      </div>
    </AdminPage>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 rounded-lg border border-border/80 bg-[#121212] p-3.5">
      <p className="text-label-caps text-muted-foreground">{label}</p>
      <div className="text-sm font-medium tabular-nums">{children}</div>
    </div>
  );
}

function PropertyContent({ property }: { property: AdminPropertyRow }) {
  const { t } = useTranslation("admin-properties");
  const { t: tAdmin } = useTranslation("admin");
  const delisted = property.status === "delisted";
  const [confirming, setConfirming] = React.useState(false);
  const setListed = useSetPropertyListed();

  function confirm(reason: string) {
    setListed.mutate(
      { propertyId: property.id, listed: delisted, reason },
      {
        onSuccess: () => {
          toast.success(
            tAdmin(delisted ? "properties.relisted" : "properties.delistedToast", {
              property: property.name,
            }),
          );
          setConfirming(false);
        },
        onError: () => toast.error(tAdmin("errors.saveFailed")),
      },
    );
  }

  const toggle = (
    <ReadOnlyGuard>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setConfirming(true)}
        className={cn(
          "h-8 text-xs",
          delisted
            ? "border-[#A2E8DD]/40 text-[#A2E8DD] hover:bg-[#A2E8DD]/10 hover:text-[#A2E8DD]"
            : "border-destructive/50 text-[#FF85A1] hover:bg-destructive/15 hover:text-[#FF85A1]",
        )}
      >
        {delisted ? (
          <RotateCcw className="size-3.5" aria-hidden />
        ) : (
          <EyeOff className="size-3.5" aria-hidden />
        )}
        {tAdmin(delisted ? "properties.relist" : "properties.delist")}
      </Button>
    </ReadOnlyGuard>
  );

  return (
    <AdminPage
      breadcrumb={[
        { label: t("breadcrumbRoot"), to: "/admin/properties" },
        { label: property.name },
      ]}
      title={property.name}
      actions={toggle}
    >
      {delisted && property.lastModeration && (
        <div
          role="status"
          className="rounded-lg border border-destructive/50 bg-destructive/15 px-4 py-3 text-[13px] text-[#FF85A1]"
        >
          {t("delistedBanner", {
            date: formatDate(property.lastModeration.at),
            admin: property.lastModeration.adminName,
            reason: property.lastModeration.reason ?? "",
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-[#121212] px-4 py-4 sm:px-6">
        <div className="min-w-0 space-y-0.5">
          <p className="truncate font-display text-xl uppercase tracking-[0.08em] text-[#F8F9FA] sm:text-2xl">
            {property.name}
          </p>
          <p className="truncate text-[13px] text-muted-foreground">{property.city}</p>
        </div>
        <ListingBadge status={property.status} className="shrink-0" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Fact label={t("client")}>
          <Link
            to="/admin/clients/$clientId"
            params={{ clientId: property.accountId }}
            className="flex items-center gap-2 hover:text-primary"
          >
            <ClientAvatar name={property.clientName} size="sm" />
            <span className="truncate">{property.clientName}</span>
          </Link>
        </Fact>
        <Fact label={t("owner")}>{property.ownerName || "—"}</Fact>
        <Fact label={t("unitCounts")}>
          <span dir="ltr" className="block">
            {t("unitsStr", { count: property.units.str })} ·{" "}
            {t("unitsLtr", { count: property.units.ltr })}
          </span>
        </Fact>
        <Fact label={t("colUnits")}>{property.units.total}</Fact>
      </div>

      <AdminSection title={t("moderationTitle")} aside={toggle}>
        <div className="space-y-3 rounded-lg border border-border/80 bg-[#121212] p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("currentStatus")}</span>
            <ListingBadge status={property.status} />
          </div>
          <h3 className="text-label-caps text-muted-foreground">{t("history")}</h3>
          {!property.lastModeration ? (
            <p className="text-sm text-muted-foreground">{t("noHistory")}</p>
          ) : (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
              <dt className="text-muted-foreground">{t("colDate")}</dt>
              <dd className="tabular-nums">{formatDate(property.lastModeration.at)}</dd>
              <dt className="text-muted-foreground">{t("colAction")}</dt>
              <dd>
                {t(
                  `action.${property.lastModeration.kind === "relist" ? "relist" : "delist"}`,
                )}
              </dd>
              <dt className="text-muted-foreground">{t("colAdmin")}</dt>
              <dd className="text-muted-foreground">{property.lastModeration.adminName}</dd>
              <dt className="text-muted-foreground">{t("colReason")}</dt>
              <dd dir="auto">{property.lastModeration.reason}</dd>
            </dl>
          )}
          {/* Note: the mock version showed the full moderation history; the real
              AdminPropertyRow only carries the single most recent action. */}
        </div>
      </AdminSection>

      <ReasonDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={tAdmin(delisted ? "properties.relistTitle" : "properties.delistTitle", {
          property: property.name,
        })}
        description={tAdmin(delisted ? "properties.relistBody" : "properties.delistBody", {
          client: property.clientName,
        })}
        confirmLabel={tAdmin(delisted ? "properties.relist" : "properties.delist")}
        tone={delisted ? "restore" : "danger"}
        pending={setListed.isPending}
        onConfirm={confirm}
      />
    </AdminPage>
  );
}
