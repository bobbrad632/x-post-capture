import archiver from "archiver";
import { createWriteStream, mkdirSync, readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dist = join(root, "dist");

if (!existsSync(join(dist, "manifest.json"))) {
  console.error("Run npm run build first (dist/ is missing or incomplete).");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(join(dist, "manifest.json"), "utf8"));
const version = manifest.version ?? "0.0.0";
const releaseDir = join(root, "release");
mkdirSync(releaseDir, { recursive: true });

const zipName = `x-post-capture-v${version}.zip`;
const zipPath = join(releaseDir, zipName);

await new Promise((resolve, reject) => {
  const output = createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });
  output.on("close", () => {
    console.log(`Wrote ${zipPath} (${archive.pointer()} bytes)`);
    resolve();
  });
  archive.on("error", reject);
  archive.pipe(output);
  archive.directory(dist, false);
  archive.finalize();
});
