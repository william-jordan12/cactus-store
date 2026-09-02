import express from "express";
import type { Request } from "express";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { z } from "zod";
import { HttpPgPool } from "../server/_core/pgHttpClient";

const t = initTRPC.create({ transformer: superjson });
const r = t.router({
  ping: t.procedure.input(z.object({ x: z.number().optional() })).query(() => {
    const pool = new HttpPgPool("x");
    return { ok: true, hasPool: typeof pool.query === "function" };
  }),
});

const app = express();
app.use("/api/trpc", createExpressMiddleware({ router: r, createContext: () => ({}) }));
app.get("/api/health", (_req: Request, res: any) => res.json({ ok: true }));
export default app;