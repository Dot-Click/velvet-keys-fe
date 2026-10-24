import { addDays, addMonths, startOfMonth } from "date-fns";
import type { Lease, RentInvoice, Tenant } from "@/types/lease";
import { parseDay, toISODate, toMonthKey } from "@/lib/dates";
import { DEFAULT_RENT_DUE_DAY, rentDueDate, rentInvoiceNumber } from "@/lib/rent";
import { MOCK_ACCOUNTS } from "./accounts";
import { ACCOUNT_IDS, USER_IDS } from "./ids";
import { MOCK_PROPERTIES, MOCK_UNITS, SIGNUP_DAYS } from "./properties";
import { MOCK_TODAY, atCasablancaTime, createRandom, dayOfMonth, hoursAgo } from "./seed";

export const MOCK_TENANTS: readonly Tenant[] = [
  {
    id: "tenant-youssef",
    accountId: ACCOUNT_IDS.atlas,
    name: "Youssef Bennani",
    email: "youssef.bennani@example.com",
    phone: "+212 6 61 52 33 90",
    language: "fr",
    invitedAt: hoursAgo(30),
  },
  {
    id: "tenant-salma",
    accountId: ACCOUNT_IDS.atlas,
    userId: USER_IDS.tenant,
    name: "Salma Idrissi",
    email: "tenant@velvetkeys.demo",
    phone: "+212 6 55 30 21 87",
    language: "en",
    invitedAt: atCasablancaTime(dayOfMonth(-8, 1)),
  },
  {
    id: "tenant-imane",
    accountId: ACCOUNT_IDS.atlas,
    name: "Imane Tahiri",
    email: "imane.tahiri@example.com",
    phone: "+212 6 63 48 12 07",
    language: "ar",
    invitedAt: hoursAgo(120),
  },
  {
    id: "tenant-mehdi",
    accountId: ACCOUNT_IDS.atlas,
    name: "Mehdi Alaoui",
    email: "mehdi.alaoui@example.com",
    phone: "+212 6 70 25 91 64",
    language: "fr",
    invitedAt: hoursAgo(72),
  },
  {
    id: "tenant-sophie",
    accountId: ACCOUNT_IDS.atlas,
    name: "Sophie Martin",
    email: "sophie.martin@example.com",
    phone: "+33 6 71 22 48 15",
    language: "fr",
  },
  {
    id: "tenant-hamid",
    accountId: ACCOUNT_IDS.benali,
    name: "Hamid Kettani",
    email: "hamid.kettani@example.com",
    phone: "+212 6 62 09 74 38",
    language: "ar",
    invitedAt: hoursAgo(200),
  },
];

const months = (from: string, count: number) => toISODate(addMonths(parseDay(from), count));

const MARINA_START = dayOfMonth(-13, 1);
const ANFA_2A_START = dayOfMonth(-8, 1);
const ANFA_4C_START = dayOfMonth(-11, 1);
const OUDAYA_START = dayOfMonth(-6, 1);
const SKYLINE_START = dayOfMonth(-11, 1);
const BENALI_START = dayOfMonth(-10, 1);

export const MOCK_LEASES: readonly Lease[] = [
  {
    id: "lease-marina-apt7",
    unitId: "unit-marina-apt7",
    tenantId: "tenant-youssef",
    startDate: MARINA_START,
    endDate: months(MARINA_START, 24),
    monthlyRentMAD: 9500,
    depositMAD: 19000,
    contractFileUrl: "/contracts/lease-marina-apt7.pdf",
    contractFileName: "lease-marina-apt7.pdf",
    rentDueDay: DEFAULT_RENT_DUE_DAY,
    status: "active",
  },
  {
    id: "lease-anfa-2a",
    unitId: "unit-anfa-2a",
    tenantId: "tenant-salma",
    startDate: ANFA_2A_START,
    endDate: months(ANFA_2A_START, 12),
    monthlyRentMAD: 12500,
    depositMAD: 25000,
    contractFileUrl: "/contracts/lease-anfa-2a.pdf",
    contractFileName: "lease-anfa-2a.pdf",
    rentDueDay: DEFAULT_RENT_DUE_DAY,
    status: "active",
  },
  // Ends at the start of next month
  {
    id: "lease-anfa-4c",
    unitId: "unit-anfa-4c",
    tenantId: "tenant-imane",
    startDate: ANFA_4C_START,
    endDate: dayOfMonth(1, 1),
    monthlyRentMAD: 8800,
    depositMAD: 17600,
    contractFileUrl: "/contracts/lease-anfa-4c.pdf",
    contractFileName: "lease-anfa-4c.pdf",
    rentDueDay: DEFAULT_RENT_DUE_DAY,
    status: "ending",
  },
  {
    id: "lease-oudaya-garden",
    unitId: "unit-oudaya-garden",
    tenantId: "tenant-mehdi",
    startDate: OUDAYA_START,
    endDate: months(OUDAYA_START, 12),
    monthlyRentMAD: 7200,
    depositMAD: 14400,
    contractFileUrl: "/contracts/lease-oudaya-garden.pdf",
    contractFileName: "lease-oudaya-garden.pdf",
    rentDueDay: DEFAULT_RENT_DUE_DAY,
    status: "active",
  },
  // Ended two months ago; the unit is vacant again
  {
    id: "lease-skyline-9",
    unitId: "unit-skyline-9",
    tenantId: "tenant-sophie",
    startDate: SKYLINE_START,
    endDate: dayOfMonth(-2, 1),
    monthlyRentMAD: 11000,
    depositMAD: 22000,
    contractFileUrl: "/contracts/lease-skyline-9.pdf",
    contractFileName: "lease-skyline-9.pdf",
    rentDueDay: DEFAULT_RENT_DUE_DAY,
    status: "ended",
  },
  {
    id: "lease-benali-apt1",
    unitId: "unit-benali-apt1",
    tenantId: "tenant-hamid",
    startDate: BENALI_START,
    endDate: months(BENALI_START, 24),
    monthlyRentMAD: 6500,
    depositMAD: 13000,
    contractFileUrl: "/contracts/lease-benali-apt1.pdf",
    contractFileName: "lease-benali-apt1.pdf",
    rentDueDay: DEFAULT_RENT_DUE_DAY,
    status: "active",
  },
];

/** Leases whose latest rent is still outstanding. */
const UNPAID_CURRENT = new Set(["lease-marina-apt7", "lease-anfa-2a"]);
const UNPAID_LAST_MONTH = new Set(["lease-anfa-4c"]);
/** This month's rent is not invoiced yet, so "Generate this month's invoices" has work to do. */
const NOT_YET_ISSUED = new Set(["lease-oudaya-garden"]);

function generateRentInvoices(): RentInvoice[] {
  const random = createRandom(777);
  const invoices: RentInvoice[] = [];
  const currentMonth = toMonthKey(MOCK_TODAY);
  const lastMonth = toMonthKey(addMonths(MOCK_TODAY, -1));
  const today = toISODate(MOCK_TODAY);
  /** Invoices issued so far per account and month, for numbering */
  const issued = new Map<string, number>();

  for (const lease of MOCK_LEASES) {
    const unit = MOCK_UNITS.find((item) => item.id === lease.unitId);
    const property = MOCK_PROPERTIES.find((item) => item.id === unit?.propertyId);
    const account = MOCK_ACCOUNTS.find((item) => item.id === property?.accountId);
    if (!property || !account?.issuerProfile) continue;

    const signup = SIGNUP_DAYS[account.id as keyof typeof SIGNUP_DAYS];
    let month = startOfMonth(parseDay(lease.startDate > signup ? lease.startDate : signup));
    const end = parseDay(lease.endDate);

    while (month < end && toMonthKey(month) <= currentMonth) {
      const period = toMonthKey(month);
      if (period === currentMonth && NOT_YET_ISSUED.has(lease.id)) break;
      const dueDate = rentDueDate(period, lease.rentDueDay);
      const outstanding =
        (period === currentMonth && UNPAID_CURRENT.has(lease.id)) ||
        (period === lastMonth && UNPAID_LAST_MONTH.has(lease.id)) ||
        dueDate > today;
      const paidAt = addDays(parseDay(dueDate), random.int(-4, 1));
      const sequenceKey = `${account.id}:${period}`;
      const sequence = (issued.get(sequenceKey) ?? 0) + 1;
      issued.set(sequenceKey, sequence);
      invoices.push({
        id: `rent-${lease.id}-${period}`,
        number: rentInvoiceNumber(period, sequence),
        leaseId: lease.id,
        period,
        issuedAt: toISODate(month),
        amountMAD: lease.monthlyRentMAD,
        issuerProfile: { ...account.issuerProfile },
        status: outstanding ? (dueDate < today ? "late" : "unpaid") : "paid",
        dueDate,
        ...(outstanding ? {} : { paidAt: toISODate(paidAt > MOCK_TODAY ? MOCK_TODAY : paidAt) }),
      });
      month = addMonths(month, 1);
    }
  }
  return invoices;
}

/** Monthly rent schedule for each lease since the account joined Velvet Keys. */
export const MOCK_RENT_INVOICES: readonly RentInvoice[] = generateRentInvoices();
