import html2canvas from "html2canvas";

const BTN_TEXT = "Copy post";
const BTN_BUSY = "…";

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
      const canvas = await html2canvas(root, {
        backgroundColor: null,
        scale: window.devicePixelRatio > 1 ? Math.min(2, window.devicePixelRatio) : 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png");

      const copied = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { type: "COPY_IMAGE_DATA_URL", dataUrl },
          (res) => {
            if (chrome.runtime.lastError) {
              resolve({ ok: false, error: chrome.runtime.lastError.message });
              return;
            }
            resolve(res ?? { ok: false, error: "No response" });
          }
        );
      });

      if (!copied.ok) {
        throw new Error(copied.error || "Clipboard copy failed");
      }

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
