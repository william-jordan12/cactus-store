import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../stripeWebhook";
import { ENV } from "./env";
import { sdk } from "./sdk";
import * as db from "../db";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { getSessionCookieOptions } from "./cookies";
import { posts as blogPosts } from "../../client/src/lib/blogPosts";
import { slugifyName } from "../../client/src/lib/slugify";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Stripe webhook needs the raw body — register BEFORE express.json()
  registerStripeWebhook(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Simple password-based admin login
  app.post("/api/admin/login", express.json(), async (req, res) => {
    try {
      const { password } = req.body;
      if (!ENV.adminPassword) {
        res.status(500).json({ error: "ADMIN_PASSWORD not configured" });
        return;
      }
      if (password !== ENV.adminPassword) {
        res.status(401).json({ error: "Invalid password" });
        return;
      }
      if (!ENV.cookieSecret) {
        res.status(500).json({ error: "JWT_SECRET not configured" });
        return;
      }
      const openId = "admin-password-user";
      try {
        await db.upsertUser({
          openId,
          name: "Admin",
          role: "admin",
          lastSignedIn: new Date(),
        });
      } catch (dbErr) {
        console.warn("[Admin Login] DB upsert failed (continuing):", dbErr);
      }
      const sessionToken = await sdk.createSessionToken(openId, {
        name: "Admin",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Admin Login] Failed", error);
      res.status(500).json({ error: "Login failed: " + (error as Error).message });
    }
  });

  // Temporary: seed products from peyoteseedsfarm.com (remove after use)
  app.post("/api/admin/seed-products", express.json(), async (req, res) => {
    try {
      const { password } = req.body;
      if (password !== ENV.adminPassword) {
        res.status(401).json({ error: "Invalid password" });
        return;
      }
      const SOURCE = "https://peyoteseedsfarm.com/wp-json/wc/store/v1/products";
      const all: any[] = [];
      let page = 1;
      while (true) {
        const r = await fetch(`${SOURCE}?per_page=100&page=${page}`);
        if (!r.ok) break;
        const d = await r.json();
        if (!Array.isArray(d) || !d.length) break;
        all.push(...d);
        if (page >= parseInt(r.headers.get("X-WP-TotalPages") || "1", 10)) break;
        page++;
      }
      const strip = (h: string) => h.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&#036;/g, "$").replace(/&ndash;/g, "–").replace(/&hellip;/g, "...").replace(/&#8230;/g, "...").replace(/\s+/g, " ").trim();
      const cents = (s: string, m: number) => { const n = parseInt(s, 10); return m === 2 ? n : Math.round(n * Math.pow(10, m)); };

      const existingCats = await db.listCategories();
      const catId = new Map<string, number>();
      for (const c of existingCats) catId.set(c.name, c.id);
      for (const p of all) {
        for (const c of p.categories ?? []) {
          if (catId.has(c.name)) continue;
          try {
            const id = await db.createCategory({ name: c.name });
            catId.set(c.name, id);
          } catch {
            const cats = await db.listCategories();
            const f = cats.find(x => x.name === c.name);
            if (f) catId.set(c.name, f.id);
          }
        }
      }
      let created = 0;
      for (const p of all) {
        const minor = p.prices?.currency_minor_unit ?? 2;
        const priceCents = p.prices ? cents(p.prices.price, minor) : 0;
        let priceEndCents: number | null = null;
        if (p.prices?.price_range) priceEndCents = cents(p.prices.price_range.max_amount, minor);
        const images = (p.images ?? []).map((i: any) => i.src);
        const imageUrl = images[0] ?? null;
        const isVariable = p.type === "variable";
        const fc = p.categories?.[0];
        const categoryId = fc ? (catId.get(fc.name) ?? null) : null;
        let variants: any = null;
        if (isVariable && p.attributes?.length) {
          const attr = p.attributes.find((a: any) => /quantity/i.test(a.name));
          if (attr?.terms?.length) {
            variants = attr.terms.map((t: any) => ({ id: `v-${p.id}-${t.name}`, name: t.name, imageUrl: imageUrl ?? "", priceCents }));
          }
        }
        await db.createProduct({
          title: p.name, imageUrl, images: JSON.stringify(images),
          priceCents, priceEndCents, inStock: p.is_in_stock ?? true,
          isVariable, variants, categoryId,
          description: strip(p.description || "") || null,
        }).catch(() => {});
        created++;
      }
      res.json({ ok: true, products: created, categories: catId.size });
    } catch (e) {
      console.error("[Seed]", e);
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Dynamic sitemap including every product URL (registered before static files
  // so it takes precedence over the static sitemap.xml in the build output).
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const base = "https://peyoteseedsvault.com";
      let products: { id: number; updatedAt: Date }[] = [];
      try {
        products = await db.listProducts();
      } catch (e) {
        console.warn("[Sitemap] Products unavailable, serving static pages only:", e);
      }
      const staticUrls: [string, string, number][] = [
        ["/", "daily", 1.0],
        ["/shop", "daily", 0.9],
        ["/blog", "weekly", 0.7],
        ["/reviews", "weekly", 0.7],
        ["/faq", "monthly", 0.6],
        ["/about", "monthly", 0.6],
        ["/shipping", "monthly", 0.5],
        ["/returns", "monthly", 0.5],
        ["/terms", "monthly", 0.4],
        ["/privacy", "monthly", 0.4],
      ];
      let categories: { id: number; name: string }[] = [];
      try {
        categories = await db.listCategories();
      } catch (e) {
        console.warn("[Sitemap] Categories unavailable:", e);
      }
      const rows = [
        ...staticUrls.map(([loc, freq, priority]) =>
          `  <url>\n    <loc>${base}${loc}</loc>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
        ),
        ...categories.map(c =>
          `  <url>\n    <loc>${base}/shop/category/${slugifyName(c.name)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
        ),
        ...blogPosts.map(p =>
          `  <url>\n    <loc>${base}/blog/${p.slug}</loc>\n    <lastmod>${new Date(p.date).toISOString().slice(0, 10)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
        ),
        ...products.map(p =>
          `  <url>\n    <loc>${base}/product/${p.id}</loc>\n    <lastmod>${new Date(p.updatedAt).toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
        ),
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>`;
      res.set("Content-Type", "application/xml; charset=utf-8");
      res.send(xml);
    } catch (e) {
      console.error("[Sitemap] Failed:", e);
      res.status(500).end("Internal Server Error");
    }
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
