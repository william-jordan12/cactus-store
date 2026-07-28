/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";
/** Cart line item stored client-side (localStorage). */
export interface CartItem {
  productId: number;
  title: string;
  imageUrl: string | null;
  priceCents: number;
  quantity: number;
  /** For variable products: the selected variant name. */
  variantName?: string;
}

/** A sub-product (variant) within a variable product. */
export interface ProductVariant {
  id: string;
  name: string;
  imageUrl: string;
  priceCents: number;
}
