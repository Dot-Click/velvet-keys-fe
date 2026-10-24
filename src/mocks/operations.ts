import { addDays, endOfMonth, startOfMonth } from "date-fns";
import type { Expense, MaintenanceTicket, UtilityType, Worker } from "@/types/operations";
import { lastMonths, parseDay, toISODate } from "@/lib/dates";
import { ACCOUNT_IDS } from "./ids";
import { MOCK_PROPERTIES, MOCK_UNITS, SIGNUP_DAYS } from "./properties";
import { MOCK_TODAY, atCasablancaTime, createRandom, daysFromToday, hoursAgo } from "./seed";

export const MOCK_WORKERS: readonly Worker[] = [
  {
    id: "worker-youssef",
    accountId: ACCOUNT_IDS.atlas,
    name: "Youssef Amrani",
    specialty: "Electrician & home automation",
    phone: "+212 6 61 49 20 19",
  },
  {
    id: "worker-fatima",
    accountId: ACCOUNT_IDS.atlas,
    name: "Fatima Zahra Bennis",
    specialty: "HVAC technician",
    phone: "+212 6 62 77 31 08",
  },
  {
    id: "worker-hassan",
    accountId: ACCOUNT_IDS.atlas,
    name: "Hassan Ouali",
    specialty: "Plumber & pools",
    phone: "+212 6 70 12 66 45",
  },
  {
    id: "worker-said",
    accountId: ACCOUNT_IDS.atlas,
    name: "Saïd Lamrani",
    specialty: "Stone & finishes",
    phone: "+212 6 68 40 92 13",
  },
  {
    id: "worker-khadija",
    accountId: ACCOUNT_IDS.atlas,
    name: "Khadija Moussaoui",
    specialty: "Head housekeeper",
    phone: "+212 6 64 05 83 27",
  },
  {
    id: "worker-aicha",
    accountId: ACCOUNT_IDS.atlas,
    name: "Aïcha Rami",
    specialty: "Housekeeper",
    phone: "+212 6 65 91 24 70",
  },
  {
    id: "worker-mustapha",
    accountId: ACCOUNT_IDS.benali,
    name: "Mustapha El Idrissi",
    specialty: "Caretaker & gardener",
    phone: "+212 6 61 30 57 84",
  },
  {
    id: "worker-naima",
    accountId: ACCOUNT_IDS.benali,
    name: "Naïma Chafik",
    specialty: "Housekeeper",
    phone: "+212 6 63 82 19 46",
  },
];

const unit = (id: string) => MOCK_UNITS.find((item) => item.id === id);
const photosFor = (unitId: string) => {
  const found = unit(unitId);
  const property = MOCK_PROPERTIES.find((item) => item.id === found?.propertyId);
  return [found?.image, property?.image].filter((url): url is string => Boolean(url));
};

type TicketSeed = Omit<MaintenanceTicket, "photos"> & { photos?: string[] };

const OPEN_TICKETS: TicketSeed[] = [
  {
    id: "ticket-ac-leak",
    unitId: "unit-aurora-ph4a",
    title: "Air conditioning compressor leak",
    description:
      "Refrigerant pressure drop flagged by the smart sensors. The valve seal needs tightening before the afternoon heat.",
    urgency: "critical",
    status: "reported",
    workerId: "worker-fatima",
    costMAD: 2600,
    reportedAt: hoursAgo(2),
  },
  {
    id: "ticket-hammam",
    unitId: "unit-garden-s8",
    title: "Hammam steam generator thermostat",
    description: "Steam room temperature drifts by 3 °C during evening sessions.",
    urgency: "medium",
    status: "assigned",
    workerId: "worker-youssef",
    costMAD: 1400,
    reportedAt: hoursAgo(5),
  },
  {
    id: "ticket-deck",
    unitId: "unit-marina-r14",
    title: "Terrace deck weatherproofing",
    description:
      "Yearly UV and salt-air sealing of the teak terrace. The residence is closed while the oil cures.",
    urgency: "low",
    status: "in_progress",
    workerId: "worker-said",
    costMAD: 1800,
    reportedAt: hoursAgo(26),
    blockedFrom: daysFromToday(-1),
    blockedUntil: daysFromToday(2),
  },
  {
    id: "ticket-curtains",
    unitId: "unit-skyline-ph21",
    title: "Motorized blackout curtain track",
    description: "Master bedroom right panel catches on the ceiling recess.",
    urgency: "medium",
    status: "in_progress",
    workerId: "worker-youssef",
    costMAD: 1200,
    reportedAt: hoursAgo(30),
  },
  {
    id: "ticket-shower",
    unitId: "unit-oudaya-zellige",
    title: "Leaking shower mixer",
    description: "Slow drip from the thermostatic mixer; cartridge to replace.",
    urgency: "low",
    status: "reported",
    workerId: "worker-hassan",
    costMAD: 650,
    reportedAt: hoursAgo(3),
  },
  {
    id: "ticket-water-heater",
    unitId: "unit-benali-suite",
    title: "Water heater replacement",
    description: "The 80 L water heater no longer holds temperature overnight.",
    urgency: "medium",
    status: "in_progress",
    workerId: "worker-mustapha",
    costMAD: 3200,
    reportedAt: hoursAgo(20),
  },
];

const REPAIR_TITLES: readonly { title: string; description: string; min: number; max: number }[] = [
  {
    title: "Pool pump service",
    description: "Pump seal and filter replaced.",
    min: 900,
    max: 2400,
  },
  {
    title: "Irrigation pressure booster",
    description: "Secondary manifold pump replaced.",
    min: 1800,
    max: 3400,
  },
  {
    title: "Kitchen extractor repair",
    description: "Fan motor replaced and ducts cleaned.",
    min: 600,
    max: 1500,
  },
  {
    title: "Zellige grout restoration",
    description: "Courtyard grout cleaned and resealed.",
    min: 1200,
    max: 3000,
  },
  {
    title: "Smart lock battery and firmware",
    description: "Lock batteries replaced, firmware updated.",
    min: 300,
    max: 700,
  },
  {
    title: "Bathroom silicone reseal",
    description: "Shower and vanity resealed.",
    min: 400,
    max: 950,
  },
  {
    title: "Air conditioning service",
    description: "Filters cleaned and gas topped up.",
    min: 700,
    max: 1800,
  },
  {
    title: "Wooden shutter repair",
    description: "Hinges replaced on two shutters.",
    min: 500,
    max: 1300,
  },
];

const TECHNICIANS = ["worker-youssef", "worker-fatima", "worker-hassan", "worker-said"] as const;

/** One or two resolved repairs a month over the last year, spread across STR and LTR units. */
function resolvedHistory(): TicketSeed[] {
  const random = createRandom(4242);
  const atlasUnits = MOCK_UNITS.filter((item) =>
    MOCK_PROPERTIES.some((p) => p.id === item.propertyId && p.accountId === ACCOUNT_IDS.atlas),
  );
  const benaliUnits = MOCK_UNITS.filter((item) =>
    MOCK_PROPERTIES.some((p) => p.id === item.propertyId && p.accountId === ACCOUNT_IDS.benali),
  );
  const seeds: TicketSeed[] = [];

  lastMonths(12, MOCK_TODAY).forEach((month, monthIndex) => {
    const monthStart = parseDay(`${month}-01`);
    const count = random.int(1, 3);
    for (let index = 0; index < count; index += 1) {
      const repair = random.pick(REPAIR_TITLES);
      const isBenali = index === 0 && monthIndex >= 10;
      const target = random.pick(isBenali ? benaliUnits : atlasUnits);
      const reported = addDays(monthStart, random.int(0, 20));
      if (reported >= MOCK_TODAY) continue;
      if (isBenali && toISODate(reported) < SIGNUP_DAYS[ACCOUNT_IDS.benali]) continue;
      const resolved = addDays(reported, random.int(0, 3));
      if (resolved >= MOCK_TODAY) continue;
      seeds.push({
        id: `ticket-${month}-${index}`,
        unitId: target.id,
        title: repair.title,
        description: repair.description,
        urgency: random.pick(["low", "low", "medium", "critical"] as const),
        status: "resolved",
        workerId: isBenali ? "worker-mustapha" : random.pick(TECHNICIANS),
        costMAD: Math.round(random.int(repair.min, repair.max) / 50) * 50,
        reportedAt: atCasablancaTime(toISODate(reported), "09:30"),
        resolvedAt: atCasablancaTime(toISODate(resolved), "17:00"),
      });
    }
  });

  seeds.push({
    id: "ticket-irrigation-recent",
    unitId: "unit-zitouna-estate",
    title: "Orange grove irrigation pump",
    description: "Secondary manifold pump replaced before the weekend.",
    urgency: "low",
    status: "resolved",
    workerId: "worker-hassan",
    costMAD: 3100,
    reportedAt: hoursAgo(52),
    resolvedAt: hoursAgo(22),
  });
  return seeds;
}

export const MOCK_TICKETS: readonly MaintenanceTicket[] = [
  ...OPEN_TICKETS,
  ...resolvedHistory(),
].map((seed) => ({ ...seed, photos: seed.photos ?? photosFor(seed.unitId) }));

type PropertyCosts = {
  propertyId: string;
  housekeeper: string;
  housekeeping: number;
  technician: string;
  retainer: number;
  utilities: Partial<Record<UtilityType, { payee: string; amount: number }>>;
};

const ATLAS_COSTS: PropertyCosts[] = [
  {
    propertyId: "prop-aurora",
    housekeeper: "worker-khadija",
    housekeeping: 5400,
    technician: "worker-fatima",
    retainer: 1000,
    utilities: {
      electricity: { payee: "Radeema", amount: 2850 },
      water: { payee: "Radeema", amount: 950 },
      internet: { payee: "Maroc Telecom", amount: 650 },
    },
  },
  {
    propertyId: "prop-marina",
    housekeeper: "worker-khadija",
    housekeeping: 3600,
    technician: "worker-said",
    retainer: 900,
    utilities: {
      electricity: { payee: "Lydec", amount: 2100 },
      water: { payee: "Lydec", amount: 780 },
      internet: { payee: "inwi", amount: 550 },
    },
  },
  {
    propertyId: "prop-anfa",
    housekeeper: "worker-khadija",
    housekeeping: 1200,
    technician: "worker-said",
    retainer: 900,
    utilities: {
      electricity: { payee: "Lydec", amount: 900 },
      water: { payee: "Lydec", amount: 420 },
    },
  },
  {
    propertyId: "prop-garden",
    housekeeper: "worker-aicha",
    housekeeping: 4800,
    technician: "worker-fatima",
    retainer: 1000,
    utilities: {
      electricity: { payee: "Radeema", amount: 2400 },
      water: { payee: "Radeema", amount: 1100 },
      gas: { payee: "Afriquia Gaz", amount: 1400 },
      internet: { payee: "Maroc Telecom", amount: 650 },
    },
  },
  {
    propertyId: "prop-zitouna",
    housekeeper: "worker-aicha",
    housekeeping: 6500,
    technician: "worker-hassan",
    retainer: 1100,
    utilities: {
      electricity: { payee: "Radeema", amount: 3200 },
      water: { payee: "Radeema", amount: 1250 },
      gas: { payee: "Afriquia Gaz", amount: 900 },
      internet: { payee: "Maroc Telecom", amount: 650 },
    },
  },
  {
    propertyId: "prop-oudaya",
    housekeeper: "worker-aicha",
    housekeeping: 2600,
    technician: "worker-hassan",
    retainer: 1100,
    utilities: {
      electricity: { payee: "Redal", amount: 1100 },
      water: { payee: "Redal", amount: 480 },
      internet: { payee: "inwi", amount: 450 },
    },
  },
  {
    propertyId: "prop-skyline",
    housekeeper: "worker-aicha",
    housekeeping: 3900,
    technician: "worker-youssef",
    retainer: 1200,
    utilities: {
      electricity: { payee: "Lydec", amount: 2300 },
      water: { payee: "Lydec", amount: 690 },
      internet: { payee: "Maroc Telecom", amount: 650 },
    },
  },
  {
    propertyId: "prop-malabata",
    housekeeper: "worker-khadija",
    housekeeping: 3000,
    technician: "worker-youssef",
    retainer: 1200,
    utilities: {
      electricity: { payee: "Amendis", amount: 1650 },
      water: { payee: "Amendis", amount: 720 },
      internet: { payee: "inwi", amount: 450 },
    },
  },
];

const BENALI_COSTS: PropertyCosts[] = [
  {
    propertyId: "prop-palmeraie",
    housekeeper: "worker-naima",
    housekeeping: 3200,
    technician: "worker-mustapha",
    retainer: 2600,
    utilities: {
      electricity: { payee: "Radeema", amount: 2600 },
      water: { payee: "Radeema", amount: 1150 },
      internet: { payee: "Maroc Telecom", amount: 650 },
    },
  },
  {
    propertyId: "prop-dar-benali",
    housekeeper: "worker-naima",
    housekeeping: 1400,
    technician: "worker-mustapha",
    retainer: 800,
    utilities: {
      electricity: { payee: "Amendis", amount: 950 },
      water: { payee: "Amendis", amount: 410 },
    },
  },
];

/** Summer air conditioning and winter heating move the energy bills. */
const ENERGY_SEASON = [1.1, 1.05, 0.95, 0.9, 1.0, 1.15, 1.3, 1.35, 1.15, 0.95, 0.95, 1.05];

/** Bills left unpaid after their due date, and bills settled by direct debit as soon as they arrive. */
const OVERDUE_BILLS = new Set(["prop-aurora:water", "prop-garden:gas"]);
const AUTOPAY_BILLS = new Set(["prop-skyline:internet"]);

const SUPPLIES: readonly { payee: string; description: string; min: number; max: number }[] = [
  { payee: "Atlas Linen Supply", description: "Bed linen and towels", min: 1800, max: 4800 },
  { payee: "Souk Amenities Co.", description: "Guest amenities restock", min: 900, max: 2200 },
  { payee: "Pool Care Maroc", description: "Pool chemicals", min: 600, max: 1400 },
  { payee: "Clean Pro Maroc", description: "Cleaning products", min: 500, max: 1200 },
];

function generateExpenses(): Expense[] {
  const random = createRandom(9001);
  const expenses: Expense[] = [];
  const months = lastMonths(12, MOCK_TODAY);
  const currentMonth = months[months.length - 1];
  const accountOf = (propertyId: string) =>
    MOCK_PROPERTIES.find((property) => property.id === propertyId)?.accountId ?? ACCOUNT_IDS.atlas;

  for (const costs of [...ATLAS_COSTS, ...BENALI_COSTS]) {
    const accountId = accountOf(costs.propertyId);
    const signupMonth = SIGNUP_DAYS[accountId as keyof typeof SIGNUP_DAYS].slice(0, 7);
    for (const month of months) {
      if (month < signupMonth) continue;
      const monthStart = parseDay(`${month}-01`);
      const isCurrent = month === currentMonth;
      const monthEnd = toISODate(endOfMonth(monthStart));
      // The plumber is paid in advance, so his balance is already cleared this month
      const paidEarly = (workerId: string) => workerId === "worker-hassan";

      for (const [workerId, amount, label] of [
        [costs.housekeeper, costs.housekeeping, "Housekeeping and turnovers"],
        [costs.technician, costs.retainer, "Maintenance retainer"],
      ] as const) {
        const pending = isCurrent && !paidEarly(workerId);
        expenses.push({
          id: `exp-pay-${costs.propertyId}-${workerId}-${month}`,
          accountId,
          propertyId: costs.propertyId,
          category: "workerPay",
          payee: MOCK_WORKERS.find((worker) => worker.id === workerId)?.name ?? workerId,
          workerId,
          description: label,
          amountMAD: amount,
          date: toISODate(monthStart),
          status: pending ? "pending" : "paid",
          ...(pending ? {} : { paidAt: isCurrent ? toISODate(addDays(MOCK_TODAY, -2)) : monthEnd }),
        });
      }

      for (const [type, bill] of Object.entries(costs.utilities) as [
        UtilityType,
        { payee: string; amount: number },
      ][]) {
        // Bills arrive on the 1st for the previous month and are due 15 days later
        const billDate = monthStart;
        if (billDate > MOCK_TODAY) continue;
        const dueDate = addDays(billDate, 15);
        const seasonal =
          type === "electricity" || type === "gas"
            ? (ENERGY_SEASON[monthStart.getMonth()] ?? 1)
            : 1;
        const amount =
          Math.round((bill.amount * seasonal * (0.94 + random.next() * 0.12)) / 10) * 10;
        const isOverdue =
          OVERDUE_BILLS.has(`${costs.propertyId}:${type}`) &&
          dueDate < MOCK_TODAY &&
          dueDate >= addDays(MOCK_TODAY, -31);
        const autoPaid = AUTOPAY_BILLS.has(`${costs.propertyId}:${type}`);
        const pending = isOverdue || (dueDate >= MOCK_TODAY && !autoPaid);
        const paidAt = addDays(billDate, random.int(3, 12));
        expenses.push({
          id: `exp-util-${costs.propertyId}-${type}-${month}`,
          accountId,
          propertyId: costs.propertyId,
          category: "utility",
          payee: bill.payee,
          utilityType: type,
          description: `${type} bill`,
          amountMAD: amount,
          date: toISODate(billDate),
          dueDate: toISODate(dueDate),
          status: pending ? "pending" : "paid",
          ...(pending ? {} : { paidAt: toISODate(paidAt > MOCK_TODAY ? MOCK_TODAY : paidAt) }),
        });
      }
    }
  }

  // Supplies: a couple of purchases a month across the Atlas and Benali properties
  for (const month of months) {
    const monthStart = startOfMonth(parseDay(`${month}-01`));
    for (let index = 0; index < 3; index += 1) {
      const day = addDays(monthStart, random.int(1, 26));
      if (day > MOCK_TODAY) continue;
      const supply = random.pick(SUPPLIES);
      const costs = random.pick([...ATLAS_COSTS, ...ATLAS_COSTS, ...BENALI_COSTS]);
      const accountId = accountOf(costs.propertyId);
      if (toISODate(day) < SIGNUP_DAYS[accountId as keyof typeof SIGNUP_DAYS]) continue;
      expenses.push({
        id: `exp-other-${month}-${index}`,
        accountId,
        propertyId: costs.propertyId,
        category: "other",
        payee: supply.payee,
        description: supply.description,
        amountMAD: Math.round(random.int(supply.min, supply.max) / 50) * 50,
        date: toISODate(day),
        status: "paid",
        paidAt: toISODate(day),
      });
    }
  }

  return expenses.sort((a, b) => a.date.localeCompare(b.date));
}

export const MOCK_EXPENSES: readonly Expense[] = generateExpenses();
