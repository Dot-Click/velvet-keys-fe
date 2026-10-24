import type { LinkProps } from "@tanstack/react-router";
import {
  Building2,
  Cable,
  CalendarDays,
  KeyRound,
  CheckCircle2,
  CircleUserRound,
  CreditCard,
  FileSpreadsheet,
  FileText,
  House,
  LayoutDashboard,
  LayoutGrid,
  Percent,
  Receipt,
  ReceiptText,
  ScrollText,
  Settings,
  Sparkles,
  Tags,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { AuthProfile } from "@/types/auth";
import { isSoloOwner } from "@/lib/roles";

export type NavItem = {
  id: string;
  /** i18n key in the common namespace */
  labelKey: string;
  to: NonNullable<LinkProps["to"]>;
  icon: LucideIcon;
  /** Active only on its own page, not its children; for a panel's root page */
  exact?: boolean;
};

export type NavSection = {
  id: string;
  /** Heading shown when a panel has more than one section, and in the command palette. */
  titleKey: string;
  items: NavItem[];
};

const OWNER_SECTION: NavSection = {
  id: "owner",
  titleKey: "roles.ownerPortal",
  items: [
    { id: "overview", labelKey: "nav.overview", to: "/owner/overview", icon: LayoutGrid },
    {
      id: "financials",
      labelKey: "nav.financials",
      to: "/owner/financials",
      icon: FileSpreadsheet,
    },
    { id: "demand", labelKey: "nav.demand", to: "/owner/demand", icon: Sparkles },
    { id: "properties", labelKey: "nav.properties", to: "/owner/properties", icon: Building2 },
    { id: "reports", labelKey: "nav.reports", to: "/owner/reports", icon: FileText },
  ],
};

const OPS_ITEM = {
  today: { id: "today", labelKey: "nav.today", to: "/conciergerie/today", icon: CheckCircle2 },
  bookings: {
    id: "bookings",
    labelKey: "nav.bookings",
    to: "/conciergerie/bookings",
    icon: UserCheck,
  },
  calendar: {
    id: "calendar",
    labelKey: "nav.calendar",
    to: "/conciergerie/calendar",
    icon: CalendarDays,
  },
  channels: { id: "channels", labelKey: "nav.channels", to: "/conciergerie/channels", icon: Cable },
  leases: { id: "leases", labelKey: "nav.leases", to: "/conciergerie/leases", icon: KeyRound },
  rentInvoices: {
    id: "rent-invoices",
    labelKey: "nav.rentInvoices",
    to: "/conciergerie/rent-invoices",
    icon: ReceiptText,
  },
  maintenance: {
    id: "maintenance",
    labelKey: "nav.maintenance",
    to: "/conciergerie/maintenance",
    icon: Wrench,
  },
  expenses: {
    id: "expenses",
    labelKey: "nav.expenses",
    to: "/conciergerie/expenses",
    icon: Receipt,
  },
  properties: {
    id: "properties",
    labelKey: "nav.properties",
    to: "/conciergerie/properties",
    icon: Building2,
  },
  owners: { id: "owners", labelKey: "nav.owners", to: "/conciergerie/owners", icon: Users },
  commission: {
    id: "commission",
    labelKey: "nav.commission",
    to: "/conciergerie/commission",
    icon: Percent,
  },
} satisfies Record<string, NavItem>;

const OPERATIONS_ITEMS: NavItem[] = [
  OPS_ITEM.today,
  OPS_ITEM.bookings,
  OPS_ITEM.calendar,
  OPS_ITEM.channels,
  OPS_ITEM.leases,
  OPS_ITEM.rentInvoices,
  OPS_ITEM.maintenance,
  OPS_ITEM.expenses,
];

/** The Conciergerie panel, grouped as the operations sidebar shows it. */
function conciergerieSections(billing: NavItem | null): NavSection[] {
  return [
    {
      id: "operations",
      titleKey: "nav.group.operations",
      items: [OPS_ITEM.today, OPS_ITEM.bookings, OPS_ITEM.calendar, OPS_ITEM.channels],
    },
    {
      id: "long-term",
      titleKey: "nav.group.longTerm",
      items: [OPS_ITEM.leases, OPS_ITEM.rentInvoices],
    },
    {
      id: "portfolio",
      titleKey: "nav.group.portfolio",
      items: [OPS_ITEM.properties, OPS_ITEM.owners, OPS_ITEM.commission],
    },
    {
      id: "finance",
      titleKey: "nav.group.finance",
      items: [OPS_ITEM.maintenance, OPS_ITEM.expenses, ...(billing ? [billing] : [])],
    },
  ];
}

/**
 * A solo Owner runs their own operations: every Conciergerie tool under an "Operations" heading,
 * including property and unit management, but not Owners or Commission.
 */
const MANAGE_PROPERTIES_ITEM: NavItem = {
  id: "manage-properties",
  labelKey: "nav.propertiesUnits",
  to: "/conciergerie/properties",
  icon: Building2,
};

const OPERATIONS_SECTION: NavSection = {
  id: "operations",
  titleKey: "nav.operations",
  items: [...OPERATIONS_ITEMS, MANAGE_PROPERTIES_ITEM],
};

/** The account holder pays the subscription, so only they see Billing. */
const BILLING_ITEM: NavItem = {
  id: "billing",
  labelKey: "nav.billing",
  to: "/owner/billing",
  icon: CreditCard,
};

const CONCIERGERIE_BILLING_ITEM: NavItem = { ...BILLING_ITEM, to: "/conciergerie/billing" };

const ADMIN_SECTION: NavSection = {
  id: "admin",
  titleKey: "roles.adminConsole",
  items: [
    { id: "overview", labelKey: "nav.overview", to: "/admin", icon: LayoutDashboard, exact: true },
    { id: "clients", labelKey: "nav.clients", to: "/admin/clients", icon: Users },
    { id: "properties", labelKey: "nav.properties", to: "/admin/properties", icon: Building2 },
    { id: "invoices", labelKey: "nav.invoices", to: "/admin/invoices", icon: ReceiptText },
    { id: "revenue", labelKey: "nav.revenue", to: "/admin/revenue", icon: TrendingUp },
    { id: "pricing", labelKey: "nav.pricingOffers", to: "/admin/pricing", icon: Tags },
    { id: "settings", labelKey: "nav.settings", to: "/admin/settings", icon: Settings },
  ],
};

const TENANT_SECTION: NavSection = {
  id: "tenant",
  titleKey: "roles.tenantPortal",
  items: [
    { id: "home", labelKey: "nav.home", to: "/tenant", icon: House },
    { id: "lease", labelKey: "nav.myLease", to: "/tenant/lease", icon: ScrollText },
    { id: "invoices", labelKey: "nav.myInvoices", to: "/tenant/invoices", icon: ReceiptText },
    { id: "profile", labelKey: "nav.profile", to: "/tenant/profile", icon: CircleUserRound },
  ],
};

export function getNavSections(profile: AuthProfile): NavSection[] {
  switch (profile.role) {
    case "admin":
      return [ADMIN_SECTION];
    case "conciergerie":
      return conciergerieSections(profile.isAccountHolder ? CONCIERGERIE_BILLING_ITEM : null);
    case "owner": {
      const owner = profile.isAccountHolder
        ? { ...OWNER_SECTION, items: [...OWNER_SECTION.items, BILLING_ITEM] }
        : OWNER_SECTION;
      return isSoloOwner(profile) ? [owner, OPERATIONS_SECTION] : [owner];
    }
    case "tenant":
      return [TENANT_SECTION];
  }
}

/**
 * Sections of the operations sidebar (/conciergerie/*). A solo Owner keeps their Owner section and
 * sees their operations tools in the same groups as a Conciergerie, without Owners or Commission.
 */
export function getOperationsNavSections(profile: AuthProfile): NavSection[] {
  if (profile.role !== "owner") return getNavSections(profile);
  const [owner] = getNavSections(profile);
  return [
    ...(owner ? [owner] : []),
    {
      id: "operations",
      titleKey: "nav.group.operations",
      items: [OPS_ITEM.today, OPS_ITEM.bookings, OPS_ITEM.calendar, OPS_ITEM.channels],
    },
    {
      id: "long-term",
      titleKey: "nav.group.longTerm",
      items: [OPS_ITEM.leases, OPS_ITEM.rentInvoices],
    },
    { id: "portfolio", titleKey: "nav.group.portfolio", items: [MANAGE_PROPERTIES_ITEM] },
    {
      id: "finance",
      titleKey: "nav.group.finance",
      items: [OPS_ITEM.maintenance, OPS_ITEM.expenses],
    },
  ];
}

export function isNavItemActive(item: NavItem, pathname: string) {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return path === item.to || (!item.exact && path.startsWith(`${item.to}/`));
}

/** Where the signed-in account holder pays their subscription. */
export function billingRoute(profile: AuthProfile): "/conciergerie/billing" | "/owner/billing" {
  return profile.role === "conciergerie" ? "/conciergerie/billing" : "/owner/billing";
}
