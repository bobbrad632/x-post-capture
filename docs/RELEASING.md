# Creating a GitHub release (maintainers)

End users install from **Releases** and do **not** need Node.js. This document is for publishing a new version.

## Steps

1. Set **`version`** in [`src/manifest.json`](../src/manifest.json) to the new semver (e.g. `1.4.0`). It must match the tag you will create (without the `v` prefix).
2. Commit and push to `master` (or your default branch).
3. Create and push an annotated tag whose name is `v` plus that version:
   ```bash
   git tag v1.4.0
   git push origin v1.4.0
   ```
4. The [release workflow](../.github/workflows/release.yml) runs: `npm ci`, `npm run build`, `npm run pack`, then attaches **`release/x-post-capture-vVERSION.zip`** to the GitHub Release.

If the tag does not match the manifest version (e.g. tag `v1.4.0` but manifest says `1.3.0`), the workflow **fails** on purpose.

## Artifact

The ZIP is the contents of **`dist/`** with `manifest.json` at the **root** — same layout as [Chrome Web Store](CHROME_WEB_STORE.md) uploads and as documented in the main README for “Load unpacked”.
