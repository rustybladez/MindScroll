// popup.js - Extension popup logic
document.addEventListener("DOMContentLoaded", function () {
  const reminderIntervalInput = document.getElementById("reminderInterval");
  const sessionPurposeInput = document.getElementById("sessionPurpose");
  const saveBtn = document.getElementById("saveSettings");
  const resetTimerBtn = document.getElementById("resetTimer");
  const statusDiv = document.getElementById("status");
  const currentPurposeDiv = document.getElementById("currentPurpose");
  const purposeTextSpan = document.getElementById("purposeText");
  const presetBtns = document.querySelectorAll(".preset-btn[data-purpose]");

  // Load saved settings and current session
  loadSettings();
  loadCurrentSession();

  // Preset button handlers
  presetBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      presetBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      sessionPurposeInput.value = this.dataset.purpose;
    });
  });

  // Save settings
  saveBtn.addEventListener("click", function () {
    const settings = {
      reminderInterval: parseInt(reminderIntervalInput.value) || 10,
      timestamp: Date.now(),
    };

    const purpose = sessionPurposeInput.value.trim();
    if (purpose) {
      settings.currentPurpose = purpose;
      settings.sessionStart = Date.now();
    }

    chrome.storage.local.set(settings, function () {
      if (chrome.runtime.lastError) {
        showStatus("Error saving settings", "error");
      } else {
        showStatus("Settings saved!", "success");

        // Notify content script about new purpose
        if (purpose) {
          notifyContentScript();
        }

        // Update current purpose display
        loadCurrentSession();
      }
    });
  });

  // Reset timer
  resetTimerBtn.addEventListener("click", function () {
    chrome.storage.local.set(
      {
        sessionStart: Date.now(),
        lastReminderTime: Date.now(),
      },
      function () {
        showStatus("Timer reset!", "success");
        notifyContentScript();
      }
    );
  });

  function loadSettings() {
    chrome.storage.local.get(["reminderInterval"], function (result) {
      reminderIntervalInput.value = result.reminderInterval || 10;
    });
  }

  function loadCurrentSession() {
    chrome.storage.local.get(["currentPurpose"], function (result) {
      if (result.currentPurpose) {
        purposeTextSpan.textContent = result.currentPurpose;
        currentPurposeDiv.style.display = "block";
      } else {
        currentPurposeDiv.style.display = "none";
      }
    });
  }

  function showStatus(message, type = "info") {
    statusDiv.textContent = message;
    statusDiv.style.color =
      type === "error" ? "#d32f2f" : type === "success" ? "#388e3c" : "#666";

    setTimeout(() => {
      statusDiv.textContent = "";
    }, 3000);
  }

  function notifyContentScript() {
    // Send message to content script to update session
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0] && tabs[0].url.includes("facebook.com")) {
        chrome.tabs
          .sendMessage(tabs[0].id, {
            action: "updateSession",
          })
          .catch(() => {
            // Content script might not be ready, ignore error
          });
      }
    });
  }
});
