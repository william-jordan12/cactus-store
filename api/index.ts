import type { Express } from "express";
import createApp from "../dist/index.js";

/**
 * Vercel serverless entry point.
 *
 * Runs the Express app directly as a (req, res) handler. This is the most
 * portable pattern and works with @vercel/node / Vercel Functions regardless
 * of how the function is bundled. We cut the build up-front so the app is
 * reused across warm invocations.
 */
let appPromise: Promise<Express> | null = null;

export default async function handler(
  req: Parameters<Express>[0],
  res: Parameters<Express>[1]
) {
  if (!appPromise) {
    appPromise = createApp();
  }
  const app = await appPromise;
  try {
    app(req, res);
  } catch (err) {
    const msg = err instanceof Error ? (err.stack || err.message) : String(err);
    try {
      res.status(500).send("BOOT ERROR:\n" + msg);
    } catch {
      res.status(500).end();
    }
  }
}
