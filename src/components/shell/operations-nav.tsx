import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { LogoHorizontal, LogoMark } from "@/components/brand";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { buildAttention } from "@/components/conciergerie/today/today-items";
import { useRentDue, useTodayBoard } from "@/hooks/use-portfolio-data";
import type { NavItem, NavSection } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export type NavBadges = Partial<Record<string, { count: number; tone: "ruby" | "gold" }>>;

/** Counts on the sidebar: items needing attention today, late rents and channel sync issues. */
export function useOperationsBadges(): NavBadges {
  const board = useTodayBoard();
  const rentDue = useRentDue();
  const urgent = board.data ? buildAttention(board.data).length : 0;
  const late = rentDue.data?.filter((item) => item.state === "late").length ?? 0;
  const errors = board.data?.syncIssueCount ?? 0;
  return {
    today: { count: urgent, tone: "ruby" },
    "rent-invoices": { count: late, tone: "ruby" },
    channels: { count: errors, tone: "ruby" },
  };
}

/** Matches the md–lg band, where the sidebar is always the slim rail. */
function useWideScreen() {
  const [wide, setWide] = React.useState(true);
  React.useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return wide;
}

/** Width of the operations sidebar, for the content offset. */
export function operationsSidebarOffset(collapsed: boolean) {
  return collapsed ? "md:ps-16" : "md:ps-16 lg:ps-64";
}

interface OperationsSidebarProps {
  sections: NavSection[];
  isActive: (item: NavItem) => boolean;
  collapsed: boolean;
  onToggle: () => void;
  subtitle: string;
  roleBadge: string;
  /** Demo tooling at the foot, told whether the sidebar is the slim rail */
  footer?: (rail: boolean) => React.ReactNode;
}

/**
 * Grouped operations navigation. Collapses to a 64px icon rail with tooltips (always a rail
 * between md and lg); a jade indicator slides to the active item.
 */
export function OperationsSidebar({
  sections,
  isActive,
  collapsed,
  onToggle,
  subtitle,
  roleBadge,
  footer,
}: OperationsSidebarProps) {
  const { t } = useTranslation("common");
  const badges = useOperationsBadges();
  const wide = useWideScreen();
  const rail = collapsed || !wide;

  return (
    <TooltipProvider delayDuration={120}>
      <aside
        data-collapsed={rail}
        className={cn(
          "fixed inset-y-0 start-0 z-40 hidden flex-col border-e border-sidebar-border bg-[#0D0D0D]/95 backdrop-blur-xl transition-[width] duration-300 ease-out md:flex",
          rail ? "w-16" : "w-64",
        )}
      >
        {wide && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggle}
                aria-label={t(collapsed ? "nav.expandSidebar" : "nav.collapseSidebar")}
                aria-expanded={!collapsed}
                className="absolute -end-3 top-[1.35rem] z-50 grid size-6 place-items-center rounded-full border border-sidebar-border bg-[#141414] text-muted-foreground shadow-lg transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                {collapsed ? (
                  <PanelLeftOpen className="size-3.5 rtl:rotate-180" aria-hidden />
                ) : (
                  <PanelLeftClose className="size-3.5 rtl:rotate-180" aria-hidden />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {t(collapsed ? "nav.expandSidebar" : "nav.collapseSidebar")}{" "}
              <kbd className="ms-1 rounded border border-border/70 px-1 text-[0.62rem]">[</kbd>
            </TooltipContent>
          </Tooltip>
        )}

        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-sidebar-border/80",
            rail ? "justify-center" : "gap-3 px-5",
          )}
        >
          {rail ? <LogoMark size="sm" /> : <LogoHorizontal size="sm" subtitle={subtitle} />}
        </div>

        <nav
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden py-5",
            rail ? "px-2" : "px-3",
          )}
          aria-label={t("nav.mainNavigation")}
        >
          {!rail && (
            <p className="flex items-center gap-2 px-3 text-[0.62rem] font-medium uppercase tracking-[0.16em] text-[#A2E8DD]/90">
              <span className="size-1.5 rounded-full bg-[#A2E8DD]" aria-hidden="true" />
              {roleBadge}
            </p>
          )}
          {sections.map((section) => (
            <div key={section.id} className="flex flex-col gap-0.5">
              {rail ? (
                <span aria-hidden className="mx-3 mb-1.5 h-px bg-sidebar-border/80" />
              ) : (
                <p className="px-3 pb-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                  {t(section.titleKey)}
                </p>
              )}
              {section.items.map((item) => (
                <SidebarLink
                  key={`${section.id}-${item.id}`}
                  item={item}
                  active={isActive(item)}
                  rail={rail}
                  badge={badges[item.id]}
                />
              ))}
            </div>
          ))}
        </nav>

        {footer && (
          <div className={cn("border-t border-sidebar-border/80", rail ? "p-2" : "p-3")}>
            {footer(rail)}
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

/** Hover micro-animation per item: the key turns, the wrench rotates, the rest nudge. */
const ICON_MOTION: Partial<Record<string, string>> = {
  today: "icon-wiggle",
  leases: "icon-turn",
  maintenance: "icon-rotate",
  channels: "icon-nudge",
  calendar: "icon-nudge",
};

function SidebarLink({
  item,
  active,
  rail,
  badge,
}: {
  item: NavItem;
  active: boolean;
  rail: boolean;
  badge: NavBadges[string];
}) {
  const { t } = useTranslation("common");
  const label = t(item.labelKey);
  const count = badge && badge.count > 0 ? badge.count : 0;
  const link = (
    <Link
      to={item.to}
      aria-label={rail ? (count ? `${label} (${count})` : label) : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-lg text-[0.84rem] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        rail ? "justify-center px-0" : "px-3",
        active
          ? "bg-[#121A18] text-foreground"
          : "text-muted-foreground hover:bg-[#161616] hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="opsNavIndicator"
          aria-hidden="true"
          className="absolute inset-y-2 start-0 w-[3px] rounded-e-full bg-[#A2E8DD] shadow-[0_0_12px_rgba(162,232,221,0.7)]"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      <span className="relative">
        <item.icon
          className={cn(
            "size-[1.05rem] shrink-0",
            ICON_MOTION[item.id] ?? "transition-transform duration-300 group-hover:scale-110",
            active ? "text-[#A2E8DD]" : "text-muted-foreground group-hover:text-foreground",
          )}
          aria-hidden="true"
        />
        {rail && count > 0 && (
          <span className="absolute -end-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[0.55rem] font-semibold leading-4 text-destructive-foreground tabular-nums">
            {count}
          </span>
        )}
      </span>
      {!rail && <span className="min-w-0 flex-1 truncate font-medium">{label}</span>}
      {!rail && count > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[0.62rem] font-semibold leading-[1.15rem] tabular-nums",
            badge?.tone === "gold"
              ? "bg-primary/15 text-primary"
              : "bg-destructive/25 text-[#FF85A1]",
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
  if (!rail) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        {label}
        {count > 0 && <span className="ms-1.5 text-[#FF85A1] tabular-nums">{count}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

const MOBILE_TAB_IDS = ["today", "calendar", "bookings", "leases"] as const;

/** Phone navigation: Today, Calendar, Bookings, Leases and a "More" sheet with everything. */
export function OperationsMobileNav({
  sections,
  isActive,
  subtitle,
}: {
  sections: NavSection[];
  isActive: (item: NavItem) => boolean;
  subtitle: string;
}) {
  const { t } = useTranslation("common");
  const badges = useOperationsBadges();
  const [open, setOpen] = React.useState(false);
  const all = sections.flatMap((section) => section.items);
  const tabs = MOBILE_TAB_IDS.map((id) => all.find((item) => item.id === id)).filter(
    (item): item is NavItem => Boolean(item),
  );
  const moreActive = !tabs.some(isActive);

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid h-16 grid-cols-5 border-t border-sidebar-border bg-[#0D0D0D]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label={t("nav.mobileNavigation")}
      >
        {tabs.map((item) => {
          const active = isActive(item);
          const count = badges[item.id]?.count ?? 0;
          return (
            <Link
              key={item.id}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 text-[0.6rem] font-medium uppercase tracking-[0.08em]",
                active ? "text-[#A2E8DD]" : "text-muted-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="opsMobileIndicator"
                  aria-hidden="true"
                  className="absolute inset-x-5 top-0 h-[2px] rounded-b-full bg-[#A2E8DD]"
                />
              )}
              <span className="relative">
                <item.icon className="size-5" aria-hidden="true" />
                {count > 0 && (
                  <span className="absolute -end-2 -top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[0.55rem] leading-4 text-destructive-foreground tabular-nums">
                    {count}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate px-1">{t(item.labelKey)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[0.6rem] font-medium uppercase tracking-[0.08em]",
            moreActive ? "text-[#A2E8DD]" : "text-muted-foreground",
          )}
        >
          <Menu className="size-5" aria-hidden="true" />
          {t("nav.more")}
        </button>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-2xl border-sidebar-border bg-[#0D0D0D] px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-6"
        >
          <SheetTitle className="font-serif text-xl tracking-normal text-foreground">
            {t("nav.more")}
          </SheetTitle>
          <SheetDescription className="sr-only">{subtitle}</SheetDescription>
          <div className="mt-4 space-y-5">
            {sections.map((section) => (
              <div key={section.id} className="space-y-2">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                  {t(section.titleKey)}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {section.items.map((item) => {
                    const count = badges[item.id]?.count ?? 0;
                    return (
                      <Link
                        key={`${section.id}-${item.id}`}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-[0.62rem] font-medium uppercase tracking-[0.06em]",
                          isActive(item)
                            ? "border-[#A2E8DD]/40 bg-[#121A18] text-[#A2E8DD]"
                            : "border-border/60 bg-[#141414] text-muted-foreground",
                        )}
                      >
                        <item.icon className="size-5" aria-hidden="true" />
                        <span className="max-w-full truncate">{t(item.labelKey)}</span>
                        {count > 0 && (
                          <span className="absolute end-2 top-2 rounded-full bg-destructive px-1.5 text-[0.55rem] leading-4 text-destructive-foreground tabular-nums">
                            {count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
