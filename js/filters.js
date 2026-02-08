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
// NOTE: Ensure these IDs match your HTML exactly.
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

    // 3. Reset ALL arrows
    // Method A: Use the map
    Object.values(ARROW_MAP).forEach(arrowId => {
        const arrow = document.getElementById(arrowId);
        if (arrow) arrow.textContent = '▶';
    });

    // Method B: Fallback - Find all elements with class 'arrow' inside buttons and reset them
    document.querySelectorAll('.dropdown-btn .arrow, .filter-input-wrapper .input-arrow').forEach(arrow => {
        // Only reset if it looks like an arrow (avoid resetting other icons if any)
        if (arrow.textContent === '▼') arrow.textContent = '▶';
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
    const isStandardActive = target.classList.contains('active');
    const isGridActive = target.style.display === 'grid' || target.style.display === 'block';
    
    // Note: We must check if it's actually visible.
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
            target.style.display = ''; 
            target.classList.add('active');
        }

        // === UPDATE ARROW LOGIC ===
        // Attempt 1: Use the map
        let arrowUpdated = false;
        const arrowId = ARROW_MAP[dropdownId];
        if (arrowId) {
            const arrow = document.getElementById(arrowId);
            if (arrow) {
                arrow.textContent = '▼';
                arrowUpdated = true;
            }
        }

        // Attempt 2: Dynamic Lookup (Fallback)
        // If the map failed, look for the button that triggered this.
        // We assume the button is a sibling or parent of the dropdown container.
        if (!arrowUpdated) {
            // Find the container wrapping the dropdown
            const container = target.closest('.dropdown-filter') || target.closest('.input-dropdown-container');
            if (container) {
                // Find the button or input wrapper inside this container
                const btn = container.querySelector('.dropdown-btn') || container.querySelector('.filter-input-wrapper');
                if (btn) {
                    // Find the arrow span inside that button
                    const arrow = btn.querySelector('.arrow') || btn.querySelector('.input-arrow');
                    if (arrow) {
                        arrow.textContent = '▼';
                    }
                }
            }
        }
    }

    // UPDATED LOGIC: Trigger update regardless of open/close state.
    // 1. If we just OPENED the dropdown: It is now visible. updateDynamicDropdowns will see 'isVisible=true' 
    //    and perform a "Soft Update" (counts/checks only), preserving the order so items don't jump.
    // 2. If we just CLOSED the dropdown: It is now hidden. updateDynamicDropdowns will see 'isVisible=false'
    //    and perform a "Full Rebuild", sorting selected items to the top for the next time it opens.
    updateDynamicDropdowns();
}

document.addEventListener('click', function(event) {
    // Check if click is inside any filter container
    const isFilterClick = event.target.closest('.dropdown-filter') || 
                          event.target.closest('.dropdown-section') || 
                          event.target.closest('.advanced-header') ||
                          event.target.closest('.input-dropdown-container');

    if (!isFilterClick) {
        closeAllDropdowns();
        // UPDATED: When clicking outside to close, trigger the sort on the now-hidden elements.
        updateDynamicDropdowns();
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

window.filterByTag = async function(category, value) {
    // Ensure the category object exists in the global filter state
    if (!window.triStateFilters[category]) {
        window.triStateFilters[category] = {};
    }

    // Check the current state of this specific tag
    const currentState = window.triStateFilters[category][value];

    if (currentState === 'checked') {
        // TOGGLE OFF: If currently active, remove it
        delete window.triStateFilters[category][value];
    } else {
        // TOGGLE ON: If inactive (or excluded), set to checked
        window.triStateFilters[category][value] = 'checked';
    }

    await filterQuestions();
};

function filterDropdownList(input, listId) {
    const filter = input.value.toUpperCase();
    const list = document.getElementById(listId);
    
    list.classList.add('active');
    
    const items = list.getElementsByClassName('tri-state-label');
    for (let i = 0; i < items.length; i++) {
        const txtValue = items[i].textContent || items[i].innerText;
        // Remove the count number for search matching (e.g. "Algebra (5)" -> match "Algebra")
        // We assume the text content starts with the value. 
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
    const PRIORITY_CONFIG = { 
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
    
    // Remove 'search' from the context used to populate dropdowns.
    // This prevents the dropdowns from disappearing (becoming empty) 
    // when the user types a term that has 0 results in the current scope.
    delete contextFilters.search;

    const contextQuestions = window.storage.applyFilters(allQuestions, contextFilters);

    // Helper to generate HTML for a specific list
    const populateList = (containerId, fieldName, filterType, isArrayField = false) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 1. Calculate Counts First
        const counts = {};
        contextQuestions.forEach(q => {
            const val = q[fieldName];
            if (isArrayField && Array.isArray(val)) {
                val.forEach(v => {
                    if (v && v.trim() !== '') {
                        const key = v.trim();
                        counts[key] = (counts[key] || 0) + 1;
                    }
                });
            } else if (val) {
                const key = typeof val === 'string' ? val.trim() : val;
                if(key !== '') counts[key] = (counts[key] || 0) + 1;
            }
        });

        // 2. Check if Dropdown is Open (Visible)
        // If it is open, we do NOT want to re-sort (rebuild HTML), because it makes items jump.
        // We only want to update the visual state (checked/excluded) and the counts.
        const isVisible = container.classList.contains('active') || 
                          container.style.display === 'block' || 
                          container.style.display === 'grid' ||
                          (container.offsetParent !== null && container.closest('.active'));

        if (isVisible) {
            // SOFT UPDATE: Update existing DOM elements without reordering
            const existingItems = container.querySelectorAll('.tri-state-label');
            existingItems.forEach(el => {
                const itemValue = el.dataset.value;
                const count = counts[itemValue] || 0;
                const checkbox = el.querySelector('.tri-state-checkbox');
                
                // Update State Classes
                const currentState = window.triStateFilters[filterType] && window.triStateFilters[filterType][itemValue];
                
                el.classList.remove('checked', 'excluded');
                if (checkbox) checkbox.classList.remove('checked', 'excluded');

                if (currentState === 'checked') {
                    el.classList.add('checked');
                    if (checkbox) checkbox.classList.add('checked');
                } else if (currentState === 'excluded') {
                    el.classList.add('excluded');
                    if (checkbox) checkbox.classList.add('excluded');
                }

                // Update Count Text
                const countSpan = el.querySelector('small');
                if (countSpan) {
                    countSpan.textContent = `(${count})`;
                }
            });
            return; // EXIT HERE - Do not rebuild/sort
        }

        // ============================================================
        // FULL REBUILD (Only happens when dropdown is closed)
        // ============================================================

        // 3. Get Values (Only those that exist in context)
        let validValues;
        if (isArrayField) {
            const set = new Set();
            contextQuestions.forEach(q => {
                if (Array.isArray(q[fieldName])) {
                    q[fieldName].forEach(val => {
                        if (val && val.trim() !== '') set.add(val.trim());
                    });
                }
            });
            validValues = Array.from(set);
        } else {
            validValues = window.storage.getUniqueValues(contextQuestions, fieldName);
        }
        
        // 4. Apply Custom Sorting (Active items first)
        const priorities = PRIORITY_CONFIG[filterType] || [];
        
        validValues.sort((a, b) => {
            // Priority 1: Checked Items
            const isAChecked = window.triStateFilters[filterType] && window.triStateFilters[filterType][a] === 'checked';
            const isBChecked = window.triStateFilters[filterType] && window.triStateFilters[filterType][b] === 'checked';
            
            if (isAChecked && !isBChecked) return -1;
            if (!isAChecked && isBChecked) return 1;

            // Priority 2: Excluded Items
            const isAExcluded = window.triStateFilters[filterType] && window.triStateFilters[filterType][a] === 'excluded';
            const isBExcluded = window.triStateFilters[filterType] && window.triStateFilters[filterType][b] === 'excluded';
            
            if (isAExcluded && !isBExcluded) return -1;
            if (!isAExcluded && isBExcluded) return 1;

            // Priority 3: Config Priority (e.g. "No Graph")
            const indexA = priorities.indexOf(a);
            const indexB = priorities.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            // Priority 4: Alphabetical
            return a.localeCompare(b, 'zh-HK');
        });

        // 5. Clean up filters for non-existent values
        if (window.triStateFilters[filterType]) {
            Object.keys(window.triStateFilters[filterType]).forEach(val => {
                if (!validValues.includes(val)) {
                    delete window.triStateFilters[filterType][val];
                }
            });
        }

        const wrapper = container.closest('.input-dropdown-container') || container.closest('.dropdown-filter');

        if (validValues.length === 0) {
            if (wrapper) wrapper.style.display = 'none';
            return;
        } else {
            if (wrapper) wrapper.style.display = 'block'; 
        }

        let html = '';
        validValues.forEach(item => {
            const count = counts[item] || 0;
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

            // Added Count Badge Logic
            html += `
                <div class="${wrapperClass}" onclick="toggleTriState(this)" data-filter="${filterType}" data-value="${item}">
                    <div class="${checkboxClass}" data-filter="${filterType}" data-value="${item}">
                        <span>${item} <small style="opacity: 0.6; font-size: 0.85em; margin-left: 4px;">(${count})</small></span>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    };

    populateList('multiple-selection-options', 'multipleSelectionType', 'multipleSelection');
    populateList('graph-options', 'graphType', 'graph');
    populateList('table-options', 'tableType', 'table');
    populateList('calculation-options', 'calculationType', 'calculation');
    
    populateList('concepts-options', 'concepts', 'concepts', true);
    populateList('patterns-options', 'patterns', 'patterns', true);

    const aiContainer = document.getElementById('ai-options');
    if (aiContainer) {
        const hasAI = contextQuestions.some(q => q.AIExplanation && q.AIExplanation.trim() !== '');
        const wrapper = aiContainer.closest('.dropdown-filter') || aiContainer.parentElement;

        if (!hasAI) {
            if (wrapper) wrapper.style.display = 'none';
        } else {
            if (wrapper) wrapper.style.display = 'block'; 
            
            // Calculate AI Count
            const aiCount = contextQuestions.filter(q => q.AIExplanation && q.AIExplanation.trim() !== '').length;

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
                        <span>${item} <small style="opacity: 0.6; font-size: 0.85em; margin-left: 4px;">(${aiCount})</small></span>
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
            closeAllDropdowns();
            if(list) {
                list.classList.add('active');
                list.style.display = ''; 
            }
            const container = input.closest('.filter-input-wrapper');
            if (container) {
                const arrow = container.querySelector('.input-arrow');
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

// ============================================
// CLEAR & RESET FUNCTIONS
// ============================================

window.clearChapterFilter = function() {
    window.triStateFilters.chapter = {};
    const container = document.getElementById('chapter-options');
    if (container) {
        container.querySelectorAll('.tri-state-checkbox, .tri-state-label').forEach(el => {
            el.classList.remove('checked', 'excluded');
        });
    }
    filterQuestions();
};

function clearFilters() {
    document.getElementById('search').value = '';
    document.getElementById('year-filter').value = '';
    
    const pctSection = document.getElementById('percentage-options');
    if (pctSection) pctSection.style.display = 'none';

    const marksSection = document.getElementById('marks-options');
    if (marksSection) marksSection.style.display = 'none';

    const collapsibleTypes = ['curriculum', 'chapter', 'feature'];
    collapsibleTypes.forEach(type => {
        const section = document.getElementById(`${type}-options`);
        if (section) section.style.display = 'none';
    });

    closeAllDropdowns();

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

window.removeFilter = function(type, param1, param2) {
    if (type === 'search') {
        document.getElementById('search').value = '';
    } else if (type === 'year') {
        document.getElementById('year-filter').value = '';
    } else if (type === 'percentage') {
        clearPercentageFilter();
        return;
    } else if (type === 'marks') {
        clearMarksFilter();
        return;
    } else if (type === 'tag') {
        const category = param1;
        const value = param2;
        if (window.triStateFilters[category]) {
            delete window.triStateFilters[category][value];
        }
    }
    
    filterQuestions();
};

function updateSearchInfo() {
    const container = document.getElementById('active-filters-display');
    if (!container) return;

    let html = '';
    let hasFilters = false;

    const createBadge = (label, value, colorClass = 'blue', removeType, p1, p2) => {
        let removeArgs = `'${removeType}'`;
        if (p1) removeArgs += `, '${p1.replace(/'/g, "\\'")}'`; 
        if (p2) removeArgs += `, '${p2.replace(/'/g, "\\'")}'`;

        return `
        <span class="filter-badge ${colorClass}">
            <span class="remove-filter-btn" onclick="removeFilter(${removeArgs})" style="cursor: pointer; margin-right: 6px; font-weight: bold; opacity: 0.7; display: inline-block;">✕</span>
            ${label}: ${value}
        </span>`;
    };

    const searchText = document.getElementById('search').value.trim();
    const scopeSelect = document.getElementById('search-scope');
    const scopeText = scopeSelect && scopeSelect.options[scopeSelect.selectedIndex] 
        ? scopeSelect.options[scopeSelect.selectedIndex].text 
        : '全部';
    
    if (searchText) {
        html += createBadge(`搜尋 (${scopeText})`, searchText, 'blue', 'search');
        hasFilters = true;
    }

    const yearVal = document.getElementById('year-filter').value;
    if (yearVal) {
        html += createBadge('年份', yearVal, 'blue', 'year');
        hasFilters = true;
    }

    if (window.percentageFilter && window.percentageFilter.active) {
        html += createBadge('答對率', `${window.percentageFilter.min}% - ${window.percentageFilter.max}%`, 'green', 'percentage');
        hasFilters = true;
    }

    if (window.marksFilter && window.marksFilter.active) {
        html += createBadge('分數', `${window.marksFilter.min} - ${window.marksFilter.max}`, 'green', 'marks');
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
                html += createBadge(label, itemVal, 'blue', 'tag', catKey, itemVal);
                hasFilters = true;
            } else if (state === 'excluded') {
                html += createBadge(`排除 ${label}`, itemVal, 'red', 'tag', catKey, itemVal);
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

/**
 * Helper: Updates the visual state (checked/excluded) of static filters
 * that are NOT handled by updateDynamicDropdowns (e.g., Chapter, Curriculum).
 * This ensures that when a filter is removed via the badge, the dropdown UI updates.
 */
function updateStaticFilterVisuals() {
    const staticContainers = [
        'curriculum-options', 
        'chapter-options', 
        'feature-options', 
        'exam-options', 
        'qtype-options'
    ];

    staticContainers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Strategy: Find ALL elements that define a filter value.
        // This covers both cases: 
        // 1. <div class="tri-state-label" data-filter="..." ...>
        // 2. <div class="tri-state-checkbox" data-filter="..." ...>
        const filterElements = container.querySelectorAll('[data-filter][data-value]');
        
        filterElements.forEach(el => {
            const filterType = el.dataset.filter;
            const itemValue = el.dataset.value; 
            
            if (!filterType || !itemValue) return;

            // Determine the visual components to update
            // Case A: 'el' is the wrapper (.tri-state-label)
            // Case B: 'el' is the inner (.tri-state-checkbox)
            
            const label = el.closest('.tri-state-label');
            const checkbox = el.classList.contains('tri-state-checkbox') ? el : el.querySelector('.tri-state-checkbox');
            
            // Check state
            const currentState = window.triStateFilters[filterType] && window.triStateFilters[filterType][itemValue];
            
            // Update Label
            if (label) {
                label.classList.remove('checked', 'excluded');
                if (currentState === 'checked') label.classList.add('checked');
                if (currentState === 'excluded') label.classList.add('excluded');
            }

            // Update Checkbox
            if (checkbox) {
                checkbox.classList.remove('checked', 'excluded');
                if (currentState === 'checked') checkbox.classList.add('checked');
                if (currentState === 'excluded') checkbox.classList.add('excluded');
            }
        });
    });
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
    
    // Update dynamic lists (concepts, etc.)
    await updateDynamicDropdowns();
    
    // Update static lists (chapters, etc.)
    updateStaticFilterVisuals();
    
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
}