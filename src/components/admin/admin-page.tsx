import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The Admin page frame: the same tokens as the other panels, set denser, with 13px body text
 * so tables and figures fit more on screen.
 */
export interface Crumb {
  label: string;
  /** Route path of an ancestor page; the last crumb (the page itself) has none */
  to?: string;
}

export function AdminPage({
  breadcrumb,
  eyebrow,
  title,
  subtitle,
  actions,
  back,
  children,
  className,
}: {
  /** Where the page sits, e.g. Clients › Hicham Alami */
  breadcrumb?: Crumb[];
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Link back to the list a detail page belongs to */
  back?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto max-w-[1720px] space-y-6 px-4 py-6 text-[13px] sm:px-6 lg:px-8",
        className,
      )}
    >
      {back}
      <header className="relative flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          {breadcrumb && breadcrumb.length > 0 ? (
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                {breadcrumb.map((crumb, index) => (
                  <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                    {index > 0 && <ChevronRight className="size-3 rtl:rotate-180" aria-hidden />}
                    {crumb.to ? (
                      <Link to={crumb.to as never} className="hover:text-primary">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span aria-current="page" className="text-foreground">
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          ) : (
            eyebrow && <p className="text-label-caps text-muted-foreground">{eyebrow}</p>
          )}
          <h1 className="truncate font-display text-2xl uppercase tracking-[0.08em] text-[#F8F9FA]">
            {title}
          </h1>
          {subtitle && <div className="text-[13px] text-muted-foreground">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        {/* Thin gold hairline closing the header */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-primary/70 via-primary/25 to-transparent rtl:bg-gradient-to-l"
        />
      </header>
      {children}
    </div>
  );
}

/** A titled block on an Admin page. */
export function AdminSection({
  title,
  aside,
  children,
  className,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-label-caps text-muted-foreground">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
