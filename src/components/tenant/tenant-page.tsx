import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/empty-state";
import { PanelErrorState } from "@/components/panel-states";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TenantPortalTuple } from "@/hooks/use-tenant-portal";

/** Narrow, airy column every Tenant screen sits in, with its heading. */
export function TenantPage({
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-4xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-8 sm:py-12",
        className,
      )}
    >
      <header className="space-y-2">
        <p className="text-label-caps text-primary">{eyebrow}</p>
        <h1 className="font-display text-3xl uppercase tracking-[0.08em] text-[#F8F9FA] sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        )}
      </header>
      {children}
    </div>
  );
}

/** Loading placeholder in the shape of a Tenant screen. */
export function TenantPageSkeleton() {
  const { t } = useTranslation("common");
  return (
    <div
      aria-busy="true"
      aria-label={t("states.loading")}
      className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 sm:space-y-10 sm:px-8 sm:py-12"
    >
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-3 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
      <Skeleton className="h-40 rounded-2xl" />
      <span className="sr-only">{t("states.loading")}</span>
    </div>
  );
}

/** Line-art doorway shown until the manager creates the tenant's lease. */
export function NoLeaseState({ className }: { className?: string }) {
  const { t } = useTranslation("tenant");
  return (
    <EmptyState
      illustration="doorway"
      title={t("noLease.title")}
      description={t("noLease.body")}
      className={cn("min-h-80", className)}
    />
  );
}

/**
 * Loading, error and no-lease states around the tenant's portal data (home, lease, invoices --
 * combined into one query by `useTenantPortal`). Screens that only make sense with a lease show
 * the no-lease state instead of their content.
 */
export function TenantPortalView({
  query,
  eyebrow,
  title,
  subtitle,
  requiresLease = true,
  children,
}: {
  query: Pick<UseQueryResult<TenantPortalTuple>, "data" | "isPending" | "isError" | "refetch">;
  eyebrow: string;
  title: string;
  subtitle?: string;
  requiresLease?: boolean;
  children: (portal: TenantPortalTuple) => ReactNode;
}) {
  if (query.isError) return <PanelErrorState onRetry={() => void query.refetch()} />;
  if (query.isPending || query.data === undefined) return <TenantPageSkeleton />;
  const [, lease, invoicesPage] = query.data;
  return (
    <TenantPage eyebrow={eyebrow} title={title} {...(subtitle ? { subtitle } : {})}>
      {requiresLease && !lease && invoicesPage.items.length === 0 ? (
        <NoLeaseState />
      ) : (
        children(query.data)
      )}
    </TenantPage>
  );
}
