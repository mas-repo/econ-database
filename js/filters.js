// Dependencies: globals.js, render.js, storage-core.js, storage-filters.js

// ============================================
// GLOBAL FILTER STATE INITIALIZATION
// ============================================
if (!window.percentageFilter) {
    window.percentageFilter = { min: 0, max: 100, active: false };
}

if (!window.marksFilter) {
    window.marksFilter = { min: 0, max: 30, active: false };
}

if (!window.triStateFilters) {
    window.triStateFilters = { 
        curriculum: {}, 
        chapter: {}, 
        feature: {}, 
        exam: {}, 
        qtype: {},
        concepts: {},
        patterns: {},
        ai: {},
        multipleSelection: {},
        graph: {},
        table: {},
        calculation: {}
    };
}

// ============================================
// DROPDOWN & UI FUNCTIONS
// ============================================

// Configuration map for all filters that have arrow icons
// Maps the Dropdown ID -> The Arrow Span ID
const ARROW_MAP = {
    // Custom Grid Filters
    'curriculum-options': 'curriculum-arrow',
    'feature-options': 'feature-arrow',
    'chapter-options': 'chapter-arrow',
    
    // Standard Filters
    'exam-options': 'exam-arrow',
    'year-options': 'year-arrow',
    'qtype-options': 'qtype-arrow',
    
    // Range Filters
    'percentage-options': 'percentage-arrow',
    'marks-options': 'marks-arrow',
    
    // Input-First / Dynamic Filters
    'multiple-selection-options': 'multiple-selection-arrow',
    'graph-options': 'graph-arrow',
    'table-options': 'table-arrow',
    'calculation-options': 'calculation-arrow',
    'concepts-options': 'concepts-arrow',
    'patterns-options': 'patterns-arrow',
    'ai-options': 'ai-arrow'
};

/**
 * Helper: Closes ALL dropdowns (both standard and custom grids)
 * and resets all arrow icons.
 */
function closeAllDropdowns() {
    // 1. Close standard CSS-based dropdowns (remove .active)
    document.querySelectorAll('.dropdown-content').forEach(d => {
        d.classList.remove('active');
    });
    
    // Close input-dropdown lists specifically
    document.querySelectorAll('.input-dropdown-list').forEach(d => {
        d.classList.remove('active');
    });

    // 2. Close custom inline-style grids (Curriculum, Chapter, Feature)
    ['curriculum', 'chapter', 'feature'].forEach(type => {
        const section = document.getElementById(`${type}-options`);
        if (section) section.style.display = 'none';
    });

    // 3. Reset ALL arrows using the centralized map
    Object.values(ARROW_MAP).forEach(arrowId => {
        const arrow = document.getElementById(arrowId);
        if (arrow) arrow.textContent = '▶';
    });
}

/**
 * Master Toggle Function
 * Handles opening/closing for ALL filter types
 */
function toggleDropdown(dropdownId) {
    const target = document.getElementById(dropdownId);
    if (!target) return;

    // 1. Determine if the target is CURRENTLY open
    // It is open if it has class 'active' OR display is 'grid'/'block'
    const isStandardActive = target.classList.contains('active');
    const isGridActive = target.style.display === 'grid' || target.style.display === 'block';
    
    // Note: We must check if it's actually visible. If clearFilters set display:none, 
    // it might have .active but be hidden.
    const isActuallyVisible = isGridActive || (isStandardActive && target.style.display !== 'none');
    
    const wasOpen = isActuallyVisible;

    // 2. Close EVERYTHING first (Exclusive Mode)
    closeAllDropdowns();

    // 3. If it was NOT open before, open it now
    if (!wasOpen) {
        
        // Configuration for special grid filters that need display: grid
        const gridFilters = ['curriculum-options', 'feature-options', 'chapter-options'];

        if (gridFilters.includes(dropdownId)) {
            // === Case A: Custom Grid Filters ===
            target.style.display = 'grid';
        } else {
            // === Case B: Standard, Range, & Input Filters ===
            // FIX Issue 3: Explicitly clear inline display style.
            // This fixes the bug where "Reset" sets display:none and prevents reopening.
            target.style.display = ''; 
            target.classList.add('active');
        }

        // Update the specific arrow for this dropdown (FIX Issue 1)
        const arrowId = ARROW_MAP[dropdownId];
        if (arrowId) {
            const arrow = document.getElementById(arrowId);
            if (arrow) arrow.textContent = '▼';
        }
    }
}

document.addEventListener('click', function(event) {
    // Check if click is inside any filter container
    const isFilterClick = event.target.closest('.dropdown-filter') || 
                          event.target.closest('.dropdown-section') || 
                          event.target.closest('.advanced-header') ||
                          event.target.closest('.input-dropdown-container');

    if (!isFilterClick) {
        closeAllDropdowns();
    }
});

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

    const parentLabel = element.closest('.tri-state-label');
    if (parentLabel && element !== parentLabel) {
        if (window.triStateFilters[filter][value] === 'checked') {
            parentLabel.classList.add('checked');
            parentLabel.classList.remove('excluded');
        } else if (window.triStateFilters[filter][value] === 'excluded') {
            parentLabel.classList.remove('checked');
            parentLabel.classList.add('excluded');
        } else {
            parentLabel.classList.remove('checked', 'excluded');
        }
    }
    
    updateFilterIndicators();
    filterQuestions();
}

window.filterByTag = function(type, value) {
    if (!window.triStateFilters[type]) {
        window.triStateFilters[type] = {};
    }

    window.triStateFilters[type][value] = 'checked';

    const checkbox = document.querySelector(`.tri-state-checkbox[data-filter="${type}"][data-value="${value}"]`);
    if (checkbox) {
        checkbox.classList.remove('excluded');
        checkbox.classList.add('checked');
        const label = checkbox.closest('.tri-state-label');
        if(label) {
            label.classList.add('checked');
            label.classList.remove('excluded');
        }
    }

    updateFilterIndicators();
    filterQuestions();
};

function filterDropdownList(input, listId) {
    const filter = input.value.toUpperCase();
    const list = document.getElementById(listId);
    
    list.classList.add('active');
    
    const items = list.getElementsByClassName('tri-state-label');
    for (let i = 0; i < items.length; i++) {
        const txtValue = items[i].textContent || items[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            items[i].style.display = "";
        } else {
            items[i].style.display = "none";
        }
    }
}

function updateFilterIndicators() {
    const triStateTypes = [
        'exam', 'qtype', 'curriculum', 'chapter', 'feature',
        'multipleSelection', 'graph', 'table', 'calculation',
        'concepts', 'patterns', 'ai'
    ];
    
    triStateTypes.forEach(type => {
        // Handle the Dot Indicator (if it exists in HTML)
        const indicator = document.getElementById(`indicator-${type}`);
        if (!indicator) return;

        const hasActiveFilters = window.triStateFilters[type] && 
                                 Object.keys(window.triStateFilters[type]).length > 0;
        
        if (hasActiveFilters) {
            indicator.classList.add('visible');
        } else {
            indicator.classList.remove('visible');
        }
        // Handle Input Borders (for dropdowns with search inputs)
        const input = document.querySelector(`input[data-filter-type="${type}"]`);
        if (input) {
            input.style.borderColor = hasActiveFilters ? 'var(--secondary-color)' : '';
        }
    });

    // Explicitly Handle AI Button Styling
    const aiBtn = document.getElementById('ai-filter-btn');
    if (aiBtn) {
        const hasAiFilter = window.triStateFilters.ai && Object.keys(window.triStateFilters.ai).length > 0;
        if (hasAiFilter) {
            aiBtn.style.borderColor = 'var(--secondary-color)';
            aiBtn.style.color = 'var(--secondary-color)';
            // Also try to toggle a child indicator class if the ID method above failed
            const childIndicator = aiBtn.querySelector('.filter-indicator');
            if (childIndicator) childIndicator.classList.add('visible');
        } else {
            aiBtn.style.borderColor = '';
            aiBtn.style.color = '';
            const childIndicator = aiBtn.querySelector('.filter-indicator');
            if (childIndicator) childIndicator.classList.remove('visible');
        }
    }

    // Handle Year Indicator
    const yearIndicator = document.getElementById('indicator-year');
    if (yearIndicator) {
        const yearValue = document.getElementById('year-filter').value;
        if (yearValue && yearValue !== '') {
            yearIndicator.classList.add('visible');
        } else {
            yearIndicator.classList.remove('visible');
        }
    }

    // Handle Percentage Indicator
    const pctIndicator = document.getElementById('indicator-percentage');
    if (pctIndicator) {
        if (window.percentageFilter && window.percentageFilter.active) {
            pctIndicator.classList.add('visible');
        } else {
            pctIndicator.classList.remove('visible');
        }
    }

    // Handle Marks Indicator
    const marksIndicator = document.getElementById('indicator-marks');
    if (marksIndicator) {
        if (window.marksFilter && window.marksFilter.active) {
            marksIndicator.classList.add('visible');
        } else {
            marksIndicator.classList.remove('visible');
        }
    }
}

// ============================================
// DYNAMIC DROPDOWN LOGIC (Context-Aware)
// ============================================

function gatherFilterState() {
    return {
        search: document.getElementById('search').value,
        searchScope: window.searchScope || 'all',
        year: document.getElementById('year-filter').value,
        percentageFilter: window.percentageFilter,
        marksFilter: window.marksFilter,
        triState: window.triStateFilters
    };
}

async function updateDynamicDropdowns() {
    if (!window.storage) return;

    // ==========================================================
    // CONFIG: DEFINE YOUR PRIORITY SORT OPTIONS HERE
    // ==========================================================
    const PRIORITY_CONFIG = { // These will appear first
        multipleSelection: ['並非複選型', '不適用'], 
        graph: ['沒有圖', '未命名圖表'],
        table: ['沒有表格', '未命名表格'],
        calculation: ['沒有計算', '未命名計算題'],
        concepts: [],
        patterns: ['未分類']
    };
    // ==========================================================

    const allQuestions = await window.storage.getQuestions();
    const currentFilters = gatherFilterState();

    const contextFilters = JSON.parse(JSON.stringify(currentFilters));
    
    // Remove self-filter to allow seeing other options in the same category
    if (contextFilters.triState) {
        delete contextFilters.triState.multipleSelection;
        delete contextFilters.triState.graph;
        delete contextFilters.triState.table;
        delete contextFilters.triState.calculation;
        delete contextFilters.triState.concepts;
        delete contextFilters.triState.patterns;
        delete contextFilters.triState.ai;
    }

    const contextQuestions = window.storage.applyFilters(allQuestions, contextFilters);

    // Helper to generate HTML for a specific list
    const populateList = (containerId, fieldName, filterType, isArrayField = false) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 1. Get Values
        let validValues;
        if (isArrayField) {
            // Flatten array fields
            const set = new Set();
            contextQuestions.forEach(q => {
                if (Array.isArray(q[fieldName])) {
                    q[fieldName].forEach(val => {
                        if (val && val.trim() !== '') set.add(val.trim());
                    });
                }
            });
            validValues = Array.from(set).sort();
        } else {
            validValues = window.storage.getUniqueValues(contextQuestions, fieldName);
        }
        
        // 2. Apply Custom Sorting based on PRIORITY_CONFIG
        const priorities = PRIORITY_CONFIG[filterType] || [];
        
        if (priorities.length > 0) {
            validValues.sort((a, b) => {
                const indexA = priorities.indexOf(a);
                const indexB = priorities.indexOf(b);

                // If both are in priority list, sort by their order in config
                if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                }
                // If only A is in priority list, it comes first
                if (indexA !== -1) return -1;
                // If only B is in priority list, it comes first
                if (indexB !== -1) return 1;

                // Otherwise, standard string comparison (Chinese-aware)
                return a.localeCompare(b, 'zh-HK');
            });
        }

        // 3. Clean up filters for non-existent values
        if (window.triStateFilters[filterType]) {
            Object.keys(window.triStateFilters[filterType]).forEach(val => {
                if (!validValues.includes(val)) {
                    delete window.triStateFilters[filterType][val];
                }
            });
        }

        // Determine the wrapper to hide/show (supports both old and new styles)
        const wrapper = container.closest('.input-dropdown-container') || container.closest('.dropdown-filter');

        if (validValues.length === 0) {
            // Hide the entire dropdown container if no values exist
            if (wrapper) wrapper.style.display = 'none';
            return;
        } else {
             // Show it if it was hidden
            if (wrapper) wrapper.style.display = 'block'; 
        }

        let html = '';
        validValues.forEach(item => {
            const currentState = window.triStateFilters[filterType] && window.triStateFilters[filterType][item];
            
            let wrapperClass = 'tri-state-label';
            let checkboxClass = 'tri-state-checkbox';
            
            if (currentState === 'checked') {
                wrapperClass += ' checked';
                checkboxClass += ' checked';
            } else if (currentState === 'excluded') {
                wrapperClass += ' excluded';
                checkboxClass += ' excluded';
            }

            html += `
                <div class="${wrapperClass}" onclick="toggleTriState(this)" data-filter="${filterType}" data-value="${item}">
                    <div class="${checkboxClass}" data-filter="${filterType}" data-value="${item}">
                        <span>${item}</span>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    };

    // Populate standard dynamic lists
    populateList('multiple-selection-options', 'multipleSelectionType', 'multipleSelection');
    populateList('graph-options', 'graphType', 'graph');
    populateList('table-options', 'tableType', 'table');
    populateList('calculation-options', 'calculationType', 'calculation');
    
    // Populate new array-based lists
    populateList('concepts-options', 'concepts', 'concepts', true);
    populateList('patterns-options', 'patterns', 'patterns', true);

    // Dynamic AI Option (Modified to check for data existence)
        const aiContainer = document.getElementById('ai-options');
        if (aiContainer) {
            // 1. Check if any question in the current context has an AI Explanation
            const hasAI = contextQuestions.some(q => q.AIExplanation && q.AIExplanation.trim() !== '');

            // 2. Find the wrapper element to hide/show
            // This usually wraps both the button and the dropdown div
            const wrapper = aiContainer.closest('.dropdown-filter') || aiContainer.parentElement;

            if (!hasAI) {
                // No questions have AI explanations -> Hide the filter
                if (wrapper) wrapper.style.display = 'none';
            } else {
                // Questions exist -> Show the filter
                if (wrapper) wrapper.style.display = 'block'; 

                // 3. Render the checkbox option (Existing Logic)
                const item = 'AI 詳解';
                const currentState = window.triStateFilters.ai && window.triStateFilters.ai[item];
                
                let wrapperClass = 'tri-state-label';
                let checkboxClass = 'tri-state-checkbox';
                
                if (currentState === 'checked') {
                    wrapperClass += ' checked';
                    checkboxClass += ' checked';
                } else if (currentState === 'excluded') {
                    wrapperClass += ' excluded';
                    checkboxClass += ' excluded';
                }

                aiContainer.innerHTML = `
                    <div class="${wrapperClass}" onclick="toggleTriState(this)" data-filter="ai" data-value="${item}">
                        <div class="${checkboxClass}" data-filter="ai" data-value="${item}">
                            <span>${item}</span>
                        </div>
                    </div>
                `;
            }
        }
    
    updateFilterIndicators();
}

async function populateDynamicFilters() {
    await updateDynamicDropdowns();
    setupInputDropdownListeners();
}

function setupInputDropdownListeners() {
    const inputs = document.querySelectorAll('.filter-input');
    
    inputs.forEach(input => {
        const onkeyupAttr = input.getAttribute('onkeyup');
        if (!onkeyupAttr) return;

        const match = onkeyupAttr.match(/'([^']+)'/);
        if (!match) return;

        const listId = match[1];
        const list = document.getElementById(listId);
        
        input.addEventListener('focus', () => {
            // FIX Issue 2: Close other dropdowns (like Marks/Percentage) when focusing an input
            closeAllDropdowns();

            // Open this specific list
            if(list) {
                list.classList.add('active');
                // Ensure it's visible if it was hidden by Reset
                list.style.display = ''; 
            }

            // FIX Issue 1 (Part B): Rotate the arrow for this specific input
            // We find the arrow ID by reverse lookup in ARROW_MAP based on the listId
            const arrowId = ARROW_MAP[listId];
            if (arrowId) {
                const arrow = document.getElementById(arrowId);
                if (arrow) arrow.textContent = '▼';
            }
        });
    });
}

function populateSearchScope() {
    const select = document.getElementById('search-scope');
    if (!select) return;

    const currentSelection = select.value;
    const available = window.availableFields || new Set();

    let html = `<option value="all">全部欄位</option>`;
    
    if (available.size === 0 || available.has('id')) {
        html += `<option value="id">題目 ID</option>`;
    }

    const hasContent = available.size === 0 || 
                      available.has('questionTextChi') || 
                      available.has('questionTextEng');
    
    if (hasContent) {
        html += `<option value="content">題目內容</option>`;
    }

    const fieldMapping = {
        'answer': '答案',
        'concepts': '相關概念',
        'markersReport': '評卷報告',
        'patterns': '題型標籤' 
    };

    Object.entries(fieldMapping).forEach(([field, label]) => {
        if (available.has(field)) {
            html += `<option value="${field}">${label}</option>`;
        }
    });

    select.innerHTML = html;

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
    
    // Explicitly hide sections to visually reset
    const pctSection = document.getElementById('percentage-options');
    if (pctSection) pctSection.style.display = 'none';

    const marksSection = document.getElementById('marks-options');
    if (marksSection) marksSection.style.display = 'none';

    const collapsibleTypes = ['curriculum', 'chapter', 'feature'];
    collapsibleTypes.forEach(type => {
        const section = document.getElementById(`${type}-options`);
        if (section) section.style.display = 'none';
    });

    // Reset all arrows
    Object.values(ARROW_MAP).forEach(arrowId => {
        const arrow = document.getElementById(arrowId);
        if (arrow) arrow.textContent = '▶';
    });

    const scopeSelect = document.getElementById('search-scope');
    if (scopeSelect) scopeSelect.value = 'all';
    window.searchScope = 'all';

    document.querySelectorAll('.tri-state-checkbox').forEach(el => {
        el.classList.remove('checked', 'excluded');
        const label = el.closest('.tri-state-label');
        if(label) label.classList.remove('checked', 'excluded');
    });

    document.querySelectorAll('.filter-input').forEach(input => {
        input.value = '';
        input.style.borderColor = ''; 
        
        const onkeyupAttr = input.getAttribute('onkeyup');
        if (onkeyupAttr) {
            const listId = onkeyupAttr.match(/'([^']+)'/)[1];
            const list = document.getElementById(listId);
            if (list) {
                const items = list.getElementsByClassName('tri-state-label');
                for (let i = 0; i < items.length; i++) {
                    items[i].style.display = "";
                }
            }
        }
    });

    // Reset AI button style
    const aiBtn = document.getElementById('ai-filter-btn');
    if (aiBtn) {
        aiBtn.style.borderColor = '';
        aiBtn.style.color = '';
    }

    window.triStateFilters = { 
        curriculum: {}, 
        chapter: {}, 
        feature: {}, 
        exam: {}, 
        qtype: {},
        concepts: {},
        patterns: {},
        ai: {},
        multipleSelection: {},
        graph: {},
        table: {},
        calculation: {}
    };

    clearPercentageFilter();    
    clearMarksFilter();
    updateFilterIndicators();

    if (window.paginationState && window.paginationState.questions) {
        window.paginationState.questions.page = 1;
    }
    
    updateDynamicDropdowns().then(() => {
        if (typeof renderQuestions === 'function') renderQuestions();
    });
}

function updateSearchInfo() {
    const container = document.getElementById('active-filters-display');
    if (!container) return;

    let html = '';
    let hasFilters = false;

    const createBadge = (label, value, colorClass = 'blue') => {
        return `<span class="filter-badge ${colorClass}">${label}: ${value}</span>`;
    };

    const searchText = document.getElementById('search').value.trim();
    const scopeSelect = document.getElementById('search-scope');
    const scopeText = scopeSelect && scopeSelect.options[scopeSelect.selectedIndex] 
        ? scopeSelect.options[scopeSelect.selectedIndex].text 
        : '全部';
    
    if (searchText) {
        html += createBadge(`搜尋 (${scopeText})`, searchText);
        hasFilters = true;
    }

    const yearVal = document.getElementById('year-filter').value;
    if (yearVal) {
        html += createBadge('年份', yearVal);
        hasFilters = true;
    }

    if (window.percentageFilter && window.percentageFilter.active) {
        html += createBadge('答對率', `${window.percentageFilter.min}% - ${window.percentageFilter.max}%`, 'green');
        hasFilters = true;
    }

    if (window.marksFilter && window.marksFilter.active) {
        html += createBadge('分數', `${window.marksFilter.min} - ${window.marksFilter.max}`, 'green');
        hasFilters = true;
    }

    const categories = {
        'curriculum': '課程',
        'chapter': 'Chapter',
        'feature': '特徵',
        'exam': '考試',
        'qtype': '題型',
        'concepts': '概念',
        'patterns': '題型標籤',
        'multipleSelection': '複選',
        'graph': '圖表',
        'table': '表格',
        'calculation': '計算',
        'ai': 'AI'
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
        container.style.display = 'flex';
    } else {
        container.innerHTML = '';
        container.style.display = 'none';
    }
}

async function filterQuestions() {
    if (window.paginationState && window.paginationState.questions) {
        window.paginationState.questions.page = 1;
    }
    
    const scopeSelect = document.getElementById('search-scope');
    if (scopeSelect) {
        window.searchScope = scopeSelect.value;
    }

    updateFilterIndicators();
    await updateDynamicDropdowns();
    updateSearchInfo();
    if (typeof renderQuestions === 'function') await renderQuestions();
}

// ============================================
// RANGE FILTER FUNCTIONS
// ============================================

function updatePercentageRange() {
    const minSlider = document.getElementById('min-percentage');
    const maxSlider = document.getElementById('max-percentage');
    const minDisplay = document.getElementById('min-percentage-display');
    const maxDisplay = document.getElementById('max-percentage-display');
    const rangeFill = document.getElementById('percentage-range-fill');
    
    if (!minSlider || !maxSlider || !minDisplay || !maxDisplay || !rangeFill) return;
    
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
    
    if (!window.percentageFilter) window.percentageFilter = { min: 0, max: 100, active: false };
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
    window.percentageFilter = { min: 0, max: 100, active: false };
    updatePercentageRange();
    filterQuestions();
}

function updateMarksRange() {
    const minSlider = document.getElementById('min-marks');
    const maxSlider = document.getElementById('max-marks');
    const minDisplay = document.getElementById('min-marks-display');
    const maxDisplay = document.getElementById('max-marks-display');
    const rangeFill = document.getElementById('marks-range-fill');
    
    if (!minSlider || !maxSlider || !minDisplay || !maxDisplay || !rangeFill) return;
    
    let minVal = parseFloat(minSlider.value);
    let maxVal = parseFloat(maxSlider.value);
    
    if (minVal > maxVal) {
        minVal = maxVal;
        minSlider.value = minVal;
    }
    
    minDisplay.textContent = minVal;
    maxDisplay.textContent = maxVal;
    
    const percentMin = (minVal / 30) * 100;
    const percentMax = (maxVal / 30) * 100;
    
    rangeFill.style.left = percentMin + '%';
    rangeFill.style.width = (percentMax - percentMin) + '%';
    
    if (!window.marksFilter) window.marksFilter = { min: 0, max: 30, active: false };
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
        active: (minVal > 0 || maxVal < 30)
    };
    filterQuestions();
}

function clearMarksFilter() {
    const minSlider = document.getElementById('min-marks');
    const maxSlider = document.getElementById('max-marks');
    if (!minSlider || !maxSlider) return;
    
    minSlider.value = 0;
    maxSlider.value = 30;
    window.marksFilter = { min: 0, max: 30, active: false };
    updateMarksRange();
    filterQuestions();
}