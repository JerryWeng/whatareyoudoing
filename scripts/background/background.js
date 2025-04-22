let currentTab = {
  id: null,
  intervalId: null,
  domain: null,
  currentDate: null,
  timeSpent: 0,
};

// function to get the local timezone
function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// function to start tracking tab
function initialize() {
  currentTab.currentDate = getLocalDateString();

  // Check for active tab and start tracking
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      trackTab(tabs[0]);
    }
  });
}

// function to get domain from url
function getDomain(url) {
  try {
    const urlObj = new URL(url);

    // Filter out chrome:// URLs
    if (urlObj.protocol === "chrome:") {
      return null;
    }

    // Filter out about: URLs
    if (urlObj.protocol === "about:") {
      return null;
    }

    // Filter out file:// URLs
    if (urlObj.protocol === "file:") {
      return null;
    }

    // Only return domains for http: and https: protocols
    if (urlObj.protocol === "http:" || urlObj.protocol === "https:") {
      return urlObj.hostname;
    }

    // Any other protocol we don't want to track
    return null;
  } catch (e) {
    return null;
  }
}

function getStorageData(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || null);
    });
  });
}

function setStorageData(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}

// function to track time spent on the current tab (seconds)
function trackTab(tab) {
  if (currentTab.intervalId) {
    clearInterval(currentTab.intervalId);
  }

  currentTab.id = tab.id;
  currentTab.domain = getDomain(tab.url);
  currentTab.timeSpent = 0;

  if (currentTab.domain) {
    currentTab.intervalId = setInterval(() => {
      // check if date has changed if yes, save the current tab time and reset the time
      const today = getLocalDateString();

      if (today !== currentTab.currentDate) {
        console.log(`Date changed from ${currentTab.currentDate} to ${today}`);
        updateInfo(
          currentTab.domain,
          currentTab.timeSpent,
          currentTab.currentDate
        );
        currentTab.timeSpent = 0;
        currentTab.currentDate = today;
      }

      currentTab.timeSpent += 1;
      console.log(`Timespent: ${currentTab.timeSpent}`);
    }, 1000);

    console.log(`Now tracking tab: ${tab.id} (${currentTab.domain})`);
  } else {
    console.log(`Not tracking tab: ${tab.id} (invalid domain)`);
  }
}

// function to update both time and session
async function updateInfo(domain, seconds, date) {
  if (!domain || seconds <= 0) return;
  const today = date || getLocalDateString();

  let siteInfo = (await getStorageData("siteInfo")) || {};

  if (!siteInfo[today]) {
    siteInfo[today] = {
      sessions: {},
      time: {},
    };
    console.log("Created new entry for today:", today);
  }

  if (!siteInfo[today].time) {
    siteInfo[today].time = {};
  }
  if (!siteInfo[today].time[domain]) {
    siteInfo[today].time[domain] = 1;
  } else {
    console.log(`Old time: ${siteInfo[today].time[domain]}`);
    siteInfo[today].time[domain] += seconds;
    console.log(
      `New time for ${domain}: ${siteInfo[today].time[domain]} time today`
    );
  }

  if (!siteInfo[today].sessions) {
    siteInfo[today].sessions = {};
  }
  if (!siteInfo[today].sessions[domain]) {
    siteInfo[today].sessions[domain] = 1;
  } else {
    console.log(`Old session: ${siteInfo[today].sessions[domain]}`);
    siteInfo[today].sessions[domain] += 1;
    console.log(
      `New session for ${domain}: ${siteInfo[today].sessions[domain]} sessions today`
    );
  }

  await setStorageData({ siteInfo: siteInfo });
  console.log("Updated site time and session:", siteInfo);
}

// function to update specifically time
async function updateTime(domain, seconds, date) {
  if (!domain || seconds <= 0) return;
  const today = date || getLocalDateString();

  let siteInfo = (await getStorageData("siteInfo")) || {};

  if (!siteInfo[today]) {
    siteInfo[today] = {
      sessions: {},
      time: {},
    };
    console.log("Created new entry for today:", today);
  }

  if (!siteInfo[today].time) {
    siteInfo[today].time = {};
  }
  if (!siteInfo[today].time[domain]) {
    siteInfo[today].time[domain] = 1;
  } else {
    console.log(
      `Old time: ${siteInfo[today].time[domain]} (modifying just time)`
    );
    siteInfo[today].time[domain] += seconds;
    console.log(
      `New time for ${domain}: ${siteInfo[today].time[domain]} time today`
    );
  }

  await setStorageData({ siteInfo: siteInfo });
  console.log("Updated site time", siteInfo);
}

// function to save the current tab information
async function saveInfo() {
  if (currentTab.domain && currentTab.timeSpent > 0) {
    await updateInfo(
      currentTab.domain,
      currentTab.timeSpent,
      currentTab.currentDate
    );
    console.log(
      `Saved ${currentTab.timeSpent} seconds and session to ${currentTab.domain}`
    );
    currentTab.timeSpent = 0;
  }
}

// function to save specfically time
async function saveTime() {
  if (currentTab.domain && currentTab.timeSpent > 0) {
    await updateTime(
      currentTab.domain,
      currentTab.timeSpent,
      currentTab.currentDate
    );
    console.log(
      `Saved ${currentTab.timeSpent} seconds to ${currentTab.domain}`
    );
    currentTab.timeSpent = 0;
  }
}

// user switches to another tab ("activates" another tab)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log("Tab activated:", activeInfo.tabId);

  await saveInfo();
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    trackTab(tab);
  });
});

// user switches to another domain
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (currentTab.id === tabId && changeInfo.url) {
    console.log("Tab URL updated:", tabId, changeInfo.url);

    saveInfo();
    trackTab(tab);
  }
});

// user switches to another chrome window
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  console.log("Window focus changed:", windowId);

  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    if (currentTab.intervalId) {
      clearInterval(currentTab.intervalId);
    }
    await saveInfo();
  } else {
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs.length > 0) {
        trackTab(tabs[0]);
      }
    });
  }
});

// saves data when the user opens the extension popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Opened Extension");
  if (message.action === "saveTime") {
    (async () => {
      try {
        // save just the time when user upens extension
        await saveTime();
        sendResponse({ success: true });
      } catch (error) {
        console.error("Error saving time:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
  return true; // Keep the message channel open for async response
});

// saves data before the browser closes
chrome.runtime.onSuspend.addListener(() => {
  console.log("Browser is closing, saving data...");
  saveInfo().catch((error) => {
    console.error("Error saving data on suspend:", error);
  });
});

// starts tracking tabs when chrome starts
chrome.runtime.onStartup.addListener(() => {
  console.log("Chrome started up - initializing extension");
  initialize();
});
