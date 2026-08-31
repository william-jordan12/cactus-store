import express from "express";
import path from "path";
import fs from "fs";
import { Pool } from "@neondatabase/serverless";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_TNbgGSj9C1Aq@ep-gentle-queen-axr5xctq-pooler.c-4.us-east-2.aws.neon.tech/neondb";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "william.40";

// Neon serverless driver: designed to work inside Vercel's serverless runtime.
// It handles SSL and connection pooling for serverless natively.
const pool = new Pool({ connectionString: DATABASE_URL });

// Create tables if they don't exist (idempotent).
async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      image_url TEXT,
      price_cents INT NOT NULL DEFAULT 0,
      category TEXT,
      description TEXT,
      in_stock BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

function findStaticDir(): string {
  const roots = [process.cwd(), __dirname, path.resolve(__dirname, "..", "..")];
  const cands: string[] = [];
  for (const r of roots) {
    cands.push(path.join(r, "dist", "public"), path.join(r, "public"));
  }
  for (const c of cands) {
    try {
      if (fs.existsSync(path.join(c, "index.html"))) return c;
    } catch {}
  }
  return path.join(process.cwd(), "dist", "public");
}

const app = express();
app.use(express.json({ limit: "50mb" }));

// Products (public)
app.get("/api/products", async (_req, res) => {
  try {
    const { rows } = await Promise.race([
      pool.query(
        "SELECT id, title, image_url, price_cents, category, description, in_stock FROM products ORDER BY id"
      ),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("db timeout")), 20000)
      ),
    ]);
    res.json({ products: rows });
  } catch (e: any) {
    res.status(500).json({ error: "products: " + (e && e.message) });
  }
});

// DB connectivity check (diagnostic)
app.get("/api/dbcheck", async (_req, res) => {
  try {
    const { rows } = await Promise.race([
      pool.query("SELECT 1 as ok"),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("dbcheck timeout")), 8000)
      ),
    ]);
    res.json({ ok: true, version: rows });
  } catch (e: any) {
    res.json({ ok: false, error: (e && e.message) || String(e) });
  }
});

// Admin login
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: "admin" });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

// Admin create product
app.post("/api/admin/products", async (req, res) => {
  const auth = req.headers.authorization || "";
  if (auth !== "Bearer admin") {
    return res.status(401).json({ error: "unauthorized" });
  }
  const { title, image_url, price_cents, category, description } = req.body || {};
  if (!title) return res.status(400).json({ error: "title required" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO products (title, image_url, price_cents, category, description) VALUES ($1,$2,$3,$4,$5) RETURNING id",
      [title, image_url || null, price_cents || 0, category || null, description || null]
    );
    res.json({ id: rows[0].id });
  } catch (e: any) {
    res.status(500).json({ error: "db: " + (e && e.message) });
  }
});

// Static SPA
const staticDir = findStaticDir();
if (fs.existsSync(path.join(staticDir, "index.html"))) {
  app.use(express.static(staticDir));
  app.use("*", (_req, res) => res.sendFile(path.join(staticDir, "index.html")));
} else {
  app.get("/", (_req, res) =>
    res
      .status(200)
      .set("Content-Type", "text/html")
      .send(
        "<!doctype html><html><head><title>Peyote Seeds Farm</title></head><body style='font-family:sans-serif;text-align:center;padding:50px'><h1>Peyote Seeds Farm</h1><p>Live on Vercel.</p></body></html>"
      )
  );
}

// Ensure tables on first request (non-blocking).
ensureTables().catch((e: any) =>
  console.error("[Server] ensureTables failed:", e && e.message)
);

export default app;
