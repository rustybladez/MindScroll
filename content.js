// content.js - Runs on Facebook pages
class MindScrollFacebook {
  constructor() {
    this.isModalOpen = false;
    this.sessionData = null;
    this.checkTimer = null;
    this.purposeModalShown = false;

    this.init();
  }

  async init() {
    console.log("MindScroll: Initializing on Facebook");

    // Load session data
    await this.loadSessionData();

    // Show purpose modal if this is a new session
    this.checkForNewSession();

    // Start monitoring
    this.startTimeMonitoring();

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "updateSession") {
        this.loadSessionData();
        sendResponse({ success: true });
      }
    });
  }

  async loadSessionData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        [
          "currentPurpose",
          "sessionStart",
          "reminderInterval",
          "lastReminderTime",
          "lastVisitTime",
        ],
        (result) => {
          this.sessionData = {
            purpose: result.currentPurpose || "",
            sessionStart: result.sessionStart || Date.now(),
            reminderInterval: (result.reminderInterval || 10) * 60000, // Convert to ms
            lastReminderTime: result.lastReminderTime || Date.now(),
            lastVisitTime: result.lastVisitTime || 0,
          };
          resolve();
        }
      );
    });
  }

  checkForNewSession() {
    const now = Date.now();
    const timeSinceLastVisit = now - this.sessionData.lastVisitTime;

    // If more than 30 minutes since last visit, show purpose modal
    if (timeSinceLastVisit > 30 * 60000 || !this.sessionData.purpose) {
      // Show immediately, but ensure body exists first
      this.waitForBody().then(() => this.showPurposeModal());
    }

    // Update last visit time
    chrome.storage.local.set({ lastVisitTime: now });
  }

  waitForBody(timeoutMs = 3000) {
    return new Promise((resolve) => {
      if (document.body) return resolve();
      const start = Date.now();
      const iv = setInterval(() => {
        if (document.body || Date.now() - start > timeoutMs) {
          clearInterval(iv);
          resolve();
        }
      }, 50);
    });
  }

  showPurposeModal() {
    if (this.purposeModalShown || this.isModalOpen) return;

    this.purposeModalShown = true;
    this.isModalOpen = true;

    const modal = this.createPurposeModal();
    document.body.appendChild(modal);

    // Prevent scrolling
    document.body.style.overflow = "hidden";
  }

  createPurposeModal() {
    const overlay = document.createElement("div");
    overlay.id = "mindscroll-purpose-modal";
    overlay.innerHTML = `
            <div class="mindscroll-modal-content">
                <div class="mindscroll-modal-header">
                    <h2>🧠 Why are you visiting Facebook?</h2>
                    <p>Take a moment to set your intention</p>
                </div>
                <div class="mindscroll-modal-body">
                    <input type="text" id="mindscroll-purpose-input" placeholder="Enter your purpose (e.g., check messages, birthday wishes...)" />
                    <div class="mindscroll-preset-buttons">
                        <button class="mindscroll-preset-btn" data-purpose="Check messages">📩 Messages</button>
                        <button class="mindscroll-preset-btn" data-purpose="Check notifications">🔔 Notifications</button>
                        <button class="mindscroll-preset-btn" data-purpose="Birthday wishes">🎂 Birthdays</button>
                        <button class="mindscroll-preset-btn" data-purpose="Fun/Time waste">🎯 Just browsing</button>
                    </div>
                </div>
                <div class="mindscroll-modal-footer">
                    <button id="mindscroll-purpose-save" class="mindscroll-btn-primary">Set Purpose & Continue</button>
                    <button id="mindscroll-purpose-skip" class="mindscroll-btn-secondary">Skip for now</button>
                </div>
            </div>
        `;

    // Add event listeners
    const input = overlay.querySelector("#mindscroll-purpose-input");
    const saveBtn = overlay.querySelector("#mindscroll-purpose-save");
    const skipBtn = overlay.querySelector("#mindscroll-purpose-skip");
    const presetBtns = overlay.querySelectorAll(".mindscroll-preset-btn");

    presetBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        presetBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        input.value = btn.dataset.purpose;
      });
    });

    saveBtn.addEventListener("click", () => {
      const purpose = input.value.trim();
      if (purpose) {
        this.savePurpose(purpose);
      }
      this.closePurposeModal();
    });

    skipBtn.addEventListener("click", () => {
      this.closePurposeModal();
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isModalOpen) {
        this.closePurposeModal();
      }
    });

    return overlay;
  }

  savePurpose(purpose) {
    const now = Date.now();
    chrome.storage.local.set({
      currentPurpose: purpose,
      sessionStart: now,
      lastReminderTime: now,
    });

    this.sessionData.purpose = purpose;
    this.sessionData.sessionStart = now;
    this.sessionData.lastReminderTime = now;
  }

  closePurposeModal() {
    const modal = document.getElementById("mindscroll-purpose-modal");
    if (modal) {
      modal.remove();
    }
    document.body.style.overflow = "";
    this.isModalOpen = false;
  }

  startTimeMonitoring() {
    // Check every 30 seconds
    this.checkTimer = setInterval(() => {
      this.checkTimeElapsed();
    }, 30000);
  }

  checkTimeElapsed() {
    if (this.isModalOpen) return;

    const now = Date.now();
    const timeSinceLastReminder = now - this.sessionData.lastReminderTime;

    if (timeSinceLastReminder >= this.sessionData.reminderInterval) {
      this.showReminderModal();
      chrome.storage.local.set({ lastReminderTime: now });
      this.sessionData.lastReminderTime = now;
    }
  }

  showReminderModal() {
    if (this.isModalOpen) return;

    this.isModalOpen = true;
    const modal = this.createReminderModal();
    document.body.appendChild(modal);

    // Prevent scrolling
    document.body.style.overflow = "hidden";
  }

  createReminderModal() {
    const timeSpent = Math.round(
      (Date.now() - this.sessionData.sessionStart) / 60000
    );
    const intervalMinutes = Math.max(
      1,
      Math.round(this.sessionData.reminderInterval / 60000)
    );
    const purposeText = this.sessionData.purpose
      ? `Remember: You came here to "${this.sessionData.purpose}"`
      : "What was your original purpose?";

    const overlay = document.createElement("div");
    overlay.id = "mindscroll-reminder-modal";
    // Fallback inline styles so modal is usable even if CSS fails
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.85)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "999999";

    const content = document.createElement("div");
    content.className = "mindscroll-reminder-content";
    content.style.background = "#fff";
    content.style.borderRadius = "16px";
    content.style.padding = "32px";
    content.style.maxWidth = "480px";
    content.style.width = "90%";
    content.style.textAlign = "center";
    content.style.boxShadow = "0 25px 50px rgba(0,0,0,0.4)";
    content.style.border = "3px solid #ff9800";

    content.innerHTML = `
      <div class="mindscroll-warning-icon" style="font-size:42px;margin-bottom:16px;">⚠️</div>
      <h2 style="margin:0 0 16px;color:#ff6600;font-size:26px;font-weight:700;">Time to take a break!</h2>
      <div class="mindscroll-stats" style="background:#fff3e0;padding:16px;border-radius:12px;margin-bottom:18px;border-left:4px solid #ff9800;">
        <p style="margin:0 0 8px;color:#333;">You've been scrolling for <strong>${timeSpent} minutes</strong></p>
        <p class="mindscroll-purpose-reminder" style="margin:0;color:#ff6f00;font-style:italic;font-weight:600;">${purposeText}</p>
      </div>
      <div class="mindscroll-reminder-actions" style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px;">
        <button id="mindscroll-leave-fb" class="mindscroll-btn-leave" style="background:#4caf50;color:#fff;border:none;padding:14px 22px;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;">✅ Leave Facebook</button>
    <button id="mindscroll-continue-scroll" class="mindscroll-btn-continue" style="background:#ff5722;color:#fff;border:none;padding:12px 18px;border-radius:8px;font-size:14px;cursor:pointer;">⏰ Continue (${intervalMinutes} more minute${
      intervalMinutes === 1 ? "" : "s"
    })</button>
      </div>
      <div class="mindscroll-motivation" style="background:#e8f5e8;padding:12px;border-radius:8px;border:2px solid #4caf50;">
        <p style="margin:0;color:#2e7d32;font-weight:600;">💪 Your productive self is waiting for you!</p>
      </div>
    `;

    overlay.appendChild(content);

    // Add event listeners
    const leaveBtn = content.querySelector("#mindscroll-leave-fb");
    const continueBtn = content.querySelector("#mindscroll-continue-scroll");

    leaveBtn.addEventListener("click", () => {
      // Close Facebook tab
      chrome.runtime.sendMessage({ action: "closeFacebookTab" });
    });

    continueBtn.addEventListener("click", () => {
      this.closeReminderModal();
      // Reset timer for another full interval
      const now = Date.now();
      chrome.storage.local.set({ lastReminderTime: now });
      this.sessionData.lastReminderTime = now;
    });

    return overlay;
  }

  closeReminderModal() {
    const modal = document.getElementById("mindscroll-reminder-modal");
    if (modal) {
      modal.remove();
    }
    document.body.style.overflow = "";
    this.isModalOpen = false;
  }
}

// Initialize when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new MindScrollFacebook();
  });
} else {
  new MindScrollFacebook();
}
