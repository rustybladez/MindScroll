// background.js - Service worker for MindScroll extension
class MindScrollBackground {
  constructor() {
    this.setupListeners();
    this.initializeSettings();
  }

  setupListeners() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === "install") {
        this.onFirstInstall();
      }
    });

    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Handle tab updates (when user navigates to Facebook)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (
        changeInfo.status === "complete" &&
        tab.url &&
        tab.url.includes("facebook.com")
      ) {
        this.onFacebookTabLoaded(tabId, tab);
      }
    });

    // Handle tab activation (when user switches to Facebook tab)
    chrome.tabs.onActivated.addListener((activeInfo) => {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url && tab.url.includes("facebook.com")) {
          this.onFacebookTabActivated(activeInfo.tabId, tab);
        }
      });
    });
  }

  async initializeSettings() {
    // Set default settings if they don't exist
    const settings = await this.getStorageData([
      "reminderInterval",
      "firstInstall",
      "totalTimeSpent",
      "sessionsCount",
    ]);

    const defaults = {
      reminderInterval: 10, // 10 minutes default
      firstInstall: false,
      totalTimeSpent: 0,
      sessionsCount: 0,
    };

    const toSet = {};
    Object.keys(defaults).forEach((key) => {
      if (settings[key] === undefined) {
        toSet[key] = defaults[key];
      }
    });

    if (Object.keys(toSet).length > 0) {
      chrome.storage.local.set(toSet);
    }
  }

  onFirstInstall() {
    // Create welcome notification
    chrome.storage.local.set({
      firstInstall: true,
      installDate: Date.now(),
    });

    // Open options page or show welcome message
    chrome.tabs.create({
      url: chrome.runtime.getURL("popup.html"),
    });
  }

  onFacebookTabLoaded(tabId, tab) {
    // Track that user visited Facebook
    this.incrementSessionCount();

    // Reset session start time if it's a new session
    this.checkAndResetSession();
  }

  onFacebookTabActivated(tabId, tab) {
    // Update last active time
    chrome.storage.local.set({
      lastActiveTime: Date.now(),
      lastActiveTab: tabId,
    });
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case "closeFacebookTab":
          await this.closeFacebookTab(sender.tab.id);
          sendResponse({ success: true });
          break;

        case "getStats":
          const stats = await this.getUsageStats();
          sendResponse({ success: true, stats });
          break;

        case "resetSession":
          await this.resetCurrentSession();
          sendResponse({ success: true });
          break;

        case "logTimeSpent":
          await this.logTimeSpent(request.timeSpent);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: "Unknown action" });
      }
    } catch (error) {
      console.error("MindScroll Background Error:", error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async closeFacebookTab(tabId) {
    // Log time spent before closing
    const sessionData = await this.getStorageData(["sessionStart"]);
    if (sessionData.sessionStart) {
      const timeSpent = Date.now() - sessionData.sessionStart;
      await this.logTimeSpent(timeSpent);
    }

    // Close the tab
    chrome.tabs.remove(tabId);

    // Clear session data
    chrome.storage.local.set({
      currentPurpose: "",
      sessionStart: null,
      lastReminderTime: null,
    });
  }

  async incrementSessionCount() {
    const data = await this.getStorageData(["sessionsCount"]);
    const newCount = (data.sessionsCount || 0) + 1;
    chrome.storage.local.set({ sessionsCount: newCount });
  }

  async checkAndResetSession() {
    const data = await this.getStorageData(["lastActiveTime", "sessionStart"]);
    const now = Date.now();

    // If more than 30 minutes since last activity, start new session
    if (!data.lastActiveTime || now - data.lastActiveTime > 30 * 60000) {
      chrome.storage.local.set({
        sessionStart: now,
        lastReminderTime: now,
        lastActiveTime: now,
      });
    }
  }

  async resetCurrentSession() {
    const now = Date.now();
    chrome.storage.local.set({
      sessionStart: now,
      lastReminderTime: now,
      lastActiveTime: now,
    });
  }

  async logTimeSpent(timeSpent) {
    const data = await this.getStorageData(["totalTimeSpent"]);
    const newTotal = (data.totalTimeSpent || 0) + timeSpent;

    chrome.storage.local.set({
      totalTimeSpent: newTotal,
      lastSessionTime: timeSpent,
      lastSessionDate: Date.now(),
    });
  }

  async getUsageStats() {
    const data = await this.getStorageData([
      "totalTimeSpent",
      "sessionsCount",
      "installDate",
      "lastSessionTime",
      "lastSessionDate",
    ]);

    const daysSinceInstall = data.installDate
      ? Math.ceil((Date.now() - data.installDate) / (24 * 60 * 60 * 1000))
      : 1;

    return {
      totalTimeSpent: data.totalTimeSpent || 0,
      sessionsCount: data.sessionsCount || 0,
      averageSessionTime: data.sessionsCount
        ? Math.round((data.totalTimeSpent || 0) / data.sessionsCount)
        : 0,
      daysSinceInstall,
      averageTimePerDay: Math.round(
        (data.totalTimeSpent || 0) / daysSinceInstall
      ),
      lastSessionTime: data.lastSessionTime || 0,
      lastSessionDate: data.lastSessionDate || null,
    };
  }

  getStorageData(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  }
}

// Initialize background script
new MindScrollBackground();
