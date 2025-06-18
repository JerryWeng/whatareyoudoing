import StorageManager from "./modules/storageManager.js";
import BadgeManager from "./modules/badgeManager.js";
import TabTracker from "./modules/tabTracker.js";
import EventHandler from "./modules/eventHandler.js";

class BackgroundScript {
  constructor() {
    this.storageManager = new StorageManager();
    this.badgeManager = new BadgeManager();
    this.tabTracker = new TabTracker(this.storageManager, this.badgeManager);
    this.eventHandler = new EventHandler(this.tabTracker);

    this.initialize();
  }

  async initialize() {
    console.log("Background script initialized");
    await this.tabTracker.initialize();
  }
}

// Initialize the background script
new BackgroundScript();
