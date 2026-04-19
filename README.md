# X Post Capture

Chrome extension for **x.com** / **twitter.com**: adds a **copy** icon on each post (next to Reply / Like / Share). One click captures **what you actually see** (dark mode, fonts, quoted posts) as a **PNG** and copies it to the **clipboard** so you can paste it elsewhere.

## Install from GitHub Releases 

You only need **Google Chrome** (or another Chromium browser that supports unpacked extensions).

1. Open **Releases**: **[github.com/bobbrad632/x-post-capture/releases/latest](https://github.com/bobbrad632/x-post-capture/releases/latest)**  
   (Forks: use your repo’s **Releases** page instead.)
2. Under **Assets**, download **`x-post-capture-vX.Y.Z.zip`** (not the source code archives unless you develop the extension).
3. **Unzip** the file somewhere permanent on your computer (e.g. `Documents\ChromeExtensions\x-post-capture`).  
   After unzipping, the folder must contain **`manifest.json`** at the top level (along with `content.js`, `icons`, etc.).
4. In Chrome, go to **`chrome://extensions`**.
5. Turn **Developer mode** **on** (top right).
6. Click **Load unpacked**.
7. Choose the **folder** you unzipped (select the folder that directly contains `manifest.json`).  
   Do **not** select the `.zip` file; Chrome needs an unpacked directory.

Updates: download a newer release ZIP, replace the old folder (or unzip to a new folder), then on `chrome://extensions` use **Reload** on the extension card, or remove the old extension and **Load unpacked** again pointing at the new folder.

**“Extension context invalidated” / refresh icon:** After you **reload** or **update** the extension, already-open X.com tabs still run an old copy of the script until you refresh. **Reload the tab** (F5 or the address-bar refresh) and use the **copy** icon again.

---

## How it works

1. Open a post or timeline on X.
2. Click the **copy** icon (clipboard) on the row with Reply / Repost / Like / Share.
3. The icon briefly shows a **checkmark** — paste the image (Ctrl+V / ⌘V) into chat, docs, or image editors.

Capture uses the browser’s **visible tab screenshot** cropped to the post, not a DOM re-draw, so the result matches the on-screen UI.

### Side panel preview

After a successful copy (**clipboard** icon), the same PNG is still placed on the **clipboard**, and the extension also **stores it in memory** and opens Chrome’s **side panel** so you can see the image vertically beside the page.

- **Close the panel** using Chrome’s normal side-panel close control (or collapse the side panel area).
- **Open again without copying:** **pin** the extension to the toolbar if needed, then click its **icon** (opens the preview panel), or use the **Preview panel** floating button on X (bottom-right).

---

## Development (Node.js)

Only needed if you change the source code or build the ZIP yourself.

Requirements: **Node.js** 18+.

```bash
npm install
npm run build
```

Load **unpacked**: Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → choose the **`dist`** folder (not the repo root).

- **`npm run watch`** — rebuild `content.js` on changes (run `npm run icons` once if you change the master icon).
- **`npm run check:manifest`** — quick checks for manifest + store-oriented warnings.
- **`npm run pack`** — after `npm run build`, creates `release/x-post-capture-vVERSION.zip` for uploads.

Maintainers: see **[docs/RELEASING.md](docs/RELEASING.md)** for tagging and automated release builds.

### Icons

Master file: `src/icons/icon-128.png`. `npm run build` runs `npm run icons`, which generates `icon-16.png`, `icon-32.png`, and `icon-48.png` via [sharp](https://sharp.pixelplumbing.com/).

## Permissions (why they exist)

| Permission | Reason |
|------------|--------|
| **clipboardWrite** | Copy the PNG to your clipboard when you use the **copy** icon. |
| **Host access** `https://x.com/*`, `https://twitter.com/*` | Inject the button and read layout for cropping. |
| **`<all_urls>`** | Required by Chrome for `chrome.tabs.captureVisibleTab` after the async steps (scroll + message) used for a pixel-accurate capture. **No browsing data is collected**; see [PRIVACY.md](PRIVACY.md). |
| **sidePanel** | Show the optional vertical preview panel next to the page. |
| **storage** (`session`) | Hold the **last copied image** only for preview in the side panel (cleared when the browser session ends; not synced to servers). |

## Chrome Web Store

See **[docs/CHROME_WEB_STORE.md](docs/CHROME_WEB_STORE.md)** for a publishing checklist, listing text ideas, and review notes.

## License

Add a license file if you publish the repo (e.g. MIT).
