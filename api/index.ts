import express from "express";
import type { Request } from "express";

const app = express();
app.get("/api/health", async (_req: Request, res: any) => {
  try {
    const r = await fetch("https://example.com");
    res.json({ ok: true, fetchStatus: r.status });
  } catch (e) {
    res.json({ ok: false, err: (e as Error).message });
  }
});
export default app;