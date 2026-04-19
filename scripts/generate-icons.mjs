import sharp from "sharp";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgSrc = join(root, "xpc.svg");
const outDir = join(root, "src", "icons");

if (!existsSync(svgSrc)) {
  console.error("Missing xpc.svg in the project root (next to package.json).");
  process.exit(1);
}

for (const size of [16, 32, 48, 128]) {
  await sharp(svgSrc)
    .resize(size, size)
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(join(outDir, `icon-${size}.png`));
}

console.log("Generated icon-16/32/48/128.png from xpc.svg");
