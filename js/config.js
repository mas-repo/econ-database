// Configuration file for Google Sheets sync
// Dependencies: storage-sync.js (GoogleSheetsSync)

const CONFIG = {
    GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwSMrdxHK1dBLHrXS8ffqP5fsROykh2BXj6_xR23GQpo2_0zdcdIWRyXVoui4PGOLmG/exec'
};

// Initialize sync on page load
// Dependencies: storage-sync.js (GoogleSheetsSync)
window.addEventListener('DOMContentLoaded', async () => {
    if (CONFIG.GOOGLE_APPS_SCRIPT_URL && CONFIG.GOOGLE_APPS_SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        window.googleSheetsSync = new GoogleSheetsSync(CONFIG.GOOGLE_APPS_SCRIPT_URL);
        console.log('✅ Google Sheets Sync initialized');
    } else {
        console.warn('⚠️ Google Apps Script URL not configured in config.js');
    }
});