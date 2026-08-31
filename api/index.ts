import createApp from "../dist/index.js";

/**
 * Vercel serverless entry point.
 *
 * This imports the pre-built server bundle (dist/index.js, produced by
 * `build:server`) so the function uses the exact same compiled code as
 * Render/local. Dependencies (express, pg, drizzle, etc.) are resolved from
 * node_modules, which Vercel installs automatically from package.json.
 *
 * The app is created lazily and cached so it is reused across warm invocations.
 */
export default // @ts-expect-error Vercel accepts an async default export
async function handler() {
  const app = await createApp();
  return app;
}
