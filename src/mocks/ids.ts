/** Shared ids so mock modules can reference each other without import cycles. */
export const ACCOUNT_IDS = {
  atlas: "acct-atlas-conciergerie",
  benali: "acct-benali",
  alami: "acct-alami",
  tazi: "acct-tazi",
  // Other platform clients, seen only from the Admin panel
  riad: "acct-riad-collection",
  elAmrani: "acct-el-amrani",
  casaPrestige: "acct-casa-prestige",
  chraibi: "acct-chraibi",
  atlantic: "acct-atlantic-keys",
  laurent: "acct-laurent",
} as const;

export const PLATFORM_ACCOUNT_ID = "platform";

export const USER_IDS = {
  admin: "user-admin",
  conciergerie: "user-conciergerie",
  owner: "user-owner",
  ownerRachid: "user-owner-rachid",
  ownerClaire: "user-owner-claire",
  soloOwner: "user-solo-owner",
  tenant: "user-tenant",
  alami: "user-alami",
  banned: "user-banned",
  riad: "user-riad",
  elAmrani: "user-el-amrani",
  casaPrestige: "user-casa-prestige",
  chraibi: "user-chraibi",
  atlantic: "user-atlantic",
  laurent: "user-laurent",
} as const;
