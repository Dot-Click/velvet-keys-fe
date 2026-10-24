import type { Booking } from "@/types/booking";
import type { MonthKey } from "@/types/common";
import type { Lease, RentInvoice } from "@/types/lease";
import type { Expense, MaintenanceTicket } from "@/types/operations";
import type { Property, Unit } from "@/types/property";
import {
  isWithin,
  monthRange,
  overlapDays,
  parseDay,
  rangeDays,
  round2,
  type DayRange,
} from "@/lib/dates";
import {
  bookingNights,
  bookingRevenueIn,
  calcAdr,
  calcCommission,
  calcNetProfit,
  calcOccupancy,
  commissionPctOn,
} from "@/lib/finance";

/** Everything needed to compute performance for a set of properties. */
export interface PortfolioData {
  properties: Property[];
  units: Unit[];
  bookings: Booking[];
  leases: Lease[];
  rentInvoices: RentInvoice[];
  expenses: Expense[];
  tickets: MaintenanceTicket[];
}

/** Profit and loss for a period, in MAD. */
export interface PLFigures {
  strRevenue: number;
  ltrRevenue: number;
  grossRevenue: number;
  commission: number;
  payroll: number;
  utilities: number;
  repairs: number;
  netProfit: number;
  /** Occupied share of unit-nights (stays and leases), % with one decimal */
  occupancy: number;
  /** Booked share of STR unit-nights, % with one decimal */
  strOccupancy: number;
  /** STR revenue per booked night */
  adr: number;
  bookedNights: number;
}

export const EMPTY_PL: PLFigures = {
  strRevenue: 0,
  ltrRevenue: 0,
  grossRevenue: 0,
  commission: 0,
  payroll: 0,
  utilities: 0,
  repairs: 0,
  netProfit: 0,
  occupancy: 0,
  strOccupancy: 0,
  adr: 0,
  bookedNights: 0,
};

/** Splits the data per property so per-period calculations only scan what they need. */
export function splitByProperty(data: PortfolioData): Map<string, PortfolioData> {
  const unitToProperty = new Map(data.units.map((unit) => [unit.id, unit.propertyId]));
  const leaseToProperty = new Map(
    data.leases.map((lease) => [lease.id, unitToProperty.get(lease.unitId)]),
  );
  const result = new Map<string, PortfolioData>();
  for (const property of data.properties) {
    result.set(property.id, {
      properties: [property],
      units: [],
      bookings: [],
      leases: [],
      rentInvoices: [],
      expenses: [],
      tickets: [],
    });
  }
  const bucket = (propertyId: string | undefined) =>
    propertyId ? result.get(propertyId) : undefined;

  for (const unit of data.units) bucket(unit.propertyId)?.units.push(unit);
  for (const booking of data.bookings)
    bucket(unitToProperty.get(booking.unitId))?.bookings.push(booking);
  for (const lease of data.leases) bucket(unitToProperty.get(lease.unitId))?.leases.push(lease);
  for (const invoice of data.rentInvoices)
    bucket(leaseToProperty.get(invoice.leaseId))?.rentInvoices.push(invoice);
  for (const expense of data.expenses) bucket(expense.propertyId)?.expenses.push(expense);
  for (const ticket of data.tickets)
    bucket(unitToProperty.get(ticket.unitId))?.tickets.push(ticket);
  return result;
}

/** Rent earned in the range: each monthly invoice spread over the days of its period. */
function rentIn(invoices: RentInvoice[], range: DayRange): number {
  let total = 0;
  for (const invoice of invoices) {
    const period = monthRange(invoice.period);
    const days = overlapDays(period, range);
    if (days > 0) total += (invoice.amountMAD * days) / rangeDays(period);
  }
  return total;
}

function sumExpenses(expenses: Expense[], category: Expense["category"], range: DayRange) {
  return expenses
    .filter((expense) => expense.category === category && isWithin(parseDay(expense.date), range))
    .reduce((sum, expense) => sum + expense.amountMAD, 0);
}

/** Repairs: resolved maintenance work plus supplies and other running costs. */
function repairsIn(data: PortfolioData, range: DayRange) {
  const tickets = data.tickets
    .filter((ticket) => ticket.resolvedAt && isWithin(parseDay(ticket.resolvedAt), range))
    .reduce((sum, ticket) => sum + ticket.costMAD, 0);
  return tickets + sumExpenses(data.expenses, "other", range);
}

/**
 * Commission earned in the range: each booking at the rate in force on its check-in day, each
 * rent period at the rate in force when the period starts.
 */
function commissionIn(data: PortfolioData, range: DayRange): number {
  const property = data.properties[0];
  if (!property) return 0;
  let total = 0;
  for (const booking of data.bookings) {
    const revenue = bookingRevenueIn(booking, range);
    if (revenue > 0) total += calcCommission(revenue, commissionPctOn(property, booking.checkIn));
  }
  for (const invoice of data.rentInvoices) {
    const revenue = rentIn([invoice], range);
    if (revenue > 0) {
      total += calcCommission(revenue, commissionPctOn(property, `${invoice.period}-01`));
    }
  }
  return round2(total);
}

/** P&L for one property over a range. */
export function propertyPL(data: PortfolioData, range: DayRange): PLFigures {
  const strRevenue = data.bookings.reduce(
    (sum, booking) => sum + bookingRevenueIn(booking, range),
    0,
  );
  const ltrRevenue = rentIn(data.rentInvoices, range);
  const grossRevenue = strRevenue + ltrRevenue;
  const commission = commissionIn(data, range);
  const payroll = sumExpenses(data.expenses, "workerPay", range);
  const utilities = sumExpenses(data.expenses, "utility", range);
  const repairs = repairsIn(data, range);
  const occupancy = calcOccupancy({
    units: data.units,
    bookings: data.bookings,
    leases: data.leases,
    range,
  });
  const strOccupancy = calcOccupancy({ ...data, range, type: "STR" });
  const bookedNights = data.bookings.reduce(
    (sum, booking) => sum + overlapDays(bookingNights(booking), range),
    0,
  );

  return {
    strRevenue: round2(strRevenue),
    ltrRevenue: round2(ltrRevenue),
    grossRevenue: round2(grossRevenue),
    commission,
    payroll,
    utilities,
    repairs,
    netProfit: calcNetProfit({ grossRevenue, commission, payroll, utilities, repairs }),
    occupancy: occupancy.rate,
    strOccupancy: strOccupancy.rate,
    adr: calcAdr(data.bookings, range),
    bookedNights,
  };
}

/** P&L for a whole portfolio: money adds up per property; occupancy and ADR are recomputed. */
export function portfolioPL(
  data: PortfolioData,
  range: DayRange,
  split = splitByProperty(data),
): PLFigures {
  const totals = { ...EMPTY_PL };
  for (const propertyData of split.values()) {
    const figures = propertyPL(propertyData, range);
    totals.strRevenue += figures.strRevenue;
    totals.ltrRevenue += figures.ltrRevenue;
    totals.grossRevenue += figures.grossRevenue;
    totals.commission += figures.commission;
    totals.payroll += figures.payroll;
    totals.utilities += figures.utilities;
    totals.repairs += figures.repairs;
    totals.netProfit += figures.netProfit;
    totals.bookedNights += figures.bookedNights;
  }
  const occupancy = calcOccupancy({
    units: data.units,
    bookings: data.bookings,
    leases: data.leases,
    range,
  });
  const strOccupancy = calcOccupancy({ ...data, range, type: "STR" });
  return {
    ...totals,
    strRevenue: round2(totals.strRevenue),
    ltrRevenue: round2(totals.ltrRevenue),
    grossRevenue: round2(totals.grossRevenue),
    commission: round2(totals.commission),
    payroll: round2(totals.payroll),
    utilities: round2(totals.utilities),
    repairs: round2(totals.repairs),
    netProfit: round2(totals.netProfit),
    occupancy: occupancy.rate,
    strOccupancy: strOccupancy.rate,
    adr: calcAdr(data.bookings, range),
  };
}

export interface MonthlyPL extends PLFigures {
  month: MonthKey;
}

export function monthlyPL(data: PortfolioData, months: MonthKey[]): MonthlyPL[] {
  const split = splitByProperty(data);
  return months.map((month) => ({ month, ...portfolioPL(data, monthRange(month), split) }));
}
