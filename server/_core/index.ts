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

  // Temporary seed endpoint - POST to seed product catalog
  app.post("/api/seed-catalog", async (req, res) => {
    try {
      const dbConn = await (await import("mysql2/promise")).createConnection({
        uri: process.env.DATABASE_URL!,
        ssl: { rejectUnauthorized: false },
      });

      const categories = [
        "Ariocarpus", "Astrophytum", "Lophophora", "Trichocereus",
        "Echinopsis", "Mammillaria", "Ferocactus", "Gymnocalycium",
        "Notocactus", "Turbinicarpus", "Coryphantha", "Escobaria",
        "Pediocactus", "Sulcorebutia",
      ];

      const products: Array<{ title: string; priceCents: number; cat: string; desc: string }> = [
        { title: "Ariocarpus Retusus Seeds (10 seeds)", priceCents: 1299, cat: "Ariocarpus", desc: "Premium Ariocarpus retusus seeds. Slow-growing Living Rock Cactus with white to pink flowers." },
        { title: "Ariocarpus Retusus Seeds (25 seeds)", priceCents: 2499, cat: "Ariocarpus", desc: "Bulk 25 Ariocarpus retusus seeds with detailed growing guide." },
        { title: "Ariocarpus Furfuraceus Seeds (10 seeds)", priceCents: 1499, cat: "Ariocarpus", desc: "Rare Ariocarpus furfuraceus with distinctive tubercle texture." },
        { title: "Ariocarpus Kotsoubeyanus Seeds (10 seeds)", priceCents: 1999, cat: "Ariocarpus", desc: "Smallest Ariocarpus species with stunning pink flowers." },
        { title: "Ariocarpus Scaphirostris Seeds (10 seeds)", priceCents: 2499, cat: "Ariocarpus", desc: "Extremely rare endangered species with large pink flowers." },
        { title: "Ariocarpus Bravoanus Seeds (10 seeds)", priceCents: 2299, cat: "Ariocarpus", desc: "Compact species with woolly areoles and large white flowers." },
        { title: "Ariocarpus Trigonus Seeds (10 seeds)", priceCents: 1399, cat: "Ariocarpus", desc: "Elongated tubercle species with beautiful yellow flowers." },
        { title: "Astrophytum Asterias Seeds (20 seeds)", priceCents: 999, cat: "Astrophytum", desc: "Sand Dollar Cactus. Star-shaped spineless body with bright yellow flowers." },
        { title: "Astrophytum Myriostigma Seeds (20 seeds)", priceCents: 1099, cat: "Astrophytum", desc: "Bishop's Cap. Columnar star shape with white flocking." },
        { title: "Astrophytum Ornatum Seeds (20 seeds)", priceCents: 1199, cat: "Astrophytum", desc: "Most robust Astrophytum with star-shaped body. Great for beginners." },
        { title: "Astrophytum Capricorne Seeds (20 seeds)", priceCents: 1299, cat: "Astrophytum", desc: "Curved spines and golden-brown flocking. Large yellow flowers." },
        { title: "Astrophytum Potassium (Hybrid) Seeds (20 seeds)", priceCents: 1499, cat: "Astrophytum", desc: "Beautiful asterias x myriostigma hybrid with pronounced ribs." },
        { title: "Astrophytum Nudum Seeds (20 seeds)", priceCents: 1199, cat: "Astrophytum", desc: "Rare spineless Astrophytum with smooth green body and white dotting." },
        { title: "Astrophytum Asterias Super Kabuto Seeds (10 seeds)", priceCents: 2999, cat: "Astrophytum", desc: "Sought-after Japanese cultivar with dramatic white flocking. Limited." },
        { title: "Lophophora Williamsii Seeds (20 seeds)", priceCents: 1499, cat: "Lophophora", desc: "Famous Peyote cactus. Beautiful pink flowers. Highly prized." },
        { title: "Lophophora Fricii Seeds (20 seeds)", priceCents: 1699, cat: "Lophophora", desc: "Second-largest Lophophora with pink to lavender flowers." },
        { title: "Lophophora Williamsii Var Caespitosa Seeds (20 seeds)", priceCents: 1999, cat: "Lophophora", desc: "Clumping form producing multiple heads with pink flowers." },
        { title: "Lophophora Diffusa Seeds (20 seeds)", priceCents: 1599, cat: "Lophophora", desc: "Rare species with diffuse rib pattern and yellow-green flowers." },
        { title: "Lophophora Jourdaniana Seeds (10 seeds)", priceCents: 2999, cat: "Lophophora", desc: "Extremely rare. Largest flowers of any Lophophora. Limited." },
        { title: "Lophophora Williamsii Mixed Seeds (50 seeds)", priceCents: 3499, cat: "Lophophora", desc: "Bulk 50 seeds. Great value for larger collections." },
        { title: "Trichocereus Pachanoi Seeds (30 seeds)", priceCents: 899, cat: "Trichocereus", desc: "San Pedro. Fast-growing columnar. Easy and hardy." },
        { title: "Trichocereus Bridgesii Seeds (30 seeds)", priceCents: 999, cat: "Trichocereus", desc: "Achuma. Tall columnar with larger ribs. Beautiful white flowers." },
        { title: "Trichocereus Terscheckii Seeds (20 seeds)", priceCents: 1199, cat: "Trichocereus", desc: "Large columnar from Argentina. Beautiful white flowers." },
        { title: "Trichocereus Spachianus Seeds (30 seeds)", priceCents: 799, cat: "Trichocereus", desc: "Torch Cactus. Cluster-forming with large white flowers." },
        { title: "Trichocereus Ancistrophorus Seeds (20 seeds)", priceCents: 1299, cat: "Trichocereus", desc: "Rare with distinctive hooked spines and large white flowers." },
        { title: "Trichocereus Hybrid Mix Seeds (30 seeds)", priceCents: 1099, cat: "Trichocereus", desc: "Curated blend of Trichocereus species crosses." },
        { title: "Echinopsis Oxygona Seeds (30 seeds)", priceCents: 799, cat: "Echinopsis", desc: "Classic globular with spectacular night-blooming white to pink flowers." },
        { title: "Echinopsis Subdenudata Seeds (20 seeds)", priceCents: 899, cat: "Echinopsis", desc: "Domino Cactus. Spineless globular with large white flowers." },
        { title: "Echinopsis Pachanoi Seeds (30 seeds)", priceCents: 849, cat: "Echinopsis", desc: "Fast-growing columnar with nocturnal white flowers. Very hardy." },
        { title: "Echinopsis Huascha Seeds (20 seeds)", priceCents: 749, cat: "Echinopsis", desc: "Red Torch Cactus. Vibrant red to orange flowers." },
        { title: "Echinopsis Mirabilis Seeds (20 seeds)", priceCents: 1099, cat: "Echinopsis", desc: "Small globular with enormous white night-blooming flowers." },
        { title: "Mammillaria Elongata Seeds (30 seeds)", priceCents: 699, cat: "Mammillaria", desc: "Lady Finger Cactus. Easy-growing clustering with pink flowers." },
        { title: "Mammillaria Grahamii Seeds (30 seeds)", priceCents: 649, cat: "Mammillaria", desc: "Small globular from southwestern US. Pink to lavender crown ring." },
        { title: "Mammillaria Bocasana Seeds (30 seeds)", priceCents: 749, cat: "Mammillaria", desc: "Powder Puff Cactus. White woolly with pink flowers." },
        { title: "Mammillaria Plumerigera Seeds (20 seeds)", priceCents: 999, cat: "Mammillaria", desc: "Rare Oaxaca species with large yellow flowers." },
        { title: "Mammillaria Hahniana Seeds (20 seeds)", priceCents: 899, cat: "Mammillaria", desc: "Old Lady Cactus. White hairy with purple-pink flowers." },
        { title: "Mammillaria Heynmannii Seeds (20 seeds)", priceCents: 899, cat: "Mammillaria", desc: "Slender cylindrical with delicate lavender flowers." },
        { title: "Ferocactus Histrix Seeds (20 seeds)", priceCents: 799, cat: "Ferocactus", desc: "Classic barrel with prominent ribs and hooked spines." },
        { title: "Ferocactus Wislizeni Seeds (20 seeds)", priceCents: 849, cat: "Ferocactus", desc: "Fishhook Barrel. Large Sonoran Desert species. Orange to red flowers." },
        { title: "Ferocactus Emoryi Seeds (20 seeds)", priceCents: 899, cat: "Ferocactus", desc: "Robust barrel with red-tipped spines. Yellow to orange flowers." },
        { title: "Ferocactus Latispinus Seeds (20 seeds)", priceCents: 999, cat: "Ferocactus", desc: "Wide flat spines. Purple to red flowers." },
        { title: "Gymnocalycium Mihanovichii Seeds (30 seeds)", priceCents: 699, cat: "Gymnocalycium", desc: "Popular globular with pink to white flowers. Easy to grow." },
        { title: "Gymnocalycium Baldianum Seeds (20 seeds)", priceCents: 799, cat: "Gymnocalycium", desc: "Dwarf Chin Cactus. Deep red flowers." },
        { title: "Gymnocalycium Saglionis Seeds (20 seeds)", priceCents: 899, cat: "Gymnocalycium", desc: "Large globular with heavy spination and pale pink flowers." },
        { title: "Gymnocalycium Pflanzii Seeds (20 seeds)", priceCents: 749, cat: "Gymnocalycium", desc: "Flattened globular with silver spines and large white flowers." },
        { title: "Gymnocalycium Friedmanii Seeds (20 seeds)", priceCents: 849, cat: "Gymnocalycium", desc: "Chin Cactus. Dark green with pink to magenta flowers." },
        { title: "Notocactus Magnificus Seeds (20 seeds)", priceCents: 899, cat: "Notocactus", desc: "Blue-green globular with golden spines and large yellow flowers." },
        { title: "Notocactus Haselbergii Seeds (20 seeds)", priceCents: 799, cat: "Notocactus", desc: "Scarlet Ball Cactus. Bright orange-red flowers." },
        { title: "Notocactus Leninghausii Seeds (20 seeds)", priceCents: 749, cat: "Notocactus", desc: "Golden Ball. Clustering golden-spined. Fast-growing." },
        { title: "Notocactus Grappleri Seeds (20 seeds)", priceCents: 849, cat: "Notocactus", desc: "Small clustering with bright red flowers." },
        { title: "Turbinicarpus Valdezianus Seeds (20 seeds)", priceCents: 1499, cat: "Turbinicarpus", desc: "Tiny with white feathery spines and large pink flowers." },
        { title: "Turbinicarpus Pseudopectinatus Seeds (20 seeds)", priceCents: 1399, cat: "Turbinicarpus", desc: "Comb-like spines. Large pink to magenta flowers." },
        { title: "Turbinicarpus Schmiedickeanus Seeds (20 seeds)", priceCents: 1299, cat: "Turbinicarpus", desc: "Variable species with attractive spination." },
        { title: "Turbinicarpus Jauernigii Seeds (10 seeds)", priceCents: 2499, cat: "Turbinicarpus", desc: "Extremely rare. White flowers with dark center stripe." },
        { title: "Coryphantha Macromeris Seeds (20 seeds)", priceCents: 899, cat: "Coryphantha", desc: "Clustering with large pink to magenta flowers." },
        { title: "Coryphantha Elephantidens Seeds (20 seeds)", priceCents: 999, cat: "Coryphantha", desc: "Large-flowered with bright pink to magenta blooms." },
        { title: "Coryphantha Radiosa Seeds (20 seeds)", priceCents: 849, cat: "Coryphantha", desc: "Compact globular with vibrant red flowers." },
        { title: "Escobaria Vivipara Seeds (30 seeds)", priceCents: 699, cat: "Escobaria", desc: "Hardy clustering from Great Plains. Pink flowers." },
        { title: "Escobaria Missouriensis Seeds (20 seeds)", priceCents: 799, cat: "Escobaria", desc: "Small globular with greenish-yellow flowers. Very cold-hardy." },
        { title: "Escobaria Runyonii Seeds (20 seeds)", priceCents: 999, cat: "Escobaria", desc: "Rat Tail Coryphantha. Cylindrical with bright pink flowers." },
        { title: "Pediocactus Simpsonii Seeds (20 seeds)", priceCents: 1299, cat: "Pediocactus", desc: "Hardy mountain cactus. Extremely cold-tolerant." },
        { title: "Pediocactus Knowltonii Seeds (10 seeds)", priceCents: 2999, cat: "Pediocactus", desc: "One of the rarest cacti in North America." },
        { title: "Pediocactus Pectinatus Seeds (20 seeds)", priceCents: 1499, cat: "Pediocactus", desc: "Comb-like spines and pink to white flowers." },
        { title: "Sulcorebutia Rauschii Seeds (30 seeds)", priceCents: 899, cat: "Sulcorebutia", desc: "Stunning blue-purple body with vibrant yellow to orange flowers." },
        { title: "Sulcorebutia Brettfeldii Seeds (20 seeds)", priceCents: 999, cat: "Sulcorebutia", desc: "Intense violet-blue flowers. Most colorful cactus in cultivation." },
        { title: "Sulcorebutia Alba Seeds (20 seeds)", priceCents: 1199, cat: "Sulcorebutia", desc: "White-bodied form with bright yellow flowers. Rare." },
        { title: "Sulcorebutia Horstii Seeds (20 seeds)", priceCents: 1099, cat: "Sulcorebutia", desc: "Blue-green body with golden spines and magenta flowers." },
      ];

      // Insert categories
      const catIdMap: Record<string, number> = {};
      for (const name of categories) {
        const [existing] = await dbConn.execute("SELECT id FROM categories WHERE name = ?", [name]);
        if ((existing as any[]).length > 0) {
          catIdMap[name] = (existing as any[])[0].id;
        } else {
          const [result] = await dbConn.execute("INSERT INTO categories (name) VALUES (?)", [name]);
          catIdMap[name] = (result as any).insertId;
        }
      }

      // Insert products
      let created = 0;
      for (const p of products) {
        const catId = catIdMap[p.cat] ?? null;
        await dbConn.execute(
          "INSERT INTO products (title, priceCents, categoryId, description, inStock, isVariable) VALUES (?, ?, ?, ?, 1, 0)",
          [p.title, p.priceCents, catId, p.desc]
        );
        created++;
      }

      await dbConn.end();
      res.json({ success: true, categories: categories.length, products: created });
    } catch (e: any) {
      console.error("[Seed] Error:", e);
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
