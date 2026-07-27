import type { ProductVariant } from "../../../shared/types";

/** Format integer cents as a USD price string, e.g. 1250 -> "$12.50". */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Format a price range, e.g. (1250, 2500) -> "$12.50 – $25.00". */
export function formatPriceRange(startCents: number, endCents: number): string {
  return `${formatPrice(startCents)} – ${formatPrice(endCents)}`;
}

/** Parse a user-entered dollar amount (e.g. "12.50") into integer cents. */
export function parsePriceToCents(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

/** Parse the variants JSON stored in a product row. Returns empty array if missing/invalid. */
export function parseVariants(json: string | null | undefined): ProductVariant[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

/** Compute the price range from a list of variants. Returns [min, max] in cents. */
export function variantPriceRange(variants: ProductVariant[]): [number, number] | null {
  if (variants.length === 0) return null;
  const prices = variants.map(v => v.priceCents).filter(p => p > 0);
  if (prices.length === 0) return null;
  return [Math.min(...prices), Math.max(...prices)];
}

/** Display price for a product: range if variable, single price otherwise. */
export function displayPrice(
  priceCents: number,
  isVariable: boolean,
  variants: ProductVariant[],
): { text: string; range: [number, number] | null } {
  if (isVariable && variants.length > 0) {
    const range = variantPriceRange(variants);
    if (range) {
      return {
        text: range[0] === range[1] ? formatPrice(range[0]) : formatPriceRange(range[0], range[1]),
        range,
      };
    }
  }
  return { text: formatPrice(priceCents), range: null };
}

