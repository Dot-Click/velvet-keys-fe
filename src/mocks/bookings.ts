import { addDays, differenceInCalendarDays } from "date-fns";
import type { Booking, BookingSource } from "@/types/booking";
import { parseDay, toISODate } from "@/lib/dates";
import { MOCK_TICKETS } from "./operations";
import { MOCK_PROPERTIES, MOCK_UNITS, UNIT_BASE_RATES } from "./properties";
import { MOCK_TODAY, createRandom, daysFromToday, seedFrom } from "./seed";

const HISTORY_DAYS = 365;
const FUTURE_DAYS = 120;

const GUESTS: readonly { name: string; phone: string }[] = [
  { name: "Sophia Laurent", phone: "+33 6 12 34 56 78" },
  { name: "Daniel Wong", phone: "+852 9123 4567" },
  { name: "Elena Chernova", phone: "+41 22 819 4000" },
  { name: "Lukas Becker", phone: "+49 151 2345 6789" },
  { name: "Isabella Rossi", phone: "+39 333 456 7890" },
  { name: "James Whitfield", phone: "+44 7700 900123" },
  { name: "Amira Haddad", phone: "+971 50 123 4567" },
  { name: "Chloé Martin", phone: "+33 6 98 76 54 32" },
  { name: "Henrik Larsen", phone: "+45 20 12 34 56" },
  { name: "Maya Cohen", phone: "+1 212 555 0148" },
  { name: "Mateo García", phone: "+34 612 345 678" },
  { name: "Yuki Tanaka", phone: "+81 90 1234 5678" },
  { name: "Aisha Rahman", phone: "+44 7700 900456" },
  { name: "Thomas Moreau", phone: "+32 470 12 34 56" },
  { name: "Grace O'Connor", phone: "+353 85 123 4567" },
  { name: "Nina Petrova", phone: "+359 88 123 4567" },
  { name: "Mehdi Berrada", phone: "+212 6 61 23 45 67" },
  { name: "Kenza Alaoui", phone: "+212 6 62 98 11 04" },
  { name: "Amine Chraibi", phone: "+212 6 70 44 82 19" },
  { name: "Laila Fassi", phone: "+212 6 63 12 90 55" },
  { name: "Driss Bennani", phone: "+212 6 68 37 14 02" },
  { name: "Imane Sqalli", phone: "+212 6 65 21 70 38" },
  { name: "Hamza Lahlou", phone: "+212 6 61 88 03 47" },
  { name: "Rania Kettani", phone: "+212 6 64 55 29 81" },
];

function emailFor(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `${slug}@example.com`;
}

/** Demand by month (0 = January) for Marrakech vs the coastal cities. */
const SEASON: Record<"inland" | "coast", number[]> = {
  inland: [0.95, 1.0, 1.15, 1.2, 1.1, 0.9, 0.8, 0.85, 1.0, 1.15, 1.1, 1.2],
  coast: [0.8, 0.85, 0.95, 1.0, 1.05, 1.15, 1.25, 1.3, 1.1, 0.95, 0.85, 0.95],
};

type AnchorSeed = {
  unitId: string;
  from: number;
  to: number;
  guest: string;
  source: BookingSource;
  guests: number;
  notes?: string;
  paymentStatus?: Booking["paymentStatus"];
};

/** Stays around today so the Today and Calendar screens always have something to show. */
const ANCHORS: AnchorSeed[] = [
  {
    unitId: "unit-aurora-ph4a",
    from: -3,
    to: 0,
    guest: "Jean-Paul Laurent",
    source: "airbnb",
    guests: 2,
    notes: "Luggage escort to Marrakech Menara airport, private car booked.",
  },
  {
    unitId: "unit-aurora-ph4a",
    from: 0,
    to: 4,
    guest: "Marc & Hélène Dubois",
    source: "direct",
    guests: 2,
    notes: "Late afternoon welcome tea in the courtyard. Champagne pre-chilled.",
  },
  {
    unitId: "unit-zitouna-estate",
    from: 0,
    to: 7,
    guest: "Sheikh Hamad Al-Thani",
    source: "direct",
    guests: 5,
    notes: "Fruit platter, chilled almond milk and dates; private chef on standby.",
  },
  {
    unitId: "unit-marina-r12",
    from: -4,
    to: 0,
    guest: "Daniel Wong",
    source: "booking",
    guests: 2,
    notes: "Late checkout agreed until 12:00.",
  },
  {
    unitId: "unit-marina-r12",
    from: 1,
    to: 5,
    guest: "Sophia Laurent",
    source: "airbnb",
    guests: 2,
  },
  {
    unitId: "unit-skyline-ph21",
    from: -2,
    to: 2,
    guest: "Sophia Vance",
    source: "airbnb",
    guests: 1,
    notes: "Keycard check-in at the tower reception.",
  },
  {
    unitId: "unit-garden-s8",
    from: -1,
    to: 3,
    guest: "Alexander Vogel",
    source: "direct",
    guests: 2,
    notes: "Corporate rate, invoice to his company.",
    paymentStatus: "partial",
  },
  {
    unitId: "unit-skyline-18",
    from: 0,
    to: 3,
    guest: "Kenji Takahashi",
    source: "direct",
    guests: 1,
    notes: "Digital key sent to the guest's phone.",
    paymentStatus: "unpaid",
  },
  {
    unitId: "unit-oudaya-andalous",
    from: -2,
    to: 0,
    guest: "Inès Moreau",
    source: "direct",
    guests: 2,
  },
  {
    unitId: "unit-palmeraie-villa",
    from: 0,
    to: 5,
    guest: "The Haddad family",
    source: "airbnb",
    guests: 6,
    notes: "Pool heating on from noon.",
  },
  {
    unitId: "unit-benali-suite",
    from: -3,
    to: 0,
    guest: "Lukas Becker",
    source: "direct",
    guests: 2,
  },
];

function blockedNights(unitId: string): Set<string> {
  const nights = new Set<string>();
  for (const anchor of ANCHORS.filter((item) => item.unitId === unitId)) {
    for (let day = anchor.from; day < anchor.to; day += 1) nights.add(daysFromToday(day));
  }
  for (const ticket of MOCK_TICKETS.filter((item) => item.unitId === unitId)) {
    if (!ticket.blockedFrom || !ticket.blockedUntil) continue;
    let day = parseDay(ticket.blockedFrom);
    const end = parseDay(ticket.blockedUntil);
    while (day < end) {
      nights.add(toISODate(day));
      day = addDays(day, 1);
    }
  }
  return nights;
}

function priceStay(
  rate: number,
  checkIn: Date,
  nights: number,
  season: number[],
  jitter: number,
): number {
  let total = 0;
  for (let night = 0; night < nights; night += 1) {
    const day = addDays(checkIn, night);
    const weekend = day.getDay() === 5 || day.getDay() === 6 ? 1.12 : 1;
    total += rate * (season[day.getMonth()] ?? 1) * weekend;
  }
  return Math.round((total * jitter) / 50) * 50;
}

function statusesFor(
  source: BookingSource,
  checkIn: Date,
  checkOut: Date,
  random: ReturnType<typeof createRandom>,
): Pick<Booking, "depositStatus" | "paymentStatus"> {
  if (checkOut <= MOCK_TODAY) return { depositStatus: "returned", paymentStatus: "paid" };
  if (source !== "direct") return { depositStatus: "received", paymentStatus: "paid" };
  if (checkIn <= MOCK_TODAY) {
    return { depositStatus: "received", paymentStatus: random.chance(0.8) ? "paid" : "partial" };
  }
  const roll = random.next();
  if (roll < 0.55) return { depositStatus: "received", paymentStatus: "paid" };
  if (roll < 0.85) return { depositStatus: "received", paymentStatus: "partial" };
  return { depositStatus: "pending", paymentStatus: "unpaid" };
}

function generateBookings(): Booking[] {
  const drafts: Omit<Booking, "id">[] = [];
  const windowStart = addDays(MOCK_TODAY, -HISTORY_DAYS);
  const windowEnd = addDays(MOCK_TODAY, FUTURE_DAYS);

  for (const unit of MOCK_UNITS) {
    const rate = UNIT_BASE_RATES[unit.id];
    if (!rate) continue;
    const property = MOCK_PROPERTIES.find((item) => item.id === unit.propertyId);
    const season = SEASON[property?.city === "Marrakech" ? "inland" : "coast"];
    const random = createRandom(seedFrom(unit.id));
    const blocked = blockedNights(unit.id);
    const synced = Boolean(unit.channelConnection);
    const baseDemand = 0.62 + random.next() * 0.2;

    for (const anchor of ANCHORS.filter((item) => item.unitId === unit.id)) {
      const checkIn = addDays(MOCK_TODAY, anchor.from);
      const checkOut = addDays(MOCK_TODAY, anchor.to);
      const nights = anchor.to - anchor.from;
      const guest = GUESTS.find((item) => item.name === anchor.guest);
      const statuses = statusesFor(anchor.source, checkIn, checkOut, random);
      drafts.push({
        unitId: unit.id,
        source: anchor.source,
        synced: anchor.source !== "direct",
        guestName: anchor.guest,
        guestContact: {
          email: emailFor(anchor.guest),
          phone: guest?.phone ?? "+212 6 00 00 00 00",
        },
        guests: anchor.guests,
        checkIn: toISODate(checkIn),
        checkOut: toISODate(checkOut),
        amountMAD: priceStay(rate, checkIn, nights, season, 1),
        ...statuses,
        ...(anchor.paymentStatus ? { paymentStatus: anchor.paymentStatus } : {}),
        ...(anchor.notes ? { notes: anchor.notes } : {}),
      });
    }

    for (const period of unit.typeHistory) {
      if (period.type !== "STR") continue;
      const periodStart = parseDay(period.from);
      const periodEnd = period.to ? parseDay(period.to) : windowEnd;
      let cursor = periodStart > windowStart ? periodStart : windowStart;
      const end = periodEnd < windowEnd ? periodEnd : windowEnd;

      while (cursor < end) {
        if (blocked.has(toISODate(cursor))) {
          cursor = addDays(cursor, 1);
          continue;
        }
        const daysAhead = differenceInCalendarDays(cursor, MOCK_TODAY);
        const futureFade = daysAhead > 0 ? Math.max(0.12, 1 - daysAhead / FUTURE_DAYS) : 1;
        const demand = baseDemand * (season[cursor.getMonth()] ?? 1) * futureFade;

        if (!random.chance(Math.min(0.95, demand) * 0.45)) {
          cursor = addDays(cursor, 1);
          continue;
        }

        let nights = unit.bedrooms >= 4 ? random.int(3, 8) : random.int(2, 6);
        for (let night = 1; night < nights; night += 1) {
          const day = addDays(cursor, night);
          if (blocked.has(toISODate(day)) || day >= end) {
            nights = night;
            break;
          }
        }

        const checkOut = addDays(cursor, nights);
        const source: BookingSource = synced
          ? random.pick(["airbnb", "airbnb", "booking", "booking", "direct"] as const)
          : "direct";
        const guest = random.pick(GUESTS);
        drafts.push({
          unitId: unit.id,
          source,
          synced: source !== "direct",
          guestName: guest.name,
          guestContact: { email: emailFor(guest.name), phone: guest.phone },
          guests: Math.min(unit.bedrooms * 2, random.int(1, 4)),
          checkIn: toISODate(cursor),
          checkOut: toISODate(checkOut),
          amountMAD: priceStay(rate, cursor, nights, season, 0.92 + random.next() * 0.16),
          ...statusesFor(source, cursor, checkOut, random),
        });
        cursor = checkOut;
      }
    }
  }

  return drafts
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.unitId.localeCompare(b.unitId))
    .map((draft, index) => ({ id: `bk-${String(index + 1).padStart(4, "0")}`, ...draft }));
}

/** Twelve months of stays plus four months of forward bookings for every STR unit. */
export const MOCK_BOOKINGS: readonly Booking[] = generateBookings();
