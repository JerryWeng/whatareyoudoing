class ChartManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.chart = null;
    this.backgroundColors = [
      "rgba(220, 20, 60, 0.8)",
      "rgba(0, 128, 128, 0.8)",
      "rgba(255, 165, 0, 0.8)",
      "rgba(75, 0, 130, 0.8)",
      "rgba(50, 205, 50, 0.8)",
      "rgba(255, 20, 147, 0.8)",
      "rgba(0, 71, 171, 0.8)",
      "rgba(128, 0, 128, 0.8)",
      "rgba(210, 180, 140, 0.8)",
      "rgba(0, 128, 0, 0.8)",
    ];
  }

  createChart(data) {
    this.destroyExistingChart();

    if (!this.canvas || !data || data.labels.length === 0) {
      this.showNoDataMessage();
      return;
    }

    const ctx = this.canvas.getContext("2d");
    this.chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: this.backgroundColors,
            borderWidth: 1,
          },
        ],
      },
      options: this.getChartOptions(),
    });
  }

  destroyExistingChart() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  getChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 0 },
      plugins: {
        legend: {
          position: "right",
          labels: {
            boxWidth: 12,
            font: { size: 10 },
            padding: 8,
            color: "#666",
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const seconds = context.raw;
              return `${context.label}: ${TimeFormatter.formatTimeDisplay(
                seconds
              )}`;
            },
          },
        },
      },
    };
  }

  showNoDataMessage() {
    const chartContainer = document.getElementById("chart-container");
    if (chartContainer) {
      chartContainer.innerHTML =
        '<div class="no-data">No data to display in chart.</div>';
    }
  }

  static prepareChartData(processedSiteData) {
    const sortedSites = Object.entries(processedSiteData)
      .sort((a, b) => b[1].time - a[1].time)
      .slice(0, 10);

    return {
      labels: sortedSites.map(([domain]) => domain),
      values: sortedSites.map(([, data]) => data.time),
    };
  }
}
