import { createApp } from "../server/_core/index";
import type { Request, Response, Express } from "express";

/**
 * Vercel serverless entry (Express style). Re-exports the full app built by
 * `createApp`, so every route (tRPC, admin, static SPA, sitemap) is available.
 * Passed to @vercel/node as the default handler.
 */
let cachedApp: Express | null = null;

async function buildApp(): Promise<Express> {
  if (!cachedApp) {
    cachedApp = await createApp();
  }
  return cachedApp;
}

export default async function handler(req: Request, res: Response) {
  const app = await buildApp();
  app(req, res);
}