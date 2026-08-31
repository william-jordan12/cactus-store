import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";

export async function setupVite(app: Express, server: Server) {
  // Vite is a development-only dependency. Import it lazily so it is not
  // bundled into the production server build (avoids pulling in the whole
  // Vite + Tailwind dev toolchain, which breaks esbuild/Vercel bundling).
  const { createServer: createViteServer } = await import("vite");
  const viteConfig = (await import("../../vite.config")).default;

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

function findStaticDir(): string {
  // Search a wide set of candidate paths so this works across Render, local
  // dev, and Vercel serverless (where the bundle runs from a different cwd /
  // directory layout).
  const roots = [
    process.cwd(),
    path.resolve(import.meta.dirname),
    path.resolve(import.meta.dirname, ".."),
    path.resolve(import.meta.dirname, "..", ".."),
    "/var/task",
  ];
  const candidates: string[] = [];
  for (const root of roots) {
    candidates.push(
      path.join(root, "dist", "public"),
      path.join(root, "public"),
    );
  }
  for (const c of candidates) {
    try {
      if (fs.existsSync(path.join(c, "index.html"))) return c;
    } catch {
      /* ignore */
    }
  }
  // Recursively look for dist/public/index.html under a set of roots.
  for (const root of roots) {
    try {
      const found = walkForIndexHtml(root, 4);
      if (found) return found;
    } catch {
      /* ignore */
    }
  }
  return path.join(process.cwd(), "dist", "public");
}

function walkForIndexHtml(dir: string, depth: number): string | null {
  if (depth <= 0) return null;
  let entries: string[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const e of entries) {
    try {
      const full = path.join(dir, e.name);
      if (e.isFile() && e.name === "index.html") return dir;
      if (e.isDirectory()) {
        if (full.endsWith(path.join("dist", "public"))) {
          if (fs.existsSync(path.join(full, "index.html"))) return full;
        }
        const sub = walkForIndexHtml(full, depth - 1);
        if (sub) return sub;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function serveStatic(app: Express) {
  let distPath = findStaticDir();

  if (!fs.existsSync(path.join(distPath, "index.html"))) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexFile = path.join(distPath, "index.html");
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res
        .status(200)
        .set("Content-Type", "text/html")
        .send(
          `<!doctype html><html><head><title>Peyote Seeds Farm</title></head><body style="font-family:sans-serif;text-align:center;padding:60px"><h1>Peyote Seeds Farm</h1><p>Site is online. Static build missing (${distPath}) -- skipping product data.</p></body></html>`
        );
    }
  });
}
