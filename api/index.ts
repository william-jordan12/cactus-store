export default async function handler(req: any, res: any) {
  const url = req.url || "";
  res.status(200).set("Content-Type", "text/plain");

  async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
      p,
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error(label + " timed out " + ms + "ms")), ms)),
    ]);
  }

  // /step: import the server module with a hard timeout, report what happens.
  if (url.startsWith("/step")) {
    try {
      const mod: any = await withTimeout(
        import("../server/_core/index"),
        15000,
        "IMPORT"
      );
      res.end("module loaded, has createApp=" + typeof mod.createApp + ", default=" + typeof mod.default);
    } catch (e: any) {
      res.end("STEP FAIL: " + (e && e.stack ? e.stack : String(e)));
    }
    return;
  }

  res.end("PROBE OK " + new Date().toISOString());
}
