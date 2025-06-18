class BadgeManager {
  constructor() {
    this.updateInterval = null;
    this.isPaused = false;
  }

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

  async startBadgeUpdates(domain, getCurrentSessionTime, getTotalDomainTime) {
    this.stopBadgeUpdates();
    this.isPaused = false;

    if (!domain) return;

    await this.updateBadge(domain, getCurrentSessionTime, getTotalDomainTime);

    this.setBadgeUpdateInterval(
      domain,
      getCurrentSessionTime,
      getTotalDomainTime
    );
  }

  async setBadgeUpdateInterval(
    domain,
    getCurrentSessionTime,
    getTotalDomainTime
  ) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    const initialTotalTime = await getTotalDomainTime();
    let currentUpdateFrequency = initialTotalTime < 60 ? 1000 : 5000;

    console.log(
      `Setting badge update frequency to ${currentUpdateFrequency}ms (total time: ${initialTotalTime}s)`
    );

    this.updateInterval = setInterval(async () => {
      if (this.isPaused) return;

      await this.updateBadge(domain, getCurrentSessionTime, getTotalDomainTime);

      if (Math.random() < 0.2) {
        const newTotalTime = await getTotalDomainTime();
        const newUpdateFrequency = newTotalTime < 60 ? 1000 : 5000;

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

  pauseBadgeUpdates() {
    this.isPaused = true;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log("Badge updates paused");
  }

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

  stopBadgeUpdates() {
    this.isPaused = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  clearBadge() {
    this.stopBadgeUpdates();
    chrome.action.setBadgeText({ text: "" });
  }

  isUpdating() {
    return this.updateInterval !== null && !this.isPaused;
  }

  get paused() {
    return this.isPaused;
  }
}

export default BadgeManager;
