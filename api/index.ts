import express from "express";
import type { Request } from "express";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { z } from "zod";
import { SignJWT, jwtVerify } from "jose";

// ---------- DB client (plain fetch to Neon SQL-over-HTTP) ----------
interface HttpPgResult { rows: any[]; rowCount: number | null; fields: { name: string }[]; }

function parseUrl(url: string) {
  const scheme = url.startsWith("postgres://") ? "postgres" : "postgresql";
  const rest = url.slice(scheme.length + 3);
  const atIndex = rest.indexOf("@");
  const auth = rest.slice(0, atIndex);
  const hostPortPath = rest.slice(atIndex + 1);
  const slash = hostPortPath.indexOf("/");
  const host = slash >= 0 ? hostPortPath.slice(0, slash) : hostPortPath;
  const pathPart = slash >= 0 ? hostPortPath.slice(slash + 1) : "";
  const db = pathPart.split("?")[0];
  const sp = auth.indexOf(":");
  const user = sp >= 0 ? auth.slice(0, sp) : auth;
  const password = sp >= 0 ? auth.slice(sp + 1) : "";
  return { host, user, password, db };
}

function endpoint(url: string) {
  const p = parseUrl(url);
  const host = p.host.replace("-pooler.", ".");
  return {
    url: `https://${host}/sql?sslmode=require`,
    headers: {
      "Content-Type": "application/json",
      "neon-connection-string": `postgres://${encodeURIComponent(p.user)}:${encodeURIComponent(p.password)}@${p.host}/${p.db}?sslmode=require`,
    },
  };
}

async function queryHttp(url: string, text: string, params: unknown[] = []): Promise<HttpPgResult> {
  const ep = endpoint(url);
  const res = await fetch(ep.url, { method: "POST", headers: ep.headers, body: JSON.stringify({ query: text, params }) });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`DB HTTP ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json() as { rows: any[]; rowCount?: number; fields?: { name: string }[] };
  return { rows: data.rows ?? [], rowCount: data.rowCount ?? data.rows?.length ?? null, fields: data.fields ?? [] };
}

class Pg {
  private url: string;
  constructor(url: string) { this.url = url; }
  query(textOrConfig: string | { text: string; values?: unknown[] }, params?: unknown[]): Promise<HttpPgResult> {
    if (typeof textOrConfig === "object" && textOrConfig !== null) {
      return queryHttp(this.url, textOrConfig.text, params ?? textOrConfig.values ?? []);
    }
    return queryHttp(this.url, textOrConfig, params ?? []);
  }
}

function dbUrl(): string | undefined {
  return process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
}
let _pool: Pg | null = null;
function pool(): Pg {
  const url = dbUrl();
  if (!url) throw new Error("Database not configured");
  if (!_pool) _pool = new Pg(url);
  return _pool;
}
async function q<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const r = await pool().query(sql, params);
  return (r.rows as T[]) ?? [];
}

function mapProduct(r: any) {
  return {
    id: r.id, title: r.title, imageUrl: r.imageUrl, images: r.images ?? null,
    priceCents: r.priceCents, priceEndCents: r.priceEndCents, inStock: !!r.inStock,
    isVariable: !!r.isVariable, variants: r.variants ?? null, categoryId: r.categoryId,
    description: r.description, createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt),
  };
}

const CART_ITEM = z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(999) });
const PAYMENT_METHODS = ["Cash App","PayPal","Venmo","Zelle","Bitcoin","Apple Pay","Chime","Bank transfer","Cryptocurrency","Stripe"];
const MINIMUM_ORDER_CENTS = 10000;

async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await q<any>(`SELECT key, value FROM settings`);
  const all: Record<string, string> = {};
  for (const row of rows) all[row.key] = row.value ?? "";
  return all;
}

// ---------- Admin auth (password login -> signed JWT cookie) ----------
const COOKIE_NAME = "app_session_id";
const ADMIN_OPEN_ID = "admin-password-user";
const APP_ID = process.env.VITE_APP_ID || "cactus-store";

type SessionClaims = { openId: string; appId: string; name: string };

function jwtSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "");
}

function parseCookies(header?: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!header) return map;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) map.set(key, decodeURIComponent(value));
  }
  return map;
}

async function signSessionToken(): Promise<string> {
  const issuedAt = Date.now();
  const exp = Math.floor((issuedAt + 1000 * 60 * 60 * 24 * 365) / 1000);
  return new SignJWT({ openId: ADMIN_OPEN_ID, appId: APP_ID, name: "Admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(Math.floor(issuedAt / 1000))
    .setExpirationTime(exp)
    .sign(jwtSecret());
}

async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret(), { algorithms: ["HS256"] });
    const { openId, appId, name } = payload as Record<string, unknown>;
    if (
      typeof openId !== "string" ||
      typeof appId !== "string" ||
      typeof name !== "string" ||
      !openId ||
      !appId ||
      !name
    ) {
      return null;
    }
    return { openId, appId, name };
  } catch {
    return null;
  }
}

function getRequestToken(req: Request): string | null {
  const cookies = parseCookies(req.headers.cookie);
  const fromCookie = cookies.get(COOKIE_NAME);
  if (fromCookie) return fromCookie;
  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

function adminUserPayload() {
  const now = new Date();
  return {
    id: -1,
    openId: ADMIN_OPEN_ID,
    name: "Admin",
    email: null,
    loginMethod: null,
    role: "admin",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

async function authenticateRequest(req: Request): Promise<Record<string, unknown> | null> {
  const token = getRequestToken(req);
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  if (session.openId !== ADMIN_OPEN_ID) return null;
  return adminUserPayload();
}

async function createContext({ req, res }: { req: Request; res: any }) {
  const user = (await authenticateRequest(req)) as any;
  return { req, res, user };
}

const t = initTRPC
  .context<{ req: Request; res: any; user: Record<string, unknown> | null }>()
  .create({ transformer: superjson });
const proc = t.procedure;

const adminProcedure = proc.use(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = t.router({
  store: t.router({
    products: proc
      .input(z.object({ categoryId: z.number().int().positive().nullish(), search: z.string().trim().max(200).nullish() }).optional())
      .query(async ({ input }) => {
        let rows = await q<any>(`SELECT id, title, "imageUrl", images, description, "priceCents", "priceEndCents", "inStock", "isVariable", variants, "categoryId", "createdAt", "updatedAt" FROM products ORDER BY "createdAt" DESC`);
        let products = rows.map(mapProduct);
        if (input?.categoryId) products = products.filter(p => p.categoryId === input.categoryId);
        if (input?.search) {
          const ql = input.search.toLowerCase();
          products = products.filter(p => p.title.toLowerCase().includes(ql) || (p.description ?? "").toLowerCase().includes(ql));
        }
        return products;
      }),
    product: proc.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const rows = await q<any>(`SELECT * FROM products WHERE id = $1 LIMIT 1`, [input.id]);
      const p = rows[0];
      if (!p) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      return mapProduct(p);
    }),
    categories: proc.query(async () =>
      (await q<any>(`SELECT id, name, "createdAt" FROM categories ORDER BY name`)).map(r => ({ id: r.id, name: r.name, createdAt: new Date(r.createdAt) }))
    ),
    settings: proc.query(async () => {
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
    reviews: proc.query(async () =>
      (await q<any>(`SELECT id, "authorName", rating, content, "createdAt" FROM reviews WHERE status = 'approved' ORDER BY "createdAt" DESC`)).map(r => ({
        id: r.id, authorName: r.authorName, rating: r.rating, content: r.content, createdAt: new Date(r.createdAt),
      }))
    ),
    placeOrder: proc
      .input(z.object({
        items: z.array(CART_ITEM).min(1),
        customerName: z.string().trim().min(1).max(255),
        customerEmail: z.string().trim().email().max(320),
        customerPhone: z.string().trim().min(5).max(64),
        shippingAddress: z.string().trim().min(5).max(1000),
        billingAddress: z.string().trim().min(5).max(1000),
        paymentMethod: z.enum(PAYMENT_METHODS as [string, ...string[]]),
      }))
      .mutation(async ({ input }) => {
        const allSettings = await getAllSettings();
        const lineItems: { productId: number; title: string; unitPriceCents: number; quantity: number }[] = [];
        for (const item of input.items) {
          const rows = await q<any>(`SELECT id, title, "priceCents" FROM products WHERE id = $1 LIMIT 1`, [item.productId]);
          const p = rows[0];
          if (!p) throw new TRPCError({ code: "NOT_FOUND", message: `Product ${item.productId} no longer exists` });
          lineItems.push({ productId: p.id, title: p.title, unitPriceCents: p.priceCents, quantity: item.quantity });
        }
        const totalCents = lineItems.reduce((s, li) => s + li.unitPriceCents * li.quantity, 0);
        if (totalCents < MINIMUM_ORDER_CENTS) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Minimum order amount is $100.00" });
        }
        const res = await pool().query(
          `INSERT INTO orders ("customerName","customerEmail","customerPhone","shippingAddress","billingAddress","paymentMethod","totalCents","paymentStatus","stripeSessionId","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',NULL,now(),now()) RETURNING id`,
          [input.customerName, input.customerEmail, input.customerPhone, input.shippingAddress, input.billingAddress, input.paymentMethod, totalCents]
        );
        const orderId = (res.rows as any[])[0].id;
        for (const li of lineItems) {
          await pool().query(
            `INSERT INTO "orderItems" ("orderId","productId",title,"unitPriceCents",quantity) VALUES ($1,$2,$3,$4,$5)`,
            [orderId, li.productId, li.title, li.unitPriceCents, li.quantity]
          );
        }
        return {
          orderId,
          totalCents,
          items: lineItems,
          contactEmail: allSettings.contactEmail || "peyoteseedsfarm@gmail.com",
          paymentMethod: input.paymentMethod,
        };
      }),
    submitReview: proc
      .input(z.object({
        authorName: z.string().trim().min(1).max(191),
        rating: z.number().int().min(1).max(5),
        content: z.string().trim().min(5).max(2000),
      }))
      .mutation(async ({ input }) => {
        const res = await pool().query(
          `INSERT INTO reviews ("authorName",rating,content,status,"createdAt") VALUES ($1,$2,$3,'pending',now()) RETURNING id`,
          [input.authorName, input.rating, input.content]
        );
        return { id: (res.rows as any[])[0].id };
      }),
    trackVisit: proc.input(z.object({ visitorId: z.string().trim().min(1).max(64), path: z.string().trim().max(500).optional().default("/") })).mutation(async () => ({ recorded: true })),
  }),
  auth: t.router({
    me: proc.query(({ ctx }) => (ctx.user as any) ?? null),
    logout: proc.mutation(({ ctx }) => {
      if (ctx.res && typeof ctx.res.clearCookie === "function") {
        ctx.res.clearCookie(COOKIE_NAME, { path: "/", httpOnly: true, sameSite: "none", secure: true, maxAge: -1 });
      }
      return { success: true } as const;
    }),
  }),
  admin: t.router({
    orders: t.router({
      list: adminProcedure.query(async () => {
        const allOrders = (await q<any>(`SELECT id, "customerName","customerEmail","customerPhone","shippingAddress","billingAddress","paymentMethod","totalCents","paymentStatus","stripeSessionId","createdAt","updatedAt" FROM orders ORDER BY "createdAt" DESC`)).map(r => ({
          id: r.id,
          customerName: r.customerName,
          customerEmail: r.customerEmail,
          customerPhone: r.customerPhone,
          shippingAddress: r.shippingAddress,
          billingAddress: r.billingAddress,
          paymentMethod: r.paymentMethod,
          totalCents: r.totalCents,
          paymentStatus: r.paymentStatus,
          stripeSessionId: r.stripeSessionId,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        }));
        const allItems = await q<any>(`SELECT id, "orderId", "productId", title, "unitPriceCents", quantity FROM "orderItems"`);
        const itemsByOrder = new Map<number, any[]>();
        for (const it of allItems) {
          const list = itemsByOrder.get(it.orderId) ?? [];
          list.push({ id: it.id, orderId: it.orderId, productId: it.productId, title: it.title, unitPriceCents: it.unitPriceCents, quantity: it.quantity });
          itemsByOrder.set(it.orderId, list);
        }
        for (const o of allOrders) o.items = itemsByOrder.get(o.id) ?? [];
        return allOrders;
      }),
      delete: adminProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input }) => {
          await pool().query(`DELETE FROM "orderItems" WHERE "orderId" = $1`, [input.id]);
          await pool().query(`DELETE FROM orders WHERE id = $1`, [input.id]);
          return { success: true };
        }),
    }),
  }),
});
export type AppRouter = typeof appRouter;

// ---------- HTTP app ----------
const app = express();
app.use(express.json({ limit: "10mb" }));
app.get("/api/health", (_req: Request, res: any) => res.json({ ok: true }));

app.post("/api/admin/login", async (req: Request, res: any) => {
  try {
    const { password } = req.body ?? {};
    if (!process.env.ADMIN_PASSWORD) {
      res.status(500).json({ error: "ADMIN_PASSWORD not configured" });
      return;
    }
    if (password !== process.env.ADMIN_PASSWORD) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }
    if (!process.env.JWT_SECRET) {
      res.status(500).json({ error: "JWT_SECRET not configured" });
      return;
    }
    const sessionToken = await signSessionToken();
    const isSecure = !!(req.headers["x-forwarded-proto"] || "").toLowerCase().includes("https") || req.protocol === "https";
    res.cookie(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    res.json({ success: true });
  } catch (error) {
    console.error("[Admin Login] Failed", error);
    res.status(500).json({ error: "Login failed: " + ((error as Error).message ?? String(error)) });
  }
});

app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
export default app;