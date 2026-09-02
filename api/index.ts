import express from "express";
import type { Request } from "express";

// Inline replica of pgClient (no separate file import)
class HttpPgPoolInline {
  private url: string;
  constructor(url: string) { this.url = url; }
  async query(text: string, params: unknown[] = []) {
    const res = await fetch(this.url, {
      method: "POST",
      body: JSON.stringify({ query: text, params }),
    });
    const data = await res.json() as { rows: unknown[] };
    return { rows: data.rows ?? [] };
  }
}

const app = express();
app.get("/api/health", (_req: Request, res: any) =>
  res.json({ ok: true, hasInline: typeof HttpPgPoolInline === "function" })
);
export default app;