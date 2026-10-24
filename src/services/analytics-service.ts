import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  format,
  startOfQuarter,
  startOfYear,
} from "date-fns";
import type {
  AttentionItem,
  BookingWithUnit,
  DemandDay,
  FinancialPeriod,
  FinancialsView,
  PortfolioOverview,
  PropertyDetail,
  PropertyPerformance,
  StatementRecord,
  StatementView,
  TicketView,
  UnitPerformance,
} from "@/types/analytics";
import type { DataScope } from "@/types/common";
import type { Property } from "@/types/property";
import { today } from "@/lib/clock";
import {
  lastMonths,
  monthRange,
  parseDay,
  rangeDays,
  toISODate,
  toMonthKey,
  type DayRange,
} from "@/lib/dates";
import { bookingNights, calcAdr, calcOccupancy, unitTypeOn } from "@/lib/finance";
import type { Lease } from "@/types/lease";
import type { Unit } from "@/types/property";
import {
  monthlyPL,
  portfolioPL,
  propertyPL,
  splitByProperty,
  type PLFigures,
  type PortfolioData,
} from "@/lib/portfolio";
import { MOCK_DEMAND_EVENTS } from "@/mocks/events";
import { leaseRentStatus } from "./leases-service";
import { withLatency } from "./mock-latency";
import { scopedProperties, scopedUnits } from "./scope";
import { db, findOrThrow } from "./store";

/** Collects every record a scope can see, for the portfolio calculations. */
export function scopedData(scope: DataScope, propertyId?: string): PortfolioData {
  const properties = scopedProperties(scope).filter(
    (property) => !propertyId || property.id === propertyId,
  );
  const propertyIds = new Set(properties.map((property) => property.id));
  const units = db.units.filter((unit) => propertyIds.has(unit.propertyId));
  const unitIds = new Set(units.map((unit) => unit.id));
  const leases = db.leases.filter((lease) => unitIds.has(lease.unitId));
  const leaseIds = new Set(leases.map((lease) => lease.id));
  return {
    properties,
    units,
    bookings: db.bookings.filter((booking) => unitIds.has(booking.unitId)),
    leases,
    rentInvoices: db.rentInvoices.filter((invoice) => leaseIds.has(invoice.leaseId)),
    expenses: db.expenses.filter(
      (expense) => expense.propertyId && propertyIds.has(expense.propertyId),
    ),
    tickets: db.tickets.filter((ticket) => unitIds.has(ticket.unitId)),
  };
}

/** The lease running on `day` for a unit, if any. */
function runningLease(leases: Lease[], unitId: string, day: string) {
  return leases.find(
    (lease) =>
      lease.unitId === unitId &&
      lease.status !== "ended" &&
      lease.startDate <= day &&
      lease.endDate > day,
  );
}

/** Units running as LTR today, and how many of them have a lease running. */
function ltrOccupancy(units: Unit[], leases: Lease[]) {
  const now = today();
  const day = toISODate(now);
  const ltr = units.filter((unit) => unitTypeOn(unit, now) === "LTR");
  return {
    leased: ltr.filter((unit) => runningLease(leases, unit.id, day)).length,
    total: ltr.length,
  };
}

function margin(pl: PLFigures) {
  return pl.grossRevenue === 0 ? 0 : Math.round((pl.netProfit / pl.grossRevenue) * 100);
}

function performanceFor(
  property: Property,
  data: PortfolioData | undefined,
  range: DayRange,
): PropertyPerformance {
  const units = data?.units ?? [];
  const pl = data ? propertyPL(data, range) : propertyPL(emptyData(property), range);
  return {
    property,
    unitCount: units.length,
    strUnits: units.filter((unit) => unit.type === "STR").length,
    ltrUnits: units.filter((unit) => unit.type === "LTR").length,
    ltrLeased: ltrOccupancy(units, data?.leases ?? []).leased,
    pl,
    margin: margin(pl),
  };
}

function emptyData(property: Property): PortfolioData {
  return {
    properties: [property],
    units: [],
    bookings: [],
    leases: [],
    rentInvoices: [],
    expenses: [],
    tickets: [],
  };
}

function propertyRows(data: PortfolioData, range: DayRange): PropertyPerformance[] {
  const split = splitByProperty(data);
  return data.properties.map((property) => performanceFor(property, split.get(property.id), range));
}

export function toTicketView(ticketId: string): TicketView {
  const ticket = findOrThrow(db.tickets, ticketId);
  const unit = db.units.find((item) => item.id === ticket.unitId);
  const property = db.properties.find((item) => item.id === unit?.propertyId);
  const worker = ticket.workerId
    ? db.workers.find((item) => item.id === ticket.workerId)
    : undefined;
  return {
    ...structuredClone(ticket),
    unitName: unit?.name ?? "",
    propertyName: property?.name ?? "",
    propertyId: property?.id ?? "",
    ...(worker ? { worker: structuredClone(worker) } : {}),
  };
}

export function toBookingWithUnit(bookingId: string): BookingWithUnit {
  const booking = findOrThrow(db.bookings, bookingId);
  const unit = db.units.find((item) => item.id === booking.unitId);
  const property = db.properties.find((item) => item.id === unit?.propertyId);
  return {
    ...structuredClone(booking),
    unitName: unit?.name ?? "",
    propertyName: property?.name ?? "",
    image: unit?.image ?? property?.image ?? "",
  };
}

/** What needs the Owner's eye: critical repairs, arrivals today, unpaid stays and late rent. */
function attentionFeed(data: PortfolioData): AttentionItem[] {
  const day = toISODate(today());
  const soon = toISODate(addDays(today(), 14));
  const names = (unitId: string) => {
    const unit = data.units.find((item) => item.id === unitId);
    const property = data.properties.find((item) => item.id === unit?.propertyId);
    return { unitName: unit?.name ?? "", propertyName: property?.name ?? "" };
  };
  const items: AttentionItem[] = [];

  for (const ticket of data.tickets) {
    if (ticket.urgency !== "critical" || ticket.status === "resolved") continue;
    items.push({
      id: `att-${ticket.id}`,
      kind: "critical_repair",
      urgency: "critical",
      subject: ticket.title,
      at: ticket.reportedAt,
      ...names(ticket.unitId),
    });
  }
  for (const booking of data.bookings) {
    if (booking.checkIn === day) {
      items.push({
        id: `att-arrival-${booking.id}`,
        kind: "arrival",
        urgency: (booking.guests ?? 0) >= 5 ? "warning" : "info",
        subject: booking.guestName,
        at: `${booking.checkIn}T15:00:00+01:00`,
        ...names(booking.unitId),
      });
    }
    if (booking.paymentStatus === "unpaid" && booking.checkOut > day && booking.checkIn <= soon) {
      items.push({
        id: `att-balance-${booking.id}`,
        kind: "unpaid_balance",
        urgency: "warning",
        subject: booking.guestName,
        amountMAD: booking.amountMAD,
        ...names(booking.unitId),
      });
    }
  }
  for (const invoice of data.rentInvoices) {
    if (invoice.status !== "late") continue;
    const lease = data.leases.find((item) => item.id === invoice.leaseId);
    const tenant = db.tenants.find((item) => item.id === lease?.tenantId);
    if (!lease) continue;
    items.push({
      id: `att-${invoice.id}`,
      kind: "late_rent",
      urgency: "warning",
      subject: tenant?.name ?? "",
      amountMAD: invoice.amountMAD,
      ...names(lease.unitId),
    });
  }

  const rank = { critical: 0, warning: 1, info: 2 } as const;
  return items.sort((a, b) => rank[a.urgency] - rank[b.urgency]).slice(0, 6);
}

function periodRange(period: FinancialPeriod): DayRange {
  const now = today();
  switch (period) {
    case "this_month":
      return monthRange(now);
    case "last_month":
      return monthRange(addMonths(now, -1));
    case "this_quarter": {
      const from = startOfQuarter(now);
      return { from, to: addMonths(from, 3) };
    }
    case "full_year": {
      const from = startOfYear(now);
      return { from, to: addMonths(from, 12) };
    }
  }
}

/** The equal-length period just before `range`, for comparisons. */
function previousRange(range: DayRange): DayRange {
  const months = Math.round(rangeDays(range) / 30.4);
  return { from: addMonths(range.from, -months), to: range.from };
}

export const analyticsService = {
  getPortfolioOverview(scope: DataScope): Promise<PortfolioOverview> {
    return withLatency(() => {
      const data = scopedData(scope);
      const now = today();
      const split = splitByProperty(data);
      const current = portfolioPL(data, monthRange(now), split);
      const previous = portfolioPL(data, monthRange(addMonths(now, -1)), split);
      return {
        month: toMonthKey(now),
        current,
        previous,
        monthly: monthlyPL(data, lastMonths(12, now)),
        properties: propertyRows(data, monthRange(now)),
        activeUnits: data.units.filter((unit) => unitTypeOn(unit, now)).length,
        ltrUnits: ltrOccupancy(data.units, data.leases),
        workerCount: db.workers.filter((worker) => worker.accountId === scope.accountId).length,
        attention: attentionFeed(data),
      };
    });
  },

  getFinancials(scope: DataScope, period: FinancialPeriod): Promise<FinancialsView> {
    return withLatency(() => {
      const data = scopedData(scope);
      const range = periodRange(period);
      const split = splitByProperty(data);
      return {
        period,
        from: toISODate(range.from),
        to: toISODate(range.to),
        current: portfolioPL(data, range, split),
        previous: portfolioPL(data, previousRange(range), split),
        monthly: monthlyPL(data, lastMonths(12, today())),
        properties: propertyRows(data, range).sort((a, b) => b.margin - a.margin),
      };
    });
  },

  /** Current-month performance of each property in scope. */
  listPropertyPerformance(scope: DataScope): Promise<PropertyPerformance[]> {
    return withLatency(() => propertyRows(scopedData(scope), monthRange(today())));
  },

  getPropertyDetail(scope: DataScope, propertyId: string): Promise<PropertyDetail> {
    return withLatency(() => {
      const data = scopedData(scope, propertyId);
      const property = data.properties[0];
      if (!property) throw new Error("not_found");
      const now = today();
      const day = toISODate(now);
      const month = monthRange(now);
      const months = lastMonths(12, now);
      const monthly = monthlyPL(data, months);

      const units: UnitPerformance[] = data.units.map((unit) => {
        const bookings = data.bookings.filter((booking) => booking.unitId === unit.id);
        const lease = data.leases.find(
          (item) => item.unitId === unit.id && item.status !== "ended" && item.endDate > day,
        );
        const tenant = lease ? db.tenants.find((item) => item.id === lease.tenantId) : undefined;
        return {
          unit,
          occupancy: calcOccupancy({ units: [unit], bookings, leases: data.leases, range: month })
            .rate,
          adr: calcAdr(bookings, { from: addDays(now, -90), to: addDays(now, 1) }),
          ...(lease ? { lease, rentStatus: leaseRentStatus(lease, now) } : {}),
          ...(tenant ? { tenant } : {}),
        };
      });

      const sortedByDistance = [...data.bookings].sort(
        (a, b) =>
          Math.abs(differenceInCalendarDays(parseDay(a.checkIn), now)) -
          Math.abs(differenceInCalendarDays(parseDay(b.checkIn), now)),
      );

      return {
        performance: performanceFor(property, data, month),
        units,
        monthly,
        trailingYearRevenue: Math.round(
          monthly.reduce((sum, point) => sum + point.grossRevenue, 0),
        ),
        recentBookings: sortedByDistance
          .slice(0, 4)
          .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
          .map((booking) => toBookingWithUnit(booking.id)),
        openTickets: data.tickets
          .filter((ticket) => ticket.status !== "resolved")
          .map((ticket) => toTicketView(ticket.id)),
      };
    });
  },

  /** Figures for an Owner statement over a date range (inclusive `to` day). */
  getStatement(
    scope: DataScope,
    input: { from: string; to: string; propertyId?: string },
  ): Promise<StatementView> {
    return withLatency(() => {
      const data = scopedData(scope, input.propertyId);
      const range = { from: parseDay(input.from), to: addDays(parseDay(input.to), 1) };
      const rows = propertyRows(data, range);
      return {
        from: input.from,
        to: input.to,
        pl: portfolioPL(data, range),
        rows,
        cities: [...new Set(data.properties.map((property) => property.city))],
      };
    });
  },

  /** Monthly statements already issued (last full months), newest first. */
  listStatements(scope: DataScope): Promise<StatementRecord[]> {
    return withLatency(() => {
      const properties = scopedProperties(scope);
      if (properties.length === 0) return [];
      const months = lastMonths(4, today()).slice(0, 3).reverse();
      return months.map((month, index) => ({
        id: `statement-${scope.accountId}-${month}`,
        period: month,
        kind:
          index === 0
            ? "detailed"
            : index === 2 && Number(month.slice(5)) % 3 === 0
              ? "quarterly"
              : "summary",
        issuedAt: toISODate(addMonths(parseDay(`${month}-01`), 1)),
        sizeKb: 900 + properties.length * 180 + index * 120,
      }));
    });
  },

  /**
   * Daily demand for STR units: share of units booked, the average nightly rate of those
   * stays, a suggested rate and any Moroccan holiday or festival that day.
   */
  getDemandCalendar(
    scope: DataScope,
    input: { from: string; to: string; propertyId?: string },
  ): Promise<{ days: DemandDay[]; totalUnits: number }> {
    return withLatency(() => {
      const range = { from: parseDay(input.from), to: parseDay(input.to) };
      const units = scopedUnits(scope).filter(
        (unit) =>
          (!input.propertyId || unit.propertyId === input.propertyId) &&
          unit.typeHistory.some((period) => period.type === "STR"),
      );
      const unitIds = new Set(units.map((unit) => unit.id));
      const bookings = db.bookings.filter((booking) => unitIds.has(booking.unitId));
      const baseAdr = calcAdr(bookings, { from: addDays(today(), -365), to: addDays(today(), 1) });
      const days: DemandDay[] = [];

      for (let day = range.from; day < range.to; day = addDays(day, 1)) {
        const iso = toISODate(day);
        const available = units.filter((unit) => unitTypeOn(unit, day) === "STR");
        let booked = 0;
        let revenue = 0;
        for (const booking of bookings) {
          if (booking.checkIn <= iso && booking.checkOut > iso) {
            booked += 1;
            revenue += booking.amountMAD / Math.max(1, rangeDays(bookingNights(booking)));
          }
        }
        const total = available.length;
        const occupancy = total === 0 ? 0 : Math.min(100, Math.round((booked / total) * 100));
        const weekday = day.getDay();
        const isWeekend = weekday === 5 || weekday === 6;
        const eventKey = MOCK_DEMAND_EVENTS[format(day, "MM-dd")];
        const adr =
          booked > 0 ? Math.round(revenue / booked) : Math.round(baseAdr * (isWeekend ? 1.12 : 1));
        const multiplier =
          (occupancy >= 85 ? 1.12 : occupancy < 40 ? 0.92 : 1) * (eventKey ? 1.1 : 1);
        days.push({
          date: iso,
          occupancy,
          bookedUnits: Math.min(booked, total),
          totalUnits: total,
          adr,
          suggestedRate: Math.round((adr * multiplier) / 50) * 50,
          isWeekend,
          ...(eventKey ? { eventKey } : {}),
        });
      }
      return { days, totalUnits: units.length };
    });
  },
};
