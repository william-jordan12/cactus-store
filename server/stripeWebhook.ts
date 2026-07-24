import type { Express } from "express";
import express from "express";
import { getStripe, isStripeConfigured } from "./stripe";
import * as db from "./db";

/**
 * Registers the Stripe webhook route. MUST be registered before express.json()
 * so that signature verification receives the raw body.
 */
export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      if (!isStripeConfigured()) {
        return res.status(503).json({ error: "Stripe not configured" });
      }
      const stripe = getStripe();
      const signature = req.headers["stripe-signature"] as string | undefined;
      const webhookSecret =
        process.env.STORE_STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

      let event;
      try {
        if (webhookSecret && signature) {
          event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
        } else {
          event = JSON.parse(req.body.toString());
        }
      } catch (err) {
        console.error("[Webhook] Signature verification failed:", err);
        return res.status(400).json({ error: "Invalid signature" });
      }

      // Test events must return this exact verification response.
      if (typeof event.id === "string" && event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      try {
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as {
            id: string;
            customer_details?: { name?: string | null; email?: string | null } | null;
            metadata?: Record<string, string> | null;
            payment_status?: string;
          };
          const name = session.customer_details?.name || session.metadata?.customer_name || null;
          const email = session.customer_details?.email || session.metadata?.customer_email || null;
          await db.updateOrderByStripeSessionId(session.id, {
            paymentStatus: session.payment_status === "paid" ? "paid" : "pending",
            customerName: name,
            customerEmail: email,
          });
          console.log(`[Webhook] Order for session ${session.id} marked paid`);
        } else if (
          event.type === "checkout.session.expired" ||
          event.type === "checkout.session.async_payment_failed"
        ) {
          const session = event.data.object as { id: string };
          await db.updateOrderByStripeSessionId(session.id, { paymentStatus: "failed" });
        }
      } catch (err) {
        console.error("[Webhook] Handler error:", err);
        return res.status(500).json({ error: "Webhook handler error" });
      }

      return res.json({ received: true });
    },
  );
}
