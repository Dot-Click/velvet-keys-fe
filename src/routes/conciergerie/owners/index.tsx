import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { InviteOwnerDrawer } from "@/components/conciergerie/invite-owner-drawer";
import { PendingInvites } from "@/components/conciergerie/owners/pending-invites";
import { OwnerCard } from "@/components/conciergerie/owners/owner-cards";
import { EmptyState } from "@/components/empty-state";
import { ListPagination } from "@/components/list-pagination";
import { PageHeader } from "@/components/page-header";
import { QueryView } from "@/components/panel-states";
import { Button } from "@/components/ui/button";
import { useOwners } from "@/hooks/use-portfolio-data";
import {
  useServerPageControls,
  useServerPagination,
  type ServerPageControls,
} from "@/hooks/use-server-pagination";
import type { Page } from "@/lib/apiClient";
import { formatNumber } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { OwnerSummary } from "@/types/portfolio";

export const Route = createFileRoute("/conciergerie/owners/")({
  component: OwnersPage,
});

function OwnersPage() {
  const controls = useServerPageControls(25);
  const query = useOwners(controls.page, controls.pageSize);
  return (
    <QueryView query={query} skeleton="gallery">
      {(owners) => (
        <OwnersContent owners={owners} controls={controls} refreshing={query.isPlaceholderData} />
      )}
    </QueryView>
  );
}

function OwnersContent({
  owners,
  controls,
  refreshing,
}: {
  owners: Page<OwnerSummary>;
  controls: ServerPageControls;
  refreshing: boolean;
}) {
  const { t } = useTranslation(["conciergerie", "common"]);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const pager = useServerPagination(owners, controls);

  return (
    <div className="mx-auto max-w-[1720px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <PageHeader
        breadcrumb={[{ label: t("common:nav.group.portfolio") }, { label: t("common:nav.owners") }]}
        title={t("owners.pageTitle")}
        description={t("owners.subtitleCount", { total: formatNumber(owners.total) })}
        actions={
          <ReadOnlyGuard>
            <Button size="sm" onClick={() => setInviteOpen(true)} className="h-9">
              <UserPlus className="size-4" aria-hidden="true" />
              {t("owners.invite")}
            </Button>
          </ReadOnlyGuard>
        }
      />

      <PendingInvites />

      {owners.total === 0 ? (
        <EmptyState
          illustrationName="empty-owners"
          title={t("owners.emptyTitle")}
          description={t("owners.emptyLine")}
          action={t("owners.invite")}
          onAction={() => setInviteOpen(true)}
        />
      ) : (
        <section
          className={cn("space-y-4 transition-opacity", refreshing && "opacity-60")}
          aria-busy={refreshing}
        >
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {owners.items.map((owner) => (
              <li key={owner.userId}>
                <OwnerCard owner={owner} />
              </li>
            ))}
          </ul>
          <ListPagination pagination={pager} mono={false} />
        </section>
      )}

      <InviteOwnerDrawer open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
