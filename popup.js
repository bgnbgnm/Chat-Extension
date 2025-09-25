document.addEventListener("DOMContentLoaded", () => {
  const minTimeInput = document.getElementById("minTime");
  const maxTimeInput = document.getElementById("maxTime");
  const runDurationInput = document.getElementById("runDuration");
  const linesInput = document.getElementById("lines");
  const saveBtn = document.getElementById("saveBtn");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const msgBox = document.getElementById("msg");
  const sentCount = document.getElementById("sentCount");
  const countdown = document.getElementById("countdown");
  const fastTextWrapper = document.getElementById("fastTextWrapper");
  const fastTextInput = document.getElementById("fastText");
  const linesCount = document.getElementById("linesCount");
  const statusIndicator = document.getElementById("statusIndicator");
  const statusText = document.getElementById("statusText");
  const progressValue = document.getElementById("progressValue");
  const toggleTableBtn = document.getElementById("toggleTableBtn");
  const remainingTimeDiv = document.getElementById("remainingTime");
  const emojiModeBtn = document.getElementById("emojiModeBtn");
  const customizeModeBtn = document.getElementById("customizeModeBtn");
  const customizeArea = document.getElementById("customizeArea");
  const messageListSection = document.getElementById("messageListSection");
  const messageListSelect = document.getElementById("messageListSelect");
  const addListBtn = document.getElementById("addListBtn");
  const editListBtn = document.getElementById("editListBtn");
  const deleteListBtn = document.getElementById("deleteListBtn");
  const randomModeBtn = document.getElementById("randomModeBtn");
  const maxModeBtn = document.getElementById("maxModeBtn");
  const fastModeBtn = document.getElementById("fastModeBtn");

  let mode = "max";
  let messageMode = "emoji";
  let durationInterval;
  let currentList = "";

  // This variable is set ONLY after popup is loaded for the first time
  let popupJustOpened = true;

  function showMsg(text, color = "#27ae60ef") {
    msgBox.textContent = text;
    msgBox.style.background = color;
    msgBox.classList.add("show");
    setTimeout(() => {
      msgBox.classList.remove("show");
    }, 1500);
  }

  function stopSpammerIfNeeded() {
    if (!popupJustOpened) {
      chrome.storage.local.set({ running: false });
    }
  }

  function getAllListNames(callback) {
    chrome.storage.local.get(null, (data) => {
      const names = [];
      for (const key in data) {
        if (key.startsWith("customList_")) {
          names.push(key.replace("customList_", ""));
        }
      }
      callback(names);
    });
  }

  function getListContent(listName, callback) {
    chrome.storage.local.get("customList_" + listName, (data) => {
      callback(data["customList_" + listName] || []);
    });
  }

  function setListContent(listName, linesArr, callback) {
    chrome.storage.local.set({ ["customList_" + listName]: linesArr }, callback);
  }

  function removeList(listName, callback) {
    chrome.storage.local.remove("customList_" + listName, callback);
  }

  function updateMessageMode(modeVal, triggeredByUser = false) {
    stopSpammerIfNeeded();
    messageMode = modeVal;
    if (modeVal === "emoji") {
      emojiModeBtn.classList.add("active");
      customizeModeBtn.classList.remove("active");
      customizeArea.style.display = "none";
      messageListSection.classList.add("hidden");
    } else {
      customizeModeBtn.classList.add("active");
      emojiModeBtn.classList.remove("active");
      customizeArea.style.display = "block";
      messageListSection.classList.remove("hidden");
      loadMessageLists();
    }
    chrome.storage.local.set({ messageMode });
    if (triggeredByUser) {
      showMsg("Message mode changed. Press Start.", "#f1c40f");
    }
  }

  emojiModeBtn.addEventListener("click", () => updateMessageMode("emoji", true));
  customizeModeBtn.addEventListener("click", () => updateMessageMode("customize", true));

  function updateModeButtons(currentMode, triggeredByUser = false) {
    stopSpammerIfNeeded();
    mode = currentMode;
    [randomModeBtn, maxModeBtn, fastModeBtn].forEach((btn) => btn.classList.remove("active"));
    if (currentMode === "random") randomModeBtn.classList.add("active");
    if (currentMode === "max") maxModeBtn.classList.add("active");
    if (currentMode === "fast") fastModeBtn.classList.add("active");
    fastTextWrapper.style.display = currentMode === "fast" ? "block" : "none";
    chrome.storage.local.set({ mode: currentMode });

    if (triggeredByUser) {
      showMsg("Mode changed. Press Start.", "#f1c40f");
    }
  }
  randomModeBtn.addEventListener("click", () => updateModeButtons("random", true));
  maxModeBtn.addEventListener("click", () => updateModeButtons("max", true));
  fastModeBtn.addEventListener("click", () => updateModeButtons("fast", true));

  function updateLinesCount() {
    const count = linesInput.value.split("\n").filter((l) => l.trim() !== "").length;
    if (linesCount) linesCount.textContent = count;
    return count;
  }
  linesInput.addEventListener("input", updateLinesCount);
  minTimeInput.addEventListener("input", updateLinesCount);
  maxTimeInput.addEventListener("input", updateLinesCount);
  runDurationInput.addEventListener("input", updateLinesCount);
  fastTextInput.addEventListener("input", updateLinesCount);

  toggleTableBtn.addEventListener("click", () => {
    chrome.storage.local.get("showTable", (data) => {
      const newState = !data.showTable;
      chrome.storage.local.set({ showTable: newState }, () => {
        updateTableBtn(newState);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: "toggleTable" });
        });
      });
    });
  });

  function updateTableBtn(showTable) {
    if (showTable) {
      toggleTableBtn.innerHTML =
        '<i class="fa-solid fa-table"></i> Hide Table Inside Kick';
      toggleTableBtn.classList.add("active");
    } else {
      toggleTableBtn.innerHTML =
        '<i class="fa-solid fa-table"></i> Show Table Inside Kick';
      toggleTableBtn.classList.remove("active");
    }
  }
  chrome.storage.local.get("showTable", (data) => {
    updateTableBtn(!!data.showTable);
  });

  function updateProgressBar(current, max) {
    let percent = 0;
    if (
      current &&
      max &&
      typeof current === "number" &&
      typeof max === "number" &&
      max > 0
    ) {
      percent = Math.min(100, Math.round(100 * (1 - current / max)));
    }
    if (progressValue) progressValue.style.width = percent + "%";
  }

  function updateStatus(running) {
    if (statusIndicator && statusText) {
      if (running) {
        statusIndicator.classList.remove("stopped");
        statusIndicator.classList.add("running");
        statusText.textContent = "Running";
      } else {
        statusIndicator.classList.remove("running");
        statusIndicator.classList.add("stopped");
        statusText.textContent = "Stopped";
      }
    }
  }

  function updateRemainingTime() {
    chrome.storage.local.get(
      ["runDuration", "startTimestamp", "running"],
      (data) => {
        if (!data.running || !data.runDuration || !data.startTimestamp) {
          if (remainingTimeDiv) remainingTimeDiv.textContent = "";
          clearInterval(durationInterval);
          return;
        }
        const totalMs = data.runDuration * 60 * 1000;
        const elapsed = Date.now() - data.startTimestamp;
        const leftMs = Math.max(0, totalMs - elapsed);
        if (leftMs <= 0) {
          if (remainingTimeDiv) remainingTimeDiv.textContent = "Time is up!";
          clearInterval(durationInterval);
          chrome.storage.local.set({ running: false });
          return;
        }
        if (leftMs > 120000) {
          let min = Math.ceil(leftMs / 60000);
          if (remainingTimeDiv)
            remainingTimeDiv.textContent = `Remaining: ${min} minute${
              min > 1 ? "s" : ""
            }`;
        } else {
          let sec = Math.ceil(leftMs / 1000);
          if (remainingTimeDiv)
            remainingTimeDiv.textContent = `Remaining: ${sec} second${
              sec > 1 ? "s" : ""
            }`;
        }
      }
    );
  }

  // Message Lists logic (only for Customize)
  function loadMessageLists(selectedList = "") {
    getAllListNames((names) => {
      if (names.length === 0) {
        // Always ensure at least one Default exists
        setListContent("Default", [], () => {
          loadMessageLists();
        });
        return;
      }
      currentList = selectedList || currentList || names[0] || "Default";
      populateMessageListSelect(names);
      messageListSelect.value = currentList;
      getListContent(currentList, (linesArr) => {
        linesInput.value = (linesArr || []).join("\n");
        updateLinesCount();
      });
      chrome.storage.local.set({ currentList });
    });
  }

  function populateMessageListSelect(names) {
    messageListSelect.innerHTML = "";
    names.forEach((listName) => {
      const option = document.createElement("option");
      option.value = listName;
      option.textContent = listName;
      messageListSelect.appendChild(option);
    });
  }

  messageListSelect.addEventListener("change", () => {
    currentList = messageListSelect.value;
    getListContent(currentList, (linesArr) => {
      linesInput.value = (linesArr || []).join("\n");
      updateLinesCount();
      chrome.storage.local.set({ currentList });
    });
  });

  addListBtn.addEventListener("click", () => {
    const listName = prompt("Enter new message list name:");
    if (!listName) return;
    getAllListNames((names) => {
      if (names.includes(listName)) {
        showMsg("List already exists!", "#e74c3c");
        return;
      }
      setListContent(listName, [], () => {
        currentList = listName;
        loadMessageLists(listName);
        showMsg("List added!", "#27ae60");
      });
    });
  });

  editListBtn.addEventListener("click", () => {
    if (!currentList) return;
    const linesArr = linesInput.value.split("\n").filter((l) => l.trim() !== "");
    if (linesArr.length > 0) {
      setListContent(currentList, linesArr, () => {
        showMsg("List updated!", "#27ae60");
        updateLinesCount();
      });
    } else {
      showMsg("Customize messages is empty. List not updated.", "#f1c40f");
    }
  });

  deleteListBtn.addEventListener("click", () => {
    if (!currentList) return;
    getAllListNames((names) => {
      if (names.length <= 1) {
        showMsg("At least one list must remain!", "#e74c3c");
        return;
      }
      if (!confirm(`Delete list "${currentList}"?`)) return;
      removeList(currentList, () => {
        const newCurrent = names.filter((n) => n !== currentList)[0] || "Default";
        currentList = newCurrent;
        loadMessageLists(newCurrent);
        showMsg("List deleted!", "#e74c3c");
      });
    });
  });

  // Load settings and status on popup open
  chrome.storage.local.get(
    [
      "minTime",
      "maxTime",
      "lines",
      "sent",
      "nextDelay",
      "mode",
      "fastText",
      "showTable",
      "running",
      "runDuration",
      "startTimestamp",
      "messageMode",
      "currentList",
    ],
    (data) => {
      minTimeInput.value = data.minTime || 60;
      maxTimeInput.value = data.maxTime || 120;
      runDurationInput.value = data.runDuration || "";
      currentList = data.currentList || "";
      if (data.messageMode === "customize") {
        updateMessageMode("customize", false);
        loadMessageLists();
      } else {
        updateMessageMode("emoji", false);
        linesInput.value = "";
      }
      sentCount.textContent = data.sent || 0;
      countdown.textContent = data.nextDelay || "-";
      fastTextInput.value = data.fastText || "";
      updateLinesCount();

      const modeVal = data.mode || "max";
      updateModeButtons(modeVal, false);

      updateProgressBar(data.nextDelay, data.maxTime);
      updateTableBtn(!!data.showTable);

      if (data.running && data.runDuration && data.startTimestamp) {
        updateStatus(true);
        updateRemainingTime();
        clearInterval(durationInterval);
        durationInterval = setInterval(updateRemainingTime, 1000);
      } else {
        updateStatus(data.running);
        if (remainingTimeDiv) remainingTimeDiv.textContent = "";
        clearInterval(durationInterval);
      }
      popupJustOpened = false; // Only after initial load
    }
  );

  // Save settings without stopping
  saveBtn.addEventListener("click", () => {
    const minTime = parseInt(minTimeInput.value) || 60;
    const maxTime = parseInt(maxTimeInput.value) || 120;
    const runDuration = parseInt(runDurationInput.value) || "";
    const fastText = fastTextInput.value.trim();

    let linesArr = [];
    let updateListContent = true;

    if (messageMode === "customize") {
      linesArr = linesInput.value.split("\n").filter((l) => l.trim() !== "");
      if (messageListSelect && currentList) {
        if (linesArr.length > 0) {
          setListContent(currentList, linesArr, () => {});
        } else {
          updateListContent = false;
        }
      }
      if (linesArr.length === 0) {
        showMsg("Customize messages is empty. Switched to Mod Emoji mode.", "#f1c40f");
        updateMessageMode("emoji", true);
      }
    }

    chrome.storage.local.get(
      ["showTable", "running", "sent", "nextDelay"],
      (data) => {
        const setObj = {
          minTime,
          maxTime,
          lines: linesArr,
          mode,
          fastText,
          showTable: !!data.showTable,
          sent: data.running ? data.sent : 0,
          nextDelay: data.running ? data.nextDelay : "-",
          runDuration,
          messageMode,
          running: data.running,
          currentList,
        };
        chrome.storage.local.set(
          setObj,
          () => {
            updateLinesCount();
            showMsg("✅ Saved!", "#27ae60ef");
            chrome.runtime.sendMessage({ action: "updateTable" });
            chrome.runtime.sendMessage({ action: "toggleTable" });
          }
        );
      }
    );
  });

  // Start button
  startBtn.addEventListener("click", () => {
    const minTime = parseInt(minTimeInput.value) || 60;
    const maxTime = parseInt(maxTimeInput.value) || 120;
    const runDuration = parseInt(runDurationInput.value) || "";
    const fastText = fastTextInput.value.trim();

    let linesArr = [];
    if (messageMode === "customize") {
      getListContent(currentList, (lines) => {
        linesArr = lines || [];
        chrome.storage.local.get("showTable", (data) => {
          chrome.storage.local.set(
            {
              minTime,
              maxTime,
              lines: linesArr,
              mode,
              fastText,
              showTable: !!data.showTable,
              running: true,
              sent: 0,
              runDuration,
              messageMode,
              startTimestamp: Date.now(),
              currentList,
            },
            () => {
              showMsg("▶ Started!", "#2980b9");
              updateStatus(true);
              updateRemainingTime();
              clearInterval(durationInterval);
              durationInterval = setInterval(updateRemainingTime, 1000);
              chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                  target: { tabId: tabs[0].id },
                  function: () => {
                    const chatInput = document.querySelector(
                      '.editor-input[contenteditable="true"] .editor-paragraph'
                    );
                    if (chatInput) chatInput.focus();
                  },
                });
              });
            }
          );
        });
      });
    } else {
      chrome.storage.local.get("showTable", (data) => {
        chrome.storage.local.set(
          {
            minTime,
            maxTime,
            lines: [],
            mode,
            fastText,
            showTable: !!data.showTable,
            running: true,
            sent: 0,
            runDuration,
            messageMode,
            startTimestamp: Date.now(),
            currentList,
          },
          () => {
            showMsg("▶ Started!", "#2980b9");
            updateStatus(true);
            updateRemainingTime();
            clearInterval(durationInterval);
            durationInterval = setInterval(updateRemainingTime, 1000);
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: () => {
                  const chatInput = document.querySelector(
                    '.editor-input[contenteditable="true"] .editor-paragraph'
                  );
                  if (chatInput) chatInput.focus();
                },
              });
            });
          }
        );
      });
    }
  });

  // Stop button
  stopBtn.addEventListener("click", () => {
    chrome.storage.local.set(
      { running: false, sent: 0, nextDelay: "-", startTimestamp: null },
      () => {
        showMsg("⏹ Stopped", "#e74c3cef");
        updateStatus(false);
        if (remainingTimeDiv) remainingTimeDiv.textContent = "";
        clearInterval(durationInterval);
      }
    );
  });

  // Listen for changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.running || changes.runDuration || changes.startTimestamp) {
      updateRemainingTime();
      clearInterval(durationInterval);
      chrome.storage.local.get(
        ["running", "runDuration", "startTimestamp"],
        (data) => {
          if (data.running && data.runDuration && data.startTimestamp) {
            durationInterval = setInterval(updateRemainingTime, 1000);
          }
        }
      );
    }
    if (changes.sent) sentCount.textContent = changes.sent.newValue;
    if (changes.nextDelay) {
      countdown.textContent = changes.nextDelay.newValue;
      chrome.storage.local.get(["nextDelay", "maxTime"], (data) => {
        updateProgressBar(data.nextDelay, data.maxTime);
      });
    }
    if (changes.running) updateStatus(changes.running.newValue);
    if (changes.lines) {
      linesCount.textContent = changes.lines.newValue.length;
    }
    if (changes.showTable) updateTableBtn(changes.showTable.newValue);
    if (changes.mode) updateModeButtons(changes.mode.newValue, false);
    if (changes.messageMode)
      updateMessageMode(changes.messageMode.newValue, false);
    if (changes.currentList) {
      currentList = changes.currentList.newValue;
      if (messageMode === "customize") loadMessageLists(currentList);
    }
  });
});