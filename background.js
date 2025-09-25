function updateBadge(mode, running) {
  if (!running) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  let text = "";
  let color = "#000";

  if (mode === "random") {
    text = "R";
    color = "#27ae60"; // green
  } else if (mode === "max") {
    text = "M";
    color = "#f1c40f"; // yellow
  } else if (mode === "fast") {
    text = "F";
    color = "#e74c3c"; // red
  }

  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes.running || changes.mode) {
    chrome.storage.local.get(["mode", "running"], (data) => {
      updateBadge(data.mode || "max", data.running);
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "" });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(["mode", "running"], (data) => {
    updateBadge(data.mode || "max", data.running);
  });
});
