// Dependencies: globals.js, render.js

// ============================================
// GLOBAL FILTER STATE INITIALIZATION
// ============================================
// Initialize these at the top to prevent "undefined" errors
if (!window.percentageFilter) {
    window.percentageFilter = { min: 0, max: 100, active: false };
}

if (!window.marksFilter) {
    window.marksFilter = { min: 0, max: 16, active: false };
}

if (!window.triStateFilters) {
    window.triStateFilters = { 
        curriculum: {}, 
        chapter: {}, 
        feature: {}, 
        exam: {}, 
        qtype: {},
        concepts: {},
        patterns: {}
    };
}

// ============================================
// DROPDOWN & UI FUNCTIONS
// ============================================

// Dropdown toggle
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const allDropdowns = document.querySelectorAll('.dropdown-content');
    const chapterOptions = document.getElementById('chapter-options');
    
    allDropdowns.forEach(d => {
        if (d.id !== dropdownId) {
            d.classList.remove('active');
        }
    });
    
    if (chapterOptions && dropdownId !== 'chapter-options') {
        chapterOptions.style.display = 'none';
        const chapterArrow = document.getElementById('chapter-arrow');
        if (chapterArrow) {
            chapterArrow.textContent = '▶';
        }
    }
    
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Toggle collapsible sections
function toggleCollapsibleSection(sectionId, arrowId) {
    const section = document.getElementById(sectionId);
    const arrow = document.getElementById(arrowId);
    
    if (!section) return;
    
    if (sectionId === 'chapter-options') {
        document.querySelectorAll('.dropdown-content').forEach(d => {
            d.classList.remove('active');
        });
    }
    
    const isHidden = section.style.display === 'none' || !section.style.display;
    
    if (isHidden) {
        section.style.display = 'grid';
        if (arrow) arrow.textContent = '▼';
    } else {
        section.style.display = 'none';
        if (arrow) arrow.textContent = '▶';
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.dropdown-filter') && !event.target.closest('.dropdown-section')) {
        document.querySelectorAll('.dropdown-content').forEach(d => {
            d.classList.remove('active');
        });
        
        const chapterOptions = document.getElementById('chapter-options');
        if (chapterOptions) {
            chapterOptions.style.display = 'none';
            const chapterArrow = document.getElementById('chapter-arrow');
            if (chapterArrow) {
                chapterArrow.textContent = '▶';
            }
        }
    }
});

// Tri-state filter toggle
function toggleTriState(element) {
    const filter = element.dataset.filter;
    const value = element.dataset.value;
    
    if (!window.triStateFilters[filter]) {
        window.triStateFilters[filter] = {};
    }
    
    const currentState = window.triStateFilters[filter][value];
    
    if (!currentState) {
        element.classList.add('checked');
        window.triStateFilters[filter][value] = 'checked';
    } else if (currentState === 'checked') {
        element.classList.remove('checked');
        element.classList.add('excluded');
        window.triStateFilters[filter][value] = 'excluded';
    } else {
        element.classList.remove('excluded');
        delete window.triStateFilters[filter][value];
    }
    
    filterQuestions();
}

// Filter by clicking a tag (Concept, Chapter, Curriculum)
window.filterByTag = function(type, value) {
    if (!window.triStateFilters[type]) {
        window.triStateFilters[type] = {};
    }

    window.triStateFilters[type][value] = 'checked';

    if (type === 'chapter') {
        const checkbox = document.querySelector(`.tri-state-checkbox[data-filter="chapter"][data-value="${value}"]`);
        if (checkbox) {
            checkbox.classList.remove('excluded');
            checkbox.classList.add('checked');
        }
    }
    
    if (type === 'curriculum' || type === 'feature') {
        const checkbox = document.querySelector(`.tri-state-checkbox[data-filter="${type}"][data-value="${value}"]`);
        if (checkbox) {
            checkbox.classList.remove('excluded');
            checkbox.classList.add('checked');
        }
    }

    filterQuestions();
};

// Populate Search Scope Dropdown based on permissions
function populateSearchScope() {
    const select = document.getElementById('search-scope');
    if (!select) return;

    // Save current selection if it exists
    const currentSelection = select.value;

    // Use window.availableFields as the source of truth. 
    // If undefined (data not loaded), default to empty Set to avoid showing restricted fields.
    const available = window.availableFields || new Set();

    // 1. Static Options (Always available)
    let html = `<option value="all">全部欄位</option>`;
    
    // Only show ID if available or if no data loaded yet (standard field)
    if (available.size === 0 || available.has('id')) {
        html += `<option value="id">題目 ID</option>`;
    }

    // 2. Check for Content (Chi/Eng)
    const hasContent = available.size === 0 || 
                      available.has('questionTextChi') || 
                      available.has('questionTextEng');
    
    if (hasContent) {
        html += `<option value="content">題目內容</option>`;
    }

    // 3. Dynamic Options Mapping
    // These correspond to the keys in config.gs COLUMN_MAPPINGS
    const fieldMapping = {
        'answer': '答案',
        'concepts': '相關概念',
        'markersReport': '評卷報告',
        'patternTags': '題型標籤' 
    };

    Object.entries(fieldMapping).forEach(([field, label]) => {
        // Strict check: Only add the option if the field is explicitly in the available set.
        // This ensures 'Colleagues' (who lack 'concepts') won't see it.
        if (available.has(field)) {
            html += `<option value="${field}">${label}</option>`;
        }
    });

    select.innerHTML = html;

    // Restore selection if it's still valid, otherwise default to 'all'
    if (select.querySelector(`option[value="${currentSelection}"]`)) {
        select.value = currentSelection;
    } else {
        select.value = 'all';
        window.searchScope = 'all';
    }
}

function clearFilters() {
    document.getElementById('search').value = '';
    document.getElementById('year-filter').value = '';
    
    const scopeSelect = document.getElementById('search-scope');
    if (scopeSelect) scopeSelect.value = 'all';
    window.searchScope = 'all';

    document.querySelectorAll('.tri-state-checkbox').forEach(el => {
        el.classList.remove('checked', 'excluded');
    });
    window.triStateFilters = { 
        curriculum: {}, 
        chapter: {}, 
        feature: {}, 
        exam: {}, 
        qtype: {},
        concepts: {},
        patterns: {}
    };

    clearPercentageFilter();    
    clearMarksFilter();

    window.paginationState.questions.page = 1;
    renderQuestions();
}

// Update the visual Search Info display
function updateSearchInfo() {
    const container = document.getElementById('active-filters-display');
    if (!container) return;

    let html = '';
    let hasFilters = false;

    const createBadge = (label, value, colorClass = 'blue') => {
        return `<span class="filter-badge ${colorClass}">${label}: ${value}</span>`;
    };

    // 1. Search Text & Scope
    const searchText = document.getElementById('search').value.trim();
    const scopeSelect = document.getElementById('search-scope');
    
    const scopeText = scopeSelect && scopeSelect.options[scopeSelect.selectedIndex] 
        ? scopeSelect.options[scopeSelect.selectedIndex].text 
        : '全部';
    
    if (searchText) {
        html += createBadge(`搜尋 (${scopeText})`, searchText);
        hasFilters = true;
    }

    // 2. Year
    const yearVal = document.getElementById('year-filter').value;
    if (yearVal) {
        html += createBadge('年份', yearVal);
        hasFilters = true;
    }

    // 3. Percentage
    if (window.percentageFilter && window.percentageFilter.active) {
        html += createBadge('答對率', `${window.percentageFilter.min}% - ${window.percentageFilter.max}%`, 'green');
        hasFilters = true;
    }

    // 4. Marks
    if (window.marksFilter && window.marksFilter.active) {
        html += createBadge('分數', `${window.marksFilter.min} - ${window.marksFilter.max}`, 'green');
        hasFilters = true;
    }

    // 5. Tri-state Filters
    const categories = {
        'curriculum': '課程',
        'chapter': 'Chapter',
        'feature': '特徵',
        'exam': '考試',
        'qtype': '題型',
        'concepts': '概念',
        'patterns': '題型標籤'
    };

    Object.entries(window.triStateFilters).forEach(([catKey, items]) => {
        Object.entries(items).forEach(([itemVal, state]) => {
            const label = categories[catKey] || catKey;
            if (state === 'checked') {
                html += createBadge(label, itemVal, 'blue');
                hasFilters = true;
            } else if (state === 'excluded') {
                html += createBadge(`排除 ${label}`, itemVal, 'red');
                hasFilters = true;
            }
        });
    });

    if (hasFilters) {
        container.innerHTML = `<div class="search-info-title">🔍 篩選條件:</div><div class="badges-list">${html}</div>`;
        container.style.display = 'block';
    } else {
        container.innerHTML = '';
        container.style.display = 'none';
    }
}

async function filterQuestions() {
    window.paginationState.questions.page = 1;
    
    const scopeSelect = document.getElementById('search-scope');
    if (scopeSelect) {
        window.searchScope = scopeSelect.value;
    }

    updateSearchInfo();
    await renderQuestions();
}

// ============================================
// PERCENTAGE FILTER
// ============================================

function updatePercentageRange() {
    const minSlider = document.getElementById('min-percentage');
    const maxSlider = document.getElementById('max-percentage');
    const minDisplay = document.getElementById('min-percentage-display');
    const maxDisplay = document.getElementById('max-percentage-display');
    const rangeFill = document.getElementById('percentage-range-fill');
    
    if (!minSlider || !maxSlider || !minDisplay || !maxDisplay || !rangeFill) {
        return;
    }
    
    let minVal = parseInt(minSlider.value);
    let maxVal = parseInt(maxSlider.value);
    
    if (minVal > maxVal) {
        minVal = maxVal;
        minSlider.value = minVal;
    }
    
    minDisplay.textContent = minVal;
    maxDisplay.textContent = maxVal;
    
    const percentMin = (minVal / 100) * 100;
    const percentMax = (maxVal / 100) * 100;
    
    rangeFill.style.left = percentMin + '%';
    rangeFill.style.width = (percentMax - percentMin) + '%';
    
    // Safety check
    if (!window.percentageFilter) {
        window.percentageFilter = { min: 0, max: 100, active: false };
    }
    
    window.percentageFilter.min = minVal;
    window.percentageFilter.max = maxVal;
    
    applyPercentageFilter();
}

function applyPercentageFilter() {
    const minVal = parseInt(document.getElementById('min-percentage').value);
    const maxVal = parseInt(document.getElementById('max-percentage').value);
    
    window.percentageFilter = {
        min: minVal,
        max: maxVal,
        active: (minVal > 0 || maxVal < 100)
    };
    
    filterQuestions();
}

function clearPercentageFilter() {
    const minSlider = document.getElementById('min-percentage');
    const maxSlider = document.getElementById('max-percentage');
    
    if (!minSlider || !maxSlider) return;
    
    minSlider.value = 0;
    maxSlider.value = 100;
    
    window.percentageFilter = {
        min: 0,
        max: 100,
        active: false
    };
    
    updatePercentageRange();
    filterQuestions();
}

// ============================================
// MARKS FILTER
// ============================================

function updateMarksRange() {
    const minSlider = document.getElementById('min-marks');
    const maxSlider = document.getElementById('max-marks');
    const minDisplay = document.getElementById('min-marks-display');
    const maxDisplay = document.getElementById('max-marks-display');
    const rangeFill = document.getElementById('marks-range-fill');
    
    if (!minSlider || !maxSlider || !minDisplay || !maxDisplay || !rangeFill) {
        return;
    }
    
    let minVal = parseFloat(minSlider.value);
    let maxVal = parseFloat(maxSlider.value);
    
    if (minVal > maxVal) {
        minVal = maxVal;
        minSlider.value = minVal;
    }
    
    minDisplay.textContent = minVal;
    maxDisplay.textContent = maxVal;
    
    const percentMin = (minVal / 16) * 100;
    const percentMax = (maxVal / 16) * 100;
    
    rangeFill.style.left = percentMin + '%';
    rangeFill.style.width = (percentMax - percentMin) + '%';
    
    // Safety check
    if (!window.marksFilter) {
        window.marksFilter = { min: 0, max: 16, active: false };
    }
    
    window.marksFilter.min = minVal;
    window.marksFilter.max = maxVal;
    
    applyMarksFilter();
}

function applyMarksFilter() {
    const minVal = parseFloat(document.getElementById('min-marks').value);
    const maxVal = parseFloat(document.getElementById('max-marks').value);
    
    window.marksFilter = {
        min: minVal,
        max: maxVal,
        active: (minVal > 0 || maxVal < 16)
    };
    
    filterQuestions();
}

function clearMarksFilter() {
    const minSlider = document.getElementById('min-marks');
    const maxSlider = document.getElementById('max-marks');
    
    if (!minSlider || !maxSlider) return;
    
    minSlider.value = 0;
    maxSlider.value = 16;
    
    window.marksFilter = {
        min: 0,
        max: 16,
        active: false
    };
    
    updateMarksRange();
    filterQuestions();
}