export default async function handler(
  req: any,
  res: any
) {
  const url = req.url || "";
  if (url.startsWith("/probe")) {
    res.status(200).send("PROBE OK " + new Date().toISOString());
    return;
  }
  if (url.startsWith("/boot")) {
    try {
      const m = await import("../dist/index.js");
      res.status(200).send(
        "BOOT: module-loaded, has default=" + typeof m?.default
      );
      return;
    } catch (e) {
      res.status(500).send("BOOT IMPORT ERR: " + (e && e.stack ? e.stack : String(e)));
      return;
    }
  }
  const mod: any = await import("../dist/index.js");
  let appPromise = mod.__testapp as Promise<any> | null;
  if (!appPromise) {
    try {
      appPromise = mod.default();
      mod.__testapp = appPromise;
    } catch (e) {
      res.status(500).send("CREATE APP SYNC ERR: " + (e && e.stack ? e.stack : String(e)));
      return;
    }
  }
  let app;
  try {
    app = await Promise.race([
      appPromise,
      new Promise((_, rej) => setTimeout(() => rej(new Error("createApp timeout 25s")), 25000)),
    ]);
  } catch (e) {
    res.status(500).send("CREATE APP ERR: " + (e && e.stack ? e.stack : String(e)));
    return;
  }
  try {
    app.use((err: any, _req: any, _res: any, next: any) => {
      if (res.headersSent) return next(err);
      try {
        res.status(500).send("APP ERR: " + (err && err.stack ? err.stack : String(err)));
      } catch {
        res.status(500).end();
      }
    });
    app(req, res);
  } catch (e) {
    try {
      res.status(500).send("HANDLER ERR: " + (e && e.stack ? e.stack : String(e)));
    } catch {
      res.status(500).end();
    }
  }
}
