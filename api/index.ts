export default async function handler(
  req: { url?: string },
  res: { status: (n: number) => any; send: (b: unknown) => void }
) {
  if ((req.url || "").startsWith("/probe")) {
    res.status(200).send("PROBE OK " + new Date().toISOString());
    return;
  }
  const mod = await import("../dist/index.js");
  let appPromise = (mod as any).__testapp as Promise<any> | null;
  if (!appPromise) {
    appPromise = (mod as any).default();
    (mod as any).__testapp = appPromise;
  }
  const app = await appPromise;
  try {
    app(req, res);
  } catch (err) {
    try {
      res.status(500).send("ERR: " + (err && err.stack ? err.stack : String(err)));
    } catch {
      res.status(500).end();
    }
  }
}
