# Utils Folder Documentation

This document provides comprehensive documentation for all utility files in the `utils/` folder of the WhatAreYouDoing Chrome extension. These utilities follow the **Single Responsibility Principle** - each file has one clear purpose and can be reused across different parts of the extension.

## Table of Contents

1. [timeFormatter.js](#timeformatterjs)
2. [storageService.js](#storageservicejs)
3. [chartManager.js](#chartmanagerjs)
4. [paginationManager.js](#paginationmanagerjs)
5. [uiController.js](#uicontrollerjs)
6. [dataProcessor.js](#dataprocessorjs)
7. [popupController.js](#popupcontrollerjs)

---

## timeFormatter.js

**Purpose**: Handles all time-related formatting and date operations. This utility ensures consistent time display across the entire extension.

### Class: `TimeFormatter`

A static utility class that provides time formatting methods without requiring instantiation.

#### Methods

##### `static formatTimeDisplay(seconds)`

Converts seconds into a human-readable time format.

**Parameters:**

- `seconds` (number): Time in seconds to format

**Returns:**

- `string`: Formatted time string (e.g., "2 hours 30 minutes 45 seconds")

**Example:**

```javascript
TimeFormatter.formatTimeDisplay(3661); // "1 hour 1 minute 1 second"
TimeFormatter.formatTimeDisplay(90); // "1 minute 30 seconds"
TimeFormatter.formatTimeDisplay(45); // "45 seconds"
```

**Why Necessary:**

- Provides consistent time formatting across popup, settings, and any future pages
- Handles pluralization automatically (1 hour vs 2 hours)
- Eliminates code duplication for time display logic

##### `static getLocalDateString()`

Gets the current date in YYYY-MM-DD format for consistent date keys.

**Parameters:** None

**Returns:**

- `string`: Current date in "YYYY-MM-DD" format

**Example:**

```javascript
TimeFormatter.getLocalDateString(); // "2024-01-15"
```

**Why Necessary:**

- Ensures consistent date format across all storage operations
- Handles timezone considerations properly
- Provides a single source of truth for date formatting

---

## storageService.js

**Purpose**: Abstracts all Chrome storage API interactions and background script communication. Provides async/await interface instead of callbacks.

### Class: `StorageService`

A static service class that handles all data persistence and communication with the background script.

#### Methods

##### `static async getSiteInfo()`

Retrieves all site tracking information from Chrome storage.

**Parameters:** None

**Returns:**

- `Promise<Object>`: Site information object with structure:
  ```javascript
  {
    "2024-01-15": {
      time: { "example.com": 1800, "google.com": 900 },
      sessions: { "example.com": 5, "google.com": 3 }
    }
  }
  ```

**Example:**

```javascript
const siteInfo = await StorageService.getSiteInfo();
console.log(siteInfo["2024-01-15"].time["example.com"]); // 1800 seconds
```

**Why Necessary:**

- Converts callback-based Chrome API to modern async/await
- Provides consistent error handling
- Centralizes storage access logic

##### `static async sendMessageToBackground(message)`

Sends messages to the background script and handles responses.

**Parameters:**

- `message` (Object): Message object to send to background script

**Returns:**

- `Promise<any>`: Response from background script

**Example:**

```javascript
const response = await StorageService.sendMessageToBackground({
  action: "saveTime",
});
```

**Why Necessary:**

- Abstracts Chrome messaging API complexity
- Provides consistent error handling for background communication
- Enables async/await usage for better code readability

##### `static async saveCurrentTime()`

Convenience method to save current tab time when popup opens.

**Parameters:** None

**Returns:**

- `Promise<any>`: Response from background script

**Example:**

```javascript
try {
  await StorageService.saveCurrentTime();
  console.log("Time saved successfully");
} catch (error) {
  console.error("Failed to save time:", error);
}
```

**Why Necessary:**

- Provides semantic method name for common operation
- Includes error handling and logging
- Simplifies popup initialization code

##### `static async getDayData(dateString)`

Retrieves data for a specific date.

**Parameters:**

- `dateString` (string): Date in "YYYY-MM-DD" format

**Returns:**

- `Promise<Object>`: Day data object with time and sessions

**Example:**

```javascript
const todayData = await StorageService.getDayData("2024-01-15");
console.log(todayData.time["example.com"]); // Time spent on example.com today
```

**Why Necessary:**

- Provides convenient access to single-day data
- Handles missing date gracefully by returning default structure
- Useful for future features like date-specific analysis

##### `static async getAvailableDates()`

Gets all dates that have tracking data.

**Parameters:** None

**Returns:**

- `Promise<string[]>`: Array of date strings in chronological order

**Example:**

```javascript
const dates = await StorageService.getAvailableDates();
console.log(dates); // ["2024-01-10", "2024-01-11", "2024-01-15"]
```

**Why Necessary:**

- Enables date range selection features
- Useful for analytics and reporting
- Provides foundation for future date navigation features

---

## chartManager.js

**Purpose**: Manages all Chart.js operations, including chart creation, destruction, and configuration. Encapsulates chart complexity and provides reusable chart functionality.

### Class: `ChartManager`

Handles pie chart creation and management using Chart.js library.

#### Constructor

##### `constructor(canvasId)`

Creates a new chart manager instance.

**Parameters:**

- `canvasId` (string): ID of the HTML canvas element

**Example:**

```javascript
const chartManager = new ChartManager("pieChart");
```

#### Properties

- `canvas`: Reference to the canvas DOM element
- `chart`: Current Chart.js instance (null when no chart exists)
- `backgroundColors`: Array of colors for chart segments

#### Methods

##### `createChart(data)`

Creates or updates a pie chart with the provided data.

**Parameters:**

- `data` (Object): Chart data object with structure:
  ```javascript
  {
    labels: ["example.com", "google.com"],
    values: [1800, 900]
  }
  ```

**Returns:** None

**Example:**

```javascript
const chartData = {
  labels: ["example.com", "google.com", "github.com"],
  values: [3600, 1800, 900],
};
chartManager.createChart(chartData);
```

**Why Necessary:**

- Handles chart lifecycle (destroy existing, create new)
- Provides consistent chart appearance across the extension
- Manages Chart.js complexity and configuration

##### `destroyExistingChart()`

Safely destroys the current chart instance.

**Parameters:** None

**Returns:** None

**Why Necessary:**

- Prevents memory leaks when updating charts
- Ensures clean state before creating new charts
- Handles Chart.js cleanup properly

##### `getChartOptions()`

Returns Chart.js configuration options.

**Parameters:** None

**Returns:**

- `Object`: Chart.js options object

**Why Necessary:**

- Centralizes chart styling and behavior
- Ensures consistent appearance
- Makes chart customization easier

##### `showNoDataMessage()`

Displays a message when no data is available for charting.

**Parameters:** None

**Returns:** None

**Why Necessary:**

- Provides user feedback when no data exists
- Maintains consistent UI experience
- Prevents empty chart containers

##### `static prepareChartData(processedSiteData)`

Converts processed site data into chart-ready format.

**Parameters:**

- `processedSiteData` (Object): Site data with time information

**Returns:**

- `Object`: Chart data object with labels and values

**Example:**

```javascript
const processedData = {
  "example.com": { time: 3600 },
  "google.com": { time: 1800 },
};
const chartData = ChartManager.prepareChartData(processedData);
// Returns: { labels: ["example.com", "google.com"], values: [3600, 1800] }
```

**Why Necessary:**

- Transforms data processor output to chart input format
- Handles sorting (shows top 10 sites by time)
- Abstracts data transformation logic

---

## paginationManager.js

**Purpose**: Manages pagination functionality including page navigation, item display, and UI state updates. Provides reusable pagination for any list of items.

### Class: `PaginationManager`

Handles pagination logic and UI updates for large lists of items.

#### Constructor

##### `constructor(itemsPerPage = 4)`

Creates a new pagination manager instance.

**Parameters:**

- `itemsPerPage` (number, optional): Number of items to display per page (default: 4)

**Example:**

```javascript
const paginationManager = new PaginationManager(5); // 5 items per page
```

#### Properties

- `itemsPerPage`: Number of items displayed per page
- `currentPage`: Current page number (1-based)
- `totalPages`: Total number of pages
- `allItems`: Array of all items being paginated
- `prevPageBtn`, `nextPageBtn`, `pageNumberDisplay`: DOM element references

#### Methods

##### `setupEventListeners()`

Sets up click handlers for pagination buttons.

**Parameters:** None

**Returns:** None

**Why Necessary:**

- Encapsulates event handling within the manager
- Provides automatic UI response to user interactions
- Simplifies integration with other components

##### `setItems(items)`

Sets the items to be paginated and updates pagination state.

**Parameters:**

- `items` (Array): Array of items to paginate

**Returns:** None

**Example:**

```javascript
const siteData = [
  ["example.com", { time: 3600, sessions: 5 }],
  ["google.com", { time: 1800, sessions: 3 }],
];
paginationManager.setItems(siteData);
```

**Why Necessary:**

- Calculates pagination parameters automatically
- Validates current page against new data
- Updates UI to reflect new pagination state

##### `getCurrentPageItems()`

Returns items for the current page.

**Parameters:** None

**Returns:**

- `Array`: Items to display on current page

**Example:**

```javascript
const currentItems = paginationManager.getCurrentPageItems();
// Returns subset of items for current page
```

**Why Necessary:**

- Provides easy access to page-specific data
- Handles array slicing logic
- Abstracts pagination calculations

##### `goToPreviousPage()`

Navigates to the previous page if possible.

**Parameters:** None

**Returns:**

- `boolean`: True if navigation occurred, false if already on first page

**Why Necessary:**

- Validates page boundaries
- Updates UI state automatically
- Provides feedback about navigation success

##### `goToNextPage()`

Navigates to the next page if possible.

**Parameters:** None

**Returns:**

- `boolean`: True if navigation occurred, false if already on last page

**Why Necessary:**

- Validates page boundaries
- Updates UI state automatically
- Provides feedback about navigation success

##### `reset()`

Resets pagination to the first page.

**Parameters:** None

**Returns:** None

**Example:**

```javascript
paginationManager.reset(); // Goes back to page 1
```

**Why Necessary:**

- Useful when changing categories or filters
- Provides consistent starting point
- Prevents being stranded on non-existent pages

##### `updateUI()`

Updates pagination UI elements to reflect current state.

**Parameters:** None

**Returns:** None

**Why Necessary:**

- Keeps UI synchronized with internal state
- Handles button enable/disable logic
- Updates page counter display

##### `onPageChange()`

Callback method that can be overridden to handle page changes.

**Parameters:** None

**Returns:** None

**Example:**

```javascript
paginationManager.onPageChange = function () {
  displayCurrentPage(); // Custom handler
};
```

**Why Necessary:**

- Provides extensibility without tight coupling
- Allows custom logic when pages change
- Maintains separation of concerns

---

## uiController.js

**Purpose**: Handles all DOM manipulation and UI rendering. Centralizes user interface logic and provides consistent UI patterns across the extension.

### Class: `UIController`

Manages user interface rendering and DOM interactions.

#### Constructor

##### `constructor()`

Creates a new UI controller instance and initializes DOM references.

**Example:**

```javascript
const uiController = new UIController();
```

#### Properties

- `infoContainer`: Reference to the main content container DOM element

#### Methods

##### `renderSitesList(sites, filterBy, sortOrder)`

Renders the list of websites with their statistics.

**Parameters:**

- `sites` (Array): Array of [domain, data] pairs to display
- `filterBy` (string): Current filter type ("time" or "session")
- `sortOrder` (string): Current sort order ("ascending" or "descending")

**Returns:** None

**Example:**

```javascript
const sites = [
  ["example.com", { time: 3600, sessions: 5 }],
  ["google.com", { time: 1800, sessions: 3 }],
];
uiController.renderSitesList(sites, "time", "descending");
```

**Why Necessary:**

- Centralizes HTML generation logic
- Ensures consistent site display formatting
- Handles empty state gracefully

##### `setupImageErrorHandlers()`

Sets up error handling for favicon images with multiple fallback options.

**Parameters:** None

**Returns:** None

**Why Necessary:**

- Provides graceful degradation when favicons fail to load
- Implements multiple fallback strategies
- Enhances user experience with proper error handling

##### `updateCategoryButtons(activeButton, allButtons)`

Updates the visual state of category buttons.

**Parameters:**

- `activeButton` (HTMLElement): Button that should be marked as active
- `allButtons` (Array): Array of all category button elements

**Returns:** None

**Example:**

```javascript
const todayBtn = document.getElementById("todayBtn");
const allBtns = [todayBtn, document.getElementById("totalBtn")];
uiController.updateCategoryButtons(todayBtn, allBtns);
```

**Why Necessary:**

- Maintains visual consistency for active states
- Handles CSS class management
- Provides reusable button state logic

##### `showLoading()`

Displays a loading message in the main content area.

**Parameters:** None

**Returns:** None

**Example:**

```javascript
uiController.showLoading();
// Shows "Loading..." message to user
```

**Why Necessary:**

- Provides user feedback during data loading
- Improves perceived performance
- Maintains consistent loading experience

##### `showError(message)`

Displays an error message to the user.

**Parameters:**

- `message` (string, optional): Error message to display (default: generic error message)

**Returns:** None

**Example:**

```javascript
uiController.showError("Failed to load website data.");
```

**Why Necessary:**

- Provides consistent error display
- Improves user experience during failures
- Centralizes error message formatting

---

## dataProcessor.js

**Purpose**: Handles all data transformation and processing logic. Converts raw storage data into formats suitable for display and analysis.

### Class: `DataProcessor`

Static utility class that processes website tracking data for various display purposes.

#### Methods

##### `static processTodayData(siteInfo)`

Processes site information to extract today's data with time and session counts.

**Parameters:**

- `siteInfo` (Object): Complete site information from storage

**Returns:**

- `Object`: Today's data with structure:
  ```javascript
  {
    "example.com": { time: 1800, sessions: 5 },
    "google.com": { time: 900, sessions: 3 }
  }
  ```

**Example:**

```javascript
const siteInfo = await StorageService.getSiteInfo();
const todayData = DataProcessor.processTodayData(siteInfo);
console.log(todayData["example.com"].time); // Time spent today
```

**Why Necessary:**

- Extracts current day data from multi-day storage
- Combines time and session data consistently
- Handles missing data gracefully

##### `static processTotalData(siteInfo)`

Processes site information to calculate total accumulated data across all days.

**Parameters:**

- `siteInfo` (Object): Complete site information from storage

**Returns:**

- `Object`: Aggregated data across all days

**Example:**

```javascript
const siteInfo = await StorageService.getSiteInfo();
const totalData = DataProcessor.processTotalData(siteInfo);
console.log(totalData["example.com"].time); // Total time across all days
```

**Why Necessary:**

- Aggregates data across multiple days
- Provides historical view of usage patterns
- Handles data accumulation logic consistently

##### `static sortData(combinedData, filterBy, sortOrder)`

Sorts processed data based on specified criteria.

**Parameters:**

- `combinedData` (Object): Processed site data
- `filterBy` (string): Sort criterion ("time" or "sessions")
- `sortOrder` (string): Sort direction ("ascending" or "descending")

**Returns:**

- `Array`: Array of [domain, data] pairs in sorted order

**Example:**

```javascript
const sortedSites = DataProcessor.sortData(processedData, "time", "descending");
// Returns sites sorted by time spent (highest first)
```

**Why Necessary:**

- Centralizes sorting logic for consistency
- Supports multiple sort criteria
- Provides reusable sorting functionality

##### `static processDataForChart(siteInfo, category)`

Processes data specifically for chart display purposes.

**Parameters:**

- `siteInfo` (Object): Complete site information from storage
- `category` (string): Data category ("today" or "total")

**Returns:**

- `Object`: Chart-ready data with time information only

**Example:**

```javascript
const chartData = DataProcessor.processDataForChart(siteInfo, "today");
// Returns: { "example.com": { time: 1800 }, "google.com": { time: 900 } }
```

**Why Necessary:**

- Formats data specifically for chart requirements
- Filters out session data (charts only show time)
- Provides consistent data structure for chart manager

---

## popupController.js

**Purpose**: Main orchestration controller that coordinates all other components. Manages application state, handles user interactions, and controls the overall popup flow.

### Class: `PopupController`

The main controller class that orchestrates the entire popup functionality.

#### Constructor

##### `constructor()`

Initializes the popup controller and all its dependencies.

**Example:**

```javascript
const controller = new PopupController();
// Automatically initializes all managers and sets up the popup
```

#### Properties

- `chartManager`: Instance of ChartManager for chart operations
- `paginationManager`: Instance of PaginationManager for pagination
- `uiController`: Instance of UIController for UI operations
- `currentCategory`: Current data category ("today" or "total")
- `filterBy`: Current filter type ("time" or "session")
- `sortOrder`: Current sort order ("ascending" or "descending")
- DOM element references for buttons and UI components

#### Methods

##### `setupEventListeners()`

Configures all event listeners for user interactions.

**Parameters:** None

**Returns:** None

**Why Necessary:**

- Centralizes event handling configuration
- Maintains separation between setup and logic
- Provides single initialization point

##### `async initialize()`

Initializes the popup with background script connection and initial data load.

**Parameters:** None

**Returns:** Promise

**Example:**

```javascript
await controller.initialize();
// Popup is ready for user interaction
```

**Why Necessary:**

- Handles asynchronous initialization sequence
- Connects with background script for time tracking
- Provides error handling for initialization failures

##### `async switchCategory(category)`

Changes the active data category and refreshes the display.

**Parameters:**

- `category` (string): Target category ("today" or "total")

**Returns:** Promise

**Example:**

```javascript
await controller.switchCategory("total");
// Switches to total time view
```

**Why Necessary:**

- Coordinates UI updates across all components
- Manages state transitions consistently
- Handles data loading for new category

##### `async loadAndDisplayData()`

Loads data from storage and updates all UI components.

**Parameters:** None

**Returns:** Promise

**Why Necessary:**

- Orchestrates complex data loading sequence
- Coordinates between chart and list displays
- Provides consistent loading experience

##### `async createChart()`

Creates or updates the chart display with current data.

**Parameters:** None

**Returns:** Promise

**Why Necessary:**

- Separates chart creation from list display
- Handles chart-specific data processing
- Provides error isolation for chart operations

##### `displayCurrentPage()`

Updates the current page display with paginated data.

**Parameters:** None

**Returns:** None

**Why Necessary:**

- Coordinates between pagination and UI controllers
- Provides consistent page display logic
- Handles page-specific rendering

##### `toggleSortOrder()`

Toggles between ascending and descending sort orders.

**Parameters:** None

**Returns:** None

**Why Necessary:**

- Provides user control over data presentation
- Maintains state consistency
- Triggers appropriate data refresh

##### `toggleFilter()`

Toggles between time and session-based filtering.

**Parameters:** None

**Returns:** None

**Why Necessary:**

- Allows users to view different data perspectives
- Maintains filter state consistency
- Provides seamless filter switching

##### `openSettings()`

Navigates to the settings page.

**Parameters:** None

**Returns:** None

**Why Necessary:**

- Provides navigation to extension settings
- Maintains consistent navigation patterns
- Centralizes page routing logic

---

## Architecture Benefits

This modular architecture provides several key benefits:

### 1. **Single Responsibility Principle**

Each file has one clear purpose, making code easier to understand and maintain.

### 2. **Reusability**

Components can be reused across different pages (popup, settings, future analytics page).

### 3. **Testability**

Each component can be unit tested independently without complex mocking.

### 4. **Maintainability**

Bugs are easy to locate and fix because each piece of functionality has a clear home.

### 5. **Extensibility**

New features can be added by extending existing classes or adding new ones without modifying existing code.

### 6. **Separation of Concerns**

UI logic is separate from data logic, which is separate from storage logic, etc.

### 7. **Error Isolation**

Errors in one component don't necessarily break other components.

This architecture transforms a single 350+ line file into a maintainable, extensible system that follows modern JavaScript development practices.
