// scripts/background/modules/badgeManager.js

class BadgeManager {
  constructor() {
    this.updateInterval = null;
    this.isPaused = false;
  }

  // Format time for badge display
  formatTimeForBadge(totalSeconds) {
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    } else if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(totalSeconds / 3600);
      return `${hours}h`;
    }
  }

  // Update the badge with current domain time
  async updateBadge(domain, getCurrentSessionTime, getTotalDomainTime) {
    if (!domain) {
      chrome.action.setBadgeText({ text: "" });
      return;
    }

    const totalTime = await getTotalDomainTime();
    const badgeText = this.formatTimeForBadge(totalTime);

    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: "#4361ee" });
  }

  // Start badge update interval with dynamic frequency
  async startBadgeUpdates(domain, getCurrentSessionTime, getTotalDomainTime) {
    // Clear existing interval and reset pause state
    this.stopBadgeUpdates();
    this.isPaused = false;

    if (!domain) return;

    // Update badge immediately
    await this.updateBadge(domain, getCurrentSessionTime, getTotalDomainTime);

    // Set up update interval
    this.setBadgeUpdateInterval(
      domain,
      getCurrentSessionTime,
      getTotalDomainTime
    );
  }

  // Set badge update interval with stable frequency switching
  async setBadgeUpdateInterval(
    domain,
    getCurrentSessionTime,
    getTotalDomainTime
  ) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Determine initial frequency based on current total time
    const initialTotalTime = await getTotalDomainTime();
    let currentUpdateFrequency = initialTotalTime < 60 ? 1000 : 5000;

    console.log(
      `Setting badge update frequency to ${currentUpdateFrequency}ms (total time: ${initialTotalTime}s)`
    );

    this.updateInterval = setInterval(async () => {
      // Don't update if paused
      if (this.isPaused) return;

      await this.updateBadge(domain, getCurrentSessionTime, getTotalDomainTime);

      // Only check frequency change every 5 updates to reduce overhead
      if (Math.random() < 0.2) {
        // 20% chance to check frequency
        const newTotalTime = await getTotalDomainTime();
        const newUpdateFrequency = newTotalTime < 60 ? 1000 : 5000;

        // Only change frequency if there's a significant change and we're not paused
        if (newUpdateFrequency !== currentUpdateFrequency && !this.isPaused) {
          console.log(
            `Badge update frequency changed from ${currentUpdateFrequency}ms to ${newUpdateFrequency}ms (total time: ${newTotalTime}s)`
          );
          currentUpdateFrequency = newUpdateFrequency;
          this.setBadgeUpdateInterval(
            domain,
            getCurrentSessionTime,
            getTotalDomainTime
          );
          return;
        }
      }
    }, currentUpdateFrequency);
  }

  // Pause badge updates (stops interval but keeps badge visible)
  pauseBadgeUpdates() {
    this.isPaused = true;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log("Badge updates paused");
  }

  // Resume badge updates
  async resumeBadgeUpdates(domain, getCurrentSessionTime, getTotalDomainTime) {
    if (!this.isPaused || !domain) return;

    this.isPaused = false;
    await this.startBadgeUpdates(
      domain,
      getCurrentSessionTime,
      getTotalDomainTime
    );
    console.log("Badge updates resumed");
  }

  // Stop badge updates completely
  stopBadgeUpdates() {
    this.isPaused = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Clear badge completely (used when switching to non-trackable domains)
  clearBadge() {
    this.stopBadgeUpdates();
    chrome.action.setBadgeText({ text: "" });
  }

  // Check if update interval is active
  isUpdating() {
    return this.updateInterval !== null && !this.isPaused;
  }

  // Check if badge updates are paused
  get paused() {
    return this.isPaused;
  }
}

export default BadgeManager;
