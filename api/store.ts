import { z } from "zod";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { HttpPgPool } from "./pgClient";

const t = initTRPC.create({ transformer: superjson });
const publicProcedure = t.procedure;

function dbUrl(): string | undefined {
  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL
  );
}

let _pool: HttpPgPool | null = null;
function pool(): HttpPgPool {
  const url = dbUrl();
  if (!url) throw new Error("Database not configured");
  if (!_pool) _pool = new HttpPgPool(url);
  return _pool;
}

async function q<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const r = await pool().query(sql, params);
  return (r.rows as T[]) ?? [];
}

function mapProduct(r: any) {
  return {
    id: r.id,
    title: r.title,
    imageUrl: r.imageUrl,
    images: r.images ?? null,
    priceCents: r.priceCents,
    priceEndCents: r.priceEndCents,
    inStock: !!r.inStock,
    isVariable: !!r.isVariable,
    variants: r.variants ?? null,
    categoryId: r.categoryId,
    description: r.description,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

const CART_ITEM = z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(999) });
const PAYMENT_METHODS = [
  "Cash App", "PayPal", "Venmo", "Zelle", "Bitcoin", "Apple Pay", "Chime",
  "Bank transfer", "Cryptocurrency", "Stripe",
];

export const appRouter = t.router({
  store: t.router({
    products: publicProcedure
      .input(
        z.object({ categoryId: z.number().int().positive().nullish(), search: z.string().trim().max(200).nullish() }).optional()
      )
      .query(async ({ input }) => {
        let rows = await q(
          `SELECT id, title, "imageUrl", images, description, "priceCents", "priceEndCents", "inStock", "isVariable", variants, "categoryId", "createdAt", "updatedAt" FROM products ORDER BY "createdAt" DESC`
        );
        let products = rows.map(mapProduct);
        if (input?.categoryId) products = products.filter(p => p.categoryId === input.categoryId);
        if (input?.search) {
          const qq = input.search.toLowerCase();
          products = products.filter(p =>
            p.title.toLowerCase().includes(qq) || (p.description ?? "").toLowerCase().includes(qq)
          );
        }
        return products;
      }),

    product: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        const rows = await q<any>(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [input.id]);
        const p = rows[0];
        if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        return mapProduct(p);
      }),

    categories: publicProcedure.query(async () => {
      return q<any>(`SELECT id, name, "createdAt" FROM categories ORDER BY name`).then(rows =>
        rows.map(r => ({ id: r.id, name: r.name, createdAt: new Date(r.createdAt) }))
      );
    }),

    settings: publicProcedure.query(async () => {
      const rows = await q<any>(`SELECT key, value FROM settings`);
      const all: Record<string, string> = {};
      for (const row of rows) all[row.key] = row.value ?? "";
      return {
        whatsappNumber: all.whatsappNumber ?? "650294923",
        contactEmail: all.contactEmail || "peyoteseedsfarm@gmail.com",
        storeName: all.storeName ?? "Peyote Seeds Farm",
        onlinePaymentsEnabled: all.onlinePaymentsEnabled === "true",
        stripeConfigured: false,
        paymentMethods: [...PAYMENT_METHODS],
        minimumOrderCents: 10000,
      };
    }),

    reviews: publicProcedure.query(async () => {
      return q<any>(
        `SELECT id, "authorName", rating, content, "createdAt" FROM reviews WHERE status = 'approved' ORDER BY "createdAt" DESC`
      ).then(rows => rows.map(r => ({
        id: r.id,
        authorName: r.authorName,
        rating: r.rating,
        content: r.content,
        createdAt: new Date(r.createdAt),
      })));
    }),

    trackVisit: publicProcedure
      .input(z.object({ visitorId: z.string().trim().min(1).max(64), path: z.string().trim().max(500).optional().default("/") }))
      .mutation(async () => ({ recorded: true })),

    placeOrder: publicProcedure
      .input(z.object({
        items: z.array(CART_ITEM).min(1),
        customerName: z.string().trim().min(1).max(255),
        customerEmail: z.string().trim().email().max(320),
        customerPhone: z.string().trim().min(5).max(64),
        shippingAddress: z.string().trim().min(5).max(1000),
        billingAddress: z.string().trim().min(5).max(1000),
        paymentMethod: z.enum(PAYMENT_METHODS as any),
      }))
      .mutation(async ({ input }) => {
        const lines: { title: string; unitPriceCents: number; quantity: number; productId: number }[] = [];
        for (const item of input.items) {
          const rows = await q<any>(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [item.productId]);
          const p = rows[0];
          if (!p) throw new TRPCError({ code: "NOT_FOUND", message: `Product ${item.productId} no longer exists` });
          lines.push({ productId: p.id, title: p.title, unitPriceCents: p.priceCents, quantity: item.quantity });
        }
        const totalCents = lines.reduce((s, li) => s + li.unitPriceCents * li.quantity, 0);
        const order = await pool().query(
          `INSERT INTO orders ("customerName", "customerEmail", "customerPhone", "shippingAddress", "billingAddress", "paymentMethod", "totalCents", "paymentStatus") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
          [input.customerName, input.customerEmail, input.customerPhone, input.shippingAddress, input.billingAddress, input.paymentMethod, totalCents, "pending"]
        );
        const orderId = (order.rows as any[])[0].id;
        for (const li of lines) {
          await pool().query(
            `INSERT INTO "orderItems" ("orderId", "productId", title, "unitPriceCents", quantity) VALUES ($1,$2,$3,$4,$5)`,
            [orderId, li.productId, li.title, li.unitPriceCents, li.quantity]
          );
        }
        return { orderId, totalCents, items: lines, contactEmail: "peyoteseedsfarm@gmail.com", paymentMethod: input.paymentMethod };
      }),
  }),
});

export type AppRouter = typeof appRouter;