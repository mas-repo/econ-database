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
        multipleSelection: {},
        graph: {},
        table: {},
        calculation: {}
    };
}

// ============================================
// DROPDOWN & UI FUNCTIONS
// ============================================

function toggleDropdown(dropdownId) {
    // 1. Check if this is actually a Collapsible Section (Curriculum, Feature, Chapter)
    // These sections use style.display logic instead of class toggling.
    const collapsibleMap = {
        'curriculum-options': 'curriculum-arrow',
        'feature-options': 'feature-arrow',
        'chapter-options': 'chapter-arrow'
    };

    if (collapsibleMap[dropdownId]) {
        toggleCollapsibleSection(dropdownId, collapsibleMap[dropdownId]);
        return;
    }

    // 2. Standard Dropdown Logic (for Exam, QType, etc.)
    const dropdown = document.getElementById(dropdownId);
    const allDropdowns = document.querySelectorAll('.dropdown-content');
    
    // Close other standard dropdowns
    allDropdowns.forEach(d => {
        if (d.id !== dropdownId && !d.classList.contains('input-dropdown-list')) {
            d.classList.remove('active');
        }
    });
    
    // Force close ALL collapsible sections when opening a standard dropdown
    // (This replaces the hardcoded chapter-options check in the previous version)
    const collapsibleTypes = ['curriculum', 'chapter', 'feature'];
    collapsibleTypes.forEach(type => {
        const section = document.getElementById(`${type}-options`);
        const arrow = document.getElementById(`${type}-arrow`);
        const arrowInner = document.getElementById(`${type}-arrow-inner`); // Handle inner arrow if exists
        
        if (section && section.style.display !== 'none') {
            section.style.display = 'none';
            if (arrow) arrow.textContent = '▶';
            if (arrowInner) arrowInner.textContent = '▶';
        }
    });
    
    // Toggle the requested standard dropdown
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

function toggleCollapsibleSection(sectionId, arrowId) {
    const section = document.getElementById(sectionId);
    const arrow = document.getElementById(arrowId);
    
    if (!section) return;
    
    // If opening a collapsible section, close all standard dropdowns first
    if (section.style.display === 'none' || !section.style.display) {
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

document.addEventListener('click', function(event) {
    // Check if click is outside filter areas
    if (!event.target.closest('.dropdown-filter') && !event.target.closest('.dropdown-section') && !event.target.closest('.advanced-header')) {
        
        // 1. Close standard dropdowns (remove .active class)
        document.querySelectorAll('.dropdown-content:not(.input-dropdown-list):not(.static-position)').forEach(d => {
            d.classList.remove('active');
        });
        
        // 2. Force close collapsible sections (Curriculum, Chapter, Feature)
        // These use style.display, so we must manually set them to none
        const collapsibleTypes = ['curriculum', 'chapter', 'feature'];
        collapsibleTypes.forEach(type => {
            const section = document.getElementById(`${type}-options`);
            const arrow = document.getElementById(`${type}-arrow`);
            
            // If section exists and is currently visible (not none), hide it
            if (section && section.style.display && section.style.display !== 'none') {
                section.style.display = 'none';
                if (arrow) arrow.textContent = '▶';
            }
        });
    }

    if (!event.target.closest('.input-dropdown-container')) {
        document.querySelectorAll('.input-dropdown-list').forEach(d => {
            d.classList.remove('active');
        });
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
    // 1. Handle Tri-State Filters (Dropdowns)
    const triStateTypes = [
        'exam', 
        'qtype', 
        'curriculum', 
        'chapter', 
        'feature',
        'multipleSelection', 
        'graph', 
        'table', 
        'calculation'
    ];
    
    triStateTypes.forEach(type => {
        const indicator = document.getElementById(`indicator-${type}`);
        if (!indicator) return;

        const hasActiveFilters = window.triStateFilters[type] && 
                                 Object.keys(window.triStateFilters[type]).length > 0;
        
        // Toggle the visual dot
        if (hasActiveFilters) {
            indicator.classList.add('visible');
        } else {
            indicator.classList.remove('visible');
        }

        // Also handle the border color for input fields (for dynamic filters)
        const input = document.querySelector(`input[data-filter-type="${type}"]`);
        if (input) {
            input.style.borderColor = hasActiveFilters ? 'var(--secondary-color)' : '';
        }
    });

    // 2. Handle Year Filter
    const yearIndicator = document.getElementById('indicator-year');
    if (yearIndicator) {
        const yearValue = document.getElementById('year-filter').value;
        if (yearValue && yearValue !== '') {
            yearIndicator.classList.add('visible');
        } else {
            yearIndicator.classList.remove('visible');
        }
    }

    // 3. Handle Percentage Filter
    const pctIndicator = document.getElementById('indicator-percentage');
    if (pctIndicator) {
        if (window.percentageFilter && window.percentageFilter.active) {
            pctIndicator.classList.add('visible');
        } else {
            pctIndicator.classList.remove('visible');
        }
    }

    // 4. Handle Marks Filter
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

// Helper to gather all current filters into one object
function gatherFilterState() {
    return {
        search: document.getElementById('search').value,
        searchScope: window.searchScope || 'all',
        year: document.getElementById('year-filter').value,
        percentageFilter: window.percentageFilter,
        marksFilter: window.marksFilter,
        triState: window.triStateFilters // This includes Chapter, Curriculum, etc.
    };
}

// Fetches data, applies "Context Filters" (everything EXCEPT the 4 dynamic ones),
// and repopulates the dropdown options.
async function updateDynamicDropdowns() {
    if (!window.storage) return; // Guard clause if storage isn't ready

    const allQuestions = await window.storage.getQuestions();
    const currentFilters = gatherFilterState();

    // Create a "Context Filter" object.
    // We want to filter the available options based on Chapter, Year, etc.
    // BUT we must NOT filter by Graph/Table/Calc/Multi when populating their own lists,
    // otherwise selecting "Table A" would hide "Table B".
    // We use a "Common Context" approach: Filter by everything EXCEPT these 4 fields.
    const contextFilters = JSON.parse(JSON.stringify(currentFilters)); // Deep copy
    
    if (contextFilters.triState) {
        delete contextFilters.triState.multipleSelection;
        delete contextFilters.triState.graph;
        delete contextFilters.triState.table;
        delete contextFilters.triState.calculation;
    }

    // Get the subset of questions that match the context
    // Using window.storage.applyFilters directly
    const contextQuestions = window.storage.applyFilters(allQuestions, contextFilters);

    // Helper to generate HTML for a specific list
    const populateList = (containerId, fieldName, filterType) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Get valid values from the CONTEXT (narrowed down by Chapter/Year)
        // Using window.storage.getUniqueValues directly
        const validValues = window.storage.getUniqueValues(contextQuestions, fieldName);
        
        // Check existing selections. If a selected item is no longer in validValues, remove it.
        if (window.triStateFilters[filterType]) {
            Object.keys(window.triStateFilters[filterType]).forEach(val => {
                if (!validValues.includes(val)) {
                    delete window.triStateFilters[filterType][val];
                }
            });
        }

        if (validValues.length === 0) {
            container.innerHTML = '<div style="padding:10px; color:#999; font-size:12px; text-align:center;">無選項</div>';
            return;
        }

        let html = '';
        validValues.forEach(item => {
            // Check if this item is currently selected in the global state
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

    // Update the 4 specific dropdowns
    populateList('multiple-selection-options', 'multipleSelectionType', 'multipleSelection');
    populateList('graph-options', 'graphType', 'graph');
    populateList('table-options', 'tableType', 'table');
    populateList('calculation-options', 'calculationType', 'calculation');
    
    // Update indicators in case some filters were removed
    updateFilterIndicators();
}

// Initial setup function (called on page load)
async function populateDynamicFilters() {
    // Initial population (Context is "All")
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
            document.querySelectorAll('.input-dropdown-list').forEach(el => el.classList.remove('active'));
            if(list) list.classList.add('active');
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
        'patternTags': '題型標籤' 
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
    
    // Explicitly collapse these sections instead of toggling them
    const pctSection = document.getElementById('percentage-options');
    const pctArrow = document.getElementById('percentage-arrow');
    if (pctSection) pctSection.style.display = 'none';
    if (pctArrow) pctArrow.textContent = '▶';

    const marksSection = document.getElementById('marks-options');
    const marksArrow = document.getElementById('marks-arrow');
    if (marksSection) marksSection.style.display = 'none';
    if (marksArrow) marksArrow.textContent = '▶';

    // Explicitly collapse curriculum, chapter, and feature sections
    const collapsibleTypes = ['curriculum', 'chapter', 'feature'];
    collapsibleTypes.forEach(type => {
        const section = document.getElementById(`${type}-options`);
        const arrow = document.getElementById(`${type}-arrow`);
        if (section) section.style.display = 'none';
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

    window.triStateFilters = { 
        curriculum: {}, 
        chapter: {}, 
        feature: {}, 
        exam: {}, 
        qtype: {},
        concepts: {},
        patterns: {},
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
    
    // Reset dynamic dropdowns to show full list again
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
        'calculation': '計算'
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
        container.style.display = 'flex'; // Changed from block to flex to match CSS
    } else {
        container.innerHTML = '';
        container.style.display = 'none';
    }
}

// Main entry point to trigger a re-render based on filters
async function filterQuestions() {
    if (window.paginationState && window.paginationState.questions) {
        window.paginationState.questions.page = 1;
    }
    
    const scopeSelect = document.getElementById('search-scope');
    if (scopeSelect) {
        window.searchScope = scopeSelect.value;
    }

    // Update indicators immediately when any filter action is triggered
    updateFilterIndicators();

    // Update the dynamic dropdown options based on the new filter context
    // This ensures that if Chapter 3 is selected, only Tables from Chapter 3 are shown
    await updateDynamicDropdowns();

    updateSearchInfo();
    if (typeof renderQuestions === 'function') await renderQuestions();
}

// ============================================
// RANGE FILTER FUNCTIONS (Percentage & Marks)
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