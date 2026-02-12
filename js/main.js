/* ============================================
   Main Application Initialization
   ============================================ */

// Dependencies: auth.js, storage.js, render.js, filters.js, statistics.js

// Logout function
function logout() {
    if (confirm('確定要離開系統嗎？')) {
        window.authManager.logout();
    }
}

// Initialize application
async function init() {
    console.log('🚀 初始化應用程式...');

    // Safety check: ensure authManager exists
    if (!window.authManager) {
        console.error('❌ AuthManager not initialized!');
        alert('系統錯誤：認證模組未載入，請重新整理頁面');
        return;
    }    

    // Check if user is authenticated (from cookie)
    if (!window.authManager.isAuthenticated()) {
        console.log('❌ 未驗證，顯示驗證視窗');
        showLoginModal(); // This is defined in auth.js
        return; // Stop initialization until user logs in
    }
    
    console.log('✅ 使用者已驗證:', window.authManager.displayName);
    
    // Update UI to show logged-in user
    updateUserDisplay();
    
    // Show loading state
    showLoadingState(true);
    
    // Initialize storage
    window.storage = new IndexedDBStorage();
    
    try {
        await window.storage.init();
        console.log('✅ IndexedDB 已初始化');
    } catch (error) {
        console.error('Failed to initialize storage:', error);
        updateStorageStatus('disconnected', '✗ 資料庫初始化失敗');
        showLoadingState(false);
        return; // Stop if storage fails
    }
    
    // Auto-sync from Google Sheets on page load (for cookie-based login)
    if (window.googleSheetsSync) {
        try {
            console.log('📥 開始從 Google Sheets 載入資料...');
            updateStorageStatus('loading', '⏳ 載入資料中...');
            const result = await window.googleSheetsSync.syncOnLoad();
            
            if (result.success) {
                console.log('✅ Google Sheets 資料載入完成');
                console.log(`📊 載入 ${result.count} 題`);
                updateStorageStatus('connected', `✓ 資料載入完成`);
            }
        } catch (error) {
            console.error('Failed to sync on load:', error);
            console.warn('⚠️ Google Sheets 同步失敗:', error.message);
            // Don't stop - continue with whatever data is in IndexedDB
        }
    }
    
    // Initialize UI components
    await initializeApp();
    
    // Hide loading state after everything is loaded
    showLoadingState(false);
    
    console.log('✅ 應用程式初始化完成');
}

// Update storage status indicator
function updateStorageStatus(status, message) {
    const statusElement = document.getElementById('storage-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = ''; // Clear all classes
        statusElement.classList.add(status);
        statusElement.style.color = status === 'connected' ? '#27ae60' : '#e74c3c';
    }
}

function updateUserDisplay() {
    // Do nothing - user info not displayed on UI
}

// Initialize app UI (called by init() and also by auth.js after login)
async function initializeApp() {
    console.log('🔧 初始化應用程式介面...');
    
    setupFormHandler();
    setupEventListeners();
    
    // Initialize percentage slider
    if (document.getElementById('min-percentage')) {
        updatePercentageRange();
    }
    
    // Initialize marks slider
    if (document.getElementById('min-marks')) {
        updateMarksRange();
    }

    // Populate the Search Scope dropdown based on loaded permissions
    if (typeof populateSearchScope === 'function') {
        populateSearchScope();
    }
     
    // Populate the dynamic filters
    if (typeof populateDynamicFilters === 'function') {
        await populateDynamicFilters();
    }    
    await renderQuestions();
    await refreshStatistics();
}

// Also add to refreshViews() so they update if data changes (e.g. after sync)
async function refreshViews() {
    
    if (typeof populateDynamicFilters === 'function') {
        await populateDynamicFilters();
    }

    await renderQuestions();
    await refreshStatistics();
}

// Show/Hide loading state
function showLoadingState(show) {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
    
    // Clear "檢查資料庫..." text when hiding loading
    if (!show) {
        const statusElement = document.getElementById('storage-status');
        if (statusElement) {
            const currentText = statusElement.textContent.trim();
            // Only clear if it's still showing the loading message
            if (currentText === '檢查資料庫...') {
                statusElement.textContent = '';
            }
        }
    }
}

// Manual sync (reload from Google Sheets)
async function manualSync() {
    if (!window.googleSheetsSync) {
        alert('Google Sheets 未設定，請檢查 config.js');
        return;
    }
    
    try {
        showLoading('正在從 Google Sheets 載入資料...');
        
        const result = await window.googleSheetsSync.syncOnLoad();
        
        hideLoading();
        
        if (result.success) {
            // Re-populate search scope after sync as permissions might have changed
            if (typeof populateSearchScope === 'function') {
                populateSearchScope();
            }
            await refreshViews();
            alert(`✅ 同步成功！\n\n匯入 ${result.count} 題`);
            console.log('✅ Google Sheets 資料同步完成');
        }
    } catch (error) {
        hideLoading();
        alert('❌ 同步失敗: ' + error.message);
    }
}

// Helper functions
function showLoading(message) {
    let loader = document.getElementById('loading-overlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loading-overlay';
        loader.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7); display: flex;
            align-items: center; justify-content: center; z-index: 9999;
        `;
        document.body.appendChild(loader);
    }
    loader.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
            <div style="font-size: 24px; margin-bottom: 15px;">⏳</div>
            <div style="font-size: 16px; color: #333;">${message}</div>
        </div>
    `;
}

function hideLoading() {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.remove();
}

// Tab switching
function switchTab(tabName, event) {
    window.currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Fallback if event not passed
        const btn = document.querySelector(`[onclick*="switchTab('${tabName}')"]`);
        if (btn) btn.classList.add('active');
    }
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const content = document.getElementById(`${tabName}-tab`);
    if (content) content.classList.add('active');
    
    // Render content based on tab
    if (tabName === 'publishers') {
        // Note: calling renderPublishers here triggers the one in tabs.js (metadata)
        // or statistics.js (stats) depending on load order.
        // We will rename statistics.js functions to avoid conflict.
        if (typeof renderPublishers === 'function') renderPublishers();
    } else if (tabName === 'topics') {
        if (typeof renderTopics === 'function') renderTopics();
    } else if (tabName === 'chapters') {
        if (typeof renderChapters === 'function') renderChapters();     
    } else if (tabName === 'concepts') {
        if (typeof renderConcepts === 'function') renderConcepts();
    } else if (tabName === 'patterns') {
        if (typeof renderPatterns === 'function') renderPatterns();
    }
}

// Event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterQuestions, 300));
    }

    // Search Scope Listener
    const searchScope = document.getElementById('search-scope');
    if (searchScope) {
        searchScope.addEventListener('change', filterQuestions);
    }    
    
    // Scroll to top button
    window.addEventListener('scroll', () => {
        const scrollBtn = document.getElementById('scroll-to-top');
        if (scrollBtn && window.pageYOffset > 300) {
            scrollBtn.style.display = 'block';
        } else if (scrollBtn) {
            scrollBtn.style.display = 'none';
        }
    });
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// REMOVED: populateYearFilter function

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        populateCurriculumFilter();
        populateChapterFilter();
        populateFeatureFilter();
        populateCurriculumFormOptions();
        init();
    });
} else {
    populateCurriculumFilter();
    populateChapterFilter();
    populateFeatureFilter();
    populateCurriculumFormOptions();
    init();
}

// === Hotkey Listener (Suggestion 3) ===
document.addEventListener('keydown', function(e) {
    // Press Escape to clear filters
    if (e.key === 'Escape') {
        clearFilters();
    }
});