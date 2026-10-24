import { propertyImages, unitImages } from "@/assets/manifest";

export type MediaKind = "property" | "unit";
export type PropertyVariant = "hero" | "card" | "thumb";
export type UnitVariant = "card" | "thumb";

/** Articles and elisions skipped when building initials ("The Aurora" → "A"). */
const SKIPPED_WORDS = new Set(["the", "la", "le", "les", "de", "du", "des", "of"]);

/**
 * Up to two initials from a name. A token starting with a digit is kept whole, so units read
 * "P4A" for "Penthouse 4A" rather than "P4".
 */
export function initialsOf(name: string) {
  const words = name
    .split(/\s+/)
    .map((word) => word.replace(/^[dlDL][’']/, ""))
    .filter((word) => word && !SKIPPED_WORDS.has(word.toLowerCase()));
  return words
    .slice(0, 2)
    .map((word) => (/^\d/.test(word) ? word.slice(0, 3) : (word[0] ?? "")))
    .join("")
    .toUpperCase();
}

/** Photos people add through the upload fields are kept as data URLs (blob URLs while previewing). */
export function isUploadedImage(value: string | null | undefined): value is string {
  return Boolean(value && /^(data|blob):/.test(value));
}

/** Manifest file and blur preview for one entity, or nulls while the media is not delivered. */
export function mediaSource(kind: MediaKind, id: string, variant: PropertyVariant) {
  if (kind === "property") {
    const entry = propertyImages[id];
    return { src: entry?.[variant] ?? null, lqip: entry?.lqip ?? null };
  }
  const entry = unitImages[id];
  // Units have no hero; a hero request falls back to the portrait card
  const unitVariant: UnitVariant = variant === "thumb" ? "thumb" : "card";
  return { src: entry?.[unitVariant] ?? null, lqip: entry?.lqip ?? null };
}
