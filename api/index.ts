import express from "express";
import type { Request } from "express";
import { HttpPgPool } from "./pgClient";

const app = express();
app.get("/api/health", (_req: Request, res: any) =>
  res.json({ ok: true, hasPool: typeof HttpPgPool === "function" })
);
export default app;