class UIController {
  constructor() {
    this.infoContainer = document.getElementById("infoContainer");
  }

  renderSitesList(sites, filterBy, sortOrder) {
    if (!sites || sites.length === 0) {
      this.infoContainer.innerHTML =
        '<div class="no-data">No browsing data available yet.</div>';
      return;
    }

    const sortStatusHTML = `<p class="sort-status">Sorting by ${filterBy}${
      sortOrder === "ascending" ? " (ascending)" : " (descending)"
    }</p>`;

    const sitesHTML = sites
      .map(([domain, data]) => {
        const timeDisplay = TimeFormatter.formatTimeDisplay(data.time);
        const sessionCount = data.sessions;

        return `
        <div class="stats-item">
          <div class="site-info">
            <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" 
                alt="${domain}" 
                class="site-favicon" 
                data-domain="${domain}" />
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

    this.infoContainer.innerHTML = sortStatusHTML + sitesHTML;
    this.setupImageErrorHandlers();
  }

  setupImageErrorHandlers() {
    const images = document.querySelectorAll(".site-info img");
    images.forEach((img) => {
      img.addEventListener("error", function () {
        const domain = this.getAttribute("data-domain");

        // Try DuckDuckGo's favicon service as backup
        if (!this.src.includes("duckduckgo.com")) {
          this.src = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        }
        // If that also fails, use your default icon
        else if (!this.src.includes("default.png")) {
          this.src = "../../assets/icons/default.png";
        }
      });
    });
  }

  updateCategoryButtons(activeButton, allButtons) {
    allButtons.forEach((button) => {
      button.classList.remove("active");
    });
    activeButton.classList.add("active");
  }

  showLoading() {
    this.infoContainer.innerHTML = '<div class="loading">Loading...</div>';
  }

  showError(message = "An error occurred while loading data.") {
    this.infoContainer.innerHTML = `<div class="error">${message}</div>`;
  }
}
