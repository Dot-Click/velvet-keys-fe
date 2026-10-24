import type { Account, IssuerProfile } from "@/types/account";
import { isIssuerProfileComplete } from "@/lib/issuer";
import type { PlatformSettings } from "@/types/billing";
import type { User } from "@/types/user";
import { withLatency } from "./mock-latency";
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

export const accountsService = {
  list(): Promise<Account[]> {
    return withLatency(() => snapshot(db.accounts));
  },

  get(id: string): Promise<Account> {
    return withLatency(() => snapshot(findOrThrow(db.accounts, id)));
  },

  create(input: Omit<Account, "id">): Promise<Account> {
    return withWrite(() => {
      const account: Account = { ...input, id: newId("acct") };
      db.accounts.push(account);
      return snapshot(account);
    });
  },

  update(id: string, patch: Partial<Omit<Account, "id">>): Promise<Account> {
    return withWrite(() => snapshot(patchItem(db.accounts, id, patch)));
  },

  /**
   * Saves the name and bank details printed on rent invoices. Applies to invoices issued from
   * now on; issued invoices keep the copy they were issued with.
   */
  updateIssuerProfile(id: string, profile: IssuerProfile): Promise<Account> {
    return withWrite(() => {
      const issuerProfile: IssuerProfile = {
        name: profile.name.trim(),
        address: profile.address.trim(),
        rib: profile.rib.trim(),
        ...(profile.ice?.trim() ? { ice: profile.ice.trim() } : {}),
      };
      if (!isIssuerProfileComplete(issuerProfile)) throw new ServiceError("invalid_input");
      return snapshot(patchItem(db.accounts, id, { issuerProfile }));
    });
  },
};

export const usersService = {
  list(filter: { accountId?: string } = {}): Promise<User[]> {
    return withLatency(() =>
      snapshot(db.users.filter((user) => !filter.accountId || user.accountId === filter.accountId)),
    );
  },

  get(id: string): Promise<User> {
    return withLatency(() => snapshot(findOrThrow(db.users, id)));
  },

  create(input: Omit<User, "id">): Promise<User> {
    return withWrite(() => {
      const user: User = { ...input, id: newId("user") };
      db.users.push(user);
      return snapshot(user);
    });
  },

  update(id: string, patch: Partial<Omit<User, "id">>): Promise<User> {
    return withWrite(() => snapshot(patchItem(db.users, id, patch)));
  },

  remove(id: string): Promise<void> {
    return withWrite(() => removeItem(db.users, id));
  },
};

export const settingsService = {
  get(): Promise<PlatformSettings> {
    return withLatency(() => snapshot(db.settings));
  },

  update(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
    return withWrite(() => {
      db.settings = { ...db.settings, ...patch };
      return snapshot(db.settings);
    });
  },
};
