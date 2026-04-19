const BTN_TEXT = "Copy post";
const BTN_BUSY = "…";

async function copyPngToClipboard(blob) {
  if (!navigator.clipboard?.write) {
    throw new Error("Clipboard API is not available in this context");
  }
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
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
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "CAPTURE_VISIBLE_TAB" }, (res) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
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
  btn.textContent = BTN_TEXT;
  btn.title = "Copy screenshot of this post to clipboard";

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const root = findTweetRoot(btn);
    if (!root) return;

    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = BTN_BUSY;

    try {
      const blob = await capturePostElement(root);
      await copyPngToClipboard(blob);

      btn.textContent = "Copied!";
      setTimeout(() => {
        btn.textContent = BTN_TEXT;
      }, 1600);
    } catch (err) {
      console.error("[x-post-capture]", err);
      btn.textContent = "Failed";
      setTimeout(() => {
        btn.textContent = BTN_TEXT;
      }, 2000);
    } finally {
      btn.disabled = false;
      if (btn.textContent === BTN_BUSY) btn.textContent = prev;
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
