import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { OwnerAvatar } from "@/components/conciergerie/owner-avatar";
import { OwnerStatusBadge } from "@/components/conciergerie/owner-status-badge";
import { OwnerPropertyCard } from "@/components/conciergerie/owners/owner-cards";
import { OwnerReportsPanel } from "@/components/conciergerie/owners/owner-reports-panel";
import { EmptyState } from "@/components/empty-state";
import { QueryView } from "@/components/panel-states";
import { Button } from "@/components/ui/button";
import { useOwner } from "@/hooks/use-portfolio-data";
import { formatRelativeTime } from "@/lib/currency";
import type { OwnerDetail } from "@/types/portfolio";

export const Route = createFileRoute("/conciergerie/owners/$ownerId")({
  component: OwnerDetailPage,
});

function OwnerDetailPage() {
  const { ownerId } = Route.useParams();
  const query = useOwner(ownerId);
  return (
    <QueryView query={query} skeleton="gallery">
      {(owner) => <OwnerProfile owner={owner} />}
    </QueryView>
  );
}

function OwnerProfile({ owner }: { owner: OwnerDetail }) {
  const { t } = useTranslation(["conciergerie", "common"]);

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-10">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary ps-0"
      >
        <Link to="/conciergerie/owners">
          <ArrowLeft className="size-4 me-2 rtl-flip" />
          <span>{t("owners.backToOwners")}</span>
        </Link>
      </Button>

      <section className="flex flex-col gap-6 rounded-2xl border border-primary/20 bg-[#141414] p-6 shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <OwnerAvatar name={owner.name} size="lg" />
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-serif text-2xl text-[#F8F9FA] sm:text-3xl">{owner.name}</h1>
              <OwnerStatusBadge status={owner.inviteStatus} />
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-4 shrink-0" />
              <span className="truncate">{owner.email}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {owner.inviteStatus === "invited"
                ? t("owners.invitePendingNote")
                : owner.lastLoginAt
                  ? t("owners.lastLogin", { when: formatRelativeTime(owner.lastLoginAt) })
                  : t("owners.card.neverLoggedIn")}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-label-caps text-primary">{t("owners.propertiesBadge")}</p>
          <h2 className="font-display text-2xl uppercase tracking-[0.1em] text-[#F8F9FA]">
            {t("owners.propertyCount", { count: owner.properties.length })}
          </h2>
        </div>
        {owner.properties.length === 0 ? (
          <EmptyState
            illustrationName="empty-properties"
            title={t("owners.noPropertiesTitle")}
            description={t("owners.noPropertiesBody")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {owner.properties.map((property) => (
              <OwnerPropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <p className="text-label-caps text-primary">{t("owners.reports.badge")}</p>
          <h2 className="font-display text-2xl uppercase tracking-[0.1em] text-[#F8F9FA]">
            {t("owners.reports.title")}
          </h2>
        </div>
        <div className="rounded-xl border border-primary/20 bg-[#141414] p-6 shadow-xl">
          <OwnerReportsPanel propertyIds={owner.properties.map((property) => property.id)} />
        </div>
      </section>
    </div>
  );
}
