import type { DataScope } from "@/types/common";
import type { Expense, ExpenseCategory, ExpenseStatus } from "@/types/operations";
import { today } from "@/lib/clock";
import { toISODate } from "@/lib/dates";
import { withLatency } from "./mock-latency";
import { scopedPropertyIds } from "./scope";
import { db, findOrThrow, newId, patchItem, removeItem, snapshot, withWrite } from "./store";

export interface ExpenseFilter {
  category?: ExpenseCategory;
  status?: ExpenseStatus;
  workerId?: string;
  /** Inclusive ISO date */
  from?: string;
  /** Exclusive ISO date */
  to?: string;
}

/** Expenses of the account; an Owner's scope only sees costs of their own properties. */
function scopedExpenses(scope: DataScope) {
  const propertyIds = scopedPropertyIds(scope);
  return db.expenses.filter(
    (expense) =>
      expense.accountId === scope.accountId &&
      (expense.propertyId ? propertyIds.has(expense.propertyId) : !scope.ownerId),
  );
}

export const expensesService = {
  list(scope: DataScope, filter: ExpenseFilter = {}): Promise<Expense[]> {
    return withLatency(() =>
      snapshot(
        scopedExpenses(scope).filter(
          (expense) =>
            (!filter.category || expense.category === filter.category) &&
            (!filter.status || expense.status === filter.status) &&
            (!filter.workerId || expense.workerId === filter.workerId) &&
            (!filter.from || expense.date >= filter.from) &&
            (!filter.to || expense.date < filter.to),
        ),
      ),
    );
  },

  get(id: string): Promise<Expense> {
    return withLatency(() => snapshot(findOrThrow(db.expenses, id)));
  },

  create(input: Omit<Expense, "id">): Promise<Expense> {
    return withWrite(() => {
      const expense: Expense = { ...input, id: newId("exp") };
      db.expenses.push(expense);
      return snapshot(expense);
    });
  },

  update(id: string, patch: Partial<Omit<Expense, "id">>): Promise<Expense> {
    return withWrite(() => snapshot(patchItem(db.expenses, id, patch)));
  },

  markPaid(ids: string[]): Promise<Expense[]> {
    return withWrite(() => {
      const paidAt = toISODate(today());
      return snapshot(ids.map((id) => patchItem(db.expenses, id, { status: "paid", paidAt })));
    });
  },

  /** Settles everything still owed to a worker. */
  payWorker(scope: DataScope, workerId: string): Promise<Expense[]> {
    const owed = scopedExpenses(scope).filter(
      (expense) => expense.workerId === workerId && expense.status === "pending",
    );
    return expensesService.markPaid(owed.map((expense) => expense.id));
  },

  remove(id: string): Promise<void> {
    return withWrite(() => removeItem(db.expenses, id));
  },
};
