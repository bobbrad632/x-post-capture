const BTN_LABEL = "Copy post image to clipboard";
const MSG_RELOAD =
  "Extension was reloaded or updated. Refresh this page (F5), then try again.";

/** After an extension reload/update, old content scripts lose access to `chrome.runtime` until the tab is refreshed. */
function isExtensionContextDead() {
  try {
    return !chrome.runtime?.id;
  } catch {
    return true;
  }
}

function isInvalidatedMessage(msg) {
  const s = String(msg ?? "");
  return s.includes("Extension context invalidated") || s.includes("context invalidated");
}

async function copyPngToClipboard(blob) {
  if (!navigator.clipboard?.write) {
    throw new Error("Clipboard API is not available in this context");
  }
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read image for preview"));
    r.readAsDataURL(blob);
  });
}

/** Inline SVGs use currentColor — matches X light/dark icon rows. */
function iconWrap(paths) {
  return `<svg class="xpc-capture-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

const ICONS = {
  copy: iconWrap(
    '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'
  ),
  check: iconWrap('<path d="M20 6L9 17l-5-5"/>'),
  error: iconWrap('<path d="M18 6L6 18M6 6l12 12"/>'),
  reload: iconWrap(
    '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>'
  ),
};

function setCopyButtonVisual(btn, state) {
  btn.dataset.xpcState = state;
  btn.classList.remove(
    "xpc-capture-btn--busy",
    "xpc-capture-btn--success",
    "xpc-capture-btn--error",
    "xpc-capture-btn--reload"
  );

  if (state === "idle") {
    btn.innerHTML = ICONS.copy;
    btn.title = BTN_LABEL;
    btn.setAttribute("aria-label", BTN_LABEL);
    btn.removeAttribute("aria-busy");
    return;
  }

  btn.setAttribute("aria-busy", state === "busy" ? "true" : "false");

  if (state === "busy") {
    btn.innerHTML = ICONS.copy;
    btn.classList.add("xpc-capture-btn--busy");
    btn.title = "Copying…";
    btn.setAttribute("aria-label", "Copying…");
    return;
  }

  if (state === "success") {
    btn.innerHTML = ICONS.check;
    btn.classList.add("xpc-capture-btn--success");
    btn.title = "Copied to clipboard";
    btn.setAttribute("aria-label", "Copied to clipboard");
    return;
  }

  if (state === "error") {
    btn.innerHTML = ICONS.error;
    btn.classList.add("xpc-capture-btn--error");
    btn.title = "Copy failed — try again";
    btn.setAttribute("aria-label", "Copy failed");
    return;
  }

  if (state === "reload") {
    btn.innerHTML = ICONS.reload;
    btn.classList.add("xpc-capture-btn--reload");
    btn.title = MSG_RELOAD;
    btn.setAttribute("aria-label", "Extension updated — refresh the page");
  }
}

async function sendPreviewToSidePanel(blob) {
  if (isExtensionContextDead()) return;
  try {
    const dataUrl = await blobToDataUrl(blob);
    chrome.runtime.sendMessage({ type: "PREVIEW_CAPTURE", dataUrl }, () => void chrome.runtime.lastError);
  } catch (e) {
    console.warn("[x-post-capture] preview", e);
  }
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode screenshot"));
    img.src = dataUrl;
  });
}

/** Visible-tab capture only includes the viewport; clip element bounds to what is on screen. */
function intersectRectViewport(rect, viewportWidth, viewportHeight) {
  const left = Math.max(0, rect.left);
  const top = Math.max(0, rect.top);
  const right = Math.min(viewportWidth, rect.right);
  const bottom = Math.min(viewportHeight, rect.bottom);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);
  return { left, top, width, height };
}

/**
 * Crop the visible-tab screenshot to match on-screen pixels (dark mode, fonts, etc.).
 * Scale is derived from captured image size vs viewport so HiDPI / zoom are handled.
 */
function cropCaptureToElement(img, rect, viewportWidth, viewportHeight) {
  const visible = intersectRectViewport(rect, viewportWidth, viewportHeight);
  const scaleX = img.naturalWidth / viewportWidth;
  const scaleY = img.naturalHeight / viewportHeight;

  let sx = Math.round(visible.left * scaleX);
  let sy = Math.round(visible.top * scaleY);
  let sw = Math.round(visible.width * scaleX);
  let sh = Math.round(visible.height * scaleY);

  sx = Math.max(0, Math.min(sx, img.naturalWidth - 1));
  sy = Math.max(0, Math.min(sy, img.naturalHeight - 1));
  sw = Math.min(sw, img.naturalWidth - sx);
  sh = Math.min(sh, img.naturalHeight - sy);

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not available");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas;
}

async function captureVisibleTabPng() {
  if (isExtensionContextDead()) {
    throw new Error(MSG_RELOAD);
  }
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "CAPTURE_VISIBLE_TAB" }, (res) => {
      if (chrome.runtime.lastError) {
        const m = chrome.runtime.lastError.message;
        reject(new Error(isInvalidatedMessage(m) ? MSG_RELOAD : m));
        return;
      }
      if (!res?.ok) {
        reject(new Error(res?.error || "Screenshot failed"));
        return;
      }
      resolve(res.dataUrl);
    });
  });
}

async function capturePostElement(root) {
  root.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 80));

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = root.getBoundingClientRect();

  const dataUrl = await captureVisibleTabPng();
  const img = await loadImageFromDataUrl(dataUrl);
  const canvas = cropCaptureToElement(img, rect, vw, vh);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode PNG"))), "image/png");
  });
}

function findTweetRoot(el) {
  return el?.closest?.('article[data-testid="tweet"]') ?? el?.closest?.("article[role='article']");
}

function findActionRow(article) {
  const candidates = article.querySelectorAll(
    '[data-testid="reply"], [data-testid="retweet"], [data-testid="like"], [data-testid="bookmark"], [data-testid="share"]'
  );
  if (candidates.length) {
    const row = candidates[0].closest('[role="group"]') ?? candidates[0].parentElement;
    if (row) return row;
  }
  return article.querySelector('[role="group"]');
}

function ensureButton(article) {
  if (!article || article.dataset.xpcInjected === "1") return;
  article.dataset.xpcInjected = "1";

  const row = findActionRow(article);
  const wrap = document.createElement("span");
  wrap.className = "xpc-capture-wrap";
  wrap.setAttribute("data-xpc", "1");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "xpc-capture-btn";
  setCopyButtonVisual(btn, "idle");

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const root = findTweetRoot(btn);
    if (!root) return;

    btn.disabled = true;
    setCopyButtonVisual(btn, "busy");

    try {
      if (isExtensionContextDead()) {
        throw new Error(MSG_RELOAD);
      }

      const blob = await capturePostElement(root);
      await copyPngToClipboard(blob);
      await sendPreviewToSidePanel(blob);

      setCopyButtonVisual(btn, "success");
      setTimeout(() => setCopyButtonVisual(btn, "idle"), 1600);
    } catch (err) {
      console.error("[x-post-capture]", err);
      const reload = isInvalidatedMessage(err?.message);
      setCopyButtonVisual(btn, reload ? "reload" : "error");
      setTimeout(() => setCopyButtonVisual(btn, "idle"), reload ? 5000 : 2000);
    } finally {
      btn.disabled = false;
      if (btn.dataset.xpcState === "busy") {
        setCopyButtonVisual(btn, "idle");
      }
    }
  });

  wrap.appendChild(btn);

  if (row?.appendChild) {
    row.appendChild(wrap);
  } else {
    article.appendChild(wrap);
  }
}

function scan() {
  document.querySelectorAll('article[data-testid="tweet"]').forEach(ensureButton);
  document.querySelectorAll("article[role='article']").forEach((a) => {
    if (a.querySelector('[data-testid="tweet"]')) return;
    ensureButton(a);
  });
}

const observer = new MutationObserver(() => {
  scan();
});

observer.observe(document.documentElement, { childList: true, subtree: true });
scan();

function ensurePreviewPanelOpener() {
  if (document.getElementById("xpc-preview-opener")) return;
  const b = document.createElement("button");
  b.id = "xpc-preview-opener";
  b.type = "button";
  b.className = "xpc-preview-opener";
  b.textContent = "Preview panel";
  b.title = "Open the side panel to see your last copied post (same image as clipboard)";
  b.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isExtensionContextDead()) return;
    chrome.runtime.sendMessage({ type: "OPEN_SIDE_PANEL" }, () => void chrome.runtime.lastError);
  });
  document.body.appendChild(b);
}

ensurePreviewPanelOpener();
