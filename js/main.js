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
// Dependencies: auth.js (window.authManager, showLoginModal), storage-core.js (IndexedDBStorage)
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
// Dependencies: None
function updateStorageStatus(status, message) {
    const statusElement = document.getElementById('storage-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = ''; // Clear all classes
        statusElement.classList.add(status);
        statusElement.style.color = status === 'connected' ? '#27ae60' : '#e74c3c';
    }
}

// Update UI to show logged-in user and logout button
// Dependencies: auth.js (window.authManager)
function updateUserDisplay() {
    // Do nothing - user info not displayed on UI
}

// Initialize app UI (called by init() and also by auth.js after login)
// Dependencies: forms.js (setupFormHandler), filters.js (updatePercentageRange, updateMarksRange), render.js (renderQuestions), statistics.js (refreshStatistics)
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
    
    await populateYearFilter();
    await renderQuestions();
    await refreshStatistics();
}

// Show/Hide loading state
// Dependencies: None
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
// Dependencies: storage-sync.js (window.googleSheetsSync)
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
// Dependencies: None
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

// Dependencies: None
function hideLoading() {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.remove();
}

// Dependencies: render.js (renderQuestions), statistics.js (refreshStatistics)
async function refreshViews() {
    await populateYearFilter();
    await renderQuestions();
    await refreshStatistics();
}

// Tab switching
// Dependencies: statistics.js (renderPublishers, renderTopics, renderConcepts, renderPatterns), globals.js (window.currentTab)
function switchTab(tabName) {
    window.currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.remove('active');
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Render content based on tab
    if (tabName === 'publishers') {
        renderPublishers();
    } else if (tabName === 'topics') {
        renderTopics();
    } else if (tabName === 'chapters') {
        renderChapters();     
    } else if (tabName === 'concepts') {
        renderConcepts();
    } else if (tabName === 'patterns') {
        renderPatterns();
    }
}

// Event listeners
// Dependencies: filters.js (filterQuestions)
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterQuestions, 300));
    }
    
    // Year filter (this is still a <select> element)
    const yearFilter = document.getElementById('year-filter');
    if (yearFilter) {
        yearFilter.addEventListener('change', filterQuestions);
    }
    
    // Note: Exam type and Question type are now tri-state dropdowns
    // They trigger filterQuestions via onclick="toggleTriState(this)" in the HTML
    // No event listeners needed here for those
    
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

// Scroll to top
// Dependencies: None
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Debounce utility
// Dependencies: None
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

// Populate year filter
// Dependencies: storage-core.js (window.storage)
async function populateYearFilter() {
    const questions = await window.storage.getQuestions();
    const years = [...new Set(questions.map(q => q.year))].sort((a, b) => b - a);
    
    const yearFilter = document.getElementById('year-filter');
    yearFilter.innerHTML = '<option value="">全部年份</option>';
    
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

// Clear database
// Dependencies: storage-core.js (window.storage)
async function clearDatabase() {
    if (confirm('確定要清除所有資料？此操作無法復原！')) {
        if (confirm('請再次確認：真的要刪除所有題目嗎？')) {
            await window.storage.clear();
            await refreshViews();
            alert('資料庫已清空');
        }
    }
}

// Initialize when DOM is ready
// Dependencies: None
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