import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { MotionConfig, motion } from "framer-motion";
import {
  Building2,
  ChevronDown,
  CircleUserRound,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth-provider";
import { PaymentDueBanner } from "@/components/account/payment-due-banner";
import { ReadOnlyBanner } from "@/components/account/read-only-banner";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { LogoHorizontal, LogoMark } from "@/components/brand";
import { LanguageSwitcher } from "@/components/language-switcher";
import { AmbientDrift } from "@/components/motion/ambient-drift";
import { CommandPalette } from "@/components/command-palette";
import { FloatingQuickActions } from "@/components/floating-quick-actions";
import { MediaImage } from "@/components/media/media-image";
import {
  OperationsMobileNav,
  OperationsSidebar,
  operationsSidebarOffset,
} from "@/components/shell/operations-nav";
import { useProperties } from "@/hooks/use-portfolio-data";
import { opsPageVariants, pageMotionVariants } from "@/lib/motion";
import {
  getNavSections,
  getOperationsNavSections,
  isNavItemActive,
  type NavItem,
} from "@/lib/navigation";
import {
  canAccessOperations,
  isSoloOwner,
  roleAccent,
  roleDestination,
  roleLabelKey,
} from "@/lib/roles";
import type { AuthProfile, UserRole } from "@/types/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const SIDEBAR_KEY = "vk-sidebar-collapsed";

/** Whether the desktop sidebar is the slim icon rail; remembered per browser. */
function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(false);
  // Read after hydration so the server and first client render agree
  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_KEY) === "1") setCollapsed(true);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const toggle = () =>
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  // "[" collapses or expands the sidebar, unless the user is typing
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("input, textarea, select, [contenteditable=true]")
      ) {
        return;
      }
      if (event.key === "[" && !event.metaKey && !event.ctrlKey && !event.altKey) toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { collapsed, toggle };
}

const ACCENT_CLASSES = {
  gold: {
    text: "text-primary",
    dot: "bg-primary",
    badge: "border-primary/25 bg-primary/5 text-primary",
    menuBadge: "border-primary/20 bg-primary/10 text-primary",
    activeItem: "!bg-[#1C1A14] !text-primary font-medium",
    activePill: "bg-primary shadow-[0_0_14px_rgba(212,175,55,0.8)]",
    mobileActive: "!text-primary font-semibold",
  },
  teal: {
    text: "text-[#A2E8DD]",
    dot: "bg-[#A2E8DD]",
    badge: "border-[#A2E8DD]/25 bg-[#A2E8DD]/5 text-[#A2E8DD]",
    menuBadge: "border-[#A2E8DD]/20 bg-[#A2E8DD]/10 text-[#A2E8DD]",
    activeItem: "!bg-[#121A18] !text-[#A2E8DD] font-medium",
    activePill: "bg-[#A2E8DD] shadow-[0_0_14px_rgba(162,232,221,0.8)]",
    mobileActive: "!text-[#A2E8DD] font-semibold",
  },
} as const;

const PORTAL_SUBTITLE_KEYS: Record<UserRole, string> = {
  admin: "roles.adminConsole",
  conciergerie: "roles.conciergerieOperations",
  owner: "roles.ownerPortal",
  tenant: "roles.tenantPortal",
};

function roleBadgeKey(profile: AuthProfile) {
  if (isSoloOwner(profile)) return "roles.soloOwnerBadge";
  return {
    admin: "roles.adminBadge",
    conciergerie: "roles.conciergerieBadge",
    owner: "roles.ownerBadge",
    tenant: "roles.tenantBadge",
  }[profile.role];
}

/** Bottom bar fits five tabs; larger navs show the active section's first four plus a menu. */
const MOBILE_TAB_LIMIT = 5;

export function AppShell({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { pathname } = useLocation();
  if (!session) return <AppShellSkeleton />;
  return (
    // The operations panel honours reduced motion in its animations
    <MotionConfig reducedMotion={pathname.startsWith("/conciergerie") ? "user" : "never"}>
      <AppShellFrame profile={session.profile}>{children}</AppShellFrame>
    </MotionConfig>
  );
}

function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] luxury-canvas" aria-busy="true">
      <aside className="fixed inset-y-0 start-0 hidden w-68 flex-col gap-4 border-e border-sidebar-border bg-[#0D0D0D]/95 p-6 lg:flex">
        <div className="gold-skeleton h-9 w-40" />
        <div className="gold-skeleton mt-4 h-6 w-32 rounded-full" />
        <div className="mt-6 space-y-2.5">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="gold-skeleton h-10 w-full" />
          ))}
        </div>
      </aside>
      <div className="lg:ps-68">
        <div className="flex min-h-20 items-center justify-between gap-4 border-b border-border/80 px-4 sm:px-8 lg:px-12">
          <div className="gold-skeleton h-11 w-56" />
          <div className="gold-skeleton h-11 w-40" />
        </div>
      </div>
    </div>
  );
}

function AppShellFrame({ profile, children }: { profile: AuthProfile; children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const properties = useProperties();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation("common");
  const { collapsed, toggle: toggleSidebar } = useSidebarCollapsed();

  const accent = ACCENT_CLASSES[roleAccent(profile.role)];
  // The operations panel has its own grouped sidebar, compact top bar and phone tab bar
  const ops = location.pathname.startsWith("/conciergerie");
  const sections = ops ? getOperationsNavSections(profile) : getNavSections(profile);
  const shellRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Height of the sticky banners and top bar, so full-viewport pages can size themselves
  useEffect(() => {
    const top = topRef.current;
    const shell = shellRef.current;
    if (!top || !shell) return;
    const sync = () => shell.style.setProperty("--shell-top", `${top.offsetHeight}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(top);
    return () => observer.disconnect();
  }, []);
  const allItems = sections.flatMap((section) => section.items);
  const isActive = (item: NavItem) => isNavItemActive(item, location.pathname);

  const activeSection = sections.find((section) => section.items.some(isActive)) ?? sections[0];
  const needsMobileMenu = allItems.length > MOBILE_TAB_LIMIT;
  const mobileTabs = needsMobileMenu
    ? (activeSection?.items ?? []).slice(0, MOBILE_TAB_LIMIT - 1)
    : allItems;
  const showMobileNav = allItems.length > 1;
  const mobileMenuActive = needsMobileMenu && !mobileTabs.some(isActive);
  const mobileColumns = mobileTabs.length + (needsMobileMenu ? 1 : 0);

  const hasOperations = canAccessOperations(profile);
  const hasPortfolioSwitcher = profile.role === "owner" || profile.role === "conciergerie";
  const roleLabel = t(roleLabelKey(profile));
  const roleBadge = t(roleBadgeKey(profile));

  const initials = profile.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  async function handleSignOut() {
    await signOut();
    await navigate({ to: "/login", replace: true });
  }

  function handleQuickAction(action: "booking" | "repair" | "expense") {
    if (action === "booking") {
      void navigate({ to: "/conciergerie/bookings" });
    } else if (action === "repair") {
      void navigate({ to: "/conciergerie/maintenance" });
    } else if (action === "expense") {
      void navigate({ to: "/conciergerie/expenses" });
    }
  }

  return (
    <div
      ref={shellRef}
      data-shell={ops ? "operations" : undefined}
      className="min-h-screen bg-[#0B0B0B] text-foreground luxury-canvas"
    >
      {/* Texture noise & hairline subtle grid */}
      <div className="fixed inset-0 pointer-events-none texture-vein opacity-60 z-0" />

      {/* Ambient slow drifting gold light in background */}
      <AmbientDrift />

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onQuickAction={handleQuickAction}
      />

      {/* Operations Floating Quick Actions (Conciergerie and solo Owners) */}
      {hasOperations && (
        <FloatingQuickActions
          onAction={handleQuickAction}
          {...(ops
            ? { className: "bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] md:bottom-6" }
            : {})}
        />
      )}

      {ops && (
        <OperationsSidebar
          sections={sections}
          isActive={isActive}
          collapsed={collapsed}
          onToggle={toggleSidebar}
          subtitle={t(PORTAL_SUBTITLE_KEYS[profile.role])}
          roleBadge={roleBadge}
        />
      )}

      {/* Start sidebar nav (collapses to bottom nav on mobile) */}
      {!ops && (
        <TooltipProvider delayDuration={150}>
          <aside
            data-collapsed={collapsed}
            className={cn(
              "fixed inset-y-0 start-0 z-40 hidden flex-col border-e border-sidebar-border bg-[#0D0D0D]/95 backdrop-blur-xl transition-[width] duration-300 ease-out lg:flex",
              collapsed ? "w-[4.5rem]" : "w-68",
            )}
          >
            {/* Edge handle: collapse or expand the sidebar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  aria-label={t(collapsed ? "nav.expandSidebar" : "nav.collapseSidebar")}
                  aria-expanded={!collapsed}
                  className="absolute -end-3 top-[1.6rem] z-50 grid size-6 place-items-center rounded-full border border-sidebar-border bg-[#141414] text-muted-foreground shadow-lg transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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

            {/* Sidebar Header with Velvet Keys LogoHorizontal */}
            <div
              className={cn(
                "flex items-center border-b border-sidebar-border/80 py-6",
                collapsed ? "justify-center px-0" : "gap-3.5 px-6",
              )}
            >
              {collapsed ? (
                <LogoMark size="md" />
              ) : (
                <LogoHorizontal size="md" subtitle={t(PORTAL_SUBTITLE_KEYS[profile.role])} />
              )}
            </div>

            {/* Role badge (a single dot on the slim rail) */}
            <div className={cn("pt-6", collapsed ? "flex justify-center" : "px-6")}>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      role="img"
                      aria-label={roleBadge}
                      className={`size-2.5 rounded-full animate-pulse ${accent.dot}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right">{roleBadge}</TooltipContent>
                </Tooltip>
              ) : (
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.68rem] font-medium tracking-[0.14em] uppercase ${accent.badge}`}
                >
                  <span className={`size-1.5 rounded-full animate-pulse ${accent.dot}`} />
                  <span>{roleBadge}</span>
                </div>
              )}
            </div>

            {/* Navigation Links with Shared Layout Active Indicator */}
            <nav
              className={cn(
                "mt-6 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-4",
                collapsed ? "px-2.5" : "px-4",
              )}
              aria-label={t("nav.mainNavigation")}
            >
              {sections.map((section) => (
                <div key={section.id} className="flex flex-col gap-1.5">
                  {sections.length > 1 &&
                    (collapsed ? (
                      <span aria-hidden className="mx-2 mb-1 h-px bg-sidebar-border/80" />
                    ) : (
                      <p className="px-3.5 pb-1 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                        {t(section.titleKey)}
                      </p>
                    ))}
                  {section.items.map((item) => {
                    const active = isActive(item);
                    const link = (
                      <Button
                        key={`${section.id}-${item.id}`}
                        variant="ghost"
                        asChild
                        className={cn(
                          "group relative h-11 text-sm transition-colors",
                          collapsed ? "justify-center px-0" : "justify-start px-3.5",
                          active
                            ? accent.activeItem
                            : "text-muted-foreground hover:bg-[#161616] hover:text-foreground",
                        )}
                      >
                        <Link
                          to={item.to}
                          aria-label={collapsed ? t(item.labelKey) : undefined}
                          aria-current={active ? "page" : undefined}
                        >
                          <item.icon
                            className={`size-[1.1rem] shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                              active ? accent.text : "text-muted-foreground"
                            }`}
                          />
                          {!collapsed && (
                            <span className="tracking-[0.03em] font-medium">
                              {t(item.labelKey)}
                            </span>
                          )}
                          {active && (
                            <motion.div
                              layoutId="sidebarActivePill"
                              className={`absolute start-0 top-1.5 bottom-1.5 w-1 rounded-e-full ${accent.activePill}`}
                              transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                          )}
                        </Link>
                      </Button>
                    );
                    return collapsed ? (
                      <Tooltip key={`${section.id}-${item.id}`}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Footer Area: Settings & Discreet Collapsed Dev Tooling (Strictly Hidden Behind DEV) */}
            <div
              className={cn(
                "space-y-2 border-t border-sidebar-border/80",
                collapsed ? "p-2.5" : "p-4",
              )}
            >
              {/* Cmd+K Quick Launch Button (the Admin panel keeps a single search, in the top bar) */}
              {profile.role !== "admin" && collapsed && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCommandPaletteOpen(true)}
                      aria-label={t("nav.searchCommands")}
                      className="h-10 w-full px-0 text-muted-foreground hover:text-foreground"
                    >
                      <Search className="size-4" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t("nav.searchCommands")}</TooltipContent>
                </Tooltip>
              )}
              {profile.role !== "admin" && !collapsed && (
                <button
                  type="button"
                  onClick={() => setCommandPaletteOpen(true)}
                  className="flex w-full items-center justify-between rounded-lg border border-border/60 bg-[#141414]/70 px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all duration-200"
                >
                  <span className="flex items-center gap-2">
                    <Search className="size-3.5" />
                    <span>{t("nav.searchCommands")}</span>
                  </span>
                  <kbd className="rounded border border-border/70 bg-[#0B0B0B] px-1.5 py-0.5 text-[0.62rem] font-mono text-muted-foreground">
                    ⌘K
                  </kbd>
                </button>
              )}
            </div>
          </aside>
        </TooltipProvider>
      )}

      {/* Main Workspace Frame */}
      <div
        className={cn(
          "relative z-10 transition-[padding] duration-300 ease-out",
          ops ? operationsSidebarOffset(collapsed) : collapsed ? "lg:ps-[4.5rem]" : "lg:ps-68",
        )}
      >
        <div ref={topRef} className="sticky top-0 z-30">
          {/* No connection: the last saved data is shown and writes are off */}
          <OfflineBanner />
          {/* Persistent read-only notice while an invoice is overdue */}
          <ReadOnlyBanner />
          {/* Day 5–7 reminder before an unpaid invoice turns the account read-only */}
          <PaymentDueBanner />

          {/* Top bar */}
          <header
            className={cn(
              "flex items-center justify-between gap-4 border-b border-border/80 bg-[#0B0B0B]/90 backdrop-blur-xl",
              ops ? "h-16 px-4 sm:px-6 lg:px-8" : "min-h-20 px-4 py-3.5 sm:px-8 lg:px-12",
            )}
          >
            {/* Start: Mobile Brand + Multi-property switcher */}
            <div className="flex min-w-0 flex-1 items-center gap-3.5 sm:min-w-48">
              <div className={ops ? "md:hidden" : "lg:hidden"}>
                <LogoMark size="sm" />
              </div>

              {!hasPortfolioSwitcher && (
                <p className="hidden truncate text-label-caps text-muted-foreground sm:block">
                  {t(PORTAL_SUBTITLE_KEYS[profile.role])}
                </p>
              )}

              {/* Property / Unit Switcher */}
              {hasPortfolioSwitcher && (
                <Select defaultValue="all">
                  <SelectTrigger
                    aria-label={t("portfolio.selectPortfolio")}
                    className={cn(
                      "min-w-0 max-w-84 border-border/90 bg-card/80 px-4 text-xs sm:text-sm font-medium hover:border-primary/50 transition-colors",
                      ops ? "h-9" : "h-11",
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Building2 className="size-4 shrink-0 text-primary" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    className="w-84 border-border bg-[#141414] shadow-2xl"
                  >
                    <SelectGroup>
                      <SelectLabel className="text-[0.65rem] uppercase tracking-wider text-muted-foreground px-3 py-1.5">
                        {t("portfolio.filterLabel")}
                      </SelectLabel>
                      <SelectItem value="all" className="cursor-pointer font-medium text-primary">
                        {t("portfolio.allEstates", { count: properties.data?.length ?? 0 })}
                      </SelectItem>
                    </SelectGroup>
                    <SelectSeparator className="bg-border/60" />
                    <SelectGroup>
                      <SelectLabel className="text-[0.65rem] uppercase tracking-wider text-muted-foreground px-3 py-1.5">
                        {t("portfolio.individualResidences")}
                      </SelectLabel>
                      {(properties.data ?? []).map((property) => (
                        <SelectItem
                          key={property.id}
                          value={property.id}
                          className="cursor-pointer py-2"
                        >
                          <div className="flex items-center gap-2.5">
                            <MediaImage
                              kind="property"
                              id={property.id}
                              fileId={property.imageFileId}
                              name={property.name}
                              variant="thumb"
                              className="size-5 shrink-0 rounded border border-border/80"
                            />
                            <span>
                              {property.name} · {property.city}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* End: Language Switcher + Quick Search + User Avatar Menu */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Global Language Switcher */}
              <LanguageSwitcher variant={profile.role === "admin" || ops ? "pill" : "dropdown"} />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommandPaletteOpen(true)}
                aria-label={t("nav.searchCommands")}
                className={cn(
                  "h-9 items-center gap-2 border-border/70 bg-[#141414]/60 px-3 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  ops ? "inline-flex md:min-w-56 md:justify-between" : "hidden sm:inline-flex",
                )}
              >
                <Search className="size-3.5" aria-hidden="true" />
                <span className={ops ? "hidden flex-1 text-start md:inline" : "hidden xl:inline"}>
                  {t("nav.searchCommands")}
                </span>
                <kbd
                  aria-hidden="true"
                  className={cn(
                    "hidden rounded border border-border/80 bg-background px-1 text-[0.6rem]",
                    profile.role === "admin" || ops
                      ? "font-sans tabular-nums font-medium"
                      : "font-mono",
                    ops ? "md:inline" : "xl:inline",
                  )}
                >
                  ⌘K
                </kbd>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "group flex items-center gap-3 rounded-lg border border-border/80 bg-card/70 px-3 py-1.5 transition-all duration-300 hover:border-primary/50 hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary/25",
                      ops ? "h-10 px-2" : "h-11",
                    )}
                    aria-label={t("nav.userMenu")}
                  >
                    <Avatar className="size-8 border border-primary/40 ring-1 ring-primary/20">
                      <AvatarFallback className="bg-[#1C1A14] text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden min-w-0 max-w-40 text-start lg:block">
                      <p className="truncate text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                        {profile.displayName}
                      </p>
                      <p className="truncate text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                        {roleLabel}
                      </p>
                    </div>
                    <ChevronDown className="hidden size-3.5 text-muted-foreground lg:block group-hover:text-foreground transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-68 border-border bg-[#141414] p-2 shadow-2xl"
                >
                  <div className="px-2.5 py-2">
                    <p className="font-display text-xs font-semibold uppercase tracking-wider text-foreground">
                      {profile.displayName}
                    </p>
                    <p className="text-[0.68rem] text-muted-foreground">{profile.email}</p>
                    <div
                      className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-wider ${accent.menuBadge}`}
                    >
                      {roleBadge}
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border/60" />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2.5 py-2 text-xs"
                    onSelect={() => void navigate({ to: roleDestination(profile.role) })}
                  >
                    <CircleUserRound className="size-4 text-muted-foreground" />
                    {t("nav.accountHome")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2.5 py-2 text-xs"
                    onSelect={() => setCommandPaletteOpen(true)}
                  >
                    <Search className="size-4 text-muted-foreground" />
                    {t("nav.commandPalette")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/60" />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2.5 py-2 text-xs text-destructive-foreground focus:bg-destructive/15 focus:text-destructive-foreground"
                    onSelect={() => void handleSignOut()}
                  >
                    <LogOut className="size-4 rtl-flip" />
                    {t("nav.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
        </div>

        {/* Main Content View with Page Motion Transitions.
            Entrance only: an exit animation would keep the outgoing page mounted, and pages
            with layout animations rendered through the router outlet can block it forever. */}
        <motion.main
          key={location.pathname}
          variants={ops ? opsPageVariants : pageMotionVariants}
          initial="initial"
          animate="animate"
          className={ops ? "pb-24 md:pb-10" : showMobileNav ? "pb-28 lg:pb-16" : "pb-16"}
        >
          {children}
        </motion.main>
      </div>

      {ops && (
        <OperationsMobileNav
          sections={sections}
          isActive={isActive}
          subtitle={t(PORTAL_SUBTITLE_KEYS[profile.role])}
        />
      )}

      {/* Mobile Navigation Bar */}
      {!ops && showMobileNav && (
        <nav
          className="fixed inset-x-0 bottom-0 z-50 grid h-20 border-t border-sidebar-border bg-[#0D0D0D]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
          style={{ gridTemplateColumns: `repeat(${mobileColumns}, minmax(0, 1fr))` }}
          aria-label={t("nav.mobileNavigation")}
        >
          {mobileTabs.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              asChild
              className={`h-full flex-col gap-1.5 rounded-none border-0 px-1 text-muted-foreground hover:text-foreground ${
                isActive(item) ? accent.mobileActive : ""
              }`}
            >
              <Link to={item.to}>
                <item.icon className="size-5 shrink-0" />
                <span className="max-w-full truncate text-[0.6rem] uppercase tracking-[0.1em] font-medium">
                  {t(item.labelKey)}
                </span>
              </Link>
            </Button>
          ))}
          {needsMobileMenu && (
            <Button
              variant="ghost"
              onClick={() => setMobileMenuOpen(true)}
              aria-haspopup="dialog"
              className={`h-full flex-col gap-1.5 rounded-none border-0 px-1 text-muted-foreground hover:text-foreground ${
                mobileMenuActive ? accent.mobileActive : ""
              }`}
            >
              <Menu className="size-5 shrink-0" />
              <span className="text-[0.6rem] uppercase tracking-[0.1em] font-medium">
                {t("nav.menu")}
              </span>
            </Button>
          )}
        </nav>
      )}

      {/* Mobile full navigation for panels with more than five destinations */}
      {!ops && needsMobileMenu && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto rounded-t-2xl border-sidebar-border bg-[#0D0D0D] px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-6"
          >
            <SheetTitle className="font-display text-base uppercase tracking-[0.14em] text-foreground">
              {t("nav.menu")}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {t(PORTAL_SUBTITLE_KEYS[profile.role])}
            </SheetDescription>
            <div className="mt-4 space-y-5">
              {sections.map((section) => (
                <div key={section.id} className="space-y-2">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                    {t(section.titleKey)}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {section.items.map((item) => (
                      <Link
                        key={`${section.id}-${item.id}`}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-[0.62rem] font-medium uppercase tracking-[0.08em] ${
                          isActive(item)
                            ? `${accent.badge} ${accent.text}`
                            : "border-border/60 bg-[#141414] text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <item.icon className="size-5" />
                        <span className="max-w-full truncate">{t(item.labelKey)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
