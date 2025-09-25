let panel = null;
let timerId = null;
let countdownTimer = null;
let currentCountdown = 0;
let durationTimerId = null;
let durationRemainingTimer = null;
let isExpanded = false;

let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function updateCountdown() {
  if (currentCountdown > 0) {
    currentCountdown--;
    chrome.storage.local.set({ nextDelay: currentCountdown });
  }
}

function updateRemainingDuration(data) {
  const remainingDiv = document.getElementById("kickRemainingTime");
  if (
    !panel ||
    !remainingDiv ||
    !data.running ||
    !data.runDuration ||
    !data.startTimestamp
  ) {
    if (remainingDiv) remainingDiv.textContent = "";
    if (durationRemainingTimer) {
      clearInterval(durationRemainingTimer);
      durationRemainingTimer = null;
    }
    return;
  }
  const totalMs = data.runDuration * 60 * 1000;
  const elapsed = Date.now() - data.startTimestamp;
  const leftMs = Math.max(0, totalMs - elapsed);

  if (leftMs <= 0) {
    remainingDiv.textContent = "Time is up!";
    clearInterval(durationRemainingTimer);
    durationRemainingTimer = null;
    chrome.storage.local.set({ running: false });
    return;
  }

  if (leftMs > 120000) {
    let min = Math.ceil(leftMs / 60000);
    remainingDiv.textContent = `Remaining: ${min} minute${min > 1 ? "s" : ""}`;
  } else {
    let sec = Math.ceil(leftMs / 1000);
    remainingDiv.textContent = `Remaining: ${sec} second${sec > 1 ? "s" : ""}`;
  }
}

function createPanel() {
  if (panel) panel.remove();

  // Add popup style for panel if not exists
  if (!document.getElementById("kick-spammer-panel-style")) {
    const style = document.createElement("style");
    style.id = "kick-spammer-panel-style";
    style.textContent = `
      #kick-spammer-panel {
        font-family: "Segoe UI", Arial, sans-serif;
        background: linear-gradient(135deg, #181818 60%, #232323 100%);
        color: #f5f5f5;
        border-radius: 18px;
        border: 3px solid #f1c40f;
        box-shadow: 0 0 18px #222a;
        min-width: 370px;
        max-width: 420px;
        position: fixed;
      }
      .kick-panel-header {
        background: #23272a;
        border-radius: 13px 13px 0 0;
        padding: 10px 18px;
        font-weight: 700;
        font-size: 18px;
        color: #f1c40f;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
        border-bottom: 1px solid #353b48;
      }
      .kick-panel-content {
        padding: 16px 18px 10px 18px;
      }
      .kick-status-row {
        font-weight: bold;
        font-size: 17px;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 9px;
      }
      .kick-status-dot {
        display: inline-block;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        border: 2px solid #f1c40f;
        vertical-align: middle;
        margin-right: 7px;
        background: #c0392b;
        box-shadow: 0 0 7px #c0392b;
        transition: background 0.3s, box-shadow 0.3s;
      }
      .kick-status-dot.running {
        background: #27ae60;
        box-shadow: 0 0 7px #27ae60;
      }
      .kick-status-dot.stopped {
        background: #c0392b;
        box-shadow: 0 0 7px #c0392b;
      }
      .kick-panel-divider {
        margin: 13px 0 7px 0;
        border-bottom: 1px solid #353b48;
      }
      .kick-info-row,
      .kick-next-row,
      .kick-settings-row,
      .kick-remaining-row,
      .kick-details-row {
        transition: max-height 0.3s, opacity 0.3s;
      }
      .kick-info-row {
        margin-top: 4px;
        font-size: 15px;
        color: #f5e6a1;
        display: flex;
        flex-wrap: wrap;
        gap: 18px;
        opacity: 1;
        max-height: 100px;
      }
      .kick-next-row {
        margin-top: 8px;
        color: #aee1fa;
        font-size: 15px;
        opacity: 1;
        max-height: 30px;
      }
      .kick-settings-row {
        margin-top: 10px;
        margin-bottom: 2px;
        font-size: 15px;
        color: #f1c40f;
        background: #232323;
        border-radius: 12px;
        padding: 10px 14px;
        border: 1px solid #444;
        box-shadow: 0 1px 5px #2224;
        display: flex;
        flex-direction: column;
        gap: 7px;
        opacity: 1;
        max-height: 100px;
      }
      .kick-settings-row span {
        display: block;
        font-size: 15px;
        color: #f1c40f;
      }
      .kick-remaining-row {
        margin-top: 9px;
        color: #f1c40f;
        font-weight: 600;
        font-size: 15px;
        opacity: 1;
        max-height: 30px;
      }
      .kick-details-row {
        margin-top: 6px;
        font-size: 14px;
        color: #f1c40f;
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        opacity: 1;
        max-height: 60px;
      }
      .kick-btn-group {
        margin-top: 10px;
        display: flex;
        gap: 10px;
      }
      .kick-small-btn {
        flex: 1;
        padding: 5px 16px;
        font-size: 13px;
        font-weight: bold;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        color: #fff;
        background: #27ae60;
        box-shadow: 0 2px 6px #0002;
        transition: background 0.2s;
      }
      .kick-small-btn.stop {
        background: #e74c3c;
      }
      .kick-small-btn.start {
        background: #27ae60;
      }
      .kick-show-more-btn {
        padding: 3px 12px;
        font-size: 13px;
        font-weight: 500;
        border-radius: 7px;
        border: 2px solid #f1c40f;
        background: #353b48;
        color: #f1c40f;
        margin-left: 8px;
        cursor: pointer;
        transition: background 0.18s, border 0.18s;
      }
      .kick-collapsed {
        opacity: 0;
        max-height: 0;
        overflow: hidden;
        pointer-events: none;
        margin: 0;
        padding: 0;
      }
    `;
    document.head.appendChild(style);
  }

  panel = document.createElement("div");
  panel.id = "kick-spammer-panel";
  panel.style.bottom = "30px";
  panel.style.left = "50%";
  panel.style.transform = "translateX(-50%)";
  panel.style.zIndex = "9999";
  panel.style.userSelect = "none";
  panel.style.padding = "0";

  panel.innerHTML = `
    <div class="kick-panel-header" id="kickPanelHeader">
      <span>Kick Chat Status</span>
      <button id="hidePanel" style="
        background:#e74c3c;
        color:white;
        border:none;
        padding:2px 13px 2px 13px;
        border-radius:6px;
        cursor:pointer;
        font-weight:bold;
        font-size:18px;
        box-shadow:0 2px 6px #0002;
        transition:0.2s;
      ">✖</button>
    </div>
    <div class="kick-panel-content">
      <div style="display:flex;align-items:center;gap:0;justify-content: space-between;">
        <div class="kick-status-row" id="kickStatusRow" style="margin-bottom:0;">
          <span id="kickStatusDot" class="kick-status-dot stopped"></span>
          <span id="kickStatusText">Stopped</span>
        </div>
        <button id="kickShowMoreBtn" class="kick-show-more-btn">Show More</button>
      </div>
      <div id="kickMoreSection">
        <div class="kick-panel-divider"></div>
        <div class="kick-info-row" id="kickInfoRow">
          <span>📤 Sent Messages: <span id="kickSentText">0</span></span>
          <span>📝 Lines Entered: <span id="kickLinesText">0</span></span>
        </div>
        <div class="kick-next-row" id="kickNextRow">
          ⏳ Next in: <span id="kickNextText">-</span> sec
        </div>
        <div class="kick-settings-row" id="kickSettingsRow">
          <span id="kickMinTimeText">⏱ Min Time (seconds): -</span>
          <span id="kickMaxTimeText">⏱ Max Time (seconds): -</span>
          <span id="kickRunDurationText">⏳ Run Duration (minutes): -</span>
        </div>
        <div class="kick-remaining-row" id="kickRemainingTime"></div>
        <div class="kick-panel-divider"></div>
        <div class="kick-details-row" id="kickDetailsRow">
          <span>Message Mode:</span>
          <span id="kickMessageModeText">Emotes mode</span>
          <span id="kickListLabel" style="display:none;">| Message List:</span>
          <span id="kickMessageListName" style="font-weight:bold;"></span>
        </div>
      </div>
      <div class="kick-panel-divider"></div>
      <div class="kick-btn-group">
        <button class="kick-small-btn start" id="kickStartBtn">Start</button>
        <button class="kick-small-btn stop" id="kickStopBtn">Stop</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  // Collapsed by default
  let moreSection = document.getElementById("kickMoreSection");
  function updateMoreSection() {
    if (isExpanded) {
      moreSection.classList.remove('kick-collapsed');
      document.getElementById("kickShowMoreBtn").textContent = "Show Less";
    } else {
      moreSection.classList.add('kick-collapsed');
      document.getElementById("kickShowMoreBtn").textContent = "Show More";
    }
  }
  moreSection.classList.add('kick-collapsed');
  updateMoreSection();

  document.getElementById("kickShowMoreBtn").onclick = () => {
    isExpanded = !isExpanded;
    updateMoreSection();
  };

  // Drag logic
  const header = document.getElementById("kickPanelHeader");
  header.addEventListener("mousedown", function (e) {
    isDragging = true;
    panel.style.transform = "";
    if (!panel.style.left || !panel.style.top) {
      const rect = panel.getBoundingClientRect();
      panel.style.left = rect.left + "px";
      panel.style.top = rect.top + "px";
      panel.style.bottom = "";
    }
    dragOffsetX = e.clientX - panel.getBoundingClientRect().left;
    dragOffsetY = e.clientY - panel.getBoundingClientRect().top;
    document.body.style.userSelect = "none";
  });
  document.addEventListener("mousemove", function (e) {
    if (isDragging) {
      let left = e.clientX - dragOffsetX;
      let top = e.clientY - dragOffsetY;
      left = Math.max(0, Math.min(left, window.innerWidth - panel.offsetWidth));
      top = Math.max(0, Math.min(top, window.innerHeight - panel.offsetHeight));
      panel.style.left = left + "px";
      panel.style.top = top + "px";
      panel.style.bottom = "";
    }
  });
  document.addEventListener("mouseup", function () {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = "";
    }
  });

  document.getElementById("hidePanel").onclick = () => {
    panel.style.display = "none";
    chrome.storage.local.set({ showTable: false });
  };

  document.getElementById("kickStartBtn").onclick = () => {
    chrome.storage.local.set({
      running: true,
      sent: 0,
      startTimestamp: Date.now(),
    });
  };
  document.getElementById("kickStopBtn").onclick = () => {
    chrome.storage.local.set({ running: false });
  };

  chrome.storage.local.get(
    [
      "sent",
      "nextDelay",
      "running",
      "lines",
      "messageMode",
      "messageLists",
      "currentList",
      "runDuration",
      "startTimestamp",
      "minTime",
      "maxTime",
    ],
    (data) => {
      updatePanel(data);
      updateRemainingDuration(data);
      if (durationRemainingTimer) clearInterval(durationRemainingTimer);
      if (data.running && data.runDuration && data.startTimestamp) {
        durationRemainingTimer = setInterval(() => {
          chrome.storage.local.get(
            ["running", "runDuration", "startTimestamp"],
            updateRemainingDuration
          );
        }, 1000);
      }
    }
  );
}

function updatePanel(data) {
  if (!panel) return;
  // Status
  const statusText = document.getElementById("kickStatusText");
  const statusDot = document.getElementById("kickStatusDot");
  if (statusText && statusDot) {
    if (data.running) {
      statusText.textContent = "Running";
      statusDot.classList.add("running");
      statusDot.classList.remove("stopped");
    } else {
      statusText.textContent = "Stopped";
      statusDot.classList.add("stopped");
      statusDot.classList.remove("running");
    }
  }
  // Sent messages
  const sentText = document.getElementById("kickSentText");
  if (sentText) sentText.textContent = data.sent !== undefined ? data.sent : 0;

  // Lines entered
  const linesText = document.getElementById("kickLinesText");
  if (linesText) {
    let linesCount = 0;
    if (Array.isArray(data.lines)) {
      linesCount = data.lines.filter((l) => l && l.trim() !== "").length;
    }
    linesText.textContent = linesCount;
  }
  // Next in
  const nextText = document.getElementById("kickNextText");
  if (nextText)
    nextText.textContent = data.nextDelay !== undefined ? data.nextDelay : "-";

  // Min/Max/RunDuration
  const minTimeText = document.getElementById("kickMinTimeText");
  const maxTimeText = document.getElementById("kickMaxTimeText");
  const runDurationText = document.getElementById("kickRunDurationText");
  if (minTimeText)
    minTimeText.textContent = `⏱ Min Time (seconds): ${
      data.minTime !== undefined ? data.minTime : "-"
    }`;
  if (maxTimeText)
    maxTimeText.textContent = `⏱ Max Time (seconds): ${
      data.maxTime !== undefined ? data.maxTime : "-"
    }`;
  if (runDurationText)
    runDurationText.textContent = `⏳ Run Duration (minutes): ${
      data.runDuration !== undefined && data.runDuration !== ""
        ? data.runDuration
        : "-"
    }`;

  // Message Mode
  const messageModeText = document.getElementById("kickMessageModeText");
  if (messageModeText) {
    messageModeText.textContent =
      data.messageMode === "customize" ? "Customize" : "Emotes mode";
  }

  // Message List info (only show if in customize)
  const msgListLabel = document.getElementById("kickListLabel");
  const msgListName = document.getElementById("kickMessageListName");
  if (msgListLabel && msgListName) {
    if (data.messageMode === "customize") {
      msgListLabel.style.display = "inline";
      msgListName.textContent = data.currentList ? data.currentList : "Default";
    } else {
      msgListLabel.style.display = "none";
      msgListName.textContent = "";
    }
  }
  // Remaining duration
  updateRemainingDuration(data);
  if (durationRemainingTimer) clearInterval(durationRemainingTimer);
  if (data.running && data.runDuration && data.startTimestamp) {
    durationRemainingTimer = setInterval(() => {
      chrome.storage.local.get(
        ["running", "runDuration", "startTimestamp"],
        updateRemainingDuration
      );
    }, 1000);
  }
}

chrome.storage.onChanged.addListener((changes) => {
  if (
    panel &&
    (changes.running ||
      changes.sent ||
      changes.nextDelay ||
      changes.lines ||
      changes.messageMode ||
      changes.messageLists ||
      changes.currentList ||
      changes.runDuration ||
      changes.startTimestamp ||
      changes.minTime ||
      changes.maxTime)
  ) {
    chrome.storage.local.get(
      [
        "sent",
        "nextDelay",
        "running",
        "lines",
        "messageMode",
        "messageLists",
        "currentList",
        "runDuration",
        "startTimestamp",
        "minTime",
        "maxTime",
      ],
      (data) => {
        updatePanel(data);
      }
    );
  }
});

function startSpammer(lines, minTime, maxTime, mode, fastText, runDuration) {
  let sent = 0;
  let stopAt = null;

  if (runDuration && !isNaN(runDuration)) {
    stopAt = Date.now() + runDuration * 60 * 1000;
    if (durationTimerId) clearTimeout(durationTimerId);
    durationTimerId = setTimeout(() => {
      stopSpammer();
      chrome.storage.local.set({ running: false });
    }, runDuration * 60 * 1000);
  }

  function postOnce() {
    if (stopAt && Date.now() >= stopAt) {
      stopSpammer();
      chrome.storage.local.set({ running: false });
      return;
    }
    let message =
      mode === "fast"
        ? fastText || "GG"
        : lines[Math.floor(Math.random() * lines.length)];
    let chatInput = document.querySelector(".editor-paragraph");
    let chatInput1 = document.querySelector(".editor-input");
    if (chatInput) {
      chatInput.focus();
      chatInput1.focus();
      document.execCommand("insertText", false, message);
      let sendButton = document.querySelector("#send-message-button");
      if (sendButton) sendButton.click();
      sent++;
      chrome.storage.local.set({ sent });
    }
    let nextDelay =
      mode === "random"
        ? getRandomDelay(minTime, maxTime)
        : mode === "max"
        ? maxTime
        : 1;
    currentCountdown = nextDelay;
    chrome.storage.local.set({ nextDelay });
    timerId = setTimeout(postOnce, nextDelay * 1000);
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(updateCountdown, 1000);
  }
  postOnce();
}

function stopSpammer() {
  if (timerId) clearTimeout(timerId);
  if (countdownTimer) clearInterval(countdownTimer);
  if (durationTimerId) clearTimeout(durationTimerId);
  if (durationRemainingTimer) clearInterval(durationRemainingTimer);
  timerId = null;
  countdownTimer = null;
  durationTimerId = null;
  durationRemainingTimer = null;
}

function getActiveLines(callback) {
  chrome.storage.local.get(
    ["messageMode", "messageLists", "currentList", "lines"],
    (data) => {
      if (
        data.messageMode === "customize" &&
        data.messageLists &&
        data.currentList
      ) {
        callback(data.messageLists[data.currentList] || []);
      } else {
        callback(
          data.lines && data.lines.length > 0
            ? data.lines
            : [
                "[emote:4147873:YouTried]",
                "[emote:37239:WeSmart]",
                "[emote:4147909:coffinPls] [emote:4148144:catblobDance]",
                "[emote:37240:WeirdChamp]",
                "[emote:4147884:vibePls]",
                "[emote:3645849:TRUEING]",
                "[emote:37237:TriKool]",
                "[emote:4147896:TOXIC]",
                "[emote:37236:ThisIsFine]",
                "[emote:3645849:TRUEING] [emote:37225:KEKLEO]",
                "[emote:4148085:SUSSY]",
                "[emote:4055801:SIT]",
                "[emote:28633:SenpaiWhoo]",
                "[emote:4147869:SaltT]",
                "[emote:4148081:Sadge]",
                "[emote:37248:ratJAM]",
                "[emote:37237:TriKool] [emote:39251:beeBobble]",
                "[emote:37234:Prayge]",
                "[emote:4147888:ppJedi]",
                "[emote:39277:politeCat]",
                "[emote:37230:POLICE]",
                "[emote:37233:PogU]",
                "[emote:39275:peepoShy]",
                "[emote:37246:peepoRiot]",
                "[emote:3645849:TRUEING] [emote:37230:POLICE]",
                "[emote:37245:peepoDJ]",
                "[emote:37232:PeepoClap]",
                "[emote:4147814:OuttaPocket]",
                "[emote:37229:OOOO]",
                "[emote:4055796:ODAJAM]",
                "[emote:37234:Prayge] [emote:305040:Kappa]",
                "[emote:28631:NugTime]",
                "[emote:37228:NODDERS]",
                "[emote:37244:modCheck]",
                "[emote:4148128:mericCat]",
                "[emote:4148085:SUSSY] [emote:37221:EZ]",
                "[emote:37227:LULW]",
                "[emote:39272:LetMeIn]",
                "[emote:39261:kkHuh]",
                "[emote:37226:KEKW]",
                "[emote:37239:WeSmart] [emote:4147869:SaltT]",
                "[emote:37225:KEKLEO]",
                "[emote:4147902:KEKBye]",
                "[emote:305040:Kappa]",
                "[emote:4148074:HYPERCLAP]",
                "[emote:4148076:HaHaa]",
                "[emote:39272:LetMeIn] [emote:4148144:catblobDance]",
                "[emote:4055795:GnomeDisco]",
                "[emote:37224:GIGACHAD]",
                "[emote:37243:gachiGASM]",
                "[emote:39402:Flowie]",
                "[emote:3645852:FLASHBANG]",
                "[emote:37221:EZ]",
                "[emote:4147869:SaltT] [emote:4055796:ODAJAM]",
                "[emote:39265:EDMusiC]",
                "[emote:3645850:EDDIE]",
                "[emote:4147914:duckPls]",
                "[emote:37220:DonoWall]",
                "[emote:39260:DanceDance]",
                "[emote:4147909:coffinPls]",
                "[emote:28633:SenpaiWhoo] [emote:4147900:catKISS]",
                "[emote:37218:Clap]",
                "[emote:4147900:catKISS]",
                "[emote:4148144:catblobDance]",
                "[emote:39254:CaptFail]",
                "[emote:37217:Bwop]",
                "[emote:4147888:ppJedi] [emote:37244:modCheck]",
                "[emote:39251:beeBobble]",
                "[emote:4147910:BBoomer]",
                "[emote:37215:AYAYA]",
                "[emote:3753119:asmonSmash]",
              ]
        );
      }
    }
  );
}

chrome.storage.local.get(
  [
    "running",
    "showTable",
    "minTime",
    "maxTime",
    "lines",
    "mode",
    "fastText",
    "runDuration",
    "messageMode",
    "messageLists",
    "currentList",
    "startTimestamp",
  ],
  (data) => {
    if (data.showTable) createPanel();
    if (data.running) {
      getActiveLines((lines) => {
        startSpammer(
          lines,
          data.minTime || 60,
          data.maxTime || 120,
          data.mode || "max",
          data.fastText || "⚡",
          data.runDuration
        );
      });
    }
  }
);

chrome.storage.onChanged.addListener((changes) => {
  if (
    panel &&
    (changes.running ||
      changes.sent ||
      changes.nextDelay ||
      changes.lines ||
      changes.messageMode ||
      changes.messageLists ||
      changes.currentList ||
      changes.runDuration ||
      changes.startTimestamp ||
      changes.minTime ||
      changes.maxTime)
  ) {
    chrome.storage.local.get(
      [
        "sent",
        "nextDelay",
        "running",
        "lines",
        "messageMode",
        "messageLists",
        "currentList",
        "runDuration",
        "startTimestamp",
        "minTime",
        "maxTime",
      ],
      (data) => {
        updatePanel(data);
      }
    );
  }
  if (changes.running) {
    if (changes.running.newValue) {
      chrome.storage.local.get(
        [
          "minTime",
          "maxTime",
          "messageMode",
          "messageLists",
          "currentList",
          "lines",
          "mode",
          "fastText",
          "runDuration",
          "startTimestamp",
        ],
        (data) => {
          getActiveLines((lines) => {
            startSpammer(
              lines,
              data.minTime,
              data.maxTime,
              data.mode,
              data.fastText,
              data.runDuration
            );
          });
        }
      );
    } else {
      stopSpammer();
    }
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "toggleTable") {
    chrome.storage.local.get(["showTable"], (data) => {
      if (data.showTable) {
        if (!panel) createPanel();
        panel.style.display = "block";
      } else if (panel) {
        panel.remove();
        panel = null;
      }
    });
  }
});

chrome.storage.local.get(["showTable"], (data) => {
  if (data.showTable) createPanel();
});