/**
 * Illustrative figures behind every mockup on the landing page, in MAD. They are chosen to add up
 * (gross = STR + LTR, net = gross - commission - operating costs), so the page tells one story.
 */

/** One month of an owner's portfolio. */
export const MONTH = {
  gross: 184_000,
  str: 142_000,
  ltr: 42_000,
  commissionPct: 20,
  commission: 36_800,
  costs: 17_200,
  net: 130_000,
} as const;

/** The same portfolio, year to date. */
export const YTD = {
  gross: 1_480_000,
  str: 1_140_000,
  ltr: 340_000,
  commission: 296_000,
  costs: 138_000,
  net: 1_046_000,
  /** Net profit as a share of gross revenue */
  margin: 70.7,
} as const;

/** The best month of the year so far, which is the month the mockups show. */
export const PEAK_MONTH_GROSS = MONTH.gross;

/** Share of a total, as a whole percent. */
export const share = (part: number, total: number) => Math.round((part / total) * 100);

/** Monthly revenue per property; the four add up to MONTH. */
export const PROPERTY_ROWS = [
  {
    id: "aurora",
    name: "The Aurora",
    image: "/images/property-aurora.jpg",
    str: 52_000,
    ltr: 8_000,
  },
  {
    id: "harbour",
    name: "Harbour House",
    image: "/images/property-harbour.jpg",
    str: 58_000,
    ltr: 0,
  },
  {
    id: "marina",
    name: "Marina House",
    image: "/images/property-marina.jpg",
    str: 32_000,
    ltr: 14_000,
  },
  {
    id: "skyline",
    name: "Skyline Tower",
    image: "/images/property-skyline.jpg",
    str: 0,
    ltr: 20_000,
  },
] as const;

/** Monthly revenue of every residence in the showcase; the first four match PROPERTY_ROWS. */
export const RESIDENCE_FIGURES: Record<string, { str: number; ltr: number }> = {
  ...Object.fromEntries(PROPERTY_ROWS.map((row) => [row.id, { str: row.str, ltr: row.ltr }])),
  palm: { str: 46_000, ltr: 12_000 },
  garden: { str: 0, ltr: 24_000 },
};

/** What a conciergerie sees across all of its owners in a month. */
export const CONCIERGE_MONTH = {
  strGross: 155_300,
  ltrGross: 51_000,
  commissionPct: 20,
  strCommission: 31_060,
  ltrCommission: 10_200,
} as const;

/** Rent tracking for four leases. */
export const LEASE_ROWS = [
  { id: "youssef", rent: 7_500, dueDay: 5, state: "paid" },
  { id: "salma", rent: 5_200, dueDay: 1, state: "paid" },
  { id: "imane", rent: 6_800, dueDay: 10, state: "due" },
  { id: "mehdi", rent: 4_300, dueDay: 3, state: "late" },
] as const;

export const RENT_EXPECTED = LEASE_ROWS.reduce((sum, row) => sum + row.rent, 0);
export const RENT_COLLECTED = LEASE_ROWS.filter((row) => row.state === "paid").reduce(
  (sum, row) => sum + row.rent,
  0,
);
