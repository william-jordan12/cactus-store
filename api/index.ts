import express, { Request } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./store";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findStaticDir(): string {
  const roots = [process.cwd(), __dirname, path.resolve(__dirname, "..", "..")];
  const cands: string[] = [];
  for (const r of roots) {
    cands.push(path.join(r, "public"), path.join(r, "dist", "public"), path.join(r, "dist"));
  }
  for (const c of cands) {
    try {
      if (fs.existsSync(path.join(c, "index.html"))) return c;
    } catch {}
  }
  return path.join(process.cwd(), "public");
}

const app = express();
app.use(express.json({ limit: "10mb" }));

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
  })
);

const staticDir = findStaticDir();
if (fs.existsSync(path.join(staticDir, "index.html"))) {
  app.use(express.static(staticDir));
  app.use("*", (_req: Request, res: any) =>
    res.sendFile(path.join(staticDir, "index.html"))
  );
} else {
  app.get("/", (_req: Request, res: any) =>
    res.status(200).set("Content-Type", "text/html").send(
      "<!doctype html><html><head><title>Peyote Seeds Farm</title></head><body><h1>Peyote Seeds Farm</h1></body></html>"
    )
  );
}

export default app;