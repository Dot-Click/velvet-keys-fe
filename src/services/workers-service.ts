import type { Worker } from "@/types/operations";
import { withLatency } from "./mock-latency";
import { db, findOrThrow, newId, patchItem, removeItem, snapshot, withWrite } from "./store";

export const workersService = {
  list(accountId: string): Promise<Worker[]> {
    return withLatency(() =>
      snapshot(db.workers.filter((worker) => worker.accountId === accountId)),
    );
  },

  get(id: string): Promise<Worker> {
    return withLatency(() => snapshot(findOrThrow(db.workers, id)));
  },

  create(input: Omit<Worker, "id">): Promise<Worker> {
    return withWrite(() => {
      const worker: Worker = { ...input, id: newId("worker") };
      db.workers.push(worker);
      return snapshot(worker);
    });
  },

  update(id: string, patch: Partial<Omit<Worker, "id">>): Promise<Worker> {
    return withWrite(() => snapshot(patchItem(db.workers, id, patch)));
  },

  remove(id: string): Promise<void> {
    return withWrite(() => removeItem(db.workers, id));
  },
};
