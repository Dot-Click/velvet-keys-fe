import type { Account, AccountType } from "@/types/account";
import type { AccountStatus, AppLanguage } from "@/types/auth";
import { computeFreeSyncUntil, computeLaunchOffer } from "@/lib/billing";
import { ACCOUNT_IDS, USER_IDS } from "./ids";
import { LAUNCH_DEADLINE } from "./platform";
import { MOCK_PROPERTIES, MOCK_UNITS, SIGNUP_DAYS } from "./properties";
import { atCasablancaTime } from "./seed";

function unitMix(accountId: string) {
  const propertyIds = new Set(
    MOCK_PROPERTIES.filter((property) => property.accountId === accountId).map((p) => p.id),
  );
  const units = MOCK_UNITS.filter((unit) => propertyIds.has(unit.propertyId));
  return {
    hasStr: units.some((unit) => unit.typeHistory.some((period) => period.type === "STR")),
    hasLtr: units.some((unit) => unit.typeHistory.some((period) => period.type === "LTR")),
    hasSync: units.some((unit) => unit.channelConnection),
  };
}

function account(input: {
  id: string;
  type: AccountType;
  holderUserId: string;
  name: string;
  status: AccountStatus;
  language: AppLanguage;
  issuerProfile?: Account["issuerProfile"];
}): Account {
  const signupDate = atCasablancaTime(SIGNUP_DAYS[input.id as keyof typeof SIGNUP_DAYS]);
  const mix = unitMix(input.id);
  const { issuerProfile, ...rest } = input;
  return {
    ...rest,
    ...(issuerProfile ? { issuerProfile } : {}),
    signupDate,
    launchOffer: computeLaunchOffer({ signupDate, launchDeadline: LAUNCH_DEADLINE, ...mix }),
    // Every client so far signed up among the first 200 synced units platform-wide
    ...(mix.hasSync ? { freeSyncUntil: computeFreeSyncUntil(signupDate) } : {}),
  };
}

/** The client accounts an Admin sees; the first four are the demo sign-in accounts. */
export const MOCK_ACCOUNTS: readonly Account[] = [
  account({
    id: ACCOUNT_IDS.atlas,
    type: "conciergerie",
    holderUserId: USER_IDS.conciergerie,
    name: "Atlas Conciergerie",
    status: "active",
    language: "fr",
    issuerProfile: {
      name: "Atlas Conciergerie SARL",
      address: "45 Boulevard d'Anfa, 20050 Casablanca",
      ice: "002345678000091",
      rib: "011 780 0000123456789012 34",
    },
  }),
  account({
    id: ACCOUNT_IDS.benali,
    type: "owner",
    holderUserId: USER_IDS.soloOwner,
    name: "Karim Benali",
    status: "active",
    language: "fr",
    issuerProfile: {
      name: "Karim Benali",
      address: "12 Rue de la Kasbah, 90000 Tangier",
      rib: "230 640 0000987654321098 76",
    },
  }),
  account({
    id: ACCOUNT_IDS.alami,
    type: "owner",
    holderUserId: USER_IDS.alami,
    name: "Hicham Alami",
    // Subscription invoice overdue past day 8
    status: "readonly",
    language: "fr",
  }),
  account({
    id: ACCOUNT_IDS.tazi,
    type: "conciergerie",
    holderUserId: USER_IDS.banned,
    name: "Tazi Gestion",
    status: "banned",
    language: "fr",
  }),
  // Other platform clients, seen only from the Admin panel
  account({
    id: ACCOUNT_IDS.riad,
    type: "conciergerie",
    holderUserId: USER_IDS.riad,
    name: "Riad Collection",
    status: "active",
    language: "fr",
  }),
  account({
    id: ACCOUNT_IDS.elAmrani,
    type: "owner",
    holderUserId: USER_IDS.elAmrani,
    name: "Nadia El Amrani",
    status: "active",
    language: "ar",
  }),
  account({
    id: ACCOUNT_IDS.casaPrestige,
    type: "conciergerie",
    holderUserId: USER_IDS.casaPrestige,
    name: "Casa Prestige Services",
    status: "active",
    language: "fr",
  }),
  account({
    id: ACCOUNT_IDS.chraibi,
    type: "owner",
    holderUserId: USER_IDS.chraibi,
    name: "Omar Chraibi",
    status: "active",
    language: "ar",
  }),
  account({
    id: ACCOUNT_IDS.atlantic,
    type: "conciergerie",
    holderUserId: USER_IDS.atlantic,
    name: "Atlantic Keys Agadir",
    status: "active",
    language: "en",
  }),
  account({
    id: ACCOUNT_IDS.laurent,
    type: "owner",
    holderUserId: USER_IDS.laurent,
    name: "Thomas Laurent",
    status: "active",
    language: "en",
  }),
];

export function findMockAccount(id: string) {
  return MOCK_ACCOUNTS.find((item) => item.id === id);
}
