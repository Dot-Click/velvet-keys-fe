import { addDays, addMonths, startOfMonth } from "date-fns";
import type { DataScope } from "@/types/common";
import type {
  CreateLeaseInput,
  Lease,
  LeaseDetail,
  LeaseRentStatus,
  LeaseState,
  LeaseStatus,
  LeaseSummary,
  LeaseView,
  RentDueItem,
  RentDueState,
  RentInvoice,
  RentInvoiceRow,
  RentInvoicesView,
  RentScheduleRow,
  RentScheduleState,
  Tenant,
  TenantContactInput,
  TenantManager,
  TenantPortal,
  TenantRentStatus,
} from "@/types/lease";
import type { Property, Unit } from "@/types/property";
import { today } from "@/lib/clock";
import { parseDay, toISODate, toMonthKey } from "@/lib/dates";
import { unitTypeOn } from "@/lib/finance";
import { isIssuerProfileComplete } from "@/lib/issuer";
import {
  MAX_RENT_DUE_DAY,
  leaseDaysLeft,
  leaseState,
  leaseStatusOn,
  rentDueDate,
  rentFor,
  rentInvoiceNumber,
  rentInvoiceStatus,
} from "@/lib/rent";
import { withLatency } from "./mock-latency";
import { scopedProperties, scopedUnitIds, scopedUnits, unitWithProperty } from "./scope";
import {
  ServiceError,
  db,
  findOrThrow,
  newId,
  patchItem,
  removeItem,
  snapshot,
  withWrite,
} from "./store";

function scopedLeases(scope: DataScope) {
  const unitIds = scopedUnitIds(scope);
  return db.leases.filter((lease) => unitIds.has(lease.unitId));
}

function findScopedLease(scope: DataScope, id: string) {
  const lease = scopedLeases(scope).find((item) => item.id === id);
  if (!lease) throw new ServiceError("not_found", id);
  return lease;
}

function rentInvoiceOf(leaseId: string, period: string) {
  return db.rentInvoices.find(
    (invoice) => invoice.leaseId === leaseId && invoice.period === period,
  );
}

/** A lease that is running or still to start blocks the unit for another lease. */
function blocksUnit(lease: Lease, day: string) {
  return lease.status !== "ended" && lease.endDate > day;
}

function placeOf(lease: Lease) {
  const { unit, property } = unitWithProperty(lease.unitId);
  return {
    unitName: unit?.name ?? "",
    propertyName: property?.name ?? "",
    image: unit?.image || property?.image || "",
    propertyAddress: property?.address ?? "",
    city: property?.city ?? "",
    accountId: property?.accountId ?? "",
  };
}

/** Next number in the issuer's sequence for the month. */
function nextInvoiceNumber(accountId: string, period: string) {
  let highest = 0;
  for (const invoice of db.rentInvoices) {
    if (invoice.period !== period) continue;
    const lease = db.leases.find((item) => item.id === invoice.leaseId);
    if (!lease || placeOf(lease).accountId !== accountId) continue;
    highest = Math.max(highest, Number(invoice.number.split("-").pop()) || 0);
  }
  return rentInvoiceNumber(period, highest + 1);
}

/** Issues the rent invoice for a period under the account's current issuer profile. */
function issueInvoice(lease: Lease, period: string, status: RentInvoice["status"]): RentInvoice {
  const { accountId } = placeOf(lease);
  const account = db.accounts.find((item) => item.id === accountId);
  const day = toISODate(today());
  const dueDate = rentDueDate(period, lease.rentDueDay);
  const invoice: RentInvoice = {
    id: `rent-${lease.id}-${period}`,
    number: nextInvoiceNumber(accountId, period),
    leaseId: lease.id,
    period,
    issuedAt: day,
    amountMAD: rentFor(lease, `${period}-01`),
    issuerProfile: {
      ...(account?.issuerProfile ?? { name: account?.name ?? "", address: "", rib: "" }),
    },
    status: status === "paid" ? "paid" : rentInvoiceStatus({ status, dueDate }, day),
    dueDate,
    ...(status === "paid" ? { paidAt: day } : {}),
  };
  db.rentInvoices.push(invoice);
  return invoice;
}

/** Whether rent is owed for the period: the lease runs during it. */
function leaseRunsIn(lease: Lease, period: string) {
  return toMonthKey(parseDay(lease.startDate)) <= period && `${period}-01` < lease.endDate;
}

/**
 * Month by month, from the lease start (or its first invoice when earlier months predate the
 * account) to its end, with the invoice for each month when there is one.
 */
function scheduleOf(lease: Lease, day: string): RentScheduleRow[] {
  const invoices = db.rentInvoices.filter((invoice) => invoice.leaseId === lease.id);
  const startPeriod = toMonthKey(parseDay(lease.startDate));
  const firstInvoiced = invoices.map((invoice) => invoice.period).sort()[0];
  const from = firstInvoiced && firstInvoiced > startPeriod ? firstInvoiced : startPeriod;
  const periods = new Set(invoices.map((invoice) => invoice.period));
  for (
    let month = parseDay(`${from}-01`);
    toISODate(month) < lease.endDate;
    month = addMonths(month, 1)
  ) {
    periods.add(toMonthKey(month));
  }
  return [...periods].sort().map((period) => {
    const invoice = invoices.find((item) => item.period === period);
    if (invoice) {
      return {
        period,
        amountMAD: invoice.amountMAD,
        dueDate: invoice.dueDate,
        state: rentInvoiceStatus(invoice, day),
        invoice: snapshot(invoice),
      };
    }
    const dueDate = rentDueDate(period, lease.rentDueDay);
    return {
      period,
      amountMAD: rentFor(lease, `${period}-01`),
      dueDate,
      state: dueDate < day ? "not_invoiced" : "scheduled",
    };
  });
}

function rentStatusOf(
  state: LeaseState,
  schedule: RentScheduleRow[],
  currentPeriod: string,
): LeaseRentStatus {
  if (schedule.some((row) => row.state === "late" || row.state === "not_invoiced")) return "late";
  if (state === "ended") return "paid";
  const current =
    schedule.find((row) => row.period === currentPeriod) ??
    (state === "upcoming" ? schedule[0] : undefined);
  return !current || current.state === "paid" ? "paid" : "unpaid";
}

/** Rent status of a lease on `now`: late wins, then whether the current rent is paid. */
export function leaseRentStatus(lease: Lease, now: Date): LeaseRentStatus {
  return rentStatusOf(leaseState(lease, now), scheduleOf(lease, toISODate(now)), toMonthKey(now));
}

function summarize(lease: Lease, now: Date): LeaseSummary & { schedule: RentScheduleRow[] } {
  const day = toISODate(now);
  const tenant = db.tenants.find((item) => item.id === lease.tenantId);
  const place = placeOf(lease);
  const state = leaseState(lease, now);
  const schedule = scheduleOf(lease, day);
  const next = schedule.find((row) => row.state !== "paid");
  return {
    lease: snapshot(lease),
    tenantName: tenant?.name ?? "",
    unitName: place.unitName,
    propertyName: place.propertyName,
    image: place.image,
    state,
    daysLeft: leaseDaysLeft(lease, now),
    rentStatus: rentStatusOf(state, schedule, toMonthKey(now)),
    ...(next
      ? { nextDue: { period: next.period, dueDate: next.dueDate, amountMAD: next.amountMAD } }
      : {}),
    schedule,
  };
}

function toRow(invoice: RentInvoice, day: string): RentInvoiceRow {
  const lease = db.leases.find((item) => item.id === invoice.leaseId);
  const tenant = lease ? db.tenants.find((item) => item.id === lease.tenantId) : undefined;
  const place = lease ? placeOf(lease) : undefined;
  return {
    invoice: snapshot(invoice),
    status: rentInvoiceStatus(invoice, day),
    ...(tenant ? { tenant: snapshot(tenant) } : {}),
    unitName: place?.unitName ?? "",
    propertyName: place?.propertyName ?? "",
    propertyAddress: place?.propertyAddress ?? "",
    city: place?.city ?? "",
  };
}

export const tenantsService = {
  /** Tenants of the account (an Owner managed by a Conciergerie sees only their own tenants). */
  list(scope: DataScope): Promise<Tenant[]> {
    return withLatency(() => {
      const leased = new Set(scopedLeases(scope).map((lease) => lease.tenantId));
      return snapshot(
        db.tenants
          .filter(
            (tenant) =>
              tenant.accountId === scope.accountId && (!scope.ownerId || leased.has(tenant.id)),
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    });
  },

  get(id: string): Promise<Tenant> {
    return withLatency(() => snapshot(findOrThrow(db.tenants, id)));
  },

  create(input: Omit<Tenant, "id">): Promise<Tenant> {
    return withWrite(() => {
      const tenant: Tenant = { ...input, id: newId("tenant") };
      db.tenants.push(tenant);
      return snapshot(tenant);
    });
  },

  update(id: string, patch: Partial<Omit<Tenant, "id">>): Promise<Tenant> {
    return withWrite(() => snapshot(patchItem(db.tenants, id, patch)));
  },

  remove(id: string): Promise<void> {
    return withWrite(() => removeItem(db.tenants, id));
  },

  /** Sends the portal invitation again (the email itself is mocked). */
  resendInvite(scope: DataScope, tenantId: string): Promise<Tenant> {
    return withWrite(() => {
      const tenant = findOrThrow(db.tenants, tenantId);
      if (tenant.accountId !== scope.accountId) throw new ServiceError("not_found", tenantId);
      if (tenant.userId) throw new ServiceError("invalid_input");
      return snapshot(patchItem(db.tenants, tenantId, { invitedAt: new Date().toISOString() }));
    });
  },
};

export const leasesService = {
  list(scope: DataScope, filter: { unitId?: string; status?: LeaseStatus } = {}): Promise<Lease[]> {
    return withLatency(() =>
      snapshot(
        scopedLeases(scope).filter(
          (lease) =>
            (!filter.unitId || lease.unitId === filter.unitId) &&
            (!filter.status || lease.status === filter.status),
        ),
      ),
    );
  },

  get(id: string): Promise<Lease> {
    return withLatency(() => snapshot(findOrThrow(db.leases, id)));
  },

  /** Every lease in scope with its tenant, unit, state and rent status. */
  listSummaries(scope: DataScope): Promise<LeaseSummary[]> {
    return withLatency(() => {
      const now = today();
      return scopedLeases(scope)
        .map((lease) => {
          const { schedule: _schedule, ...summary } = summarize(lease, now);
          return summary;
        })
        .sort(
          (a, b) =>
            a.propertyName.localeCompare(b.propertyName) || a.unitName.localeCompare(b.unitName),
        );
    });
  },

  /** The lease with its tenant and full rent schedule. */
  getView(scope: DataScope, id: string): Promise<LeaseView> {
    return withLatency(() => {
      const lease = findScopedLease(scope, id);
      const tenant = db.tenants.find((item) => item.id === lease.tenantId);
      const place = placeOf(lease);
      return {
        ...summarize(lease, today()),
        ...(tenant ? { tenant: snapshot(tenant) } : {}),
        propertyAddress: place.propertyAddress,
        city: place.city,
      };
    });
  },

  /** The lease with its tenant, unit and rent schedule. */
  getDetail(scope: DataScope, id: string): Promise<LeaseDetail> {
    return withLatency(() => {
      const lease = findScopedLease(scope, id);
      const { unit, property } = unitWithProperty(lease.unitId);
      const tenant = db.tenants.find((item) => item.id === lease.tenantId);
      return snapshot({
        lease,
        ...(tenant ? { tenant } : {}),
        unitName: unit?.name ?? "",
        propertyName: property?.name ?? "",
        image: unit?.image || property?.image || "",
        invoices: db.rentInvoices
          .filter((invoice) => invoice.leaseId === lease.id)
          .sort((a, b) => b.period.localeCompare(a.period)),
      });
    });
  },

  /** LTR units that have no running or upcoming lease, so a new lease can start. */
  listAvailableUnits(scope: DataScope): Promise<{ unit: Unit; property: Property }[]> {
    return withLatency(() => {
      const now = today();
      const day = toISODate(now);
      const properties = scopedProperties(scope);
      return scopedUnits(scope)
        .filter(
          (unit) =>
            unitTypeOn(unit, now) === "LTR" &&
            !db.leases.some((lease) => lease.unitId === unit.id && blocksUnit(lease, day)),
        )
        .map((unit) => ({
          unit: snapshot(unit),
          property: snapshot(properties.find((property) => property.id === unit.propertyId)!),
        }))
        .sort(
          (a, b) =>
            a.property.name.localeCompare(b.property.name) ||
            a.unit.name.localeCompare(b.unit.name),
        );
    });
  },

  /**
   * Signs a lease on a free LTR unit, creating the tenant when needed. Tenants without an
   * account are (re)invited to their portal; `invited` says whether an invitation went out.
   */
  createLease(
    scope: DataScope,
    input: CreateLeaseInput,
  ): Promise<{ lease: Lease; tenant: Tenant; invited: boolean }> {
    return withWrite(() => {
      const now = today();
      const day = toISODate(now);
      const unit = scopedUnits(scope).find((item) => item.id === input.unitId);
      if (!unit || unitTypeOn(unit, now) !== "LTR")
        throw new ServiceError("not_found", input.unitId);
      if (db.leases.some((lease) => lease.unitId === unit.id && blocksUnit(lease, day))) {
        throw new ServiceError("unit_leased");
      }
      if (
        input.endDate <= input.startDate ||
        input.endDate <= day ||
        input.monthlyRentMAD <= 0 ||
        input.depositMAD < 0 ||
        !Number.isInteger(input.rentDueDay) ||
        input.rentDueDay < 1 ||
        input.rentDueDay > MAX_RENT_DUE_DAY ||
        !input.contractFileUrl
      ) {
        throw new ServiceError("invalid_input");
      }

      const invitedAt = new Date().toISOString();
      let tenant: Tenant;
      if ("existingId" in input.tenant) {
        const existing = findOrThrow(db.tenants, input.tenant.existingId);
        if (existing.accountId !== scope.accountId) throw new ServiceError("not_found");
        tenant = existing.userId ? existing : patchItem(db.tenants, existing.id, { invitedAt });
      } else {
        const email = input.tenant.create.email.trim().toLowerCase();
        const taken = db.tenants.some(
          (item) => item.accountId === scope.accountId && item.email.toLowerCase() === email,
        );
        if (taken) throw new ServiceError("email_taken");
        tenant = {
          id: newId("tenant"),
          accountId: scope.accountId,
          name: input.tenant.create.name.trim(),
          email,
          phone: input.tenant.create.phone.trim(),
          language: input.tenant.create.language,
          invitedAt,
        };
        db.tenants.push(tenant);
      }

      const lease: Lease = {
        id: newId("lease"),
        unitId: unit.id,
        tenantId: tenant.id,
        startDate: input.startDate,
        endDate: input.endDate,
        monthlyRentMAD: input.monthlyRentMAD,
        depositMAD: input.depositMAD,
        rentDueDay: input.rentDueDay,
        contractFileUrl: input.contractFileUrl,
        contractFileName: input.contractFileName,
        status: leaseStatusOn(input, now),
      };
      db.leases.push(lease);
      return { lease: snapshot(lease), tenant: snapshot(tenant), invited: !tenant.userId };
    });
  },

  /**
   * Extends the lease to a later end date. A new rent applies to rent periods from the old end
   * date on; periods before keep the current rent.
   */
  renew(
    scope: DataScope,
    id: string,
    input: { endDate: string; monthlyRentMAD?: number },
  ): Promise<Lease> {
    return withWrite(() => {
      const now = today();
      const lease = findScopedLease(scope, id);
      if (leaseState(lease, now) === "ended" || input.endDate <= lease.endDate) {
        throw new ServiceError("invalid_input");
      }
      if (input.monthlyRentMAD !== undefined && input.monthlyRentMAD <= 0) {
        throw new ServiceError("invalid_input");
      }
      const rentChanges =
        input.monthlyRentMAD !== undefined && input.monthlyRentMAD !== rentFor(lease, lease.endDate)
          ? [
              ...(lease.rentChanges ?? []).filter((change) => change.from < lease.endDate),
              { amountMAD: input.monthlyRentMAD, from: lease.endDate },
            ]
          : lease.rentChanges;
      return snapshot(
        patchItem(db.leases, id, {
          endDate: input.endDate,
          status: leaseStatusOn({ endDate: input.endDate }, now),
          ...(rentChanges ? { rentChanges } : {}),
        }),
      );
    });
  },

  /**
   * Ends the lease after `lastDay` (the tenant's last night). Unpaid rent for periods after the
   * end is cancelled; rent already received and earlier unpaid rent stay on record.
   */
  end(scope: DataScope, id: string, input: { lastDay: string }): Promise<Lease> {
    return withWrite(() => {
      const now = today();
      const lease = findScopedLease(scope, id);
      const endDate = toISODate(addDays(parseDay(input.lastDay), 1));
      if (
        leaseState(lease, now) === "ended" ||
        endDate <= lease.startDate ||
        endDate > lease.endDate
      ) {
        throw new ServiceError("invalid_input");
      }
      db.rentInvoices = db.rentInvoices.filter(
        (invoice) =>
          invoice.leaseId !== lease.id ||
          invoice.status === "paid" ||
          `${invoice.period}-01` < endDate,
      );
      const rentChanges = lease.rentChanges?.filter((change) => change.from < endDate);
      return snapshot(
        patchItem(db.leases, id, {
          endDate,
          status: leaseStatusOn({ endDate }, now),
          ...(rentChanges ? { rentChanges } : {}),
        }),
      );
    });
  },

  create(input: Omit<Lease, "id">): Promise<Lease> {
    return withWrite(() => {
      const lease: Lease = { ...input, id: newId("lease") };
      db.leases.push(lease);
      return snapshot(lease);
    });
  },

  update(id: string, patch: Partial<Omit<Lease, "id">>): Promise<Lease> {
    return withWrite(() => snapshot(patchItem(db.leases, id, patch)));
  },

  /** Deletes the lease together with its rent schedule. */
  remove(id: string): Promise<void> {
    return withWrite(() => {
      removeItem(db.leases, id);
      db.rentInvoices = db.rentInvoices.filter((invoice) => invoice.leaseId !== id);
    });
  },
};

/** Leases in scope that owe rent for the month and have no invoice for it yet. */
function leasesMissingInvoice(scope: DataScope, period: string) {
  return scopedLeases(scope).filter(
    (lease) =>
      lease.status !== "ended" && leaseRunsIn(lease, period) && !rentInvoiceOf(lease.id, period),
  );
}

export const rentInvoicesService = {
  list(scope: DataScope, filter: { leaseId?: string } = {}): Promise<RentInvoice[]> {
    return withLatency(() => {
      const leaseIds = new Set(scopedLeases(scope).map((lease) => lease.id));
      return snapshot(
        db.rentInvoices.filter(
          (invoice) =>
            leaseIds.has(invoice.leaseId) &&
            (!filter.leaseId || invoice.leaseId === filter.leaseId),
        ),
      );
    });
  },

  /** Every rent invoice in scope, newest period first, and how many are still to issue. */
  listView(scope: DataScope): Promise<RentInvoicesView> {
    return withLatency(() => {
      const now = today();
      const day = toISODate(now);
      const period = toMonthKey(now);
      const leaseIds = new Set(scopedLeases(scope).map((lease) => lease.id));
      const invoices = db.rentInvoices
        .filter((invoice) => leaseIds.has(invoice.leaseId))
        .map((invoice) => toRow(invoice, day))
        .sort(
          (a, b) =>
            b.invoice.period.localeCompare(a.invoice.period) ||
            a.propertyName.localeCompare(b.propertyName) ||
            a.unitName.localeCompare(b.unitName),
        );
      return { period, invoices, missingThisMonth: leasesMissingInvoice(scope, period).length };
    });
  },

  /** One invoice with its tenant and property, for the PDF preview. */
  getRow(scope: DataScope, invoiceId: string): Promise<RentInvoiceRow> {
    return withLatency(() => {
      const invoice = findOrThrow(db.rentInvoices, invoiceId);
      findScopedLease(scope, invoice.leaseId);
      return toRow(invoice, toISODate(today()));
    });
  },

  /**
   * Issues this month's rent invoice for every running lease that has none yet, under the
   * account's issuer profile. Fails when the profile cannot be printed on an invoice.
   */
  generateForMonth(scope: DataScope): Promise<{ period: string; created: number }> {
    return withWrite(() => {
      const account = db.accounts.find((item) => item.id === scope.accountId);
      if (!isIssuerProfileComplete(account?.issuerProfile)) {
        throw new ServiceError("issuer_incomplete");
      }
      const period = toMonthKey(today());
      const missing = leasesMissingInvoice(scope, period);
      for (const lease of missing) issueInvoice(lease, period, "unpaid");
      return { period, created: missing.length };
    });
  },

  create(input: Omit<RentInvoice, "id">): Promise<RentInvoice> {
    return withWrite(() => {
      const invoice: RentInvoice = { ...input, id: newId("rent") };
      db.rentInvoices.push(invoice);
      return snapshot(invoice);
    });
  },

  update(id: string, patch: Partial<Omit<RentInvoice, "id">>): Promise<RentInvoice> {
    return withWrite(() => snapshot(patchItem(db.rentInvoices, id, patch)));
  },

  remove(id: string): Promise<void> {
    return withWrite(() => removeItem(db.rentInvoices, id));
  },

  /**
   * Late rents, and rents falling due from today to `days` ahead: invoiced ones, plus the next
   * scheduled rent of a running lease that has not been invoiced yet. Late first, then by due date.
   */
  listDue(scope: DataScope, options: { days?: number } = {}): Promise<RentDueItem[]> {
    return withLatency(() => {
      const now = today();
      const day = toISODate(now);
      const horizon = toISODate(addDays(now, options.days ?? 7));
      const items: RentDueItem[] = [];
      const stateOf = (dueDate: string): RentDueState =>
        dueDate < day ? "late" : dueDate === day ? "due_today" : "upcoming";

      for (const lease of scopedLeases(scope)) {
        const place = placeOf(lease);
        const tenant = db.tenants.find((item) => item.id === lease.tenantId);
        const names = {
          tenantName: tenant?.name ?? "",
          unitName: place.unitName,
          propertyName: place.propertyName,
        };
        for (const invoice of db.rentInvoices) {
          if (invoice.leaseId !== lease.id || invoice.status === "paid") continue;
          if (invoice.dueDate > horizon) continue;
          items.push({
            leaseId: lease.id,
            period: invoice.period,
            invoiceId: invoice.id,
            amountMAD: invoice.amountMAD,
            dueDate: invoice.dueDate,
            state: stateOf(invoice.dueDate),
            ...names,
          });
        }
        if (lease.status === "ended") continue;
        for (const month of [startOfMonth(now), startOfMonth(addMonths(now, 1))]) {
          const period = toMonthKey(month);
          const dueDate = rentDueDate(period, lease.rentDueDay);
          if (
            !leaseRunsIn(lease, period) ||
            dueDate < day ||
            dueDate > horizon ||
            rentInvoiceOf(lease.id, period)
          ) {
            continue;
          }
          items.push({
            leaseId: lease.id,
            period,
            amountMAD: rentFor(lease, toISODate(month)),
            dueDate,
            state: stateOf(dueDate),
            ...names,
          });
        }
      }
      const rank: Record<RentDueState, number> = { late: 0, due_today: 1, upcoming: 2 };
      return items.sort(
        (a, b) =>
          rank[a.state] - rank[b.state] ||
          a.dueDate.localeCompare(b.dueDate) ||
          a.propertyName.localeCompare(b.propertyName),
      );
    });
  },

  /**
   * Records the rent for a period as received by bank transfer today, invoicing it first when
   * the period had no invoice yet.
   */
  markReceived(scope: DataScope, input: { leaseId: string; period: string }): Promise<RentInvoice> {
    return withWrite(() => {
      const lease = findScopedLease(scope, input.leaseId);
      const paidAt = toISODate(today());
      const existing = rentInvoiceOf(lease.id, input.period);
      if (existing) {
        return snapshot(patchItem(db.rentInvoices, existing.id, { status: "paid", paidAt }));
      }
      return snapshot(issueInvoice(lease, input.period, "paid"));
    });
  },

  /** Undoes "Mark received": the rent is outstanding again, late if its due date has passed. */
  markOutstanding(scope: DataScope, invoiceId: string): Promise<RentInvoice> {
    return withWrite(() => {
      const invoice = findOrThrow(db.rentInvoices, invoiceId);
      findScopedLease(scope, invoice.leaseId);
      const { paidAt: _undone, ...rest } = invoice;
      const reopened: RentInvoice = {
        ...rest,
        status: rentInvoiceStatus(
          { status: "unpaid", dueDate: invoice.dueDate },
          toISODate(today()),
        ),
      };
      db.rentInvoices[db.rentInvoices.indexOf(invoice)] = reopened;
      return snapshot(reopened);
    });
  },
};

/** The signed-in tenant, as the portal knows them. */
interface TenantUser {
  id: string;
  email: string;
  accountId: string;
}

/** The tenant record of a user: linked once they accepted, else matched by their invited email. */
function findTenantOf(user: TenantUser) {
  const email = user.email.trim().toLowerCase();
  return (
    db.tenants.find((tenant) => tenant.userId === user.id) ??
    db.tenants.find(
      (tenant) =>
        !tenant.userId &&
        tenant.accountId === user.accountId &&
        tenant.email.trim().toLowerCase() === email,
    )
  );
}

const LEASE_PRIORITY: Record<LeaseState, number> = { active: 0, ending: 0, upcoming: 1, ended: 2 };

/** The lease the portal shows: the running one, else the next to start, else the latest ended. */
function portalLeaseOf(leases: Lease[], now: Date): Lease | undefined {
  return [...leases].sort((a, b) => {
    const rank = LEASE_PRIORITY[leaseState(a, now)] - LEASE_PRIORITY[leaseState(b, now)];
    if (rank !== 0) return rank;
    return leaseState(a, now) === "ended"
      ? b.startDate.localeCompare(a.startDate)
      : a.startDate.localeCompare(b.startDate);
  })[0];
}

/** Rent past its due date counts as late for the tenant, invoiced or not. */
const TENANT_RENT_STATUS: Record<RentScheduleState, TenantRentStatus> = {
  paid: "paid",
  unpaid: "unpaid",
  late: "late",
  not_invoiced: "late",
  scheduled: "upcoming",
};

const isOutstanding = (row: RentInvoiceRow) => row.status !== "paid";

export const tenantPortalService = {
  /** The signed-in tenant's home, lease, rent and invoices; never another unit's data. */
  get(user: TenantUser): Promise<TenantPortal> {
    return withLatency(() => {
      const now = today();
      const day = toISODate(now);
      const tenant = findTenantOf(user);
      const account = db.accounts.find((item) => item.id === (tenant?.accountId ?? user.accountId));
      const holder = account
        ? db.users.find((item) => item.id === account.holderUserId)
        : undefined;
      const manager: TenantManager = {
        name: account?.issuerProfile?.name || account?.name || "",
        contactName: holder?.name ?? "",
        email: holder?.email ?? "",
        ...(holder?.phone ? { phone: holder.phone } : {}),
      };

      const leases = tenant ? db.leases.filter((lease) => lease.tenantId === tenant.id) : [];
      const current = portalLeaseOf(leases, now);
      const place = current ? placeOf(current) : undefined;
      const lease = current
        ? {
            ...summarize(current, now),
            ...(tenant ? { tenant: snapshot(tenant) } : {}),
            propertyAddress: place?.propertyAddress ?? "",
            city: place?.city ?? "",
          }
        : null;

      const leaseIds = new Set(leases.map((item) => item.id));
      const invoices = db.rentInvoices
        .filter((invoice) => leaseIds.has(invoice.leaseId))
        .map((invoice) => toRow(invoice, day))
        .sort(
          (a, b) =>
            Number(isOutstanding(b)) - Number(isOutstanding(a)) ||
            (isOutstanding(a)
              ? a.invoice.dueDate.localeCompare(b.invoice.dueDate)
              : b.invoice.period.localeCompare(a.invoice.period)),
        );

      const next = lease?.schedule.find((row) => row.state !== "paid");
      return {
        ...(tenant ? { tenant: snapshot(tenant) } : {}),
        lease,
        manager,
        ...(account?.issuerProfile ? { payee: snapshot(account.issuerProfile) } : {}),
        ...(next
          ? {
              nextRent: {
                period: next.period,
                amountMAD: next.amountMAD,
                dueDate: next.dueDate,
                status: TENANT_RENT_STATUS[next.state],
                ...(next.invoice ? { invoice: next.invoice } : {}),
              },
            }
          : {}),
        invoices,
      };
    });
  },

  /** Keeps the manager's tenant record in step when the tenant edits their profile. */
  updateContact(user: TenantUser, input: TenantContactInput): Promise<void> {
    return withWrite(() => {
      const tenant = findTenantOf(user);
      if (tenant) {
        patchItem(db.tenants, tenant.id, { name: input.name.trim(), phone: input.phone.trim() });
      }
    });
  },
};
