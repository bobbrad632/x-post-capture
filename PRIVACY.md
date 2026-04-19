# Privacy Policy — X Post Capture

**Last updated:** April 19, 2026

This policy describes how the **X Post Capture** browser extension (“Extension”) handles information when you use it.

## What the Extension does

The Extension adds a **copy** control (clipboard icon) on **x.com** and **twitter.com**. When you activate it, the Extension:

1. Scrolls the post into view as needed.
2. Takes a **screenshot of the visible tab** using browser APIs.
3. **Crops** that screenshot to the post area.
4. Copies the resulting **PNG image** to your **system clipboard** so you can paste it elsewhere.

## Data collection

The Extension **does not** send your posts, screenshots, clipboard contents, or browsing history to our servers. **We do not operate a backend server** for this Extension as part of the open-source project.

Processing happens **locally** in your browser (extension scripts).

### Side panel preview

When you copy a post image, a copy of that image may be stored in the browser’s **`chrome.storage.session` area** so the optional **side panel** can display your **last** capture. This storage is **session-scoped** (typically cleared when you close the browser), is **not** used for sync across devices, and is **not** transmitted to us.

## Permissions

- **Clipboard:** Used only to place the **image you requested** on the clipboard when you use the **copy** control.
- **Site access / broad host permissions:** Required so the Extension can run on X/Twitter and so the browser can perform **tab capture** for an accurate image. This matches how Chromium’s extension APIs work for screenshot-based capture.

## Third parties

**X / Twitter** is a third-party service governed by its own terms and privacy policy. The Extension does not change how X processes your use of their website.

## Updates

We may update this policy when the Extension’s behavior changes. The **“Last updated”** date will change accordingly.

## Contact

If you publish this Extension under your own name, **replace this section** with your contact email or support link.
