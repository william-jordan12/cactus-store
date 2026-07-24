/** Format integer cents as a USD price string, e.g. 1250 -> "$12.50". */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Parse a user-entered dollar amount (e.g. "12.50") into integer cents. */
export function parsePriceToCents(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

