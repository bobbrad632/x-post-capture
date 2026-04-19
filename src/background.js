function configureSidePanel() {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
}

chrome.runtime.onInstalled.addListener(configureSidePanel);
chrome.runtime.onStartup.addListener(configureSidePanel);
configureSidePanel();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const type = message?.type;

  if (type === "CAPTURE_VISIBLE_TAB") {
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
  }

  if (type === "PREVIEW_CAPTURE") {
    const tabId = sender.tab?.id;
    const dataUrl = message.dataUrl;
    if (tabId == null || !dataUrl) {
      sendResponse({ ok: false, error: "Missing tab or image" });
      return false;
    }

    (async () => {
      try {
        await chrome.storage.session.set({
          lastCaptureDataUrl: dataUrl,
          lastCaptureAt: Date.now(),
        });
      } catch (e) {
        console.warn("[x-post-capture] preview storage", e);
      }
      try {
        await chrome.sidePanel.open({ tabId });
      } catch (e) {
        console.warn("[x-post-capture] side panel open", e);
      }
      sendResponse({ ok: true });
    })();

    return true;
  }

  if (type === "OPEN_SIDE_PANEL") {
    const tabId = sender.tab?.id;
    if (tabId == null) {
      sendResponse({ ok: false, error: "No tab" });
      return false;
    }

    chrome.sidePanel
      .open({ tabId })
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err?.message ?? err) }));

    return true;
  }
});
