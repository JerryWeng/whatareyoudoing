class StorageManager {
  async getStorageData(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  }

  async setStorageData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        resolve();
      });
    });
  }

  async updateInfo(domain, seconds, date) {
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

  getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

export default StorageManager;
