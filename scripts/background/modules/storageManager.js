// scripts/background/modules/storageManager.js

class StorageManager {
  // Get data from chrome storage
  async getStorageData(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  }

  // Set data to chrome storage
  async setStorageData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        resolve();
      });
    });
  }

  // Update both time and increment session count
  async updateInfo(domain, seconds, date) {
    if (!domain || seconds <= 0) return;

    const today = date || this.getLocalDateString();
    let siteInfo = (await this.getStorageData("siteInfo")) || {};

    if (!siteInfo[today]) {
      siteInfo[today] = { sessions: {}, time: {} };
    }

    // Update time
    if (!siteInfo[today].time[domain]) {
      siteInfo[today].time[domain] = 0;
    }
    siteInfo[today].time[domain] += seconds;

    // Increment session count
    if (!siteInfo[today].sessions[domain]) {
      siteInfo[today].sessions[domain] = 0;
    }
    siteInfo[today].sessions[domain] += 1;

    await this.setStorageData({ siteInfo: siteInfo });
    console.log(
      `Updated ${domain}: +${seconds}s, sessions: ${siteInfo[today].sessions[domain]}`
    );

    return siteInfo[today];
  }

  // Update only time (no session increment)
  async updateTimeOnly(domain, seconds, date) {
    if (!domain || seconds <= 0) return;

    const today = date || this.getLocalDateString();
    let siteInfo = (await this.getStorageData("siteInfo")) || {};

    if (!siteInfo[today]) {
      siteInfo[today] = { sessions: {}, time: {} };
    }

    if (!siteInfo[today].time[domain]) {
      siteInfo[today].time[domain] = 0;
    }
    siteInfo[today].time[domain] += seconds;

    await this.setStorageData({ siteInfo: siteInfo });
    console.log(
      `Updated time for ${domain}: +${seconds}s (total: ${siteInfo[today].time[domain]}s)`
    );

    return siteInfo[today];
  }

  // Get total time spent on domain today
  async getTotalDomainTime(domain, date) {
    if (!domain) return 0;

    const today = date || this.getLocalDateString();
    const siteInfo = (await this.getStorageData("siteInfo")) || {};

    if (
      siteInfo[today] &&
      siteInfo[today].time &&
      siteInfo[today].time[domain]
    ) {
      return siteInfo[today].time[domain];
    }

    return 0;
  }

  // Utility method for date string
  getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

export default StorageManager;
