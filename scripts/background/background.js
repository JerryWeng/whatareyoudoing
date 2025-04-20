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
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

// function to track time spent on the current tab (seconds)
function trackTab(tab) {
  if (currentTab.intervalId) {
    clearInterval(currentTab.intervalId);
  }

  currentTab.id = tab.id;
  currentTab.domain = getDomain(tab.url);
  currentTab.timeSpent = 0;

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
}

// function to update both time and session
function updateInfo(domain, seconds, date) {
  if (!domain || seconds <= 0) return;
  const today = date || getLocalDateString();

  chrome.storage.local.get(["siteInfo"], (result) => {
    let siteInfo = result.siteInfo || {};

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
      siteInfo[today].sessions[domain] += 1;
      console.log(
        `New session for ${domain}: ${siteInfo[today].sessions[domain]} sessions today`
      );
    }

    chrome.storage.local.set({ siteInfo: siteInfo });
    console.log("Updated site time and session:", siteInfo);
  });
}

// function to update specifically time
function updateTime(domain, seconds, date) {
  if (!domain || seconds <= 0) return;
  const today = date || getLocalDateString();

  chrome.storage.local.get(["siteInfo"], (result) => {
    let siteInfo = result.siteInfo || {};

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
      siteInfo[today].time[domain] += seconds;
      console.log(
        `New time for ${domain}: ${siteInfo[today].time[domain]} time today`
      );
    }

    chrome.storage.local.set({ siteInfo: siteInfo });
    console.log("Updated site time", siteInfo);
  });
}

// function to save the current tab information
function saveInfo() {
  if (currentTab.domain && currentTab.timeSpent > 0) {
    updateInfo(currentTab.domain, currentTab.timeSpent, currentTab.currentDate);
    console.log(
      `Saved ${currentTab.timeSpent} seconds and session to ${currentTab.domain}`
    );
    currentTab.timeSpent = 0;
  }
}

// function to save specfically time
function saveTime() {
  if (currentTab.domain && currentTab.timeSpent > 0) {
    updateTime(currentTab.domain, currentTab.timeSpent, currentTab.currentDate);
    console.log(
      `Saved ${currentTab.timeSpent} seconds to ${currentTab.domain}`
    );
    currentTab.timeSpent = 0;
  }
}

// user switches to another tab ("activates" another tab)
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("Tab activated:", activeInfo.tabId);

  saveInfo();
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    console.log("RUNNING");
    trackTab(tab);
  });
});

// user switches to another domain
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (currentTab.id === tabId && changeInfo.url) {
    console.log("Tab URL updated:", tabId, changeInfo.url);

    saveInfo();
    trackTab(tab);
  }
});

// user switches to another chrome window
chrome.windows.onFocusChanged.addListener((windowId) => {
  console.log("Window focus changed:", windowId);

  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    if (currentTab.intervalId) {
      clearInterval(currentTab.intervalId);
    }
    saveInfo();
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
    saveTime();
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async response
});

// saves data before the browser closes
chrome.runtime.onSuspend.addListener(() => {
  console.log("Browser is closing, saving data...");
  saveInfo();
});

// starts tracking tabs when chrome starts
chrome.runtime.onStartup.addListener(() => {
  console.log("Chrome started up - initializing extension");
  initialize();
});
