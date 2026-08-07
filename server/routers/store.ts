import { z } from "zod";
import * as db from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getStripe, isStripeConfigured } from "../stripe";
import { PAYMENT_METHODS } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

/** Minimum order total in cents ($100). */
export const MINIMUM_ORDER_CENTS = 10000;

/** A visitor is "new" if their ID has never been seen within this window. */
const NEW_VISITOR_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Throttle owner notifications to at most one per 15 minutes. */
const VISITOR_NOTIF_COOLDOWN_MS = 15 * 60 * 1000;

const cartItemInput = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(999),
});

export const storeRouter = router({
  /** Public product catalog with optional category + search filters. */
  products: publicProcedure
    .input(
      z
        .object({
          categoryId: z.number().int().positive().nullish(),
          search: z.string().trim().max(200).nullish(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      let products = await db.listProducts();
      if (input?.categoryId) {
        products = products.filter(p => p.categoryId === input.categoryId);
      }
      if (input?.search) {
        const q = input.search.toLowerCase();
        products = products.filter(
          p =>
            p.title.toLowerCase().includes(q) ||
            (p.description ?? "").toLowerCase().includes(q),
        );
      }
      return products;
    }),

  product: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const product = await db.getProductById(input.id);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      return product;
    }),

  categories: publicProcedure.query(() => db.listCategories()),

  /** Public storefront settings (safe subset). */
  settings: publicProcedure.query(async () => {
    const all = await db.getAllSettings();
    return {
      whatsappNumber: all.whatsappNumber ?? "650294923",
      contactEmail: all.contactEmail || "peyoteseedsfarm@gmail.com",
      storeName: all.storeName ?? "Peyote Seeds Farm",
      onlinePaymentsEnabled: all.onlinePaymentsEnabled === "true",
      stripeConfigured: isStripeConfigured(),
      paymentMethods: [...PAYMENT_METHODS],
      minimumOrderCents: MINIMUM_ORDER_CENTS,
    };
  }),

  /**
   * Place an order via the online checkout form. Collects full customer details
   * and the chosen payment method, enforces the $100 minimum, and logs the
   * order as pending so the admin can follow up with payment instructions.
   */
  placeOrder: publicProcedure
    .input(
      z.object({
        items: z.array(cartItemInput).min(1),
        customerName: z.string().trim().min(1, "Name is required").max(255),
        customerEmail: z.string().trim().email("A valid email is required").max(320),
        customerPhone: z.string().trim().min(5, "Phone number is required").max(64),
        shippingAddress: z.string().trim().min(5, "Shipping address is required").max(1000),
        billingAddress: z.string().trim().min(5, "Billing address is required").max(1000),
        paymentMethod: z.enum(PAYMENT_METHODS),
      }),
    )
    .mutation(async ({ input }) => {
      const allSettings = await db.getAllSettings();

      // Re-price server-side from the database — never trust client prices.
      const lineItems: { title: string; unitPriceCents: number; quantity: number; productId: number }[] = [];
      for (const item of input.items) {
        const product = await db.getProductById(item.productId);
        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: `Product ${item.productId} no longer exists` });
        }
        lineItems.push({
          productId: product.id,
          title: product.title,
          unitPriceCents: product.priceCents,
          quantity: item.quantity,
        });
      }
      const totalCents = lineItems.reduce((sum, li) => sum + li.unitPriceCents * li.quantity, 0);
      if (totalCents < MINIMUM_ORDER_CENTS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Minimum order amount is $100.00",
        });
      }

      const orderId = await db.createOrder(
        {
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          shippingAddress: input.shippingAddress,
          billingAddress: input.billingAddress,
          paymentMethod: input.paymentMethod,
          totalCents,
          paymentStatus: "pending",
          stripeSessionId: null,
        },
        lineItems,
      );

      return {
        orderId,
        totalCents,
        items: lineItems,
        contactEmail: allSettings.contactEmail || "peyoteseedsfarm@gmail.com",
        paymentMethod: input.paymentMethod,
      };
    }),

  /** Approved reviews for the public Reviews page. */
  reviews: publicProcedure.query(() => db.listApprovedReviews()),

  /** Customers submit a review; it stays hidden until the admin approves it. */
  submitReview: publicProcedure
    .input(
      z.object({
        authorName: z.string().trim().min(1, "Name is required").max(191),
        rating: z.number().int().min(1).max(5),
        content: z.string().trim().min(5, "Review is too short").max(2000),
      }),
    )
    .mutation(async ({ input }) => {
      const id = await db.createReview({
        authorName: input.authorName,
        rating: input.rating,
        content: input.content,
        status: "pending",
      });
      return { id };
    }),

  /**
   * Email-based "Pay Online Now" fallback (used while Stripe is not configured).
   * Logs the order as pending and returns the details needed to build a
   * pre-filled mailto: payment request to the store's contact email.
   */
  createEmailPaymentRequest: publicProcedure
    .input(
      z.object({
        items: z.array(cartItemInput).min(1),
        customerName: z.string().trim().max(255).optional(),
        customerEmail: z.string().trim().email().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const allSettings = await db.getAllSettings();
      if (allSettings.onlinePaymentsEnabled !== "true") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Online payments are currently disabled",
        });
      }

      // Re-price server-side from the database — never trust client prices.
      const lineItems: { title: string; unitPriceCents: number; quantity: number; productId: number }[] = [];
      for (const item of input.items) {
        const product = await db.getProductById(item.productId);
        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: `Product ${item.productId} no longer exists` });
        }
        lineItems.push({
          productId: product.id,
          title: product.title,
          unitPriceCents: product.priceCents,
          quantity: item.quantity,
        });
      }
      const totalCents = lineItems.reduce((sum, li) => sum + li.unitPriceCents * li.quantity, 0);

      await db.createOrder(
        {
          customerName: input.customerName ?? null,
          customerEmail: input.customerEmail ?? null,
          totalCents,
          paymentStatus: "pending",
          stripeSessionId: null,
        },
        lineItems,
      );

      return {
        contactEmail: allSettings.contactEmail || "peyoteseedsfarm@gmail.com",
        items: lineItems,
        totalCents,
      };
    }),

  /** Create a Stripe Checkout session from the client cart. */
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        items: z.array(cartItemInput).min(1),
        customerName: z.string().trim().max(255).optional(),
        customerEmail: z.string().trim().email().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const allSettings = await db.getAllSettings();
      if (allSettings.onlinePaymentsEnabled !== "true") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Online payments are currently disabled",
        });
      }
      if (!isStripeConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Online payments are not configured yet",
        });
      }

      // Re-price server-side from the database — never trust client prices.
      const lineItems: { title: string; unitPriceCents: number; quantity: number; productId: number }[] = [];
      for (const item of input.items) {
        const product = await db.getProductById(item.productId);
        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: `Product ${item.productId} no longer exists` });
        }
        lineItems.push({
          productId: product.id,
          title: product.title,
          unitPriceCents: product.priceCents,
          quantity: item.quantity,
        });
      }
      const totalCents = lineItems.reduce((sum, li) => sum + li.unitPriceCents * li.quantity, 0);
      if (totalCents < 50) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Minimum order value for online payment is $0.50",
        });
      }

      const stripe = getStripe();
      const origin = (ctx.req.headers.origin as string) || `${ctx.req.protocol}://${ctx.req.headers.host}`;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        allow_promotion_codes: true,
        customer_email: input.customerEmail || undefined,
        line_items: lineItems.map(li => ({
          quantity: li.quantity,
          price_data: {
            currency: "usd",
            unit_amount: li.unitPriceCents,
            product_data: { name: li.title },
          },
        })),
        metadata: {
          customer_email: input.customerEmail ?? "",
          customer_name: input.customerName ?? "",
        },
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart`,
      });

      // Log the pending order immediately; webhook flips it to "paid".
      await db.createOrder(
        {
          customerName: input.customerName ?? null,
          customerEmail: input.customerEmail ?? null,
          totalCents,
          paymentStatus: "pending",
          stripeSessionId: session.id,
        },
        lineItems,
      );

      return { url: session.url };
    }),

  /** Check payment status after returning from Stripe. */
  checkoutStatus: publicProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .query(async ({ input }) => {
      const order = await db.getOrderByStripeSessionId(input.sessionId);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      return { paymentStatus: order.paymentStatus, totalCents: order.totalCents };
    }),

  /**
   * Anonymous visit beacon. Records the page view and, when the owner has
   * enabled visitor notifications, fires a notification for genuinely new
   * visitors (ID never seen in the last 24h), throttled to one per 15 minutes.
   */
  trackVisit: publicProcedure
    .input(
      z.object({
        visitorId: z.string().trim().min(1).max(64),
        path: z.string().trim().max(500).optional().default("/"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const ip =
          (ctx.req.headers["x-forwarded-for"]?.toString().split(",")[0] ?? "").trim() ||
          (ctx.req.headers["cf-connecting-ip"]?.toString() ?? "");
        const userAgent = ctx.req.headers["user-agent"]?.toString() ?? "";
        await db.recordVisit({
          visitorId: input.visitorId,
          path: input.path,
          userAgent: userAgent.slice(0, 500),
          ip: ip.slice(0, 64) || null,
        });

        const all = await db.getAllSettings();
        if (all.visitorNotificationsEnabled !== "true") {
          return { recorded: true };
        }

        const isNew = !(await db.hasVisitorSeenWithin(input.visitorId, NEW_VISITOR_WINDOW_MS));
        const now = Date.now();
        const lastNotif = Number(all.lastVisitorNotifAt ?? 0);
        if (!isNew || now - lastNotif < VISITOR_NOTIF_COOLDOWN_MS) {
          return { recorded: true, newVisitor: isNew };
        }

        try {
          const delivered = await notifyOwner({
            title: "New visitor on your site",
            content: `A new visitor just arrived at ${input.path || "/"} (${new Date().toLocaleString()}).`,
          });
          if (delivered) {
            await db.setSetting("lastVisitorNotifAt", String(now));
          }
        } catch (e) {
          console.warn("[Visit] Owner notification failed:", e);
        }

        return { recorded: true, newVisitor: isNew, notified: true };
      } catch (e) {
        console.warn("[Visit] Tracking failed:", e);
        return { recorded: false };
      }
    }),
});
