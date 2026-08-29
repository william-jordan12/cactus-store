import { createApp } from "../server/_core/index";

/**
 * Vercel serverless entry point.
 *
 * Vercel's @vercel/node runtime supports using an Express app as the default
 * export of an api/ function. All traffic (API + SPA) is routed here via
 * vercel.json, and the app serves both the JSON/API endpoints and the built
 * static frontend.
 *
 * The app is created lazily and cached in the module scope so it is reused
 * across warm invocations on Vercel's serverless runtime.
 */
export default // @ts-expect-error Vercel accepts an async default export
async function handler() {
  const app = await createApp();
  return app;
}
