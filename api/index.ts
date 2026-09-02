import express from "express";
import type { Request } from "express";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";

const t = initTRPC.create({ transformer: superjson });
const p = t.procedure;
const r = t.router({
  ping: p.query(() => ({ ok: true })),
});
export const appRouter = r;

const app = express();
app.get("/api/health", (_req: Request, res: any) => res.json({ ok: true, hasRouter: typeof appRouter === "object" }));
export default app;