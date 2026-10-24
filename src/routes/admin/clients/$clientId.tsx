import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Gift, MoreHorizontal, ShieldCheck, Ban } from "lucide-react";
import * as React from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ReadOnlyGuard } from "@/components/account/read-only-guard";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminTable, Td, Th } from "@/components/admin/admin-table";
import { ClientAvatar } from "@/components/admin/client-avatar";
import { ClientBanDialog } from "@/components/admin/client-ban-dialog";
import { ClientTimeline } from "@/components/admin/client-timeline";
import { GrantOfferDialog } from "@/components/admin/grant-offer-dialog";
import { KpiCard } from "@/components/admin/kpi-card";
import { AccountStatusPill, ListingBadge } from "@/components/admin/status-pills";
import { InvoiceStatusPill } from "@/components/billing/invoice-status-pill";
import { EmptyState } from "@/components/empty-state";
import { PageSkeleton, PanelErrorState } from "@/components/panel-states";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminClient } from "@/hooks/use-admin-data";
import { ACCOUNT_CURRENCY } from "@/lib/account-currency";
import { formatDate, formatMonth } from "@/lib/currency";
import { formatMoney } from "@/lib/money";
import { parseDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { hasErrorCode } from "@/lib/apiClient";
import type { ClientDetail, ClientUser } from "@/types/platform-admin";

export const Route = createFileRoute("/admin/clients/$clientId")({
  component: AdminClientPage,
});

function AdminClientPage() {
  const { clientId } = Route.useParams();
  const query = useAdminClient(clientId);
  if (query.isError) {
    if (hasErrorCode(query.error, "not_found")) return <ClientNotFound />;
    return <PanelErrorState onRetry={() => void query.refetch()} />;
  }
  if (query.isPending || query.data === undefined) return <PageSkeleton variant="split" />;
  return <ClientContent client={query.data} />;
}

function ClientNotFound() {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("admin-clients");
  const navigate = useNavigate();
  return (
    <AdminPage
      breadcrumb={[
        { label: t("clients.title"), to: "/admin/clients" },
        { label: tc("notFound.crumb") },
      ]}
      title={tc("notFound.title")}
    >
      <EmptyState
        illustration="doorway"
        title={tc("notFound.title")}
        description={tc("notFound.body")}
        action={t("client.back")}
        onAction={() => void navigate({ to: "/admin/clients" })}
        className="min-h-72"
      />
    </AdminPage>
  );
}

/**
 * Note: the mock version also had "send reminder" (client-level), "activity" and "notes" tabs,
 * plus an issuer/billing-identity block on the profile card, all backed by mock-only endpoints.
 * The real backend has no client-level reminder (only a per-invoice one, wired on the invoices
 * screen), no client notes/activity log, and does not expose an account's own issuer profile to
 * Admin. All four are dropped here.
 */
function ClientContent({ client }: { client: ClientDetail }) {
  const { t } = useTranslation("admin");
  const { t: tc } = useTranslation("admin-clients");
  const [dialog, setDialog] = React.useState<"grant" | "ban" | null>(null);
  const banned = client.status === "banned";

  return (
    <AdminPage
      breadcrumb={[{ label: t("clients.title"), to: "/admin/clients" }, { label: client.name }]}
      title={
        <span className="flex items-center gap-3">
          <ClientAvatar name={client.name} size="lg" />
          <span className="truncate">{client.name}</span>
        </span>
      }
      subtitle={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{t(`accountType.${client.type}`)}</span>
          <AccountStatusPill status={client.status} />
          <span>{t("client.signedUp", { date: formatDate(parseDay(client.signupAt)) })}</span>
          <span className="text-xs uppercase">{client.language}</span>
        </span>
      }
      actions={
        <>
          <ReadOnlyGuard>
            <Button size="sm" onClick={() => setDialog("grant")} className="h-8 text-xs">
              <Gift className="size-3.5" aria-hidden="true" />
              {t("client.grantOffer")}
            </Button>
          </ReadOnlyGuard>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                aria-label={tc("moreActions")}
              >
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-border bg-[#141414] text-[13px]">
              <DropdownMenuItem
                onSelect={() => setDialog("ban")}
                className={cn(banned ? "text-[#A2E8DD]" : "text-[#FF85A1]")}
              >
                {banned ? (
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                ) : (
                  <Ban className="size-3.5" aria-hidden="true" />
                )}
                {t(banned ? "client.unban" : "client.ban")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          highlight
          label={tc("kpi.thisMonth")}
          value={formatMoney(client.estimate.totalMinor, ACCOUNT_CURRENCY)}
        />
        <KpiCard
          label={tc("kpi.outstanding")}
          tone={client.overdueCount > 0 ? "danger" : "default"}
          value={String(client.overdueCount)}
        />
        <KpiCard label={t("client.properties")} value={String(client.propertyCount)} />
        <KpiCard
          label={tc("kpi.units")}
          value={client.units.str + client.units.ltr}
          detail={
            <span dir="ltr">
              {t("products.str")} {client.units.str} · {t("products.ltr")} {client.units.ltr}
            </span>
          }
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-3">
        <TabsList className="h-8 max-w-full justify-start overflow-x-auto bg-[#121212]">
          <TabsTrigger value="overview" className="h-6 text-xs">
            {tc("tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="invoices" className="h-6 text-xs">
            {t("client.tabInvoices", { count: client.invoices.length })}
          </TabsTrigger>
          <TabsTrigger value="properties" className="h-6 text-xs">
            {t("client.tabProperties", { count: client.properties.length })}
          </TabsTrigger>
          <TabsTrigger value="users" className="h-6 text-xs">
            {t("client.tabUsers", { count: client.users.length })}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="rounded-lg border border-border/80 bg-[#121212] px-4 py-4">
            <h2 className="text-label-caps mb-3 text-muted-foreground">{t("timeline.title")}</h2>
            <ClientTimeline events={client.timeline} />
          </div>
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
            <ProfileCard client={client} />
            <UnitsCard client={client} />
          </div>
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesTab client={client} />
        </TabsContent>
        <TabsContent value="properties">
          <PropertiesTab client={client} />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab users={client.users} />
        </TabsContent>
      </Tabs>

      <GrantOfferDialog
        client={client}
        open={dialog === "grant"}
        onOpenChange={(open) => setDialog(open ? "grant" : null)}
      />
      <ClientBanDialog
        account={dialog === "ban" ? client : null}
        onClose={() => setDialog(null)}
      />
    </AdminPage>
  );
}

/** A label and its value; stacked gives long values (emails, bank details) the full width. */
function Field({
  label,
  children,
  stacked = false,
}: {
  label: string;
  children: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div className={cn("grid gap-x-3 py-1.5", stacked ? "gap-y-0.5" : "grid-cols-[7.5rem_1fr]")}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </div>
  );
}

function ProfileCard({ client }: { client: ClientDetail }) {
  const { t } = useTranslation("admin");
  const { holder } = client;
  return (
    <dl className="divide-y divide-border/50 rounded-lg border border-border/80 bg-[#121212] px-4 py-2">
      <Field stacked label={t("client.holder")}>
        {holder.name}
      </Field>
      <Field stacked label={t("client.email")}>
        <a href={`mailto:${holder.email}`} dir="ltr" className="hover:text-primary">
          {holder.email}
        </a>
      </Field>
      {holder.phone && (
        <Field stacked label={t("client.phone")}>
          <span dir="ltr">{holder.phone}</span>
        </Field>
      )}
      <Field stacked label={t("client.accountId")}>
        <span className="tabular-nums text-xs text-muted-foreground">{client.id}</span>
      </Field>
    </dl>
  );
}

function UnitsCard({ client }: { client: ClientDetail }) {
  const { t } = useTranslation("admin");
  const { units, estimate } = client;
  const figures = [
    { label: t("products.str"), value: units.str },
    { label: t("products.ltr"), value: units.ltr },
    { label: t("clients.colSynced"), value: units.synced },
  ];
  return (
    <div className="space-y-3 rounded-lg border border-border/80 bg-[#121212] px-4 py-3">
      <div className="grid grid-cols-3 divide-x divide-border/60 rtl:divide-x-reverse">
        {figures.map((figure) => (
          <div key={figure.label} className="px-2 text-center first:ps-0 last:pe-0">
            <p className="tabular-nums text-xl font-semibold tabular-nums text-[#F8F9FA]">
              {figure.value}
            </p>
            <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
              {figure.label}
            </p>
          </div>
        ))}
      </div>
      <dl className="divide-y divide-border/50 border-t border-border/60">
        <Field label={t("client.properties")}>{client.propertyCount}</Field>
        <Field
          label={t("client.thisMonth", { month: formatMonth(estimate.period, { style: "long" }) })}
        >
          <span className="tabular-nums font-semibold text-primary">
            {formatMoney(estimate.subtotalMinor, ACCOUNT_CURRENCY)}
          </span>{" "}
          <span className="text-xs text-muted-foreground">{t("client.exclVat")}</span>
        </Field>
        <Field label={t("client.overdue")}>
          <span className={client.overdueCount > 0 ? "font-semibold text-[#FF85A1]" : undefined}>
            {client.overdueCount}
          </span>
        </Field>
      </dl>
    </div>
  );
}

function InvoicesTab({ client }: { client: ClientDetail }) {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  if (client.invoices.length === 0) return <EmptyLine text={t("client.noInvoices")} />;
  return (
    <AdminTable>
      <thead>
        <tr>
          <Th>{t("invoices.colPeriod")}</Th>
          <Th>{t("invoices.colNumber")}</Th>
          <Th className="text-end">{t("invoices.colTotal")}</Th>
          <Th>{t("invoices.colStatus")}</Th>
          <Th>{t("invoices.colIssued")}</Th>
          <Th>{t("invoices.colDue")}</Th>
          <Th>{t("invoices.colPaid")}</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60">
        {client.invoices.map((invoice) => (
          <tr
            key={invoice.id}
            onClick={() =>
              void navigate({ to: "/admin/invoices/$invoiceId", params: { invoiceId: invoice.id } })
            }
            className={cn(
              "cursor-pointer transition-colors hover:bg-[#1A1814]",
              invoice.status === "overdue" &&
                "bg-destructive/10 shadow-[inset_3px_0_0_var(--destructive)] rtl:shadow-[inset_-3px_0_0_var(--destructive)]",
            )}
          >
            <Td>{formatMonth(invoice.period, { style: "long", withYear: true })}</Td>
            <Td className="tabular-nums text-xs text-muted-foreground">{invoice.number}</Td>
            <Td className="text-end tabular-nums">
              {formatMoney(invoice.totalMinor, ACCOUNT_CURRENCY)}
            </Td>
            <Td>
              {/* Free (0 MAD) invoices show their own status and are never payable */}
              <InvoiceStatusPill status={invoice.status} />
            </Td>
            <Td className="text-muted-foreground">
              {invoice.issuedAt ? formatDate(parseDay(invoice.issuedAt)) : "—"}
            </Td>
            <Td className="text-muted-foreground">
              {invoice.status === "free" || !invoice.dueDate
                ? "—"
                : formatDate(parseDay(invoice.dueDate))}
            </Td>
            <Td className="text-muted-foreground">
              {invoice.paidAt ? formatDate(parseDay(invoice.paidAt)) : "—"}
            </Td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}

function PropertiesTab({ client }: { client: ClientDetail }) {
  const { t } = useTranslation("admin");
  if (client.properties.length === 0) return <EmptyLine text={t("client.noProperties")} />;
  return (
    <AdminTable>
      <thead>
        <tr>
          <Th>{t("properties.colProperty")}</Th>
          <Th>{t("properties.colOwner")}</Th>
          <Th>{t("properties.colCity")}</Th>
          <Th className="text-end">{t("properties.colUnits")}</Th>
          <Th>{t("properties.colStatus")}</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60">
        {client.properties.map((property) => (
          <tr
            key={property.id}
            className={cn(property.status === "delisted" && "text-muted-foreground")}
          >
            <Td
              className={cn(
                "font-medium",
                property.status === "delisted" && "text-muted-foreground",
              )}
            >
              {property.name}
            </Td>
            <Td className="text-muted-foreground">{property.ownerName}</Td>
            <Td className="text-muted-foreground">{property.city}</Td>
            <Td className="text-end tabular-nums">
              <span dir="ltr">
                {t("properties.unitsMix", {
                  total: property.units.total,
                  str: property.units.str,
                  ltr: property.units.ltr,
                })}
              </span>
            </Td>
            <Td>
              <ListingBadge status={property.status} />
            </Td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}

const ACCESS_STYLES: Record<string, string> = {
  active: "text-[#A2E8DD]",
  invited: "text-primary",
  not_invited: "text-muted-foreground",
};
const DEFAULT_ACCESS_STYLE = "text-muted-foreground";

function UsersTab({ users }: { users: ClientUser[] }) {
  const { t } = useTranslation("admin");
  if (users.length === 0) return <EmptyLine text={t("client.noUsers")} />;
  return (
    <AdminTable>
      <thead>
        <tr>
          <Th>{t("users.colName")}</Th>
          <Th>{t("users.colRole")}</Th>
          <Th>{t("users.colEmail")}</Th>
          <Th>{t("users.colPhone")}</Th>
          <Th>{t("users.colLanguage")}</Th>
          <Th>{t("users.colAccess")}</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/60">
        {users.map((user) => (
          <tr key={user.id}>
            <Td className="font-medium" dir="auto">
              {user.name}
            </Td>
            <Td className="text-muted-foreground">{t(`users.role.${user.role}`)}</Td>
            <Td className="text-muted-foreground" dir="ltr">
              {user.email}
            </Td>
            <Td className="text-muted-foreground" dir="ltr">
              {user.phone ?? "—"}
            </Td>
            <Td className="tabular-nums text-xs uppercase text-muted-foreground">
              {user.language}
            </Td>
            <Td
              className={cn(
                "text-xs font-medium",
                ACCESS_STYLES[user.access] ?? DEFAULT_ACCESS_STYLE,
              )}
            >
              {t(`users.access.${user.access}`, { defaultValue: user.access })}
            </Td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border/80 px-4 py-6 text-center text-xs text-muted-foreground">
      {text}
    </p>
  );
}
