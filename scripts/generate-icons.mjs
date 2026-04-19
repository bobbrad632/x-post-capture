import sharp from "sharp";
import { existsSync, renameSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "src", "icons", "icon-128.png");
const outDir = join(root, "src", "icons");

if (!existsSync(src)) {
  console.error("Missing src/icons/icon-128.png — add a master icon first.");
  process.exit(1);
}

const tmp128 = join(outDir, "icon-128.tmp.png");
await sharp(src)
  .resize(128, 128, { fit: "cover" })
  .png({ compressionLevel: 9, effort: 10 })
  .toFile(tmp128);
renameSync(tmp128, src);

for (const size of [16, 32, 48]) {
  await sharp(src)
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, `icon-${size}.png`));
}

console.log("Normalized icon-128.png and generated icon-16/32/48.png");
