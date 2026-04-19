chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "CAPTURE_VISIBLE_TAB") {
    return;
  }

  const windowId = sender.tab?.windowId;
  if (windowId == null) {
    sendResponse({ ok: false, error: "No window for tab" });
    return false;
  }

  chrome.tabs
    .captureVisibleTab(windowId, { format: "png" })
    .then((dataUrl) => sendResponse({ ok: true, dataUrl }))
    .catch((err) => sendResponse({ ok: false, error: String(err?.message ?? err) }));

  return true;
});
