import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STORE_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STORE_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("Stripe is not configured (missing STORE_STRIPE_SECRET_KEY)");
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}
