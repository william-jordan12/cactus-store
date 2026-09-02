import express from "express";
import type { Request } from "express";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { z } from "zod";

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

const t = initTRPC.create({ transformer: superjson });
const proc = t.procedure;

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
    trackVisit: proc.input(z.object({ visitorId: z.string().trim().min(1).max(64), path: z.string().trim().max(500).optional().default("/") })).mutation(async () => ({ recorded: true })),
  }),
});
export type AppRouter = typeof appRouter;

// ---------- HTTP app ----------
const app = express();
app.use(express.json({ limit: "10mb" }));
app.get("/api/health", (_req: Request, res: any) => res.json({ ok: true }));
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext: () => ({}) }));
export default app;