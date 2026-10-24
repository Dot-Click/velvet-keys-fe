import { Link, type LinkProps } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  to?: NonNullable<LinkProps["to"]>;
}

interface PageHeaderProps {
  breadcrumb: Crumb[];
  title: ReactNode;
  /** One line under the title */
  description?: ReactNode;
  /** Primary action and companions, aligned to the end */
  actions?: ReactNode;
  className?: string;
}

/**
 * Operations page header: breadcrumb, a 40px Cormorant title in mixed case, one line of
 * description and the primary action at the end. Never taller than 140px on wide screens.
 */
export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  const { t } = useTranslation("common");
  return (
    <header
      className={cn(
        "flex flex-col gap-3 lg:max-h-[140px] lg:flex-row lg:items-end lg:justify-between lg:gap-6",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <nav aria-label={t("breadcrumb")}>
          <ol className="flex flex-wrap items-center gap-1 text-[0.7rem] text-muted-foreground">
            {breadcrumb.map((crumb, index) => {
              const last = index === breadcrumb.length - 1;
              return (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                  {crumb.to && !last ? (
                    <Link to={crumb.to} className="transition-colors hover:text-primary">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={last ? "page" : undefined}
                      className={cn(last && "text-foreground/80")}
                    >
                      {crumb.label}
                    </span>
                  )}
                  {!last && <ChevronRight className="size-3 rtl-flip opacity-60" aria-hidden />}
                </li>
              );
            })}
          </ol>
        </nav>
        <h1 className="truncate font-serif tracking-[0.01em] text-[1.75rem] font-medium leading-[1.15] text-[#F8F9FA] sm:text-[2.5rem]">
          {title}
        </h1>
        {description && <div className="truncate text-sm text-muted-foreground">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
