import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");

if (!existsSync(dist)) mkdirSync(dist, { recursive: true });

const watch = process.argv.includes("--watch");

const ctx = await esbuild.context({
  entryPoints: [join(root, "src", "content.js")],
  bundle: true,
  outfile: join(dist, "content.js"),
  platform: "browser",
  target: ["chrome100"],
  format: "iife",
  minify: !watch,
});

copyFileSync(join(root, "src", "manifest.json"), join(dist, "manifest.json"));
copyFileSync(join(root, "src", "background.js"), join(dist, "background.js"));
copyFileSync(join(root, "src", "content.css"), join(dist, "content.css"));

if (watch) {
  await ctx.watch();
  console.log("Watching… output in dist/");
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log("Built to dist/");
}
