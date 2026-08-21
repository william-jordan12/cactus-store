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

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Temporary: batch-update product images by category
  app.post("/api/seed-images", async (_req, res) => {
    try {
      const dbConn = await (await import("mysql2/promise")).createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: { rejectUnauthorized: false },
      });

      const catImages: Record<string, string> = {
        Ariocarpus: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop",
        Astrophytum: "https://images.unsplash.com/photo-1520178606913-118a6b3c31b1?w=400&h=400&fit=crop",
        Lophophora: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400&h=400&fit=crop",
        Trichocereus: "https://images.unsplash.com/photo-1580752137660-17f9fd9d0c15?w=400&h=400&fit=crop",
        Echinopsis: "https://images.unsplash.com/photo-1516481605912-d34c1411504c?w=400&h=400&fit=crop",
        Mammillaria: "https://images.unsplash.com/photo-1589046212139-bf293b6eba18?w=400&h=400&fit=crop",
        Ferocactus: "https://images.unsplash.com/photo-1537799261701-0cf2e54a840b?w=400&h=400&fit=crop",
        Gymnocalycium: "https://images.unsplash.com/photo-1533066636271-fdbe3e84ad80?w=400&h=400&fit=crop",
        Notocactus: "https://images.unsplash.com/photo-1510711547938-04fb9010e471?w=400&h=400&fit=crop",
        Turbinicarpus: "https://images.unsplash.com/photo-1539571711714-62cd2534f96e?w=400&h=400&fit=crop",
        Coryphantha: "https://images.unsplash.com/photo-1589046207215-b5ee3097bafc?w=400&h=400&fit=crop",
        Escobaria: "https://images.unsplash.com/photo-1520178606913-118a6b3c31b1?w=400&h=400&fit=crop",
        Pediocactus: "https://images.unsplash.com/photo-1516481605912-d34c1411504c?w=400&h=400&fit=crop",
        Sulcorebutia: "https://images.unsplash.com/photo-1532295039064-229629db1073?w=400&h=400&fit=crop",
      };

      let updated = 0;
      for (const [catName, imgUrl] of Object.entries(catImages)) {
        const [result] = await dbConn.execute(
          "UPDATE products p JOIN categories c ON p.categoryId = c.id SET p.imageUrl = ? WHERE c.name = ? AND (p.imageUrl IS NULL OR p.imageUrl = '')",
          [imgUrl, catName]
        );
        updated += (result as any).affectedRows;
      }
      await dbConn.end();
      res.json({ success: true, updated });
    } catch (e: any) {
      console.error("[SeedImages] Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

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
