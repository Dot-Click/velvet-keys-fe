import { addDays, differenceInHours, getISOWeek, startOfISOWeek, startOfYear } from "date-fns";
import type {
  CalendarBlock,
  CalendarUnit,
  CalendarView,
  CategoryTrend,
  DayAgenda,
  DayTask,
  ExpensesOverview,
  LedgerWeek,
  MaintenanceBoard,
  StrUnitSummary,
  UnitBoardItem,
  UtilityBill,
  WorkerBalance,
} from "@/types/analytics";
import type { DataScope } from "@/types/common";
import type { Expense, MaintenanceTicket } from "@/types/operations";
import { today } from "@/lib/clock";
import { lastMonths, parseDay, round1, toISODate, toMonthKey } from "@/lib/dates";
import { calcAdr, percentChange, unitTypeOn } from "@/lib/finance";
import { toTicketView } from "./analytics-service";
import { withLatency } from "./mock-latency";
import { scopedProperties, scopedUnits } from "./scope";
import { db, findOrThrow, snapshot, withWrite } from "./store";

const CHECK_OUT_TIMES = ["10:00", "10:30", "11:00", "11:30", "12:00"];
const CHECK_IN_TIMES = ["15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
const REPAIR_TIMES = ["08:30", "12:00", "13:30", "16:30"];

function at<T>(items: T[], index: number): T {
  return items[Math.min(index, items.length - 1)] as T;
}

function addMinutes(time: string, minutes: number) {
  const [hours = 0, mins = 0] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function strUnitSummaries(scope: DataScope): StrUnitSummary[] {
  const now = today();
  const properties = scopedProperties(scope);
  return scopedUnits(scope)
    .filter((unit) => unitTypeOn(unit, now) === "STR")
    .map((unit) => {
      const bookings = db.bookings.filter((booking) => booking.unitId === unit.id);
      const recent = calcAdr(bookings, { from: addDays(now, -90), to: addDays(now, 1) });
      const adr = recent || calcAdr(bookings, { from: addDays(now, -365), to: addDays(now, 120) });
      return {
        unit: snapshot(unit),
        property: snapshot(properties.find((property) => property.id === unit.propertyId)!),
        adr,
      };
    });
}

function isBlockedOn(ticket: MaintenanceTicket, day: string) {
  return Boolean(
    ticket.blockedFrom &&
    ticket.blockedUntil &&
    ticket.blockedFrom <= day &&
    ticket.blockedUntil > day,
  );
}

/** Open repairs worth scheduling today: in-hand work, critical reports and anything fixed today. */
function repairsForToday(tickets: MaintenanceTicket[], day: string) {
  return tickets.filter(
    (ticket) =>
      (ticket.status !== "resolved" &&
        (ticket.status !== "reported" || ticket.urgency === "critical")) ||
      (ticket.resolvedAt &&
        toISODate(new Date(ticket.resolvedAt)) === day &&
        db.completedTasks.has(`repair:${ticket.id}`)),
  );
}

function categoryTrend(expenses: Expense[], category: Expense["category"]): CategoryTrend {
  const months = lastMonths(6, today()).map((month) => ({
    month,
    amount: expenses
      .filter((expense) => expense.category === category && expense.date.startsWith(month))
      .reduce((sum, expense) => sum + expense.amountMAD, 0),
  }));
  const currentMonth = months[months.length - 1]?.amount ?? 0;
  const previousMonth = months[months.length - 2]?.amount ?? 0;
  return { currentMonth, previousMonth, delta: percentChange(currentMonth, previousMonth), months };
}

export const operationsService = {
  /** Arrivals, departures, turnovers and repairs for a day, with the unit status board. */
  getDayAgenda(scope: DataScope, date: string = toISODate(today())): Promise<DayAgenda> {
    return withLatency(() => {
      const units = scopedUnits(scope);
      const unitIds = new Set(units.map((unit) => unit.id));
      const properties = scopedProperties(scope);
      const names = (unitId: string) => {
        const unit = units.find((item) => item.id === unitId);
        const property = properties.find((item) => item.id === unit?.propertyId);
        return { unitId, unitName: unit?.name ?? "", propertyName: property?.name ?? "" };
      };
      const bookings = db.bookings.filter((booking) => unitIds.has(booking.unitId));
      const tickets = db.tickets.filter((ticket) => unitIds.has(ticket.unitId));
      const byProperty = <T extends { unitId: string }>(items: T[]) =>
        [...items].sort((a, b) =>
          names(a.unitId).propertyName.localeCompare(names(b.unitId).propertyName),
        );

      const tasks: DayTask[] = [];
      byProperty(bookings.filter((booking) => booking.checkOut === date)).forEach(
        (booking, index) => {
          const time = at(CHECK_OUT_TIMES, index);
          const checkOutId = `check_out:${booking.id}`;
          const turnoverId = `housekeeping:${booking.id}`;
          tasks.push({
            id: checkOutId,
            kind: "check_out",
            time,
            subject: booking.guestName,
            ...(booking.guests ? { guests: booking.guests } : {}),
            ...(booking.notes ? { notes: booking.notes } : {}),
            done: db.completedTasks.has(checkOutId),
            ...names(booking.unitId),
          });
          tasks.push({
            id: turnoverId,
            kind: "housekeeping",
            time: addMinutes(time, 90),
            done: db.completedTasks.has(turnoverId),
            ...names(booking.unitId),
          });
        },
      );
      byProperty(bookings.filter((booking) => booking.checkIn === date)).forEach(
        (booking, index) => {
          const id = `check_in:${booking.id}`;
          tasks.push({
            id,
            kind: "check_in",
            time: at(CHECK_IN_TIMES, index),
            subject: booking.guestName,
            ...(booking.guests ? { guests: booking.guests } : {}),
            ...(booking.notes ? { notes: booking.notes } : {}),
            done: db.completedTasks.has(id),
            ...names(booking.unitId),
          });
        },
      );
      repairsForToday(tickets, date).forEach((ticket, index) => {
        const id = `repair:${ticket.id}`;
        const worker = ticket.workerId
          ? db.workers.find((item) => item.id === ticket.workerId)
          : undefined;
        tasks.push({
          id,
          kind: "repair",
          time: at(REPAIR_TIMES, index),
          subject: ticket.title,
          notes: ticket.description,
          done: ticket.status === "resolved",
          ...(worker ? { worker: snapshot(worker) } : {}),
          ...names(ticket.unitId),
        });
      });
      tasks.sort((a, b) => a.time.localeCompare(b.time));

      const day = parseDay(date);
      const board: UnitBoardItem[] = units
        .filter((unit) => unitTypeOn(unit, day) === "STR")
        .map((unit) => {
          const base = names(unit.id);
          if (tickets.some((ticket) => ticket.unitId === unit.id && isBlockedOn(ticket, date))) {
            return { ...base, status: "blocked" };
          }
          const staying = bookings.find(
            (b) => b.unitId === unit.id && b.checkIn <= date && b.checkOut > date,
          );
          if (staying) return { ...base, status: "occupied", guestName: staying.guestName };
          const departed = bookings.find((b) => b.unitId === unit.id && b.checkOut === date);
          if (departed && !db.completedTasks.has(`housekeeping:${departed.id}`)) {
            return { ...base, status: "vacant_dirty" };
          }
          return { ...base, status: "vacant_clean" };
        });

      const urgent = tickets
        .filter((ticket) => ticket.urgency === "critical" && ticket.status !== "resolved")
        .map((ticket) => toTicketView(ticket.id));

      return {
        date,
        tasks,
        units: board,
        urgent,
        summary: {
          arrivals: tasks.filter((task) => task.kind === "check_in").length,
          departures: tasks.filter((task) => task.kind === "check_out").length,
          criticalRepairs: urgent.length,
        },
      };
    });
  },

  /** Marks an agenda task done or not; repairs also resolve (or reopen) their ticket. */
  setTaskDone(taskId: string, done: boolean): Promise<void> {
    return withWrite(() => {
      const [kind, id = ""] = taskId.split(":");
      if (kind === "repair") {
        const ticket = findOrThrow(db.tickets, id);
        if (done && ticket.status !== "resolved") {
          db.completedTasks.set(taskId, ticket.status);
          ticket.status = "resolved";
          ticket.resolvedAt = new Date().toISOString();
        } else if (!done) {
          const previous = db.completedTasks.get(taskId);
          if (previous) ticket.status = previous;
          delete ticket.resolvedAt;
          db.completedTasks.delete(taskId);
        }
        return;
      }
      if (done) db.completedTasks.set(taskId, null);
      else db.completedTasks.delete(taskId);
    });
  },

  /** Every unit in scope with its property, for pickers. */
  listUnitOptions(
    scope: DataScope,
  ): Promise<{ unitId: string; unitName: string; propertyName: string; image: string }[]> {
    return withLatency(() => {
      const properties = scopedProperties(scope);
      return scopedUnits(scope).map((unit) => {
        const property = properties.find((item) => item.id === unit.propertyId);
        return {
          unitId: unit.id,
          unitName: unit.name,
          propertyName: property?.name ?? "",
          image: unit.image || property?.image || "",
        };
      });
    });
  },

  /** STR units in scope with the nightly rate used to quote direct bookings. */
  listStrUnits(scope: DataScope): Promise<StrUnitSummary[]> {
    return withLatency(() => strUnitSummaries(scope));
  },

  /**
   * Stays, turnovers, maintenance blocks and leases per unit for a range of days (inclusive).
   * Units are listed with the type they run as today.
   */
  getCalendar(scope: DataScope, input: { from: string; to: string }): Promise<CalendarView> {
    return withLatency(() => {
      const now = today();
      const day = toISODate(now);
      const adrByUnit = new Map(strUnitSummaries(scope).map((row) => [row.unit.id, row.adr]));
      const properties = scopedProperties(scope);
      const units: CalendarUnit[] = [];
      for (const unit of scopedUnits(scope)) {
        const type = unitTypeOn(unit, now);
        if (!type) continue;
        const property = properties.find((item) => item.id === unit.propertyId)!;
        const lease = db.leases.find(
          (item) =>
            item.unitId === unit.id &&
            item.status !== "ended" &&
            item.startDate <= day &&
            item.endDate > day,
        );
        units.push({
          unit: snapshot(unit),
          property: snapshot(property),
          type,
          ...(type === "STR" ? { adr: adrByUnit.get(unit.id) ?? 0 } : {}),
          ...(type === "LTR" && lease ? { monthlyRentMAD: lease.monthlyRentMAD } : {}),
        });
      }
      const unitIds = new Set(units.map((row) => row.unit.id));
      const blocks: CalendarBlock[] = [];
      const lastNight = (checkOut: string) => toISODate(addDays(parseDay(checkOut), -1));

      for (const booking of db.bookings) {
        if (
          !unitIds.has(booking.unitId) ||
          booking.checkOut <= input.from ||
          booking.checkIn > input.to
        )
          continue;
        blocks.push({
          id: booking.id,
          unitId: booking.unitId,
          kind: booking.source,
          start: booking.checkIn,
          end: lastNight(booking.checkOut),
          title: booking.guestName,
          amountMAD: booking.amountMAD,
          booking: snapshot(booking),
          ...(booking.notes ? { notes: booking.notes } : {}),
        });
      }
      for (const booking of db.bookings) {
        if (
          !unitIds.has(booking.unitId) ||
          booking.checkOut < input.from ||
          booking.checkOut > input.to
        )
          continue;
        blocks.push({
          id: `turnover-${booking.id}`,
          unitId: booking.unitId,
          kind: "housekeeping",
          start: booking.checkOut,
          end: booking.checkOut,
        });
      }
      for (const lease of db.leases) {
        if (!unitIds.has(lease.unitId) || lease.endDate <= input.from || lease.startDate > input.to)
          continue;
        const tenant = db.tenants.find((item) => item.id === lease.tenantId);
        blocks.push({
          id: lease.id,
          unitId: lease.unitId,
          kind: "lease",
          start: lease.startDate,
          end: lastNight(lease.endDate),
          title: tenant?.name ?? "",
          amountMAD: lease.monthlyRentMAD,
          leaseId: lease.id,
        });
      }
      for (const ticket of db.tickets) {
        if (!unitIds.has(ticket.unitId) || !ticket.blockedFrom || !ticket.blockedUntil) continue;
        if (ticket.blockedUntil <= input.from || ticket.blockedFrom > input.to) continue;
        blocks.push({
          id: ticket.id,
          unitId: ticket.unitId,
          kind: "maintenance",
          start: ticket.blockedFrom,
          end: lastNight(ticket.blockedUntil),
          title: ticket.title,
          notes: ticket.description,
        });
      }
      return { units, blocks };
    });
  },

  getMaintenanceBoard(scope: DataScope): Promise<MaintenanceBoard> {
    return withLatency(() => {
      const unitIds = new Set(scopedUnits(scope).map((unit) => unit.id));
      const now = today();
      const recentCutoff = addDays(now, -30).toISOString();
      const tickets = db.tickets.filter((ticket) => unitIds.has(ticket.unitId));
      const visible = tickets
        .filter(
          (ticket) => ticket.status !== "resolved" || (ticket.resolvedAt ?? "") >= recentCutoff,
        )
        .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
      const resolvedRecently = tickets.filter(
        (ticket) => ticket.resolvedAt && parseDay(ticket.resolvedAt) >= addDays(now, -90),
      );
      const month = toMonthKey(now);
      const reportedThisMonth = tickets.filter(
        (ticket) => toMonthKey(new Date(ticket.reportedAt)) === month,
      );
      return {
        tickets: visible.map((ticket) => toTicketView(ticket.id)),
        stats: {
          open: tickets.filter((ticket) => ticket.status !== "resolved").length,
          critical: tickets.filter(
            (ticket) => ticket.urgency === "critical" && ticket.status !== "resolved",
          ).length,
          avgResolutionHours:
            resolvedRecently.length === 0
              ? null
              : round1(
                  resolvedRecently.reduce(
                    (sum, ticket) =>
                      sum +
                      differenceInHours(
                        new Date(ticket.resolvedAt as string),
                        new Date(ticket.reportedAt),
                      ),
                    0,
                  ) / resolvedRecently.length,
                ),
          monthSpend: reportedThisMonth.reduce((sum, ticket) => sum + ticket.costMAD, 0),
        },
      };
    });
  },

  getExpensesOverview(scope: DataScope): Promise<ExpensesOverview> {
    return withLatency(() => {
      const now = today();
      const day = toISODate(now);
      const properties = scopedProperties(scope);
      const propertyIds = new Set(properties.map((property) => property.id));
      const propertyName = (id?: string) =>
        properties.find((property) => property.id === id)?.name ?? "";
      const expenses = db.expenses.filter(
        (expense) =>
          expense.accountId === scope.accountId &&
          (expense.propertyId ? propertyIds.has(expense.propertyId) : !scope.ownerId),
      );
      const yearStart = toISODate(startOfYear(now));

      const workers: WorkerBalance[] = db.workers
        .filter((worker) => worker.accountId === scope.accountId)
        .map((worker) => {
          const pay = expenses.filter(
            (expense) => expense.workerId === worker.id && expense.category === "workerPay",
          );
          const paid = pay.filter((expense) => expense.status === "paid");
          const lastPaidAt = paid
            .map((expense) => expense.paidAt ?? expense.date)
            .sort()
            .pop();
          return {
            worker: snapshot(worker),
            owedMAD: pay
              .filter((expense) => expense.status === "pending")
              .reduce((sum, e) => sum + e.amountMAD, 0),
            paidYtdMAD: paid
              .filter((expense) => (expense.paidAt ?? expense.date) >= yearStart)
              .reduce((sum, e) => sum + e.amountMAD, 0),
            ...(lastPaidAt ? { lastPaidAt } : {}),
          };
        });

      // Every unpaid bill, plus the latest settled bill for meters with nothing outstanding
      const utilities = expenses.filter((expense) => expense.category === "utility");
      const keyOf = (expense: Expense) => `${expense.propertyId}:${expense.utilityType}`;
      const outstanding = utilities.filter((expense) => expense.status === "pending");
      const outstandingKeys = new Set(outstanding.map(keyOf));
      const latestPaid = new Map<string, Expense>();
      for (const expense of utilities) {
        if (expense.status !== "paid" || outstandingKeys.has(keyOf(expense))) continue;
        const current = latestPaid.get(keyOf(expense));
        if (!current || expense.date > current.date) latestPaid.set(keyOf(expense), expense);
      }
      const shownBills = [...outstanding, ...latestPaid.values()];
      const rank = (bill: UtilityBill) =>
        bill.isOverdue ? 0 : bill.expense.status === "pending" ? 1 : 2;
      const utilityBills: UtilityBill[] = shownBills
        .map((expense) => ({
          expense: snapshot(expense),
          propertyName: propertyName(expense.propertyId),
          isOverdue:
            expense.status === "pending" && Boolean(expense.dueDate && expense.dueDate < day),
        }))
        .sort(
          (a, b) =>
            rank(a) - rank(b) || (a.expense.dueDate ?? "").localeCompare(b.expense.dueDate ?? ""),
        );

      const ledgerFrom = toISODate(startOfISOWeek(addDays(now, -21)));
      const weeks = new Map<string, LedgerWeek>();
      for (const expense of expenses) {
        const paidOn = expense.paidAt;
        if (expense.status !== "paid" || !paidOn || paidOn < ledgerFrom || paidOn > day) continue;
        const weekStart = startOfISOWeek(parseDay(paidOn));
        const key = toISODate(weekStart);
        const week = weeks.get(key) ?? {
          weekStart: key,
          weekEnd: toISODate(addDays(weekStart, 6)),
          isoWeek: getISOWeek(weekStart),
          total: 0,
          entries: [],
        };
        week.entries.push({ ...snapshot(expense), propertyName: propertyName(expense.propertyId) });
        week.total += expense.amountMAD;
        weeks.set(key, week);
      }
      const ledger = [...weeks.values()]
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
        .map((week) => ({
          ...week,
          entries: week.entries.sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? "")),
        }));

      return {
        trends: {
          workerPay: categoryTrend(expenses, "workerPay"),
          utility: categoryTrend(expenses, "utility"),
          other: categoryTrend(expenses, "other"),
        },
        workers,
        utilityBills,
        ledger,
      };
    });
  },
};
