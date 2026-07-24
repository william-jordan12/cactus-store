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
}
