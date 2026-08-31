import { build } from "esbuild";

async function main() {
  await build({
    entryPoints: ["server/_core/index.ts"],
    platform: "node",
    format: "esm",
    bundle: true,
    outfile: "dist/server.full.mjs",
    logLevel: "info",
    minify: true,
    banner: {
      js: 'import { createRequire as __createRequire } from "module"; const require = __createRequire(import.meta.url);',
    },
  });
  console.log("BUILD OK -> dist/server.full.mjs");
}

main().catch((e) => {
  console.error("BUILD ERROR:", e && e.message);
  process.exit(1);
});
