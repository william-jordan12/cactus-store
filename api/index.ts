import express from "express";
import type { Request } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./store";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req: Request, res: any) => res.json({ ok: true }));

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
  })
);

export default app;