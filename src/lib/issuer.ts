/** A Moroccan RIB has 24 digits: bank, city, account number and key. */
export const RIB_DIGITS = 24;

/** The ICE (Identifiant Commun de l'Entreprise) has 15 digits. */
export const ICE_DIGITS = 15;

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidRib(value: string) {
  return /^[\d\s]+$/.test(value.trim()) && digitsOnly(value).length === RIB_DIGITS;
}

export function isValidIce(value: string) {
  return /^[\d\s]+$/.test(value.trim()) && digitsOnly(value).length === ICE_DIGITS;
}

/** RIB grouped the way banks print it: 3 · 3 · 16 · 2 digits. */
export function formatRib(value: string) {
  const digits = digitsOnly(value);
  if (digits.length !== RIB_DIGITS) return value.trim();
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 22)} ${digits.slice(22)}`;
}

/** Structural shape shared by the old mock IssuerProfile (non-null strings) and the real
 *  backend's (nullable until the manager saves one). */
export interface IssuerProfileLike {
  name: string | null;
  address: string | null;
  ice?: string | null;
  rib: string | null;
}

/** Rent invoices need a name, an address and a valid RIB tenants can pay into; ICE is optional. */
export function isIssuerProfileComplete<T extends IssuerProfileLike>(
  profile: T | undefined,
): profile is T {
  return Boolean(
    profile &&
    profile.name?.trim() &&
    profile.address?.trim() &&
    profile.rib &&
    isValidRib(profile.rib) &&
    (!profile.ice || isValidIce(profile.ice)),
  );
}
