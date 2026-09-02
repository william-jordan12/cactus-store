import express from "express";
import type { Request } from "express";

const app = express();
app.get("/api/health", (_req: Request, res: any) => res.json({ ok: true }));
export default app;