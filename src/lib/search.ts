/** True when every word the user typed appears somewhere in the given fields. */
export function matchesQuery(query: string, ...fields: (string | number | null | undefined)[]) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fields.join(" ").toLowerCase();
  return words.every((word) => haystack.includes(word));
}
