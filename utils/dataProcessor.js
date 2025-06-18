class DataProcessor {
  static processTodayData(siteInfo) {
    const today = TimeFormatter.getLocalDateString();
    const todayData = siteInfo[today] || { time: {}, sessions: {} };

    let combinedData = {};

    Object.entries(todayData.time || {}).forEach(([domain, seconds]) => {
      combinedData[domain] = {
        time: seconds,
        sessions: (todayData.sessions && todayData.sessions[domain]) || 0,
      };
    });

    Object.entries(todayData.sessions || {}).forEach(([domain, sessions]) => {
      if (!combinedData[domain]) {
        combinedData[domain] = {
          time: 0,
          sessions: sessions,
        };
      }
    });

    return combinedData;
  }

  static processTotalData(siteInfo) {
    let totalTimeData = {};
    let totalSessionData = {};

    Object.values(siteInfo).forEach((dayData) => {
      if (dayData.time) {
        Object.entries(dayData.time).forEach(([domain, seconds]) => {
          totalTimeData[domain] = (totalTimeData[domain] || 0) + seconds;
        });
      }

      if (dayData.sessions) {
        Object.entries(dayData.sessions).forEach(([domain, sessions]) => {
          totalSessionData[domain] = (totalSessionData[domain] || 0) + sessions;
        });
      }
    });

    let combinedData = {};

    Object.entries(totalTimeData).forEach(([domain, seconds]) => {
      combinedData[domain] = {
        time: seconds,
        sessions: totalSessionData[domain] || 0,
      };
    });

    Object.entries(totalSessionData).forEach(([domain, sessions]) => {
      if (!combinedData[domain]) {
        combinedData[domain] = {
          time: 0,
          sessions: sessions,
        };
      }
    });

    return combinedData;
  }

  static sortData(combinedData, filterBy, sortOrder) {
    return Object.entries(combinedData).sort((a, b) => {
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
  }

  static processDataForChart(siteInfo, category) {
    let data = {};

    if (category === "today") {
      const today = TimeFormatter.getLocalDateString();
      data =
        siteInfo[today] && siteInfo[today].time ? siteInfo[today].time : {};
    } else if (category === "total") {
      Object.values(siteInfo).forEach((dayData) => {
        if (dayData.time) {
          Object.entries(dayData.time).forEach(([domain, seconds]) => {
            data[domain] = (data[domain] || 0) + seconds;
          });
        }
      });
    }

    const processedData = {};
    Object.entries(data).forEach(([domain, time]) => {
      processedData[domain] = { time };
    });

    return processedData;
  }
}
