document.addEventListener("DOMContentLoaded", function () {
  // header elements
  const settingsBtn = document.getElementById("settingsBtn");

  // category elements
  const todayBtn = document.getElementById("todayBtn");
  const totalBtn = document.getElementById("totalBtn");
  const allCategories = [todayBtn, totalBtn];

  // sort elements
  let filterBy = "time";
  let sortOrder = "descending";
  const sortBtn = document.getElementById("sortBtn");
  const filterBtn = document.getElementById("filterBtn");

  // pagination elements
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageNumberDisplay = document.getElementById("pageNumber");

  // pagination settings
  const itemsPerPage = 4;
  let currentPage = 1;
  let totalPages = 1;
  let allSites = [];

  const infoContainer = document.getElementById("infoContainer");

  function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function setCategoryActive(category) {
    allCategories.forEach((button) => {
      button.classList.remove("active");
    });
    category.classList.add("active");
    currentPage = 1;

    if (category === todayBtn) {
      displayTodayStats();
    } else if (category === totalBtn) {
      displayTotalStats();
    }
  }

  function setupImageErrorHandlers() {
    const images = document.querySelectorAll(".site-info img");
    images.forEach((img) => {
      img.addEventListener("error", function () {
        this.src = "../../assets/icons/default.png"; // Fallback image
      });
    });
  }

  function formatTimeDisplay(seconds) {
    const hours = Math.floor(seconds / 3600);
    const remainingSeconds = seconds % 3600;
    const minutes = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;

    let timeDisplay = "";
    if (hours > 0) {
      timeDisplay += `${hours} ${hours === 1 ? "hour" : "hours"} `;
    }
    if (minutes > 0 || hours > 0) {
      timeDisplay += `${minutes} ${minutes === 1 ? "minute" : "minutes"} `;
    }
    timeDisplay += `${secs} ${secs === 1 ? "second" : "seconds"}`;

    return timeDisplay;
  }

  function updatePagination() {
    // Update page number display
    pageNumberDisplay.textContent = `${currentPage} of ${totalPages}`;

    // Disable/enable pagination buttons
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;

    // Update visual state
    prevPageBtn.classList.toggle("disabled", currentPage <= 1);
    nextPageBtn.classList.toggle("disabled", currentPage >= totalPages);
  }

  function displayCurrentPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, allSites.length);
    const currentPageItems = allSites.slice(startIndex, endIndex);

    // Create HTML for each site on current page
    const infoHTML = currentPageItems
      .map(([domain, data]) => {
        const timeDisplay = formatTimeDisplay(data.time);
        const sessionCount = data.sessions;

        return `
        <div class="stats-item">
          <div class="site-info">
            <img src="https://${domain}/favicon.ico" alt="${domain}" class="site-favicon" data-domain="${domain}" />
            <span class="site-name">${domain}</span>
          </div>
          <div class="time-info">
            <div class="time-spent">${timeDisplay}</div>
            <div class="session-count">${sessionCount} ${
          sessionCount === 1 ? "session" : "sessions"
        }</div>
          </div>
        </div>
      `;
      })
      .join("");

    const sortStatusHTML = `<p class="sort-status">Sorting by ${filterBy}${
      sortOrder === "ascending" ? " (ascending)" : " (descending)"
    }</p>`;

    infoContainer.innerHTML =
      sortStatusHTML + infoHTML ||
      '<div class="no-data">No browsing data available yet.</div>';

    setupImageErrorHandlers();
    updatePagination();
  }

  function createPieChart(category) {
    const chartCanvas = document.getElementById("pieChart");
    let existingChart = Chart.getChart(chartCanvas);

    // Destroy existing chart if it exists
    if (existingChart) {
      existingChart.destroy();
    }

    chrome.storage.local.get(["siteInfo"], (result) => {
      let data = {};
      const siteInfo = result.siteInfo || {};

      if (category === "today") {
        const today = getLocalDateString();
        data =
          siteInfo[today] && siteInfo[today].time ? siteInfo[today].time : {};
      } else if (category === "total") {
        data = {};

        // Combine data from all days
        Object.values(siteInfo).forEach((dayData) => {
          if (dayData.time) {
            Object.entries(dayData.time).forEach(([domain, seconds]) => {
              data[domain] = (data[domain] || 0) + seconds;
            });
          }
        });
      }

      const sortedSites = Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // top 10 sites

      const labels = sortedSites.map(([domain]) => domain);
      const values = sortedSites.map(([, seconds]) => seconds);

      const backgroundColors = [
        "rgba(220, 20, 60, 0.8)", // Crimson Red
        "rgba(0, 128, 128, 0.8)", // Teal
        "rgba(255, 165, 0, 0.8)", // Orange
        "rgba(75, 0, 130, 0.8)", // Indigo
        "rgba(50, 205, 50, 0.8)", // Lime Green
        "rgba(255, 20, 147, 0.8)", // Deep Pink
        "rgba(0, 71, 171, 0.8)", // Royal Blue
        "rgba(128, 0, 128, 0.8)", // Purple
        "rgba(210, 180, 140, 0.8)", // Tan
        "rgba(0, 128, 0, 0.8)", // Green
      ];

      // Only create chart if we have data and canvas exists
      if (chartCanvas && sortedSites.length > 0) {
        const ctx = chartCanvas.getContext("2d");
        new Chart(ctx, {
          type: "pie",
          data: {
            labels: labels,
            datasets: [
              {
                data: values,
                backgroundColor: backgroundColors,
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: 0,
            },
            plugins: {
              legend: {
                position: "right",
                labels: {
                  boxWidth: 12,
                  font: {
                    size: 10,
                  },
                  padding: 8,
                  color: "#666",
                },
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const seconds = context.raw;
                    const hours = Math.floor(seconds / 3600);
                    const remainingSeconds = seconds % 3600;
                    const minutes = Math.floor(remainingSeconds / 60);
                    const secs = remainingSeconds % 60;

                    let timeDisplay = "";
                    if (hours > 0) {
                      timeDisplay += `${hours}h `;
                    }
                    if (minutes > 0 || hours > 0) {
                      timeDisplay += `${minutes}m `;
                    }
                    timeDisplay += `${secs}s`;

                    return `${context.label}: ${timeDisplay}`;
                  },
                },
              },
            },
          },
        });
      } else {
        const chartContainer = document.getElementById("chart-container");
        if (chartContainer) {
          chartContainer.innerHTML =
            '<div class="no-data">No data to display in chart.</div>';
        }
      }
    });
  }

  function displayTodayStats() {
    createPieChart("today");
    const today = getLocalDateString();

    // Get data from the new structure
    chrome.storage.local.get(["siteInfo"], (result) => {
      // Check if we have data for today
      let todayData =
        result.siteInfo && result.siteInfo[today]
          ? result.siteInfo[today]
          : { time: {}, sessions: {} };

      // Create combined data with both time and sessions
      let combinedData = {};

      // Add all domains from time data
      Object.entries(todayData.time || {}).forEach(([domain, seconds]) => {
        combinedData[domain] = {
          time: seconds,
          sessions: (todayData.sessions && todayData.sessions[domain]) || 0,
        };
      });

      // Add any domains that might only have session data
      Object.entries(todayData.sessions || {}).forEach(([domain, sessions]) => {
        if (!combinedData[domain]) {
          combinedData[domain] = {
            time: 0,
            sessions: sessions,
          };
        }
      });

      // Sort sites by time spent
      allSites = Object.entries(combinedData).sort((a, b) => {
        if (filterBy == "time") {
          return sortOrder === "descending"
            ? b[1].time - a[1].time
            : a[1].time - b[1].time;
        } else {
          return sortOrder === "descending"
            ? b[1].sessions - a[1].sessions
            : a[1].sessions - b[1].sessions;
        }
      });

      totalPages = Math.max(1, Math.ceil(allSites.length / itemsPerPage));
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }

      displayCurrentPage();
    });
  }

  function displayTotalStats() {
    createPieChart("total");
    chrome.storage.local.get(["siteInfo"], (result) => {
      let siteInfo = result.siteInfo || {};

      let totalTimeData = {};
      let totalSessionData = {};

      // Combine time and session data from all days
      Object.values(siteInfo).forEach((dayData) => {
        // Process time data
        if (dayData.time) {
          Object.entries(dayData.time).forEach(([domain, seconds]) => {
            totalTimeData[domain] = (totalTimeData[domain] || 0) + seconds;
          });
        }

        // Process session data
        if (dayData.sessions) {
          Object.entries(dayData.sessions).forEach(([domain, sessions]) => {
            totalSessionData[domain] =
              (totalSessionData[domain] || 0) + sessions;
          });
        }
      });

      // Create combined data
      let combinedData = {};

      // Add all domains from time data
      Object.entries(totalTimeData).forEach(([domain, seconds]) => {
        combinedData[domain] = {
          time: seconds,
          sessions: totalSessionData[domain] || 0,
        };
      });

      // Add any domains that might only have session data
      Object.entries(totalSessionData).forEach(([domain, sessions]) => {
        if (!combinedData[domain]) {
          combinedData[domain] = {
            time: 0,
            sessions: sessions,
          };
        }
      });

      // Sort sites by time spent
      allSites = Object.entries(combinedData).sort((a, b) => {
        if (filterBy === "time") {
          return sortOrder === "descending"
            ? b[1].time - a[1].time
            : a[1].time - b[1].time;
        } else {
          return sortOrder === "descending"
            ? b[1].sessions - a[1].sessions
            : a[1].sessions - b[1].sessions;
        }
      });

      // Calculate total pages
      totalPages = Math.max(1, Math.ceil(allSites.length / itemsPerPage));

      // Ensure current page is valid
      if (currentPage > totalPages) {
        currentPage = totalPages;
      }

      // Display current page items
      displayCurrentPage();
    });
  }

  // initial function runs
  setCategoryActive(todayBtn);

  allCategories.forEach((button) => {
    button.addEventListener("click", function () {
      setCategoryActive(this);
    });
  });

  settingsBtn.addEventListener("click", function () {
    window.location.href = "../settings/settings.html";
  });

  sortBtn.addEventListener("click", function () {
    sortOrder = sortOrder === "descending" ? "ascending" : "descending";
    const currentCategory = document.querySelector(".categories .active");
    if (currentCategory === todayBtn) {
      displayTodayStats();
    } else if (currentCategory === totalBtn) {
      displayTotalStats();
    }
  });

  filterBtn.addEventListener("click", function () {
    filterBy = filterBy === "time" ? "session" : "time";
    console.log(`the filter is: ${filterBy}`);
    const currentCategory = document.querySelector(".categories .active");
    if (currentCategory === todayBtn) {
      displayTodayStats();
    } else if (currentCategory === totalBtn) {
      displayTotalStats();
    }
  });

  prevPageBtn.addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      displayCurrentPage();
    }
  });

  nextPageBtn.addEventListener("click", function () {
    if (currentPage < totalPages) {
      currentPage++;
      displayCurrentPage();
    }
  });

  chrome.runtime.sendMessage({ action: "saveTime" }, function (response) {
    console.log("Background script saved current tab information");

    displayTodayStats();
  });
});
