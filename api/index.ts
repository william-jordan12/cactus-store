import type { Express } from "express";
import createApp from "../dist/index.js";

/**
 * Vercel serverless entry point (single-function Express app).
 *
 * The app is created lazily and cached so it is reused across warm invocations.
 * Errors during app creation are written to the raw response so they are
 * visible instead of silently returning a blank 500.
 */
let appPromise: Promise<Express> | null = null;

async function getApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = createApp().catch((err) => {
      appPromise = null;
      throw err;
    });
  }
  return appPromise;
}

export default async function handler(
  req: any,
  res: { status: (n: number) => any; send: (b: unknown) => void }
) {
  try {
    const app = await getApp();
    return app;
  } catch (err) {
    const msg = err instanceof Error ? (err.stack || err.message) : String(err);
    try {
      res.status(500).send("BOOT ERROR:\n" + msg);
    } catch {
      res.status(500).send("BOOT ERROR (could not render)");
    }
  }
}
