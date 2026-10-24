import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { AdminPage } from "@/components/admin/admin-page";
import { ClientAvatar } from "@/components/admin/client-avatar";
import { ClientBanDialog } from "@/components/admin/client-ban-dialog";
import { DataTable, type DataChip, type DataColumn } from "@/components/admin/data-table";
import { FreeUntilCell } from "@/components/admin/free-until-cell";
import { GrantOfferDialog } from "@/components/admin/grant-offer-dialog";
import { AccountStatusPill } from "@/components/admin/status-pills";
import { EmptyState } from "@/components/empty-state";
import { useAdminClients } from "@/hooks/use-admin-data";
import { compareNumber, compareText } from "@/hooks/use-sort";
import { today } from "@/lib/clock";
import { formatDate } from "@/lib/currency";
import { parseDay } from "@/lib/dates";
import type { ClientSummary } from "@/types/platform-admin";

export const Route = createFileRoute("/admin/clients/")({
  component: AdminClientsPage,
});

function inFreePeriod(client: ClientSummary) {
  const now = today();
  return Object.values(client.freeUntil).some((until) => until && parseDay(until) > now);
}

/** The soonest end among running free periods, to sort by who is about to start paying. */
function nextFreeEnd(client: ClientSummary) {
  const now = today();
  const ends = Object.values(client.freeUntil)
    .filter((until): until is string => Boolean(until) && parseDay(until as string) > now)
    .sort();
  return ends[0] ?? "9999-12-31";
}

function AdminClientsPage() {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("admin-clients");
  const navigate = useNavigate();
  const query = useAdminClients();
  const clients = React.useMemo(() => query.data ?? [], [query.data]);
  const [banTarget, setBanTarget] = React.useState<ClientSummary | null>(null);
  const [grantTarget, setGrantTarget] = React.useState<ClientSummary | null>(null);

  const open = React.useCallback(
    (client: ClientSummary) =>
      void navigate({ to: "/admin/clients/$clientId", params: { clientId: client.id } }),
    [navigate],
  );

  const chips: DataChip<ClientSummary>[] = [
    { id: "all", label: tc("chips.all"), predicate: () => true },
    { id: "active", label: tc("chips.active"), predicate: (c) => c.status === "active" },
    {
      id: "readonly",
      label: tc("chips.readonly"),
      predicate: (c) => c.status === "readonly",
    },
    { id: "banned", label: tc("chips.banned"), predicate: (c) => c.status === "banned" },
    { id: "free", label: tc("chips.free"), predicate: inFreePeriod },
    { id: "owners", label: tc("chips.owners"), predicate: (c) => c.type === "owner" },
    {
      id: "conciergeries",
      label: tc("chips.conciergeries"),
      predicate: (c) => c.type === "conciergerie",
    },
  ];

  const columns: DataColumn<ClientSummary>[] = [
    {
      id: "client",
      header: t("clients.colClient"),
      locked: true,
      sort: (a, b) => compareText(a.name, b.name),
      csv: (c) => c.name,
      cell: (c) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <ClientAvatar name={c.name} size="sm" />
          <span className="min-w-0">
            <span className="block max-w-64 truncate font-medium text-foreground">{c.name}</span>
            <span className="block max-w-64 truncate text-xs text-muted-foreground">
              {c.holder.email}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: "email",
      header: t("client.email"),
      defaultHidden: true,
      csv: (c) => c.holder.email,
      cell: (c) => <span dir="ltr">{c.holder.email}</span>,
    },
    {
      id: "type",
      header: t("clients.colType"),
      sort: (a, b) => compareText(a.type, b.type),
      csv: (c) => t(`accountType.${c.type}`),
      cell: (c) => <span className="text-muted-foreground">{t(`accountType.${c.type}`)}</span>,
    },
    {
      id: "signup",
      header: t("clients.colSignup"),
      sort: (a, b) => compareText(a.signupAt, b.signupAt),
      csv: (c) => c.signupAt.slice(0, 10),
      cell: (c) => <span className="text-muted-foreground">{formatDate(parseDay(c.signupAt))}</span>,
    },
    {
      id: "units",
      header: t("clients.colUnits"),
      align: "end",
      sort: (a, b) => compareNumber(a.units.str + a.units.ltr, b.units.str + b.units.ltr),
      csv: (c) => c.units.str + c.units.ltr,
      cell: (c) => (
        <span
          dir="ltr"
          title={t("clients.unitsLabel", {
            str: c.units.str,
            ltr: c.units.ltr,
            synced: c.units.synced,
          })}
        >
          {c.units.str + c.units.ltr}
          <span className="text-xs text-muted-foreground">
            {" "}
            ({c.units.str}/{c.units.ltr}/{c.units.synced})
          </span>
        </span>
      ),
    },
    {
      id: "offer",
      header: t("clients.colOffer"),
      sort: (a, b) => compareText(a.offer, b.offer),
      csv: (c) => t(`offers.${c.offer}`),
      cell: (c) => t(`offers.${c.offer}`),
    },
    {
      id: "free",
      header: t("clients.colFreeUntil"),
      sort: (a, b) => compareText(nextFreeEnd(a), nextFreeEnd(b)),
      csv: (c) =>
        Object.entries(c.freeUntil)
          .map(([product, until]) => `${product.toUpperCase()} ${until}`)
          .join(" | "),
      cell: (c) => <FreeUntilCell freeUntil={c.freeUntil} />,
    },
    {
      id: "lastPayment",
      header: tc("colLastPayment"),
      sort: (a, b) => compareText(a.lastPaymentAt ?? "", b.lastPaymentAt ?? ""),
      csv: (c) => c.lastPaymentAt ?? "",
      cell: (c) =>
        c.lastPaymentAt ? (
          <span className="text-muted-foreground">{formatDate(parseDay(c.lastPaymentAt))}</span>
        ) : (
          <span className="text-muted-foreground/70">{tc("neverPaid")}</span>
        ),
    },
    {
      id: "overdue",
      header: tc("colOverdue"),
      align: "end",
      defaultHidden: true,
      sort: (a, b) => compareNumber(a.overdueCount, b.overdueCount),
      csv: (c) => c.overdueCount,
      cell: (c) =>
        c.overdueCount > 0 ? (
          <span className="font-semibold text-[#FF85A1]">{c.overdueCount}</span>
        ) : (
          <span className="text-muted-foreground/70">—</span>
        ),
    },
    {
      id: "status",
      header: t("clients.colStatus"),
      sort: (a, b) => compareText(a.status, b.status),
      csv: (c) => t(`accountStatus.${c.status}`),
      cell: (c) => <AccountStatusPill status={c.status} />,
    },
    {
      id: "language",
      header: t("clients.colLanguage"),
      sort: (a, b) => compareText(a.language, b.language),
      csv: (c) => c.language,
      cell: (c) => <span className="text-xs uppercase text-muted-foreground">{c.language}</span>,
    },
  ];

  return (
    <AdminPage
      eyebrow={t("clients.eyebrow")}
      title={t("clients.title")}
      subtitle={t("clients.count", { shown: clients.length, count: clients.length })}
    >
      <DataTable
        columns={columns}
        rows={clients}
        rowKey={(c) => c.id}
        onRowClick={open}
        rowActions={(c) => [
          { id: "open", label: tc("row.open"), onSelect: open },
          {
            id: "grant",
            label: tc("row.grant"),
            onSelect: setGrantTarget,
            hidden: (row) => row.status === "banned",
          },
          {
            id: "ban",
            label: t(c.status === "banned" ? "client.unban" : "client.ban"),
            destructive: c.status !== "banned",
            onSelect: setBanTarget,
          },
        ]}
        searchText={(c) => [c.name, c.holder.name, c.holder.email]}
        searchPlaceholder={t("clients.searchPlaceholder")}
        chips={chips}
        chipsLabel={t("clients.title")}
        isLoading={query.isPending}
        error={query.isError}
        onRetry={() => void query.refetch()}
        csvName="clients"
        initialSort={{ key: "client", dir: "asc" }}
        empty={
          <EmptyState
            illustration="ledger"
            title={t("clients.noMatchTitle")}
            description={t("clients.noMatchBody")}
            className="min-h-72"
          />
        }
      />
      {grantTarget && (
        <GrantOfferDialog
          client={grantTarget}
          open
          onOpenChange={(isOpen) => !isOpen && setGrantTarget(null)}
        />
      )}
      <ClientBanDialog account={banTarget} onClose={() => setBanTarget(null)} />
    </AdminPage>
  );
}
