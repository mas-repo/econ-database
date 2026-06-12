// Dependencies: globals.js, render.js, storage-core.js, storage-filters.js, constants.js

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
        feature: { 'Out syl': 'excluded' }, 
        exam: {}, 
        qtype: {},
        section: {},
        year: {},
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
const ARROW_MAP = {
    // Custom Grid Filters
    'curriculum-options': 'curriculum-arrow',
    'feature-options': 'feature-arrow',
    'chapter-options': 'chapter-arrow',
    'year-options': 'year-arrow',
    
    // Standard Filters
    'exam-options': 'exam-arrow',
    'qtype-options': 'qtype-arrow',
    'section-options': 'section-arrow',

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
 * Helper: Closes ALL dropdowns and resets all arrow icons.
 */
function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-content').forEach(d => {
        d.classList.remove('active');
    });
    
    document.querySelectorAll('.input-dropdown-list').forEach(d => {
        d.classList.remove('active');
    });

    ['curriculum', 'chapter', 'feature', 'year'].forEach(type => {
        const section = document.getElementById(`${type}-options`);
        if (section) section.style.display = 'none';
    });

    Object.values(ARROW_MAP).forEach(arrowId => {
        const arrow = document.getElementById(arrowId);
        if (arrow) arrow.textContent = '▶';
    });

    document.querySelectorAll('.dropdown-btn .arrow, .filter-input-wrapper .input-arrow').forEach(arrow => {
        if (arrow.textContent === '▼') arrow.textContent = '▶';
    });
}

/**
 * Helper: Applies tooltips to Chapter options based on constants.js.
 * Also enforces the "Colleagues" rule: that group must not see chapter names,
 * so the full-name spans are hidden via the 'hide-chapter-names' class.
 */
function applyChapterTooltips() {
    const container = document.getElementById('chapter-options');
    if (!container) return;

    // Colleagues: hide names and tooltips entirely
    if (window.authManager && window.authManager.userGroup === 'Colleagues') {
        container.classList.add('hide-chapter-names');
        container.querySelectorAll('[data-value]').forEach(item => item.removeAttribute('title'));
        return;
    }
    container.classList.remove('hide-chapter-names');

    if (typeof CHAPTER_DESCRIPTIONS === 'undefined') return;

    const items = container.querySelectorAll('[data-value]');
    items.forEach(item => {
        const rawVal = item.getAttribute('data-value');
        if (!rawVal) return;

        const paddedVal = rawVal.toString().padStart(2, '0');
        const description = CHAPTER_DESCRIPTIONS[paddedVal];
        if (description) {
            item.setAttribute('title', `${paddedVal}: ${description}`);
        }
    });
}

/**
 * Master Toggle Function
 */
function toggleDropdown(dropdownId) {
    const target = document.getElementById(dropdownId);
    if (!target) return;

    const isStandardActive = target.classList.contains('active');
    const isGridActive = target.style.display === 'grid' || target.style.display === 'block';
    
    const isActuallyVisible = isGridActive || (isStandardActive && target.style.display !== 'none');
    const wasOpen = isActuallyVisible;

    closeAllDropdowns();

    if (!wasOpen) {
        const gridFilters = ['curriculum-options', 'feature-options', 'chapter-options', 'year-options'];

        if (gridFilters.includes(dropdownId)) {
            target.style.display = 'grid';
            
            if (dropdownId === 'chapter-options') {
                applyChapterTooltips();
            }
        } else {
            target.style.display = ''; 
            target.classList.add('active');
        }

        // === ARROW LOGIC ===
        let arrowUpdated = false;
        const arrowId = ARROW_MAP[dropdownId];
        if (arrowId) {
            const arrow = document.getElementById(arrowId);
            if (arrow) {
                arrow.textContent = '▼';
                arrowUpdated = true;
            }
        }

        if (!arrowUpdated) {
            const container = target.closest('.dropdown-filter') || target.closest('.input-dropdown-container');
            if (container) {
                const btn = container.querySelector('.dropdown-btn') || container.querySelector('.filter-input-wrapper');
                if (btn) {
                    const arrow = btn.querySelector('.arrow') || btn.querySelector('.input-arrow');
                    if (arrow) {
                        arrow.textContent = '▼';
                    }
                }
            }
        }
    }

    updateDynamicDropdowns();
}

document.addEventListener('click', function(event) {
    const isFilterClick = event.target.closest('.dropdown-filter') || 
                          event.target.closest('.dropdown-section') || 
                          event.target.closest('.advanced-header') ||
                          event.target.closest('.input-dropdown-container');

    if (!isFilterClick) {
        closeAllDropdowns();
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
    if (!window.triStateFilters[category]) {
        window.triStateFilters[category] = {};
    }

    const currentState = window.triStateFilters[category][value];

    if (currentState === 'checked') {
        delete window.triStateFilters[category][value];
    } else {
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
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            items[i].style.display = "";
        } else {
            items[i].style.display = "none";
        }
    }
}

function updateFilterIndicators() {
    const triStateTypes = [
        'exam', 'qtype', 'curriculum', 'chapter', 'feature', 'year', 'section',
        'multipleSelection', 'graph', 'table', 'calculation',
        'concepts', 'patterns', 'ai'
    ];
    
    triStateTypes.forEach(type => {
            const indicator = document.getElementById(`indicator-${type}`);
            if (!indicator) return;

            let hasActiveFilters = false;
            if (window.triStateFilters[type]) {
                const activeKeys = Object.keys(window.triStateFilters[type]).filter(key => {
                    if (type === 'feature' && key === 'Out syl' && window.triStateFilters[type][key] === 'excluded') {
                        return false;
                    }
                    return true;
                });
                hasActiveFilters = activeKeys.length > 0;
            }
            
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

    const aiBtn = document.getElementById('ai-filter-btn');
    if (aiBtn) {
        const hasAiFilter = window.triStateFilters.ai && Object.keys(window.triStateFilters.ai).length > 0;
        if (hasAiFilter) {
            aiBtn.style.borderColor = 'var(--secondary-color)';
            aiBtn.style.color = 'var(--secondary-color)';
            const childIndicator = aiBtn.querySelector('.filter-indicator');
            if (childIndicator) childIndicator.classList.add('visible');
        } else {
            aiBtn.style.borderColor = '';
            aiBtn.style.color = '';
            const childIndicator = aiBtn.querySelector('.filter-indicator');
            if (childIndicator) childIndicator.classList.remove('visible');
        }
    }

    const pctIndicator = document.getElementById('indicator-percentage');
    if (pctIndicator) {
        if (window.percentageFilter && window.percentageFilter.active) {
            pctIndicator.classList.add('visible');
        } else {
            pctIndicator.classList.remove('visible');
        }
    }

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
        delete contextFilters.triState.year; // Allow seeing other years
    }
    
    // Remove 'search' from the context used to populate dropdowns.
    delete contextFilters.search;

    const contextQuestions = window.storage.applyFilters(allQuestions, contextFilters);

    // --- Populate Year Filter Dynamically (Grouped by Decade) ---
    const populateYearGrid = () => {
        const container = document.getElementById('year-options');
        if (!container) return;

        // 1. Calculate Counts
        const counts = {};
        contextQuestions.forEach(q => {
            if (q.year) {
                const y = String(q.year).trim();
                counts[y] = (counts[y] || 0) + 1;
            }
        });

        // 2. Soft Update if the dropdown is currently open
        const isVisible = container.style.display === 'grid' || container.style.display === 'block';

        if (isVisible) {
            const existingItems = container.querySelectorAll('.tri-state-checkbox');
            existingItems.forEach(el => {
                const itemValue = el.dataset.value;
                const currentState = window.triStateFilters.year && window.triStateFilters.year[itemValue];
                
                el.classList.remove('checked', 'excluded');

                if (currentState === 'checked') {
                    el.classList.add('checked');
                } else if (currentState === 'excluded') {
                    el.classList.add('excluded');
                }
            });
            return;
        }

        // 3. Full Rebuild
        let validYears = window.storage.getUniqueValues(contextQuestions, 'year').map(String);

        // BUGFIX-CONSISTENCY: always keep currently-selected years visible,
        // even if the current context contains no matching questions.
        Object.keys(window.triStateFilters.year || {}).forEach(y => {
            if (!validYears.includes(y)) validYears.push(y);
        });

        // 4. Group years by decade; "PP", "SP" and other non-numeric values go to a special group
        const decadeGroups = {};   // e.g. { 2020: ['2026','2025',...], 1990: [...] }
        const specialYears = [];

        validYears.forEach(y => {
            const num = parseInt(y, 10);
            if (!isNaN(num) && /^\d{4}$/.test(String(y).trim())) {
                const decade = Math.floor(num / 10) * 10;
                if (!decadeGroups[decade]) decadeGroups[decade] = [];
                decadeGroups[decade].push(y);
            } else {
                specialYears.push(y);
            }
        });

        const decadeKeys = Object.keys(decadeGroups).map(Number).sort((a, b) => b - a); // newest decade first
        specialYears.sort((a, b) => String(b).localeCompare(String(a)));

        // Helper to render a single year button
        const yearButton = (year) => {
            const currentState = window.triStateFilters.year && window.triStateFilters.year[year];
            let itemClass = 'tri-state-checkbox';
            if (currentState === 'checked') itemClass += ' checked';
            else if (currentState === 'excluded') itemClass += ' excluded';

            const count = counts[year] || 0;
            return `
                <div class="${itemClass}" 
                     data-filter="year" 
                     data-value="${year}" 
                     onclick="toggleTriState(this)"
                     title="${year}（${count} 題）">
                    ${year}
                </div>`;
        };

        // 5. Build HTML: global header + decade groups + special group
        let html = `
            <div class="year-global-header">
                <button onclick="selectAllYears()" class="clear-btn" style="color: var(--secondary-color); font-weight: bold;">全選</button>
                <button onclick="clearYearFilter()" class="clear-btn">🗑️ 清除</button>
            </div>
        `;

        decadeKeys.forEach(decade => {
            const years = decadeGroups[decade].sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
            html += `
                <div class="year-group">
                    <div class="year-group-header">
                        <span class="year-group-title">${decade}s</span>
                        <button class="clear-btn year-decade-btn" onclick="toggleYearDecade('${decade}')">全選 / 取消</button>
                    </div>
                    <div class="year-group-grid">
                        ${years.map(yearButton).join('')}
                    </div>
                </div>`;
        });

        if (specialYears.length > 0) {
            html += `
                <div class="year-group">
                    <div class="year-group-header">
                        <span class="year-group-title">其他 (PP / SP)</span>
                    </div>
                    <div class="year-group-grid">
                        ${specialYears.map(yearButton).join('')}
                    </div>
                </div>`;
        }

        container.innerHTML = html;
    };
    populateYearGrid();
    // ---------------------------------------------

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

                const countSpan = el.querySelector('small');
                if (countSpan) {
                    countSpan.textContent = `(${count})`;
                }
            });
            return; 
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
        
        // ============================================================
        // 4. BUGFIX: Clean up filters ONLY against the FULL dataset.
        //
        // Previously this cleanup used `validValues` (derived from
        // contextQuestions, which still includes the exam / qtype /
        // section filters). Selecting one of those filters could
        // therefore silently DELETE the user's active concepts /
        // graph / table / etc. selections whenever the selected value
        // didn't appear in the narrowed context. Patterns appeared
        // immune only because `patterns` is removed from the context.
        //
        // Now we only delete a selection if the value genuinely no
        // longer exists anywhere in the database (e.g. after a re-sync).
        // ============================================================
        const allValuesSet = new Set();
        if (isArrayField) {
            allQuestions.forEach(q => {
                if (Array.isArray(q[fieldName])) {
                    q[fieldName].forEach(v => {
                        if (v && typeof v === 'string' && v.trim() !== '') allValuesSet.add(v.trim());
                    });
                }
            });
        } else {
            window.storage.getUniqueValues(allQuestions, fieldName).forEach(v => allValuesSet.add(v));
        }

        if (window.triStateFilters[filterType]) {
            Object.keys(window.triStateFilters[filterType]).forEach(val => {
                if (!allValuesSet.has(val)) {
                    delete window.triStateFilters[filterType][val];
                }
            });
        }

        // BUGFIX (part 2): Always render active selections, even when the
        // current context has 0 matches — they appear with a "(0)" count
        // instead of vanishing (and taking the filter state with them).
        Object.keys(window.triStateFilters[filterType] || {}).forEach(val => {
            if (!validValues.includes(val)) {
                validValues.push(val);
            }
        });

        // 5. Apply Custom Sorting (Active items first)
        const priorities = PRIORITY_CONFIG[filterType] || [];
        
        validValues.sort((a, b) => {
            const isAChecked = window.triStateFilters[filterType] && window.triStateFilters[filterType][a] === 'checked';
            const isBChecked = window.triStateFilters[filterType] && window.triStateFilters[filterType][b] === 'checked';
            
            if (isAChecked && !isBChecked) return -1;
            if (!isAChecked && isBChecked) return 1;

            const isAExcluded = window.triStateFilters[filterType] && window.triStateFilters[filterType][a] === 'excluded';
            const isBExcluded = window.triStateFilters[filterType] && window.triStateFilters[filterType][b] === 'excluded';
            
            if (isAExcluded && !isBExcluded) return -1;
            if (!isAExcluded && isBExcluded) return 1;

            const indexA = priorities.indexOf(a);
            const indexB = priorities.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;

            return a.localeCompare(b, 'zh-HK');
        });

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
    applyChapterTooltips();
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

    const hasAnswer = available.size === 0 || 
                      available.has('answerChi') || 
                      available.has('answerEng');                      

    const hasReports = available.size === 0 || 
                      available.has('markersReportChi') || 
                      available.has('markersReportEng'); 

    if (hasContent) {
        html += `<option value="content">題目內容</option>`;
    }
    if (hasAnswer) {
        html += `<option value="answer">答案</option>`;
    }
    if (hasReports) {
        html += `<option value="markersReport">評卷報告</option>`;
    }

    const fieldMapping = {
        'concepts': '相關概念',
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

window.clearYearFilter = function() {
    window.triStateFilters.year = {};
    const container = document.getElementById('year-options');
    if (container) {
        container.querySelectorAll('.tri-state-checkbox').forEach(el => {
            el.classList.remove('checked', 'excluded');
        });
    }
    filterQuestions();
};

// Select All Years
window.selectAllYears = function() {
    const container = document.getElementById('year-options');
    if (!container) return;
    
    const items = container.querySelectorAll('[data-value]');
    items.forEach(el => {
        const val = el.getAttribute('data-value');
        if (val) {
            window.triStateFilters.year[val] = 'checked';
            el.classList.add('checked');
            el.classList.remove('excluded');
        }
    });
    
    filterQuestions();
};

// NEW: Toggle all years within a decade (e.g. toggleYearDecade('1990'))
// If every year in that decade is already checked → unselect them all.
// Otherwise → check them all.
window.toggleYearDecade = function(decade) {
    const container = document.getElementById('year-options');
    if (!container) return;

    const decadeNum = parseInt(decade, 10);
    if (isNaN(decadeNum)) return;

    const items = Array.from(container.querySelectorAll('.tri-state-checkbox[data-value]')).filter(el => {
        const num = parseInt(el.dataset.value, 10);
        return !isNaN(num) && Math.floor(num / 10) * 10 === decadeNum;
    });

    if (items.length === 0) return;

    if (!window.triStateFilters.year) window.triStateFilters.year = {};

    const allChecked = items.every(el => window.triStateFilters.year[el.dataset.value] === 'checked');

    items.forEach(el => {
        const val = el.dataset.value;
        el.classList.remove('checked', 'excluded');
        if (allChecked) {
            delete window.triStateFilters.year[val];
        } else {
            window.triStateFilters.year[val] = 'checked';
            el.classList.add('checked');
        }
    });

    filterQuestions();
};

window.clearChapterFilter = function() {
    window.triStateFilters.chapter = {};
    const container = document.getElementById('chapter-options');
    if (container) {
        container.querySelectorAll('.tri-state-checkbox, .tri-state-label').forEach(el => {
            el.classList.remove('checked', 'excluded');
        });
    }
    
    const toggle = document.getElementById('chapter-logic-toggle');
    if (toggle) {
        toggle.checked = false;
        window.filterLogic.chapter = 'OR';
    }
    filterQuestions();
};

function clearFilters() {
    document.getElementById('search').value = '';
    
    const pctSection = document.getElementById('percentage-options');
    if (pctSection) pctSection.style.display = 'none';

    const marksSection = document.getElementById('marks-options');
    if (marksSection) marksSection.style.display = 'none';

    const collapsibleTypes = ['curriculum', 'chapter', 'feature', 'year'];
    collapsibleTypes.forEach(type => {
        const section = document.getElementById(`${type}-options`);
        if (section) section.style.display = 'none';
    });

    closeAllDropdowns();

    const scopeSelect = document.getElementById('search-scope');
    if (scopeSelect) scopeSelect.value = 'all';
    window.searchScope = 'all';

    // === Reset tri-state visual classes with Out syl exception ===
    document.querySelectorAll('.tri-state-checkbox').forEach(el => {
        if (el.dataset.value === 'Out syl') {
            el.classList.remove('checked');
            el.classList.add('excluded');
            const label = el.closest('.tri-state-label');
            if(label) {
                label.classList.remove('checked');
                label.classList.add('excluded');
            }
        } else {
            el.classList.remove('checked', 'excluded');
            const label = el.closest('.tri-state-label');
            if(label) label.classList.remove('checked', 'excluded');
        }
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
        feature: { 'Out syl': 'excluded' },  
        exam: {}, 
        qtype: {},
        section: {},
        year: {},
        concepts: {},
        patterns: {},
        ai: {},
        multipleSelection: {},
        graph: {},
        table: {},
        calculation: {}
    };

    // === RESET LOGIC TOGGLES ===
    const currToggle = document.getElementById('curriculum-logic-toggle');
    if (currToggle) {
        currToggle.checked = false; 
        if (window.filterLogic) window.filterLogic.curriculum = 'OR';
    }

    const chapToggle = document.getElementById('chapter-logic-toggle');
    if (chapToggle) {
        chapToggle.checked = false; 
        if (window.filterLogic) window.filterLogic.chapter = 'OR';
    }

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
        if (param1) {
            if (window.triStateFilters.year) {
                delete window.triStateFilters.year[param1];
            }
        } else {
            window.triStateFilters.year = {};
        }
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
        'section': 'Section',
        'year': '年份',
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
                
                if (catKey === 'feature' && itemVal === 'Out syl' && state === 'excluded') {
                    return;
                }

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
 * Helper: Updates the visual state (checked/excluded) of static filters.
 */
function updateStaticFilterVisuals() {
    const filterElements = document.querySelectorAll('[data-filter][data-value]');
    
    filterElements.forEach(el => {
        const filterType = el.dataset.filter;
        const itemValue = el.dataset.value; 
        
        if (!filterType || !itemValue) return;

        const label = el.closest('.tri-state-label');
        const checkbox = el.classList.contains('tri-state-checkbox') ? el : el.querySelector('.tri-state-checkbox');
        
        const currentState = window.triStateFilters[filterType] && window.triStateFilters[filterType][itemValue];
        
        if (label) {
            label.classList.remove('checked', 'excluded');
            if (currentState === 'checked') label.classList.add('checked');
            if (currentState === 'excluded') label.classList.add('excluded');
        }

        if (checkbox) {
            checkbox.classList.remove('checked', 'excluded');
            if (currentState === 'checked') checkbox.classList.add('checked');
            if (currentState === 'excluded') checkbox.classList.add('excluded');
        }
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
    
    await updateDynamicDropdowns();
    
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

function toggleChapterLogic(checkbox) {
    window.filterLogic.chapter = checkbox.checked ? 'AND' : 'OR';
    filterQuestions();
}

function toggleCurriculumLogic(checkbox) {
    window.filterLogic.curriculum = checkbox.checked ? 'AND' : 'OR';
    filterQuestions();
}

window.clearCurriculumFilter = function() {
    window.triStateFilters.curriculum = {};
    const container = document.getElementById('curriculum-options');
    if (container) {
        container.querySelectorAll('.tri-state-checkbox, .tri-state-label').forEach(el => {
            el.classList.remove('checked', 'excluded');
        });
        const toggle = document.getElementById('curriculum-logic-toggle');
        if (toggle) {
            toggle.checked = false;
            window.filterLogic.curriculum = 'OR';
        }
    }
    filterQuestions();
};

window.filterByExactMarks = function(marks) {
    const minSlider = document.getElementById('min-marks');
    const maxSlider = document.getElementById('max-marks');
    
    const isAlreadyFiltered = window.marksFilter && 
                              window.marksFilter.active && 
                              window.marksFilter.min == marks && 
                              window.marksFilter.max == marks;

    if (isAlreadyFiltered) {
        if (typeof clearMarksFilter === 'function') {
            clearMarksFilter();
        } else {
            if (minSlider) minSlider.value = minSlider.min;
            if (maxSlider) maxSlider.value = maxSlider.max;
            updateMarksRange();
        }
    } else {
        if (minSlider && maxSlider) {
            minSlider.value = marks;
            maxSlider.value = marks;
            
            updateMarksRange();
            
            const marksDropdown = document.getElementById('marks-options');
            if (marksDropdown && !marksDropdown.classList.contains('active')) {
                toggleDropdown('marks-options');
            }
        } else {
            window.marksFilter = { min: marks, max: marks, active: true };
            filterQuestions();
        }
    }
};