import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const distManifest = join(root, "dist", "manifest.json");
const srcManifest = join(root, "src", "manifest.json");

const path = existsSync(distManifest) ? distManifest : srcManifest;
if (!existsSync(path)) {
  console.error("No manifest found. Run npm run build or ensure src/manifest.json exists.");
  process.exit(1);
}

const m = JSON.parse(readFileSync(path, "utf8"));
const errors = [];
const warnings = [];

if (m.manifest_version !== 3) errors.push("manifest_version must be 3 for new listings.");
if (!m.name?.trim()) errors.push('Missing "name".');
if (!m.version?.trim()) errors.push('Missing "version".');
if (!m.description?.trim()) errors.push('Missing "description" (shown in store).');

const icons = m.icons ?? {};
if (!icons["128"]) warnings.push('Add icons["128"] for Chrome Web Store (required for publishing).');

const perms = new Set([...(m.permissions ?? []), ...(m.optional_permissions ?? [])]);
const hosts = m.host_permissions ?? [];
if (hosts.includes("<all_urls>") || hosts.includes("*://*/*")) {
  warnings.push(
    "<all_urls> triggers strict review; ensure privacy policy URL is set in Developer Dashboard and matches data handling."
  );
}

if (perms.has("clipboardWrite")) {
  warnings.push('clipboardWrite: explain in listing why clipboard access is needed (copying the image).');
}

// Remote code check (heuristic)
const bg = m.background?.service_worker ?? m.background;
if (typeof bg === "string" && bg.includes("http")) {
  errors.push("Background script must be a local file, not a remote URL.");
}

if (errors.length) {
  console.error("Errors:");
  for (const e of errors) console.error(" -", e);
}
if (warnings.length) {
  console.warn("Warnings / review notes:");
  for (const w of warnings) console.warn(" -", w);
}

if (errors.length) process.exit(1);
console.log("Manifest check passed:", path);
if (warnings.length) process.exit(0);
process.exit(0);
