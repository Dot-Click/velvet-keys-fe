import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmptyState, type EmptyStateProps } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Same frame as the panel pages, so states do not jump when data arrives. */
export function PanelFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative min-h-screen px-4 py-8 sm:px-8 lg:px-12 max-w-[1720px] mx-auto space-y-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="space-y-3 border-b border-border/80 pb-6">
      <Skeleton className="h-3 w-44" />
      <Skeleton className="h-9 w-80 max-w-full" />
      <Skeleton className="h-3 w-96 max-w-full" />
    </div>
  );
}

export type SkeletonVariant = "dashboard" | "table" | "board" | "calendar" | "gallery" | "split";

/** Loading placeholder shaped like the page that is about to render. */
export function PageSkeleton({ variant }: { variant: SkeletonVariant }) {
  const { t } = useTranslation("common");
  return (
    <PanelFrame>
      <div aria-busy="true" aria-label={t("states.loading")} className="space-y-10">
        {variant === "dashboard" ? (
          <>
            <Skeleton className="h-64 w-full rounded-2xl" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <Skeleton className="h-96 rounded-xl md:col-span-6 md:row-span-2" />
              <Skeleton className="h-44 rounded-xl md:col-span-6" />
              <Skeleton className="h-44 rounded-xl md:col-span-3" />
              <Skeleton className="h-44 rounded-xl md:col-span-3" />
            </div>
            <div className="flex gap-6 overflow-hidden">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-[400px] w-[320px] shrink-0 rounded-xl" />
              ))}
            </div>
          </>
        ) : (
          <HeaderSkeleton />
        )}

        {variant === "table" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-xl" />
            <div className="space-y-2">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-14 rounded-lg" />
              ))}
            </div>
          </div>
        )}

        {variant === "board" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-28 rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-[500px] rounded-2xl" />
              ))}
            </div>
          </div>
        )}

        {variant === "calendar" && (
          <div className="space-y-6">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-[520px] rounded-2xl" />
          </div>
        )}

        {variant === "gallery" && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-[440px] rounded-2xl" />
            ))}
          </div>
        )}

        {variant === "split" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <Skeleton className="h-[560px] rounded-2xl lg:col-span-7" />
            <div className="space-y-6 lg:col-span-5">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-72 rounded-2xl" />
            </div>
          </div>
        )}
        <span className="sr-only">{t("states.loading")}</span>
      </div>
    </PanelFrame>
  );
}

/** Designed failure state with a retry action. */
export function PanelErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation("common");
  return (
    <PanelFrame>
      <div
        role="alert"
        className="flex min-h-96 flex-col items-center justify-center gap-4 rounded-xl border border-destructive/40 bg-destructive/10 px-6 py-12 text-center"
      >
        <div className="grid size-14 place-items-center rounded-full border border-destructive/50 bg-destructive/20">
          <AlertTriangle className="size-6 text-destructive-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-lg uppercase tracking-[0.14em] text-foreground">
            {t("states.errorTitle")}
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{t("states.errorBody")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          <RotateCcw className="size-3.5" />
          {t("states.retry")}
        </Button>
      </div>
    </PanelFrame>
  );
}

export function PanelEmptyState(
  props: Pick<
    EmptyStateProps,
    "title" | "description" | "illustration" | "illustrationName" | "action" | "onAction"
  >,
) {
  return (
    <PanelFrame>
      <EmptyState {...props} className="min-h-[28rem]" />
    </PanelFrame>
  );
}

interface QueryViewProps<T> {
  query: Pick<UseQueryResult<T>, "data" | "isPending" | "isError" | "refetch">;
  skeleton: SkeletonVariant;
  /** When true for the loaded data, `empty` renders instead of the page */
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  children: (data: T) => ReactNode;
}

/** Renders the loading skeleton, error state, empty state or page for a query. */
export function QueryView<T>({ query, skeleton, isEmpty, empty, children }: QueryViewProps<T>) {
  if (query.isError) return <PanelErrorState onRetry={() => void query.refetch()} />;
  if (query.isPending || query.data === undefined) return <PageSkeleton variant={skeleton} />;
  if (isEmpty?.(query.data) && empty) return <>{empty}</>;
  return <>{children(query.data)}</>;
}
