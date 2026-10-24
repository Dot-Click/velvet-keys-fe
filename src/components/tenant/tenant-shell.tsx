import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronDown, CircleUserRound, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth-provider";
import { LogoHorizontal } from "@/components/brand";
import { LanguageSwitcher } from "@/components/language-switcher";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { pageMotionVariants } from "@/lib/motion";
import { getNavSections, isNavItemActive, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { AuthProfile } from "@/types/auth";

/**
 * The Tenant panel frame: a single calm top bar, no sidebar. Below desktop width the links sit in a
 * second row of the same bar.
 */
export function TenantShell({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  if (!session) return <TenantShellSkeleton />;
  return <TenantShellFrame profile={session.profile}>{children}</TenantShellFrame>;
}

function TenantShellSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] luxury-canvas" aria-busy="true">
      <div className="border-b border-border/80">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:h-20 sm:px-8">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="size-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function TenantShellFrame({ profile, children }: { profile: AuthProfile; children: ReactNode }) {
  const { t } = useTranslation("common");
  const location = useLocation();
  const items = getNavSections(profile).flatMap((section) => section.items);
  // Home is the panel root, so it is only active on its own page
  const isActive = (item: NavItem) =>
    item.to === "/tenant"
      ? location.pathname.replace(/\/$/, "") === "/tenant"
      : isNavItemActive(item, location.pathname);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-foreground luxury-canvas">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-[#0B0B0B]/90 backdrop-blur-xl">
        <OfflineBanner />
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-8">
          <Link to="/tenant" aria-label={t("brand.name")} className="min-w-0 shrink">
            <LogoHorizontal size="sm" subtitle={t("roles.tenantPortal")} />
          </Link>

          <nav aria-label={t("nav.mainNavigation")} className="hidden items-center gap-1 lg:flex">
            {items.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                aria-current={isActive(item) ? "page" : undefined}
                className={cn(
                  "relative whitespace-nowrap rounded-full px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.14em] transition-colors",
                  isActive(item)
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-[#141414] hover:text-foreground",
                )}
              >
                {t(item.labelKey)}
                {isActive(item) && (
                  <motion.span
                    layoutId="tenantNavUnderline"
                    className="absolute inset-x-4 -bottom-0.5 h-px bg-primary shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="pill" />
            <UserMenu profile={profile} />
          </div>
        </div>

        {/* Phones and tablets: the same links in a second row of the bar */}
        <nav
          aria-label={t("nav.mobileNavigation")}
          className="grid border-t border-border/60 lg:hidden"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              aria-current={isActive(item) ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-1 px-1 py-2.5 text-[0.6rem] font-medium uppercase tracking-[0.1em]",
                isActive(item) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate">{t(item.labelKey)}</span>
              {isActive(item) && (
                <span className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </nav>
      </header>

      {/* Entrance only, like the other panels: an exit animation would keep the old page mounted */}
      <motion.main
        key={location.pathname}
        variants={pageMotionVariants}
        initial="initial"
        animate="animate"
        className="relative z-10 pb-16"
      >
        {children}
      </motion.main>
    </div>
  );
}

function UserMenu({ profile }: { profile: AuthProfile }) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const initials = profile.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  async function handleSignOut() {
    await signOut();
    await navigate({ to: "/login", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("nav.userMenu")}
          className="group flex h-11 shrink-0 items-center gap-2.5 rounded-full border border-border/80 bg-card/70 p-1 pe-1 transition-colors hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/25 sm:pe-3"
        >
          <Avatar className="size-9 border border-primary/40">
            <AvatarFallback className="bg-[#1C1A14] text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-36 truncate text-xs font-medium text-foreground sm:block">
            {profile.displayName}
          </span>
          <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 border-border bg-[#141414] p-2 shadow-2xl">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold text-foreground">{profile.displayName}</p>
          <p className="truncate text-[0.68rem] text-muted-foreground">{profile.email}</p>
        </div>
        <DropdownMenuSeparator className="bg-border/60" />
        <DropdownMenuItem asChild className="cursor-pointer gap-2.5 py-2 text-xs">
          <Link to="/tenant/profile">
            <CircleUserRound className="size-4 text-muted-foreground" />
            {t("nav.profile")}
          </Link>
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
  );
}
