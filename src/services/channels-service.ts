import { addDays } from "date-fns";
import type { DataScope } from "@/types/common";
import type { ChannelPlatform, ChannelUnitRow, ExternalListing } from "@/types/channel";
import type { ChannelConnection, Unit } from "@/types/property";
import { computeFreeSyncUntil, openFreeSyncUntil } from "@/lib/billing";
import { today } from "@/lib/clock";
import { parseDay, toISODate } from "@/lib/dates";
import { unitTypeOn } from "@/lib/finance";
import { mockPlatformListings } from "@/mocks/channel-listings";
import { withLatency } from "./mock-latency";
import { scopedProperties, scopedUnits } from "./scope";
import { ServiceError, db, findOrThrow, patchItem, snapshot, withWrite } from "./store";

export const CHANNEL_PLATFORMS: readonly ChannelPlatform[] = ["airbnb", "bookingCom"];

/** True while at least one platform feeds the unit (the unit is billed for sync). */
export function isSyncing(connection: ChannelConnection | undefined) {
  return Boolean(
    connection &&
    !connection.disconnectedAt &&
    CHANNEL_PLATFORMS.some((platform) => connection[platform].status === "connected"),
  );
}

/** Units that are STR today, with their property. */
function strUnits(scope: DataScope) {
  const day = today();
  const properties = scopedProperties(scope);
  return scopedUnits(scope)
    .filter((unit) => unitTypeOn(unit, day) === "STR")
    .map((unit) => ({
      unit,
      property: properties.find((property) => property.id === unit.propertyId)!,
    }));
}

/** First day of a scheduled switch to LTR, if any. */
function ltrSwitchDay(unit: Unit) {
  const day = toISODate(today());
  return unit.typeHistory.find((period) => period.type === "LTR" && period.from > day)?.from;
}

function assertConnectable(scope: DataScope, unit: Unit) {
  if (!strUnits(scope).some((row) => row.unit.id === unit.id)) {
    throw new ServiceError("not_found", unit.id);
  }
  if (ltrSwitchDay(unit)) throw new ServiceError("invalid_input");
}

/** A unit that starts syncing takes a free sync slot while its account's free period runs. */
function claimFreeSync(accountId: string) {
  const account = db.accounts.find((item) => item.id === accountId);
  if (!account || !openFreeSyncUntil(account, db.settings.freeSyncSlots, today())) return;
  if (db.settings.freeSyncSlots.used >= db.settings.freeSyncSlots.total) return;
  db.settings.freeSyncSlots.used += 1;
  if (!account.freeSyncUntil) account.freeSyncUntil = computeFreeSyncUntil(account.signupDate);
}

export const channelsService = {
  /** Every STR unit in scope with its Airbnb / Booking.com links. */
  list(scope: DataScope): Promise<ChannelUnitRow[]> {
    return withLatency(() => {
      const account = db.accounts.find((item) => item.id === scope.accountId);
      const freeUntil = account
        ? openFreeSyncUntil(account, db.settings.freeSyncSlots, today())
        : null;
      const freeSyncLastDay = freeUntil ? toISODate(addDays(parseDay(freeUntil), -1)) : null;
      return strUnits(scope)
        .map(({ unit, property }) => {
          const switchesToLtrOn = ltrSwitchDay(unit);
          return {
            unit: snapshot(unit),
            property: snapshot(property),
            ...(freeSyncLastDay ? { freeSyncLastDay } : {}),
            ...(switchesToLtrOn ? { switchesToLtrOn } : {}),
          };
        })
        .sort(
          (a, b) =>
            a.property.name.localeCompare(b.property.name) ||
            a.unit.name.localeCompare(b.unit.name),
        );
    });
  },

  /**
   * Stands in for the platform's sign-in and consent screen. Resolves with the name of the
   * platform account that approved access; the password never passes through Velvet Keys.
   */
  authorize(scope: DataScope, platform: ChannelPlatform): Promise<{ accountName: string }> {
    return withLatency(() => {
      const account = db.accounts.find((item) => item.id === scope.accountId);
      if (!account || !CHANNEL_PLATFORMS.includes(platform)) throw new ServiceError("not_found");
      return { accountName: account.name };
    }, 1200);
  },

  /** Listings on the platform account the manager signed in with, and what each one feeds. */
  listListings(scope: DataScope, platform: ChannelPlatform): Promise<ExternalListing[]> {
    return withLatency(() => {
      const units = strUnits(scope);
      const mappedTo = new Map<string, { unit: Unit; propertyName: string }>();
      for (const { unit, property } of units) {
        const link = unit.channelConnection?.[platform];
        if (
          link?.listingName &&
          link.status !== "disconnected" &&
          !unit.channelConnection?.disconnectedAt
        ) {
          mappedTo.set(link.listingName, { unit, propertyName: property.name });
        }
      }
      return mockPlatformListings(platform, units)
        .map((listing) => {
          const mapped = mappedTo.get(listing.name);
          return mapped
            ? {
                ...listing,
                mappedUnitId: mapped.unit.id,
                mappedUnitLabel: `${mapped.propertyName} · ${mapped.unit.name}`,
              }
            : listing;
        })
        .sort((a, b) => Number(Boolean(a.mappedUnitId)) - Number(Boolean(b.mappedUnitId)));
    }, 700);
  },

  /** Maps a platform listing to the unit; bookings and availability sync from now on. */
  connect(
    scope: DataScope,
    input: { unitId: string; platform: ChannelPlatform; listingName: string },
  ): Promise<Unit> {
    return withWrite(() => {
      const unit = findOrThrow(db.units, input.unitId);
      assertConnectable(scope, unit);
      const taken = strUnits(scope).some(
        ({ unit: other }) =>
          other.id !== unit.id &&
          other.channelConnection?.[input.platform].listingName === input.listingName &&
          other.channelConnection[input.platform].status !== "disconnected",
      );
      if (taken) throw new ServiceError("invalid_input");

      const current = unit.channelConnection;
      const live = current && !current.disconnectedAt ? current : undefined;
      // A unit that was not syncing starts a new sync billing window today
      const base: ChannelConnection =
        live && isSyncing(live)
          ? live
          : {
              unitId: unit.id,
              airbnb: live?.airbnb ?? { status: "disconnected" },
              bookingCom: live?.bookingCom ?? { status: "disconnected" },
              connectedSince: toISODate(today()),
            };
      if (!current) claimFreeSync(scope.accountId);
      return snapshot(
        patchItem(db.units, unit.id, {
          channelConnection: {
            ...base,
            [input.platform]: { status: "connected", listingName: input.listingName },
            lastSyncAt: new Date().toISOString(),
          },
        }),
      );
    });
  },

  /** Signs in to the platform again after a sync error; the mapped listing is kept. */
  reconnect(scope: DataScope, input: { unitId: string; platform: ChannelPlatform }): Promise<Unit> {
    return withWrite(() => {
      const unit = findOrThrow(db.units, input.unitId);
      assertConnectable(scope, unit);
      const connection = unit.channelConnection;
      if (!connection || connection[input.platform].status !== "error") {
        throw new ServiceError("invalid_input");
      }
      return snapshot(
        patchItem(db.units, unit.id, {
          channelConnection: {
            ...connection,
            [input.platform]: { ...connection[input.platform], status: "connected" },
            lastSyncAt: new Date().toISOString(),
          },
        }),
      );
    });
  },
};
