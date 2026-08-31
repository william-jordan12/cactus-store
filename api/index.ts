export default async function handler(
  req: any,
  res: any
) {
  if ((req.url || "").startsWith("/probe")) {
    res.status(200).send("PROBE OK " + new Date().toISOString());
    return;
  }
  const mod: any = await import("../dist/index.js");
  let appPromise = mod.__testapp as Promise<any> | null;
  if (!appPromise) {
    appPromise = mod.default();
    mod.__testapp = appPromise;
  }
  const app = await appPromise;
  try {
    // Give Express an error handler that surfaces the error so we can read it.
    app.use((err: any, _req: any, _res: any, next: any) => {
      if (res.headersSent) return next(err);
      try {
        res.status(500).send("APP ERR: " + (err && err.stack ? err.stack : String(err)));
      } catch {
        res.status(500).end();
      }
    });
    app(req, res);
  } catch (err) {
    try {
      res.status(500).send("HANDLER ERR: " + (err && err.stack ? err.stack : String(err)));
    } catch {
      res.status(500).end();
    }
  }
}
