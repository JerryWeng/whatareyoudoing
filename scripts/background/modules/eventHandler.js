// scripts/background/modules/eventHandler.js

class EventHandler {
  constructor(tabTracker) {
    this.tabTracker = tabTracker;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Tab activation events
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      console.log("Tab activated:", activeInfo.tabId);
      await this.handleTabActivated(activeInfo);
    });

    // Tab update events
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (this.tabTracker.currentTabId === tabId && changeInfo.url) {
        console.log("Tab URL updated:", tabId, changeInfo.url);
        await this.handleTabUpdated(tabId, changeInfo, tab);
      }
    });

    // Window focus events
    chrome.windows.onFocusChanged.addListener(async (windowId) => {
      console.log("Window focus changed:", windowId);
      await this.handleWindowFocusChanged(windowId);
    });

    // Runtime message events
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleRuntimeMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Popup disconnect detection
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === "popup") {
        console.log("Popup connected");
        port.onDisconnect.addListener(async () => {
          console.log("Popup disconnected - resuming tracking");
          await this.handlePopupClosed();
        });
      }
    });

    // Browser suspend events
    chrome.runtime.onSuspend.addListener(async () => {
      console.log("Browser is closing, saving data...");
      await this.handleSuspend();
    });

    // Browser startup events
    chrome.runtime.onStartup.addListener(() => {
      console.log("Chrome started up - initializing extension");
      this.handleStartup();
    });
  }

  async handleTabActivated(activeInfo) {
    try {
      // Save current session (increments session count)
      await this.tabTracker.saveInfo();

      // Get new tab info and start tracking
      const tab = await new Promise((resolve, reject) => {
        chrome.tabs.get(activeInfo.tabId, (tab) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(tab);
          }
        });
      });

      await this.tabTracker.trackTab(tab);
    } catch (error) {
      console.error("Error getting tab info:", error);
      this.tabTracker.badgeManager.stopBadgeUpdates();
    }
  }

  async handleTabUpdated(tabId, changeInfo, tab) {
    const newDomain = this.tabTracker.getDomain(changeInfo.url);

    // Only treat as new session if domain actually changed
    if (newDomain !== this.tabTracker.currentDomain) {
      await this.tabTracker.saveInfo(); // Save previous session
      await this.tabTracker.trackTab(tab); // Start tracking new domain
    }
  }

  async handleWindowFocusChanged(windowId) {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      // Browser lost focus - only save time if badge is still updating (not paused by popup)
      if (this.tabTracker.badgeManager.isUpdating()) {
        this.tabTracker.cleanup();
        await this.tabTracker.saveTime();
      }
    } else {
      // Browser gained focus - only resume if not paused by popup
      if (!this.tabTracker.badgeManager.paused) {
        try {
          const tabs = await new Promise((resolve, reject) => {
            chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(tabs);
              }
            });
          });

          if (tabs.length > 0) {
            const newDomain = this.tabTracker.getDomain(tabs[0].url);

            // If returning to same domain, don't increment session
            if (newDomain === this.tabTracker.currentDomain) {
              // Just resume tracking the same session
              this.tabTracker.currentTab.startTime = Date.now();
              if (!this.tabTracker.currentTab.intervalId) {
                await this.tabTracker.trackTab(tabs[0]);
              }
            } else {
              // Different domain, treat as new session
              await this.tabTracker.trackTab(tabs[0]);
            }
          }
        } catch (error) {
          console.error("Error handling window focus:", error);
          this.tabTracker.badgeManager.stopBadgeUpdates();
        }
      }
    }
  }

  handleRuntimeMessage(message, sender, sendResponse) {
    if (message.action === "saveTime") {
      (async () => {
        try {
          // Save time without incrementing sessions
          await this.tabTracker.saveTime();

          // Stop tracking intervals but keep badge visible
          await this.tabTracker.pauseTracking();

          console.log("Time saved and tracking paused due to popup opening");
          sendResponse({ success: true });
        } catch (error) {
          console.error("Error saving time:", error);
          sendResponse({ success: false, error: error.message });
        }
      })();
    }
  }

  async handleSuspend() {
    try {
      await this.tabTracker.saveInfo();
      this.tabTracker.cleanup();
    } catch (error) {
      console.error("Error saving data on suspend:", error);
    }
  }

  async handleStartup() {
    await this.tabTracker.initialize();
  }

  async handlePopupClosed() {
    try {
      // Resume tracking on the current active tab
      const tabs = await new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(tabs);
          }
        });
      });

      if (tabs.length > 0) {
        const currentDomain = this.tabTracker.getDomain(tabs[0].url);

        // If we're still on the same domain, resume tracking
        if (currentDomain === this.tabTracker.currentDomain && currentDomain) {
          await this.tabTracker.resumeTracking(tabs[0]);
        } else if (currentDomain !== this.tabTracker.currentDomain) {
          // Different domain, start fresh tracking
          await this.tabTracker.trackTab(tabs[0]);
        }
      }
    } catch (error) {
      console.error("Error resuming tracking after popup closed:", error);
    }
  }
}

export default EventHandler;
