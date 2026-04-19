chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "COPY_IMAGE_DATA_URL") {
    return;
  }

  (async () => {
    try {
      const res = await fetch(message.dataUrl);
      const blob = await res.blob();
      const type = blob.type || "image/png";
      await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
      sendResponse({ ok: true });
    } catch (err) {
      sendResponse({ ok: false, error: String(err?.message ?? err) });
    }
  })();

  return true;
});
