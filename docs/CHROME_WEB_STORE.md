# Chrome Web Store — checklist for X Post Capture

Use this before publishing. Official policy and UI change over time; always confirm in the [Chrome Web Store Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/) and the Developer Dashboard.

## Before you upload

1. **Build a production ZIP**
   - Run `npm run build` then `npm run pack`.
   - Upload **`release/x-post-capture-vVERSION.zip`** (contents of `dist/` at the **root** of the ZIP — `manifest.json` must not be nested in a subfolder).

2. **Manifest**
   - Run `npm run check:manifest` and fix any errors.
   - Manifest V3, **128×128** icon included (`icons/icon-128.png` in package).

3. **Privacy**
   - Extensions with broad host access (`<all_urls>`) need a **privacy policy URL** in the Developer Dashboard.
   - Host [PRIVACY.md](../PRIVACY.md) on GitHub (or your site), e.g. `https://raw.githubusercontent.com/USER/x-post-capture/main/PRIVACY.md` or GitHub Pages — use a stable URL you control.

4. **Single purpose**
   - The extension does one thing: **copy an X post as an image to the clipboard**. Say that clearly in the short description and detail text.

5. **Permission justification** (Dashboard fields / review)
   - **clipboardWrite** — “Copy the captured post image to the clipboard when the user clicks Copy post.”
   - **Broad host / `<all_urls>`** — “Required by Chrome to call `captureVisibleTab` for a screenshot of the visible tab after scrolling the post into view; used only to crop the post to an image. No data is uploaded to our servers.” (Adjust if your implementation changes.)

6. **Assets to prepare in Dashboard**
   - **Screenshots**: at least **1**, typically **1280×800** or **640×400** (check current size requirements in the upload form).
   - **Promotional images** (optional but recommended): small/large tile, marquee — sizes are specified in the dashboard.
   - **Icon** 128×128 (already in the extension package).

7. **Developer account**
   - One-time **registration fee** for the Chrome Web Store developer program (paid to Google; check current pricing).

8. **Review expectations**
   - `<all_urls>` triggers **stricter review**; a clear privacy policy and honest permission text help.
   - No **remote code** (no loading executable script from arbitrary URLs). This project bundles local JS only.

## Suggested store copy (edit to match your voice)

**Short description (132 chars max — verify in dashboard)**

> Copy any X (Twitter) post as a PNG to your clipboard—matches what you see on screen.

**Detailed description (draft)**

> X Post Capture adds a “Copy post” button next to Reply, Repost, Like, and Share on x.com and twitter.com.
>
> Click it to capture that post as an image and copy it to your clipboard. Paste into chat apps, documents, or image editors. The capture uses a screenshot of the visible page (not a fake re-render), so dark mode, fonts, and quoted posts look like they do in the browser.
>
> **Permissions:** Clipboard access is only used to copy the image you asked for. Broad tab access is required by Chrome for the screenshot API used to match on-screen pixels. We do not collect your posts or sell data. See the privacy policy linked in the listing.

## After submission

- Track **review status** and **emails** from Google; respond to policy questions promptly.
- For updates, bump **`version`** in `src/manifest.json`, rebuild, repack, upload a new package.
