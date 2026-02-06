# HKDSE Economics Questions Database - System Documentation

## 1. Project Overview
This project is a **Single Page Application (SPA)** designed to manage, search, and analyze HKDSE Economics examination questions. 

**Core Architecture:**
*   **Backend / Master Database:** Google Sheets (accessed via Google Apps Script).
*   **Frontend:** Vanilla JavaScript, HTML, CSS.
*   **Local Database:** IndexedDB (via a wrapper class) is used to cache data on the client side for high-performance filtering and searching without constant API calls.
*   **Authentication:** Role-Based Access Control (RBAC) handled by Google Apps Script.

---

## 2. System Architecture & Logic Flow

### 2.1. Data Synchronization Flow
The system uses a "Sync on Load" strategy to ensure data freshness while maintaining UI responsiveness.

1.  **Initialization (`main.js`):** The app initializes `AuthManager`. If authenticated, it triggers `GoogleSheetsSync`.
2.  **API Call (`storage-sync.js`):** The frontend requests data from the Google Apps Script (`code.gs`) endpoint, passing the current `username`.
3.  **Backend Processing (`code.gs`):** 
    *   Verifies the user against `config.gs`.
    *   Determines the `userGroup` (Admin, Colleagues, Friends).
    *   **Column-Level Security:** Based on the group, it filters out specific columns (e.g., "Colleagues" cannot see "concepts").
    *   **Serialization:** Data is serialized using custom delimiters (ASCII 30 and 31) to handle special characters and newlines safely.
4.  **Local Caching (`storage-core.js`):** The frontend parses the response and wipes/repopulates the **IndexedDB**.
5.  **Rendering:** The UI renders data *only* from IndexedDB, never directly from the API response.

### 2.2. Authentication & Security
There are two distinct layers of security:

1.  **User Login (`auth.js`):**
    *   Users log in with a username.
    *   The backend validates the user and returns their `userGroup`.
    *   **Security:** This determines *what data* is sent to the client. Unauthorized users receive no data.
2.  **Admin Mode (`admin.js`):**
    *   A client-side toggle to enable editing/deleting buttons.
    *   Protected by a password hash verification against the backend.
    *   **Note:** This controls UI visibility. Actual database writes (Feedback/Logging) are handled via specific API actions.

### 2.3. Filtering Logic (`storage-filters.js` & `filters.js`)
The application supports complex filtering:
*   **Tri-State Filters:** Items (Chapters, Curriculum) can be in three states: *Neutral* (Ignored), *Included* (Green check), or *Excluded* (Red cross).
*   **Input-First Dropdowns:** Specialized filters (Graph, Table, Calculation, Multiple Selection) that function as both text inputs and dropdowns. Users can type to filter the option list, and visual indicators (blue dots/borders) show active states.
*   **Search Scope:** Users can limit text search to specific fields (ID, Content, Answer), dynamically populated based on user permissions.
*   **Range Filters:** Sliders for Marks and Percentage.

---

## 3. Backend (Google Apps Script)

These files run on the Google Cloud / Apps Script environment.

*   **`code.gs`**: The entry point (`doGet`).
    *   Handles routing via the `action` parameter (e.g., `verify_admin`, `feedback`).
    *   Default action is data fetching: verifies user, logs access to an external sheet, and returns filtered CSV-like data.
*   **`config.gs`**:
    *   **`USERS`**: Hardcoded user database defining roles.
    *   **`GROUP_COLUMN_RULES`**: Defines which columns each User Group is allowed to fetch.
    *   **`COLUMN_MAPPINGS`**: Maps Spreadsheet headers to JSON property keys.

---

## 4. Frontend File Manifest

### 4.1. Core Infrastructure
*   **`index.html`**: The skeleton of the application. Contains the layout containers and script imports.
*   **`main.js`**: The bootstrapper. Handles initialization (`init()`), loading states, and orchestrates the startup sequence.
*   **`globals.js`**: Holds global state variables (`storage`, `currentTab`, `paginationState`, `triStateFilters`). **Crucial:** Must be loaded before other logic files.
*   **`config.js`**: Frontend configuration, specifically the `GOOGLE_APPS_SCRIPT_URL`.
*   **`constants.js`**: Static definitions (Curriculum lists, Chapter ranges, Question Types). Used to populate dropdowns and sort orders.

### 4.2. Data Layer
*   **`auth.js`**: Manages user sessions. Handles Login Modal, Cookie setting/getting, and LocalStorage fallbacks.
*   **`storage-core.js`**: A wrapper around the browser's **IndexedDB**. Handles `init`, `add`, `get`, and `delete` operations.
*   **`storage-sync.js`**: Handles the fetch logic from Google Sheets. Parses the custom delimiter format and populates `storage-core.js`.
*   **`storage-filters.js`**: Extends `IndexedDBStorage` with the `applyFilters` method. Contains the actual logic for filtering arrays of questions.
*   **`import-export.js`**: Functions to export the local IndexedDB data to JSON and import it back (Backup/Restore).

### 4.3. UI & Interaction
*   **`render.js`**: The main view generator. Reads from storage, applies pagination, and generates the HTML for the Question Cards grid.
*   **`filters.js`**: UI Event handlers for the filter sidebar. Manages standard dropdowns, the new "Input-First" dropdowns with type-ahead filtering, visual active-state indicators, and range slider logic.
*   **`forms.js`**: Logic for the "Add/Edit Question" form and the "Feedback" modal. Handles form validation and submission to IndexedDB.
*   **`pagination.js`**: Calculates total pages and renders the pagination controls.
*   **`sort.js`**: Helper function to sort question arrays by Year, ID, or Marks. Handles complex alphanumeric sorting (e.g., Q1, Q1a, Q1b).
*   **`tabs.js`**: Logic for switching between the "Questions" view and "Statistics" views (Publishers, Topics, etc.).
*   **`statistics.js`**: Aggregates data from IndexedDB to render statistical grids (counts of MC vs Text questions per topic).
*   **`admin.js`**: Handles the "Admin Mode" toggle, password hashing, and UI updates for admin-only buttons.
*   **`utils.js`**: Generic helpers (Copy to clipboard, Scroll to top).

### 4.4. Styling (CSS)
*   **`main.css`**: The central CSS file that imports all other modules.
*   **`variables.css`**: Design tokens (Colors, Spacing, Shadows).
*   **`reset.css`**: Browser normalization.
*   **`layout.css`**: Global containers, Header, and Footer.
*   **`components.css`**: Tabs, Badges, Pagination.
*   **`cards.css`**: Styling for Question Cards and Statistic Cards.
*   **`filters.css`**: Specific styling for the complex filter sidebar. Includes styles for the search bar, tri-state checkboxes, range sliders, and the new input-based dropdowns with floating active indicators.
*   **`forms.js`**: Styling for input fields and modals.
*   **`buttons.css`**: Button variants (Primary, Danger, Success).
*   **`responsive.css`**: Media queries for Mobile and Tablet adaptation.

---

## 5. Key Data Structures

### 5.1. Question Object (Frontend)
The IndexedDB stores objects with normalized keys (mapped from `config.gs`):
```json
{
  "id": "2012-P1-Q1",
  "year": 2012,
  "examination": "HKDSE",
  "questionType": "MC",
  "questionTextChi": "...",
  "questionTextEng": "...",
  "answer": "A",
  "curriculumClassification": ["A", "B"], // Array
  "concepts": ["Scarcity", "Opportunity Cost"], // Array
  "marks": 2
  // ... other fields
}


\### 5.2. Custom Data Transmission Format

To avoid JSON parsing issues with quotes and newlines in question text, the backend sends data as a custom delimited string:

\*   \*\*Column Separator:\*\* `String.fromCharCode(30)` (Record Separator)

\*   \*\*Row Separator:\*\* `String.fromCharCode(31)` (Unit Separator)





