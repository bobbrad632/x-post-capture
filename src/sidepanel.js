const emptyEl = document.getElementById("empty");
const frameEl = document.getElementById("frame");
const imgEl = document.getElementById("preview");

function applyPreview(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") {
    emptyEl.classList.remove("hidden");
    frameEl.classList.add("hidden");
    imgEl.removeAttribute("src");
    return;
  }
  emptyEl.classList.add("hidden");
  frameEl.classList.remove("hidden");
  imgEl.src = dataUrl;
}

function loadFromStorage() {
  chrome.storage.session.get(["lastCaptureDataUrl"], (r) => {
    applyPreview(r.lastCaptureDataUrl);
  });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "session" || !changes.lastCaptureDataUrl) return;
  applyPreview(changes.lastCaptureDataUrl.newValue);
});

loadFromStorage();
