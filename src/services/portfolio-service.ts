import { api, type Page } from "@/lib/apiClient";
import type {
  CommissionList,
  CommissionRow,
  InviteOwnerInput,
  OwnerDetail,
  OwnerInvite,
  PendingInvite,
  OwnerSummary,
  Property,
  PropertyDetail,
  PropertyInput,
  PropertyListFilter,
  PropertyPatch,
  Unit,
  UnitInput,
  UnitPatch,
  UnitType,
  UnitWithHistory,
} from "@/types/portfolio";

/**
 * The backend serializes percentages (Decimal) as strings such as "20.00". Everything above
 * this layer works with numbers, so convert once, here.
 */
type WithPct<T> = Omit<T, "commissionPct"> & { commissionPct: string | number | null };

function pct(value: string | number | null): number | null {
  return value === null ? null : Number(value);
}

function property<T extends { commissionPct: number | null }>(raw: WithPct<T>): T {
  return { ...raw, commissionPct: pct(raw.commissionPct) } as T;
}

function query(filter: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined && value !== ""),
  );
}

/** The largest page the backend allows; used to load a whole list in as few calls as possible. */
const MAX_PAGE_SIZE = 50;

async function loadAll<T>(load: (page: number) => Promise<Page<T>>): Promise<T[]> {
  const first = await load(1);
  const items = [...first.items];
  for (let page = 2; items.length < first.total; page += 1) {
    const next = await load(page);
    if (next.items.length === 0) break;
    items.push(...next.items);
  }
  return items;
}

export const propertiesService = {
  async list(filter: PropertyListFilter = {}): Promise<Page<Property>> {
    const page = await api.get<Page<WithPct<Property>>>(
      "/properties",
      query({ ...filter }),
    );
    return { ...page, items: page.items.map((item) => property<Property>(item)) };
  },

  /** Every property the user can see, for selectors that need the whole list. */
  listAll(filter: Omit<PropertyListFilter, "page" | "pageSize"> = {}): Promise<Property[]> {
    return loadAll((page) => this.list({ ...filter, page, pageSize: MAX_PAGE_SIZE }));
  },

  async get(id: string): Promise<PropertyDetail> {
    const raw = await api.get<WithPct<PropertyDetail>>(`/properties/${id}`);
    return property<PropertyDetail>(raw);
  },

  async create(input: PropertyInput): Promise<Property> {
    const raw = await api.post<WithPct<Property>>("/properties", input);
    return property<Property>(raw);
  },

  async update(id: string, patch: PropertyPatch): Promise<Property> {
    const raw = await api.patch<WithPct<Property>>(`/properties/${id}`, patch);
    return property<Property>(raw);
  },

  /** Conciergerie only; applies to bookings and rent periods from now on. */
  async setCommission(id: string, commissionPct: number): Promise<Property> {
    const raw = await api.patch<WithPct<Property>>(`/properties/${id}/commission`, {
      commissionPct,
    });
    return property<Property>(raw);
  },
};

export const unitsService = {
  create(propertyId: string, input: UnitInput): Promise<Unit> {
    return api.post<Unit>(`/properties/${propertyId}/units`, input);
  },

  update(id: string, patch: UnitPatch): Promise<Unit> {
    return api.patch<Unit>(`/units/${id}`, patch);
  },

  /**
   * Switches STR <-> LTR. Fails with UNIT_HAS_FUTURE_BOOKINGS or UNIT_HAS_ACTIVE_LEASE
   * when the unit cannot change type right now.
   */
  switchType(id: string, toType: UnitType, effectiveDate?: string): Promise<UnitWithHistory> {
    return api.post<UnitWithHistory>(`/units/${id}/switch-type`, {
      toType,
      ...(effectiveDate ? { effectiveDate } : {}),
    });
  },

  /** Archives the unit: it is hidden and billing stops, but its history stays. */
  remove(id: string): Promise<void> {
    return api.delete(`/units/${id}`);
  },
};

export const ownersService = {
  list(page = 1, pageSize: 10 | 25 | 50 = 25): Promise<Page<OwnerSummary>> {
    return api.get<Page<OwnerSummary>>("/owners", { page, pageSize });
  },

  listAll(): Promise<OwnerSummary[]> {
    return loadAll((page) => this.list(page, MAX_PAGE_SIZE));
  },

  async get(ownerUserId: string): Promise<OwnerDetail> {
    const raw = await api.get<Omit<OwnerDetail, "properties"> & { properties: WithPct<Property>[] }>(
      `/owners/${ownerUserId}`,
    );
    return { ...raw, properties: raw.properties.map((item) => property<Property>(item)) };
  },

  /** Sends the invitation email; the invite stays valid for 7 days. */
  invite(input: InviteOwnerInput): Promise<OwnerInvite> {
    return api.post<OwnerInvite>("/owners/invites", {
      name: input.name,
      email: input.email,
      language: input.language,
      propertyIds: input.propertyIds,
    });
  },

  resendInvite(inviteId: string): Promise<OwnerInvite> {
    return api.post<OwnerInvite>(`/invites/${inviteId}/resend`);
  },

  /** Invites still waiting to be accepted, each with its copyable link (inviting account only). */
  pendingInvites(): Promise<PendingInvite[]> {
    return api.get<PendingInvite[]>("/invites");
  },
};

export const commissionService = {
  async list(page = 1, pageSize: 10 | 25 | 50 = 25): Promise<CommissionList> {
    const raw = await api.get<
      Omit<CommissionList, "items" | "defaultCommissionPct"> & {
        items: (Omit<CommissionRow, "commissionPct"> & { commissionPct: string | number })[];
        defaultCommissionPct: string | number;
      }
    >("/commission", { page, pageSize });
    return {
      ...raw,
      defaultCommissionPct: Number(raw.defaultCommissionPct),
      items: raw.items.map((row) => ({ ...row, commissionPct: Number(row.commissionPct) })),
    };
  },

  /** Commission % suggested for properties added from now on. */
  async setDefault(defaultCommissionPct: number): Promise<number> {
    const raw = await api.patch<{ defaultCommissionPct: string | number }>("/account/settings", {
      defaultCommissionPct,
    });
    return Number(raw.defaultCommissionPct);
  },
};
