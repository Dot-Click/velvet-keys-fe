import type { ChannelPlatform, ExternalListing } from "@/types/channel";
import type { Property, Unit } from "@/types/property";
import { seedFrom } from "./seed";

const ID_PREFIX: Record<ChannelPlatform, string> = { airbnb: "ABNB", bookingCom: "BDC" };

function listing(
  platform: ChannelPlatform,
  name: string,
  property: Property,
  unit: Unit,
): ExternalListing {
  return {
    id: `${ID_PREFIX[platform]}-${100000 + (seedFrom(`${platform}:${name}`) % 900000)}`,
    platform,
    name,
    city: property.city,
    bedrooms: unit.bedrooms,
  };
}

/**
 * Listings on the manager's Airbnb or Booking.com account: one per STR unit, plus the listings
 * units already sync with. A real connection returns these from the platform after sign-in.
 */
export function mockPlatformListings(
  platform: ChannelPlatform,
  units: { unit: Unit; property: Property }[],
): ExternalListing[] {
  const byName = new Map<string, ExternalListing>();
  for (const { unit, property } of units) {
    const synced = unit.channelConnection?.[platform].listingName;
    if (synced && !byName.has(synced))
      byName.set(synced, listing(platform, synced, property, unit));
    const name = `${property.name} ${unit.name}`;
    if (!byName.has(name)) byName.set(name, listing(platform, name, property, unit));
  }
  return [...byName.values()];
}
