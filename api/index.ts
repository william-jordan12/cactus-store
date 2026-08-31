import { createApp } from "../server/_core/index";

/**
 * Vercel serverless entry point.
 *
 * Import the server source directly and run the Express app as a (req, res)
 * handler. Vercel's @vercel/node compiles TypeScript and installs node_modules,
 * so this needs no manual bundling. The app is created lazily and cached.
 */
let appPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: any, res: any) {
  if ((req.url || "").startsWith("/probe")) {
    res.status(200).send("PROBE OK " + new Date().toISOString());
    return;
  }
  if (!appPromise) {
    appPromise = createApp();
  }
  const app = await appPromise;
  try {
    app(req, res);
  } catch (err) {
    const msg = err instanceof Error ? (err.stack || err.message) : String(err);
    try {
      res.status(500).send("APP ERR: " + msg);
    } catch {
      res.status(500).end();
    }
  }
}
