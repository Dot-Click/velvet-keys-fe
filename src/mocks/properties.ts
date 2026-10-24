import type { ChannelConnection, Property, Unit, UnitTypePeriod } from "@/types/property";
import { ACCOUNT_IDS, USER_IDS } from "./ids";
import { atCasablancaTime, dayOfMonth, daysFromToday } from "./seed";

/** Account signup days, shared with the account records. */
export const SIGNUP_DAYS = {
  [ACCOUNT_IDS.atlas]: dayOfMonth(-13, 14),
  [ACCOUNT_IDS.benali]: daysFromToday(-40),
  [ACCOUNT_IDS.alami]: dayOfMonth(-5, 5),
  [ACCOUNT_IDS.tazi]: dayOfMonth(-7, 20),
  // STR and free sync end within the week; LTR runs a month longer
  [ACCOUNT_IDS.riad]: daysFromToday(-56),
  // LTR free months end within days
  [ACCOUNT_IDS.elAmrani]: daysFromToday(-59),
  [ACCOUNT_IDS.casaPrestige]: dayOfMonth(-4, 9),
  // Signed up this week and has not added a property yet
  [ACCOUNT_IDS.chraibi]: daysFromToday(-3),
  [ACCOUNT_IDS.atlantic]: daysFromToday(-12),
  [ACCOUNT_IDS.laurent]: dayOfMonth(-7, 3),
} as const;

export const MOCK_PROPERTIES: readonly Property[] = [
  // Atlas Conciergerie · Amelia Avery
  {
    id: "prop-aurora",
    accountId: ACCOUNT_IDS.atlas,
    ownerId: USER_IDS.owner,
    name: "The Aurora",
    address: "Avenue Mohammed VI, Hivernage",
    city: "Marrakech",
    image: "/images/property-aurora.jpg",
    description:
      "Duplex penthouse residence overlooking the Atlas Mountains, with a heated plunge pool and private terraces.",
    commissionPct: 20,
    status: "active",
  },
  {
    id: "prop-marina",
    accountId: ACCOUNT_IDS.atlas,
    ownerId: USER_IDS.owner,
    name: "Marina House",
    address: "Boulevard des Almohades, Casablanca Marina",
    city: "Casablanca",
    image: "/images/property-marina.jpg",
    description:
      "Waterfront residences with direct Atlantic views, black marble baths and access to the marina promenade.",
    commissionPct: 20,
    status: "active",
  },
  {
    id: "prop-anfa",
    accountId: ACCOUNT_IDS.atlas,
    ownerId: USER_IDS.owner,
    name: "Résidence Anfa",
    address: "Boulevard d'Anfa, Racine",
    city: "Casablanca",
    image: "/images/property-harbour.jpg",
    description:
      "Quiet family apartments near the Anfa corniche, let on long-term leases with a resident caretaker.",
    commissionPct: 15,
    status: "active",
  },
  // Atlas Conciergerie · Rachid Ouazzani
  {
    id: "prop-garden",
    accountId: ACCOUNT_IDS.atlas,
    ownerId: USER_IDS.ownerRachid,
    name: "Garden Court",
    address: "Route de Fès, Palmeraie",
    city: "Marrakech",
    image: "/images/property-gardencourt.jpg",
    description:
      "Riad suites around zellige courtyards in an old olive grove, with a private hammam and spa.",
    commissionPct: 20,
    status: "active",
  },
  {
    id: "prop-zitouna",
    accountId: ACCOUNT_IDS.atlas,
    ownerId: USER_IDS.ownerRachid,
    name: "Dar Zitouna",
    address: "Route de l'Ourika, km 12",
    city: "Marrakech",
    image: "/images/property-palm.jpg",
    description:
      "Six-acre foothill estate among orange groves, with a clay tennis court and a resident chef.",
    commissionPct: 25,
    status: "active",
  },
  {
    id: "prop-oudaya",
    accountId: ACCOUNT_IDS.atlas,
    ownerId: USER_IDS.ownerRachid,
    name: "Riad Oudaya",
    address: "Rue Jamaa, Kasbah des Oudayas",
    city: "Rabat",
    image: "/images/riad-courtyard-night.jpg",
    description:
      "Restored riad inside the Oudayas kasbah, a short walk from the river mouth and the Andalusian gardens.",
    commissionPct: 20,
    status: "active",
  },
  // Atlas Conciergerie · Claire Dumont
  {
    id: "prop-skyline",
    accountId: ACCOUNT_IDS.atlas,
    ownerId: USER_IDS.ownerClaire,
    name: "Skyline Tower",
    address: "Casablanca Finance City, Tower B",
    city: "Casablanca",
    image: "/images/property-skyline.jpg",
    description:
      "Glass tower apartments facing the financial district, with valet service and boardroom access.",
    commissionPct: 18,
    status: "active",
  },
  {
    id: "prop-malabata",
    accountId: ACCOUNT_IDS.atlas,
    ownerId: USER_IDS.ownerClaire,
    name: "Villa Malabata",
    address: "Route de Malabata",
    city: "Tangier",
    image: "/images/villa.jpg",
    description:
      "Hillside villa above the Bay of Tangier with a sea-view terrace and a separate garden suite.",
    commissionPct: 20,
    status: "active",
  },
  // Karim Benali (solo Owner)
  {
    id: "prop-palmeraie",
    accountId: ACCOUNT_IDS.benali,
    ownerId: USER_IDS.soloOwner,
    name: "Villa Palmeraie",
    address: "Circuit de la Palmeraie",
    city: "Marrakech",
    image: "/images/executive-interior.jpg",
    description:
      "Family villa in the Palmeraie with a heated pool, a pool house and gardens of date palms.",
    commissionPct: 0,
    status: "active",
  },
  {
    id: "prop-dar-benali",
    accountId: ACCOUNT_IDS.benali,
    ownerId: USER_IDS.soloOwner,
    name: "Dar Benali",
    address: "Rue de la Kasbah, Medina",
    city: "Tangier",
    image: "/images/hero-penthouse-dusk.jpg",
    description:
      "Townhouse in the Tangier medina split into a guest suite and two long-term apartments.",
    commissionPct: 0,
    status: "active",
  },
  // Hicham Alami (read-only Owner account)
  {
    id: "prop-tanja",
    accountId: ACCOUNT_IDS.alami,
    ownerId: USER_IDS.alami,
    name: "Riad Tanja",
    address: "Rue Ben Abbou, Medina",
    city: "Tangier",
    image: "/images/concierge-hub.jpg",
    description: "Four-room guesthouse near the Kasbah, listed on Airbnb and Booking.com.",
    commissionPct: 0,
    status: "active",
  },
  // Tazi Gestion (banned Conciergerie account)
  {
    id: "prop-agdal",
    accountId: ACCOUNT_IDS.tazi,
    ownerId: USER_IDS.banned,
    name: "Résidence Agdal",
    address: "Avenue de France, Agdal",
    city: "Rabat",
    image: "/images/dark-marble.jpg",
    description: "Apartment building in Agdal let on long-term leases.",
    commissionPct: 20,
    status: "delisted",
  },
  // Other platform clients, seen only from the Admin panel
  ...[
    {
      id: "prop-mimouna",
      accountId: ACCOUNT_IDS.riad,
      ownerId: USER_IDS.riad,
      name: "Riad Lalla Mimouna",
      address: "Derb Sidi Bouloukat, Medina",
      city: "Marrakech",
      image: "/images/riad-courtyard-night.jpg",
    },
    {
      id: "prop-gueliz",
      accountId: ACCOUNT_IDS.riad,
      ownerId: USER_IDS.riad,
      name: "Résidence Guéliz",
      address: "Rue de la Liberté, Guéliz",
      city: "Marrakech",
      image: "/images/property-gardencourt.jpg",
    },
    {
      id: "prop-hassan",
      accountId: ACCOUNT_IDS.elAmrani,
      ownerId: USER_IDS.elAmrani,
      name: "Appartements Hassan",
      address: "Avenue Hassan II, Hassan",
      city: "Rabat",
      image: "/images/property-harbour.jpg",
    },
    {
      id: "prop-casa-port",
      accountId: ACCOUNT_IDS.casaPrestige,
      ownerId: USER_IDS.casaPrestige,
      name: "Casa Port Lofts",
      address: "Boulevard des Almohades, Casa Port",
      city: "Casablanca",
      image: "/images/property-skyline.jpg",
    },
    {
      id: "prop-maarif",
      accountId: ACCOUNT_IDS.casaPrestige,
      ownerId: USER_IDS.casaPrestige,
      name: "Maarif Résidence",
      address: "Rue Abou Bakr Ibnou Koutia, Maarif",
      city: "Casablanca",
      image: "/images/dark-marble.jpg",
    },
    {
      id: "prop-taghazout",
      accountId: ACCOUNT_IDS.atlantic,
      ownerId: USER_IDS.atlantic,
      name: "Taghazout Bay Villas",
      address: "Taghazout Bay, km 17",
      city: "Agadir",
      image: "/images/villa.jpg",
    },
    {
      id: "prop-agadir-marina",
      accountId: ACCOUNT_IDS.atlantic,
      ownerId: USER_IDS.atlantic,
      name: "Agadir Marina Flats",
      address: "Marina d'Agadir, Front de Mer",
      city: "Agadir",
      image: "/images/property-marina.jpg",
    },
    {
      id: "prop-mogador",
      accountId: ACCOUNT_IDS.laurent,
      ownerId: USER_IDS.laurent,
      name: "Villa Mogador",
      address: "Route de Ghazoua",
      city: "Essaouira",
      image: "/images/property-palm.jpg",
    },
  ].map((property): Property => ({
    ...property,
    commissionPct:
      property.accountId === ACCOUNT_IDS.laurent || property.accountId === ACCOUNT_IDS.elAmrani
        ? 0
        : 20,
    status: "active",
  })),
];

type UnitSeed = {
  id: string;
  propertyId: string;
  name: string;
  bedrooms: number;
  image: string;
  /** Typical nightly rate used to price generated bookings */
  rate?: number;
  history: UnitTypePeriod[];
  channels?: Partial<Pick<ChannelConnection, "airbnb" | "bookingCom">>;
};

const atlasStart = SIGNUP_DAYS[ACCOUNT_IDS.atlas];
const benaliStart = SIGNUP_DAYS[ACCOUNT_IDS.benali];
const alamiStart = SIGNUP_DAYS[ACCOUNT_IDS.alami];
const taziStart = SIGNUP_DAYS[ACCOUNT_IDS.tazi];

const STR_FROM = (from: string): UnitTypePeriod[] => [{ type: "STR", from }];
const LTR_FROM = (from: string): UnitTypePeriod[] => [{ type: "LTR", from }];

/** The same listing title is published on both platforms. */
const BOTH = (listing: string) => ({
  airbnb: { status: "connected" as const, listingName: listing },
  bookingCom: { status: "connected" as const, listingName: listing },
});

const UNIT_SEEDS: UnitSeed[] = [
  // The Aurora
  {
    id: "unit-aurora-ph4a",
    propertyId: "prop-aurora",
    name: "Penthouse 4A",
    bedrooms: 4,
    image: "/images/penthouse.jpg",
    rate: 4800,
    history: STR_FROM(atlasStart),
    channels: BOTH("The Aurora Penthouse 4A"),
  },
  {
    id: "unit-aurora-2b",
    propertyId: "prop-aurora",
    name: "Suite 2B",
    bedrooms: 2,
    image: "/images/bedroom.jpg",
    rate: 2600,
    history: STR_FROM(atlasStart),
    channels: BOTH("The Aurora Suite 2B"),
  },
  {
    id: "unit-aurora-1c",
    propertyId: "prop-aurora",
    name: "Studio 1C",
    bedrooms: 1,
    image: "/images/bathroom.jpg",
    rate: 1400,
    history: STR_FROM(atlasStart),
    channels: { airbnb: { status: "connected", listingName: "The Aurora Studio 1C" } },
  },
  // Marina House
  {
    id: "unit-marina-r12",
    propertyId: "prop-marina",
    name: "Residence 12",
    bedrooms: 3,
    image: "/images/bathroom.jpg",
    rate: 2900,
    history: STR_FROM(atlasStart),
    channels: BOTH("Marina House Residence 12"),
  },
  {
    id: "unit-marina-r14",
    propertyId: "prop-marina",
    name: "Residence 14",
    bedrooms: 2,
    image: "/images/property-marina.jpg",
    rate: 2200,
    history: STR_FROM(atlasStart),
    channels: { bookingCom: { status: "connected", listingName: "Marina House Residence 14" } },
  },
  {
    id: "unit-marina-apt7",
    propertyId: "prop-marina",
    name: "Apartment 7",
    bedrooms: 2,
    image: "/images/bedroom.jpg",
    history: LTR_FROM(atlasStart),
  },
  // Résidence Anfa
  {
    id: "unit-anfa-2a",
    propertyId: "prop-anfa",
    name: "Apartment 2A",
    bedrooms: 3,
    image: "/images/property-harbour.jpg",
    history: LTR_FROM(atlasStart),
  },
  {
    id: "unit-anfa-3b",
    propertyId: "prop-anfa",
    name: "Apartment 3B",
    bedrooms: 2,
    image: "/images/bedroom.jpg",
    history: LTR_FROM(atlasStart),
  },
  {
    id: "unit-anfa-4c",
    propertyId: "prop-anfa",
    name: "Apartment 4C",
    bedrooms: 2,
    image: "/images/bathroom.jpg",
    history: LTR_FROM(atlasStart),
  },
  // Garden Court
  {
    id: "unit-garden-s8",
    propertyId: "prop-garden",
    name: "Suite 8",
    bedrooms: 2,
    image: "/images/bedroom.jpg",
    rate: 3400,
    history: STR_FROM(atlasStart),
    channels: BOTH("Garden Court Suite 8"),
  },
  {
    id: "unit-garden-s9",
    propertyId: "prop-garden",
    name: "Suite 9",
    bedrooms: 1,
    image: "/images/property-gardencourt.jpg",
    rate: 2400,
    history: STR_FROM(atlasStart),
    channels: { airbnb: { status: "connected", listingName: "Garden Court Suite 9" } },
  },
  // Added three months ago: its first month is prorated
  {
    id: "unit-garden-s10",
    propertyId: "prop-garden",
    name: "Suite 10",
    bedrooms: 2,
    image: "/images/bedroom.jpg",
    rate: 2800,
    history: STR_FROM(dayOfMonth(-3, 12)),
  },
  // Dar Zitouna
  {
    id: "unit-zitouna-estate",
    propertyId: "prop-zitouna",
    name: "Private Estate",
    bedrooms: 6,
    image: "/images/property-palm.jpg",
    rate: 5600,
    history: STR_FROM(atlasStart),
    channels: BOTH("Dar Zitouna Private Estate"),
  },
  // Riad Oudaya
  {
    id: "unit-oudaya-andalous",
    propertyId: "prop-oudaya",
    name: "Chambre Andalouse",
    bedrooms: 1,
    image: "/images/riad-courtyard-night.jpg",
    rate: 1300,
    history: STR_FROM(atlasStart),
  },
  {
    id: "unit-oudaya-zellige",
    propertyId: "prop-oudaya",
    name: "Chambre Zellige",
    bedrooms: 1,
    image: "/images/bedroom.jpg",
    rate: 1200,
    history: STR_FROM(atlasStart),
  },
  {
    id: "unit-oudaya-garden",
    propertyId: "prop-oudaya",
    name: "Garden Apartment",
    bedrooms: 2,
    image: "/images/bathroom.jpg",
    history: LTR_FROM(atlasStart),
  },
  // Skyline Tower
  {
    id: "unit-skyline-ph21",
    propertyId: "prop-skyline",
    name: "Penthouse 21",
    bedrooms: 3,
    image: "/images/property-skyline.jpg",
    rate: 2600,
    history: STR_FROM(atlasStart),
    channels: {
      airbnb: { status: "connected", listingName: "Skyline Tower Penthouse 21" },
      bookingCom: { status: "error", listingName: "Skyline Tower Penthouse 21" },
    },
  },
  {
    id: "unit-skyline-18",
    propertyId: "prop-skyline",
    name: "Apartment 18",
    bedrooms: 2,
    image: "/images/villa.jpg",
    rate: 1800,
    history: STR_FROM(atlasStart),
  },
  {
    id: "unit-skyline-15",
    propertyId: "prop-skyline",
    name: "Apartment 15",
    bedrooms: 1,
    image: "/images/bathroom.jpg",
    rate: 1200,
    history: STR_FROM(atlasStart),
  },
  // Switched from STR to LTR when a lease started
  {
    id: "unit-skyline-9",
    propertyId: "prop-skyline",
    name: "Apartment 9",
    bedrooms: 2,
    image: "/images/bedroom.jpg",
    rate: 1700,
    history: [
      { type: "STR", from: atlasStart, to: dayOfMonth(-11, 1) },
      { type: "LTR", from: dayOfMonth(-11, 1) },
    ],
  },
  // Villa Malabata
  {
    id: "unit-malabata-villa",
    propertyId: "prop-malabata",
    name: "Sea View Villa",
    bedrooms: 4,
    image: "/images/villa.jpg",
    rate: 3800,
    history: STR_FROM(atlasStart),
  },
  {
    id: "unit-malabata-suite",
    propertyId: "prop-malabata",
    name: "Garden Suite",
    bedrooms: 1,
    image: "/images/bedroom.jpg",
    rate: 1500,
    history: STR_FROM(atlasStart),
  },
  // Villa Palmeraie (solo Owner)
  {
    id: "unit-palmeraie-villa",
    propertyId: "prop-palmeraie",
    name: "Main Villa",
    bedrooms: 5,
    image: "/images/executive-interior.jpg",
    rate: 5200,
    history: STR_FROM(benaliStart),
    channels: { airbnb: { status: "connected", listingName: "Villa Palmeraie" } },
  },
  {
    id: "unit-palmeraie-pool",
    propertyId: "prop-palmeraie",
    name: "Pool House",
    bedrooms: 2,
    image: "/images/bedroom.jpg",
    rate: 2200,
    history: STR_FROM(benaliStart),
  },
  // Dar Benali (solo Owner)
  {
    id: "unit-benali-suite",
    propertyId: "prop-dar-benali",
    name: "Kasbah Suite",
    bedrooms: 2,
    image: "/images/hero-penthouse-dusk.jpg",
    rate: 1600,
    history: STR_FROM(benaliStart),
  },
  {
    id: "unit-benali-apt1",
    propertyId: "prop-dar-benali",
    name: "Apartment 1",
    bedrooms: 2,
    image: "/images/bathroom.jpg",
    history: LTR_FROM(benaliStart),
  },
  {
    id: "unit-benali-apt2",
    propertyId: "prop-dar-benali",
    name: "Apartment 2",
    bedrooms: 1,
    image: "/images/bedroom.jpg",
    history: LTR_FROM(benaliStart),
  },
  // Riad Tanja (read-only account)
  ...["Chambre Bahr", "Chambre Kasbah", "Chambre Hercule", "Chambre Detroit"].map(
    (name, index): UnitSeed => ({
      id: `unit-tanja-${index + 1}`,
      propertyId: "prop-tanja",
      name,
      bedrooms: 1,
      image: index % 2 === 0 ? "/images/concierge-hub.jpg" : "/images/bedroom.jpg",
      rate: 900 + index * 80,
      history: STR_FROM(alamiStart),
      channels: BOTH(`Riad Tanja ${name}`),
    }),
  ),
  // Résidence Agdal (banned account)
  ...[1, 2, 3].map((number): UnitSeed => ({
    id: `unit-agdal-${number}`,
    propertyId: "prop-agdal",
    name: `Apartment ${number}`,
    bedrooms: 2,
    image: "/images/dark-marble.jpg",
    history: LTR_FROM(taziStart),
  })),
  // Other platform clients: no nightly rate, so no generated bookings
  ...platformClientUnits(),
];

/** Units of the clients only the Admin panel shows. */
function platformClientUnits(): UnitSeed[] {
  const unit = (
    id: string,
    propertyId: string,
    name: string,
    image: string,
    history: UnitTypePeriod[],
    channel?: string,
  ): UnitSeed => ({
    id,
    propertyId,
    name,
    bedrooms: 2,
    image,
    history,
    ...(channel ? { channels: BOTH(channel) } : {}),
  });
  const riad = SIGNUP_DAYS[ACCOUNT_IDS.riad];
  const amrani = SIGNUP_DAYS[ACCOUNT_IDS.elAmrani];
  const casa = SIGNUP_DAYS[ACCOUNT_IDS.casaPrestige];
  const atlantic = SIGNUP_DAYS[ACCOUNT_IDS.atlantic];
  const laurent = SIGNUP_DAYS[ACCOUNT_IDS.laurent];
  return [
    unit(
      "unit-mimouna-1",
      "prop-mimouna",
      "Suite Majorelle",
      "/images/bedroom.jpg",
      STR_FROM(riad),
      "Riad Lalla Mimouna Majorelle",
    ),
    unit(
      "unit-mimouna-2",
      "prop-mimouna",
      "Suite Menara",
      "/images/bathroom.jpg",
      STR_FROM(riad),
      "Riad Lalla Mimouna Menara",
    ),
    unit(
      "unit-mimouna-3",
      "prop-mimouna",
      "Suite Agdal",
      "/images/riad-courtyard-night.jpg",
      STR_FROM(riad),
    ),
    unit("unit-gueliz-1", "prop-gueliz", "Apartment 1", "/images/bedroom.jpg", LTR_FROM(riad)),
    unit(
      "unit-hassan-1",
      "prop-hassan",
      "Apartment A",
      "/images/property-harbour.jpg",
      LTR_FROM(amrani),
    ),
    unit("unit-hassan-2", "prop-hassan", "Apartment B", "/images/bedroom.jpg", LTR_FROM(amrani)),
    unit(
      "unit-casa-port-1",
      "prop-casa-port",
      "Loft 1",
      "/images/property-skyline.jpg",
      STR_FROM(casa),
    ),
    unit("unit-casa-port-2", "prop-casa-port", "Loft 2", "/images/bathroom.jpg", STR_FROM(casa)),
    unit("unit-casa-port-3", "prop-casa-port", "Loft 3", "/images/bedroom.jpg", STR_FROM(casa)),
    unit("unit-maarif-1", "prop-maarif", "Apartment 4", "/images/dark-marble.jpg", LTR_FROM(casa)),
    unit("unit-maarif-2", "prop-maarif", "Apartment 6", "/images/bedroom.jpg", LTR_FROM(casa)),
    unit(
      "unit-taghazout-1",
      "prop-taghazout",
      "Villa Argan",
      "/images/villa.jpg",
      STR_FROM(atlantic),
      "Taghazout Bay Villa Argan",
    ),
    unit(
      "unit-taghazout-2",
      "prop-taghazout",
      "Villa Surf",
      "/images/property-palm.jpg",
      STR_FROM(atlantic),
      "Taghazout Bay Villa Surf",
    ),
    unit(
      "unit-agadir-marina-1",
      "prop-agadir-marina",
      "Flat 12",
      "/images/property-marina.jpg",
      LTR_FROM(atlantic),
    ),
    unit(
      "unit-mogador-1",
      "prop-mogador",
      "Main House",
      "/images/property-palm.jpg",
      STR_FROM(laurent),
      "Villa Mogador Essaouira",
    ),
  ];
}

/** Typical nightly rate per STR unit, used only to price generated bookings. */
export const UNIT_BASE_RATES: Record<string, number> = Object.fromEntries(
  UNIT_SEEDS.filter((seed) => seed.rate).map((seed) => [seed.id, seed.rate as number]),
);

function toUnit(seed: UnitSeed): Unit {
  const current = seed.history[seed.history.length - 1];
  const unit: Unit = {
    id: seed.id,
    propertyId: seed.propertyId,
    name: seed.name,
    type: current?.type ?? "STR",
    bedrooms: seed.bedrooms,
    image: seed.image,
    typeHistory: seed.history,
  };
  if (seed.channels) {
    unit.channelConnection = {
      unitId: seed.id,
      airbnb: seed.channels.airbnb ?? { status: "disconnected" },
      bookingCom: seed.channels.bookingCom ?? { status: "disconnected" },
      lastSyncAt: atCasablancaTime(daysFromToday(0), "06:00"),
      connectedSince: seed.history[0]?.from ?? daysFromToday(0),
    };
  }
  return unit;
}

export const MOCK_UNITS: readonly Unit[] = UNIT_SEEDS.map(toUnit);

export function propertyOfUnit(unitId: string) {
  const unit = MOCK_UNITS.find((item) => item.id === unitId);
  return unit ? MOCK_PROPERTIES.find((property) => property.id === unit.propertyId) : undefined;
}
