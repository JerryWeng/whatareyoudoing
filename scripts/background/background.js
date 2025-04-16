// Object to store the current active tab information
let currentTab = {
  id: null,
  url: null,
  domain: null,
  startTime: null,
};

// Track when the user changes tabs or windows
chrome.tabs.onActivated.addListener((activeInfo) => {
  // When a tab becomes active, get its details
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    // Process tab change
    handleTabChange(tab);
  });
});

// Track when a tab's URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only process if this is the active tab and the URL has changed
  if (changeInfo.status === "complete" && tab.active) {
    handleTabChange(tab);
  }
});

// Handle when a tab becomes active or changes URL
function handleTabChange(tab) {
  // First, record time for the previous tab if there was one
  if (currentTab.id !== null) {
    const timeSpent = Math.round((Date.now() - currentTab.startTime) / 1000); // in seconds

    // Only record if more than 1 second was spent
    if (timeSpent > 1 && currentTab.domain) {
      updateTimeForDomain(currentTab.domain, timeSpent);
    }
  }

  // Now set current tab info
  if (tab.url && tab.url.startsWith("http")) {
    const domain = extractDomain(tab.url);

    // If the domain has changed, count this as a new session
    if (domain !== currentTab.domain) {
      incrementSessionForDomain(domain);
    }

    currentTab = {
      id: tab.id,
      url: tab.url,
      domain: domain,
      startTime: Date.now(),
    };
  } else {
    // Not a website (e.g., new tab, settings page)
    currentTab = {
      id: null,
      url: null,
      domain: null,
      startTime: null,
    };
  }
}

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

// Increment the session count for a domain
function incrementSessionForDomain(domain) {
  if (!domain) return;

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  // Get existing data
  chrome.storage.local.get(["siteSessions"], (result) => {
    let siteSessions = result.siteSessions || {};

    // Initialize if needed
    if (!siteSessions[today]) {
      siteSessions[today] = {};
    }

    // Increment session count
    if (!siteSessions[today][domain]) {
      siteSessions[today][domain] = 1;
    } else {
      siteSessions[today][domain] += 1;
      console.log(
        `New session for ${domain}: ${siteSessions[today][domain]} sessions today`
      );
    }

    // Store updated data
    chrome.storage.local.set({ siteSessions: siteSessions });
  });
}

// Update time spent for a domain
function updateTimeForDomain(domain, seconds) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  // Get existing data with consistent handling
  chrome.storage.local.get(["siteTime"], (result) => {
    // Always initialize as an empty object if undefined
    let siteTime = result.siteTime || {};

    // Debug: Log existing dates
    console.log("Available dates in storage:", Object.keys(siteTime));

    // Initialize today if needed
    if (!siteTime[today]) {
      siteTime[today] = {};
      console.log("Created new entry for today:", today);
    }

    // Add time to domain
    if (!siteTime[today][domain]) {
      siteTime[today][domain] = seconds;
    } else {
      siteTime[today][domain] += seconds;
    }

    // Store updated data
    chrome.storage.local.set({ siteTime: siteTime }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error storing data:", chrome.runtime.lastError);
      } else {
        console.log(
          `Updated time for ${domain} on ${today}: ${siteTime[today][domain]} seconds`
        );
      }
    });
  });
}

// Also track when browser window loses focus
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus, record time for current tab
    if (currentTab.id !== null) {
      const timeSpent = Math.round((Date.now() - currentTab.startTime) / 1000);
      if (timeSpent > 1 && currentTab.domain) {
        updateTimeForDomain(currentTab.domain, timeSpent);
      }

      // Reset current tab since browser is not in focus
      currentTab = {
        id: null,
        url: null,
        domain: null,
        startTime: null,
      };
    }
  } else {
    // Browser gained focus, get the active tab
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs.length > 0) {
        handleTabChange(tabs[0]);
      }
    });
  }
});

// Add a periodic timer to update time every second for the active tab
// This ensures continuous tracking even without tab switches
let periodicUpdateInterval = null;

function startPeriodicUpdates() {
  // Clear any existing interval first
  stopPeriodicUpdates();

  // Set a new interval that runs every minute instead of every second
  periodicUpdateInterval = setInterval(() => {
    // Only process if we have an active tab being tracked
    if (currentTab.id !== null && currentTab.domain) {
      // Calculate time using the EXACT difference from the original startTime
      const exactTimeSpent = Math.round(
        (Date.now() - currentTab.startTime) / 1000
      );

      // Update storage with just this increment (1 second) rather than the full calculated time
      updateTimeForDomain(currentTab.domain, 1);
    }
  }, 1000); // Still run every 1 second
}

function stopPeriodicUpdates() {
  if (periodicUpdateInterval !== null) {
    clearInterval(periodicUpdateInterval);
    periodicUpdateInterval = null;
  }
}

// Start the periodic updates when the extension initializes
startPeriodicUpdates();

// Listen for when browser goes to sleep or suspends
chrome.runtime.onSuspend.addListener(() => {
  // Make sure we record any final time before the extension is suspended
  if (currentTab.id !== null && currentTab.domain) {
    const timeSpent = Math.round((Date.now() - currentTab.startTime) / 1000);
    if (timeSpent > 0) {
      updateTimeForDomain(currentTab.domain, timeSpent);
    }
  }

  // Stop the interval
  stopPeriodicUpdates();
});
