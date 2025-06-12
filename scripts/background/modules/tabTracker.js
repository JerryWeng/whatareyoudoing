// scripts/background/modules/tabTracker.js

class TabTracker {
  constructor(storageManager, badgeManager) {
    this.storageManager = storageManager;
    this.badgeManager = badgeManager;

    this.currentTab = {
      id: null,
      intervalId: null,
      domain: null,
      currentDate: null,
      startTime: null,
      accumulatedTime: 0,
    };
  }

  // Extract domain from URL
  getDomain(url) {
    try {
      const urlObj = new URL(url);
      if (
        urlObj.protocol === "chrome:" ||
        urlObj.protocol === "about:" ||
        urlObj.protocol === "file:"
      ) {
        return null;
      }
      if (urlObj.protocol === "http:" || urlObj.protocol === "https:") {
        return urlObj.hostname;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Calculate elapsed time since tracking started
  getElapsedTime() {
    if (!this.currentTab.startTime) return 0;
    const now = Date.now();
    return Math.floor((now - this.currentTab.startTime) / 1000);
  }

  // Get total time for current session
  getCurrentSessionTime() {
    return this.currentTab.accumulatedTime + this.getElapsedTime();
  }

  // Get total time spent on current domain today
  async getTotalDomainTime() {
    if (!this.currentTab.domain) return 0;

    const storedTime = await this.storageManager.getTotalDomainTime(
      this.currentTab.domain,
      this.currentTab.currentDate
    );
    const currentSessionTime = this.getCurrentSessionTime();

    return storedTime + currentSessionTime;
  }

  // Start tracking a tab
  async trackTab(tab) {
    // Clear any existing interval
    if (this.currentTab.intervalId) {
      clearInterval(this.currentTab.intervalId);
      this.currentTab.intervalId = null;
    }

    // Save current tab data before switching
    if (this.currentTab.domain && this.currentTab.startTime) {
      const elapsedTime = this.getElapsedTime();
      this.currentTab.accumulatedTime += elapsedTime;
    }

    // Set up new tab tracking
    this.currentTab.id = tab.id;
    this.currentTab.domain = this.getDomain(tab.url);
    this.currentTab.startTime = Date.now();
    this.currentTab.accumulatedTime = 0;
    this.currentTab.currentDate = this.storageManager.getLocalDateString();

    if (this.currentTab.domain) {
      // Start badge updates for this domain
      await this.badgeManager.startBadgeUpdates(
        this.currentTab.domain,
        () => this.getCurrentSessionTime(),
        () => this.getTotalDomainTime()
      );

      // Check for date changes every 30 seconds
      this.currentTab.intervalId = setInterval(async () => {
        const today = this.storageManager.getLocalDateString();

        if (today !== this.currentTab.currentDate) {
          console.log(
            `Date changed from ${this.currentTab.currentDate} to ${today}`
          );

          // Save accumulated time for previous date
          const totalTime = this.getCurrentSessionTime();
          if (totalTime > 0) {
            await this.storageManager.updateTimeOnly(
              this.currentTab.domain,
              totalTime,
              this.currentTab.currentDate
            );
          }

          // Reset for new date
          this.currentTab.currentDate = today;
          this.currentTab.startTime = Date.now();
          this.currentTab.accumulatedTime = 0;

          // Update badge for new date
          await this.badgeManager.updateBadge(
            this.currentTab.domain,
            () => this.getCurrentSessionTime(),
            () => this.getTotalDomainTime()
          );
        }
      }, 30000);

      console.log(`Now tracking tab: ${tab.id} (${this.currentTab.domain})`);
    } else {
      // Clear badge for non-trackable domains
      this.badgeManager.clearBadge();
      console.log(`Not tracking tab: ${tab.id} (invalid domain)`);
    }
  }

  // Resume tracking after popup closes
  async resumeTracking(tab) {
    if (!this.currentTab.domain) return;

    // Reset start time to now (since we were paused)
    this.currentTab.startTime = Date.now();

    // Resume badge updates
    await this.badgeManager.resumeBadgeUpdates(
      this.currentTab.domain,
      () => this.getCurrentSessionTime(),
      () => this.getTotalDomainTime()
    );

    // Restart date change monitoring
    this.currentTab.intervalId = setInterval(async () => {
      const today = this.storageManager.getLocalDateString();

      if (today !== this.currentTab.currentDate) {
        console.log(
          `Date changed from ${this.currentTab.currentDate} to ${today}`
        );

        // Save accumulated time for previous date
        const totalTime = this.getCurrentSessionTime();
        if (totalTime > 0) {
          await this.storageManager.updateTimeOnly(
            this.currentTab.domain,
            totalTime,
            this.currentTab.currentDate
          );
        }

        // Reset for new date
        this.currentTab.currentDate = today;
        this.currentTab.startTime = Date.now();
        this.currentTab.accumulatedTime = 0;

        // Update badge for new date
        await this.badgeManager.updateBadge(
          this.currentTab.domain,
          () => this.getCurrentSessionTime(),
          () => this.getTotalDomainTime()
        );
      }
    }, 30000);

    console.log(`Resumed tracking for: ${this.currentTab.domain}`);
  }

  // Pause tracking but keep badge visible
  async pauseTracking() {
    if (this.currentTab.intervalId) {
      clearInterval(this.currentTab.intervalId);
      this.currentTab.intervalId = null;
    }

    // Pause badge updates (stops interval but keeps badge visible)
    this.badgeManager.pauseBadgeUpdates();

    // Update badge one final time with current total
    if (this.currentTab.domain) {
      await this.badgeManager.updateBadge(
        this.currentTab.domain,
        () => this.getCurrentSessionTime(),
        () => this.getTotalDomainTime()
      );
    }

    console.log("Tracking paused, badge preserved");
  }

  // Save current session with session increment
  async saveInfo() {
    if (this.currentTab.domain && this.currentTab.startTime) {
      const totalTime = this.getCurrentSessionTime();
      if (totalTime > 0) {
        await this.storageManager.updateInfo(
          this.currentTab.domain,
          totalTime,
          this.currentTab.currentDate
        );
        this.currentTab.accumulatedTime = 0;
        this.currentTab.startTime = Date.now();

        // Update badge after saving
        await this.badgeManager.updateBadge(
          this.currentTab.domain,
          () => this.getCurrentSessionTime(),
          () => this.getTotalDomainTime()
        );
      }
    }
  }

  // Save only time without session increment
  async saveTime() {
    if (this.currentTab.domain && this.currentTab.startTime) {
      const totalTime = this.getCurrentSessionTime();
      if (totalTime > 0) {
        await this.storageManager.updateTimeOnly(
          this.currentTab.domain,
          totalTime,
          this.currentTab.currentDate
        );
        this.currentTab.accumulatedTime = 0;
        this.currentTab.startTime = Date.now();

        // Update badge after saving
        await this.badgeManager.updateBadge(
          this.currentTab.domain,
          () => this.getCurrentSessionTime(),
          () => this.getTotalDomainTime()
        );
      }
    }
  }

  // Initialize tracking
  async initialize() {
    this.currentTab.currentDate = this.storageManager.getLocalDateString();

    try {
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
        await this.trackTab(tabs[0]);
      }
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  }

  // Cleanup method (completely stops tracking and clears badge)
  cleanup() {
    if (this.currentTab.intervalId) {
      clearInterval(this.currentTab.intervalId);
      this.currentTab.intervalId = null;
    }
    this.badgeManager.clearBadge();
  }

  // Getters for accessing current tab state
  get currentDomain() {
    return this.currentTab.domain;
  }

  get currentTabId() {
    return this.currentTab.id;
  }
}

export default TabTracker;
