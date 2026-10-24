import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin/admin-page";
import { ClientAvatar } from "@/components/admin/client-avatar";
import { DataTable, type DataChip, type DataColumn } from "@/components/admin/data-table";
import { ReasonDialog } from "@/components/admin/reason-dialog";
import { ListingBadge } from "@/components/admin/status-pills";
import { useAdminProperties, useSetPropertyListed } from "@/hooks/use-admin-data";
import { compareNumber, compareText } from "@/hooks/use-sort";
import { formatDate } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminPropertyRow } from "@/types/platform-admin";

export const Route = createFileRoute("/admin/properties/")({
  component: AdminPropertiesPage,
});

function AdminPropertiesPage() {
  const { t } = useTranslation("admin-properties");
  const { t: tAdmin } = useTranslation("admin");
  const navigate = useNavigate();
  const query = useAdminProperties();
  const setListed = useSetPropertyListed();
  const [target, setTarget] = React.useState<AdminPropertyRow | null>(null);
  const [selectedClient, setSelectedClient] = React.useState<string>("all");
  const [selectedCity, setSelectedCity] = React.useState<string>("all");
  const properties = React.useMemo(() => query.data ?? [], [query.data]);
  const relisting = target?.status === "delisted";

  const clientsList = React.useMemo(
    () => Array.from(new Set(properties.map((p) => p.clientName))).sort(),
    [properties],
  );

  const citiesList = React.useMemo(
    () => Array.from(new Set(properties.map((p) => p.city))).sort(),
    [properties],
  );

  const filteredProperties = React.useMemo(
    () =>
      properties.filter((p) => {
        if (selectedClient !== "all" && p.clientName !== selectedClient) return false;
        if (selectedCity !== "all" && p.city !== selectedCity) return false;
        return true;
      }),
    [properties, selectedClient, selectedCity],
  );

  function open(row: AdminPropertyRow) {
    void navigate({ to: "/admin/properties/$propertyId", params: { propertyId: row.id } });
  }

  function confirm(reason: string) {
    if (!target) return;
    setListed.mutate(
      { propertyId: target.id, listed: relisting, reason },
      {
        onSuccess: () => {
          toast.success(
            tAdmin(relisting ? "properties.relisted" : "properties.delistedToast", {
              property: target.name,
            }),
          );
          setTarget(null);
        },
        onError: () => toast.error(tAdmin("errors.saveFailed")),
      },
    );
  }

  const columns: DataColumn<AdminPropertyRow>[] = [
    {
      id: "property",
      header: t("colProperty"),
      locked: true,
      sort: (a, b) => compareText(a.name, b.name),
      csv: (row) => row.name,
      cell: (row) => (
        <span className="flex items-center gap-2.5">
          <Link
            to="/admin/properties/$propertyId"
            params={{ propertyId: row.id }}
            onClick={(event) => event.stopPropagation()}
            className="font-medium hover:text-primary focus-visible:text-primary focus-visible:outline-none"
          >
            {row.name}
          </Link>
        </span>
      ),
    },
    {
      id: "client",
      header: t("colClient"),
      sort: (a, b) => compareText(a.clientName, b.clientName),
      csv: (row) => row.clientName,
      cell: (row) => (
        <span className="flex items-center gap-2">
          <ClientAvatar name={row.clientName} size="sm" />
          <span className="text-muted-foreground">{row.clientName}</span>
        </span>
      ),
    },
    {
      id: "city",
      header: t("colCity"),
      sort: (a, b) => compareText(a.city, b.city),
      csv: (row) => row.city,
      cell: (row) => <span className="text-muted-foreground">{row.city}</span>,
    },
    {
      id: "units",
      header: t("colUnits"),
      align: "end",
      sort: (a, b) => compareNumber(a.units.total, b.units.total),
      csv: (row) => `${row.units.str} STR / ${row.units.ltr} LTR`,
      cell: (row) => (
        <span dir="ltr">{t("unitsMix", { str: row.units.str, ltr: row.units.ltr })}</span>
      ),
    },
    {
      id: "status",
      header: t("colStatus"),
      sort: (a, b) => compareText(a.status, b.status),
      csv: (row) => (row.status === "delisted" ? t("delisted") : t("listed")),
      cell: (row) => <ListingBadge status={row.status} />,
    },
    {
      id: "moderation",
      header: t("colModeration"),
      sort: (a, b) => compareText(a.lastModeration?.at ?? "", b.lastModeration?.at ?? ""),
      csv: (row) => row.lastModeration?.reason ?? "",
      className: "max-w-72",
      cell: (row) =>
        row.lastModeration ? (
          <span
            className="block truncate text-xs text-muted-foreground"
            title={row.lastModeration.reason ?? undefined}
            dir="auto"
          >
            {t("moderationNote", {
              action: t(`action.${row.lastModeration.kind === "relist" ? "relist" : "delist"}`),
              date: formatDate(row.lastModeration.at),
            })}
          </span>
        ) : (
          <span className="text-muted-foreground/80">—</span>
        ),
    },
  ];

  const chips: DataChip<AdminPropertyRow>[] = [
    { id: "all", label: t("all"), predicate: () => true },
    { id: "listed", label: t("listed"), predicate: (row) => row.status === "active" },
    { id: "delisted", label: t("delisted"), predicate: (row) => row.status === "delisted" },
  ];

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={selectedClient} onValueChange={setSelectedClient}>
        <SelectTrigger
          aria-label={t("filterClient")}
          className="h-9 w-40 border-border/80 bg-[#121212] text-xs"
        >
          <SelectValue placeholder={t("filterClient")} />
        </SelectTrigger>
        <SelectContent className="border-border bg-[#141414] text-xs">
          <SelectItem value="all">{t("allClients")}</SelectItem>
          {clientsList.map((client) => (
            <SelectItem key={client} value={client}>
              {client}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={selectedCity} onValueChange={setSelectedCity}>
        <SelectTrigger
          aria-label={t("filterCity")}
          className="h-9 w-36 border-border/80 bg-[#121212] text-xs"
        >
          <SelectValue placeholder={t("filterCity")} />
        </SelectTrigger>
        <SelectContent className="border-border bg-[#141414] text-xs">
          <SelectItem value="all">{t("allCities")}</SelectItem>
          {citiesList.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <AdminPage eyebrow={t("eyebrow")} title={t("title")}>
      <DataTable
        columns={columns}
        rows={filteredProperties}
        rowKey={(row) => row.id}
        isLoading={query.isLoading}
        error={query.isError}
        onRetry={() => void query.refetch()}
        onRowClick={open}
        toolbar={toolbar}
        searchText={(row) => [row.name, row.city, row.clientName, row.ownerName]}
        searchPlaceholder={t("searchPlaceholder")}
        chips={chips}
        chipsLabel={t("chipsLabel")}
        csvName="properties"
        rowClassName={(row) => (row.status === "delisted" ? "bg-destructive/[0.04]" : undefined)}
        rowActions={(row) => [
          { id: "open", label: t("open"), onSelect: open },
          ...(row.status === "delisted"
            ? [{ id: "relist", label: tAdmin("properties.relist"), onSelect: setTarget }]
            : [
                {
                  id: "delist",
                  label: tAdmin("properties.delist"),
                  destructive: true,
                  onSelect: setTarget,
                },
              ]),
        ]}
        empty={
          <div className="rounded-lg border border-dashed border-border/70 p-10 text-center">
            <p className="text-sm font-medium">{t("emptyTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("emptyBody")}</p>
          </div>
        }
      />
      <ReasonDialog
        open={Boolean(target)}
        onOpenChange={(next) => !next && setTarget(null)}
        title={tAdmin(relisting ? "properties.relistTitle" : "properties.delistTitle", {
          property: target?.name ?? "",
        })}
        description={tAdmin(relisting ? "properties.relistBody" : "properties.delistBody", {
          client: target?.clientName ?? "",
        })}
        confirmLabel={tAdmin(relisting ? "properties.relist" : "properties.delist")}
        tone={relisting ? "restore" : "danger"}
        pending={setListed.isPending}
        onConfirm={confirm}
      />
    </AdminPage>
  );
}
