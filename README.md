# X Post Capture

Chrome extension for **x.com** / **twitter.com**: adds a **Copy post** button on each post. One click captures **what you actually see** (dark mode, fonts, quoted posts) as a **PNG** and copies it to the **clipboard** so you can paste it elsewhere.

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

---

## How it works

1. Open a post or timeline on X.
2. Click **Copy post** on the row with Reply / Repost / Like / Share.
3. The button shows **Copied!** — paste the image (Ctrl+V / ⌘V) into chat, docs, or image editors.

Capture uses the browser’s **visible tab screenshot** cropped to the post, not a DOM re-draw, so the result matches the on-screen UI.

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
| **clipboardWrite** | Copy the PNG to your clipboard when you click **Copy post**. |
| **Host access** `https://x.com/*`, `https://twitter.com/*` | Inject the button and read layout for cropping. |
| **`<all_urls>`** | Required by Chrome for `chrome.tabs.captureVisibleTab` after the async steps (scroll + message) used for a pixel-accurate capture. **No browsing data is collected**; see [PRIVACY.md](PRIVACY.md). |

## Chrome Web Store

See **[docs/CHROME_WEB_STORE.md](docs/CHROME_WEB_STORE.md)** for a publishing checklist, listing text ideas, and review notes.

## License

Add a license file if you publish the repo (e.g. MIT).
