class StorageService {
  static async getSiteInfo() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["siteInfo"], (result) => {
        resolve(result.siteInfo || {});
      });
    });
  }

  static async sendMessageToBackground(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  }

  static async saveCurrentTime() {
    try {
      const response = await this.sendMessageToBackground({
        action: "saveTime",
      });
      console.log("Background script saved current tab information");
      return response;
    } catch (error) {
      console.error("Error saving time:", error);
      throw error;
    }
  }

  static async getDayData(dateString) {
    const siteInfo = await this.getSiteInfo();
    return siteInfo[dateString] || { time: {}, sessions: {} };
  }

  static async getAvailableDates() {
    const siteInfo = await this.getSiteInfo();
    return Object.keys(siteInfo).sort();
  }
}
