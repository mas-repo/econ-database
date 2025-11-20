// Dependencies: globals.js (window.triStateFilters, window.paginationState, window.percentageFilter, window.marksFilter), render.js (renderQuestions)

// Dropdown toggle
// Dependencies: None
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    
    // Get all dropdown content elements
    const allDropdowns = document.querySelectorAll('.dropdown-content');
    
    // Also specifically target chapter-options if it exists
    const chapterOptions = document.getElementById('chapter-options');
    
    // Close all other dropdowns
    allDropdowns.forEach(d => {
        if (d.id !== dropdownId) {
            d.classList.remove('active');
        }
    });
    
    // Close chapter options if it's not the one being toggled
    if (chapterOptions && dropdownId !== 'chapter-options') {
        chapterOptions.style.display = 'none';
        const chapterArrow = document.getElementById('chapter-arrow');
        if (chapterArrow) {
            chapterArrow.textContent = '▶';
        }
    }
    
    // Toggle current dropdown
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// Toggle collapsible sections (for Chapters, etc.)
function toggleCollapsibleSection(sectionId, arrowId) {
    const section = document.getElementById(sectionId);
    const arrow = document.getElementById(arrowId);
    
    if (!section) return;
    
    // Close other dropdown filters when opening chapters
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
// Dependencies: None
document.addEventListener('click', function(event) {
    if (!event.target.closest('.dropdown-filter')) {
        document.querySelectorAll('.dropdown-content').forEach(d => {
            d.classList.remove('active');
        });
        
        // Also close chapter options
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
// Dependencies: globals.js (window.triStateFilters), render.js (filterQuestions)
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

// Dependencies: globals.js (window.triStateFilters, window.paginationState, window.percentageFilter, window.marksFilter), render.js (renderQuestions)
function clearFilters() {
    document.getElementById('search').value = '';
    document.getElementById('year-filter').value = '';
    
    // Reset tri-state filters
    document.querySelectorAll('.tri-state-checkbox').forEach(el => {
        el.classList.remove('checked', 'excluded');
    });
    window.triStateFilters = { curriculum: {}, chapter: {}, feature: {}, exam: {}, qtype: {} };

    // Reset percentage filter
    clearPercentageFilter();    

    // Reset marks filter
    clearMarksFilter();

    window.paginationState.questions.page = 1;
    renderQuestions();
}

// Dependencies: globals.js (window.paginationState), render.js (renderQuestions)
async function filterQuestions() {
    window.paginationState.questions.page = 1;
    await renderQuestions();
}

// ============================================
// PERCENTAGE FILTER
// ============================================

// Percentage filter state
window.percentageFilter = {
    min: 0,
    max: 100,
    active: false
};

// Dependencies: globals.js (window.percentageFilter)
function updatePercentageRange() {
    const minSlider = document.getElementById('min-percentage');
    const maxSlider = document.getElementById('max-percentage');
    const minDisplay = document.getElementById('min-percentage-display');
    const maxDisplay = document.getElementById('max-percentage-display');
    const rangeFill = document.getElementById('percentage-range-fill');
    
    if (!minSlider || !maxSlider || !minDisplay || !maxDisplay || !rangeFill) {
        console.warn('⚠️ Percentage filter elements not found');
        return;
    }
    
    let minVal = parseInt(minSlider.value);
    let maxVal = parseInt(maxSlider.value);
    
    // Ensure min doesn't exceed max
    if (minVal > maxVal) {
        minVal = maxVal;
        minSlider.value = minVal;
    }
    
    // Update displays
    minDisplay.textContent = minVal;
    maxDisplay.textContent = maxVal;
    
    // Update the filled range visualization
    const percentMin = (minVal / 100) * 100;
    const percentMax = (maxVal / 100) * 100;
    
    rangeFill.style.left = percentMin + '%';
    rangeFill.style.width = (percentMax - percentMin) + '%';
    
    // Update filter state
    window.percentageFilter.min = minVal;
    window.percentageFilter.max = maxVal;
    
    // Auto-apply filter on change
    applyPercentageFilter();
}

// Dependencies: globals.js (window.percentageFilter), render.js (filterQuestions)
function applyPercentageFilter() {
    const minVal = parseInt(document.getElementById('min-percentage').value);
    const maxVal = parseInt(document.getElementById('max-percentage').value);
    
    // Only activate filter if range is not 0-100 (i.e., user has changed it)
    window.percentageFilter = {
        min: minVal,
        max: maxVal,
        active: (minVal > 0 || maxVal < 100)
    };
    
    // Trigger filter update
    filterQuestions();
}

// Dependencies: globals.js (window.percentageFilter), render.js (filterQuestions)
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
    
    // Trigger filter update
    filterQuestions();
}

// ============================================
// MARKS FILTER
// ============================================

// Marks filter state
window.marksFilter = {
    min: 0,
    max: 16,
    active: false
};

// Dependencies: globals.js (window.marksFilter)
function updateMarksRange() {
    const minSlider = document.getElementById('min-marks');
    const maxSlider = document.getElementById('max-marks');
    const minDisplay = document.getElementById('min-marks-display');
    const maxDisplay = document.getElementById('max-marks-display');
    const rangeFill = document.getElementById('marks-range-fill');
    
    if (!minSlider || !maxSlider || !minDisplay || !maxDisplay || !rangeFill) {
        console.warn('⚠️ Marks filter elements not found');
        return;
    }
    
    let minVal = parseFloat(minSlider.value);
    let maxVal = parseFloat(maxSlider.value);
    
    // Ensure min doesn't exceed max
    if (minVal > maxVal) {
        minVal = maxVal;
        minSlider.value = minVal;
    }
    
    // Update displays
    minDisplay.textContent = minVal;
    maxDisplay.textContent = maxVal;
    
    // Update the filled range visualization (max is 16 for marks)
    const percentMin = (minVal / 16) * 100;
    const percentMax = (maxVal / 16) * 100;
    
    rangeFill.style.left = percentMin + '%';
    rangeFill.style.width = (percentMax - percentMin) + '%';
    
    // Update filter state
    window.marksFilter.min = minVal;
    window.marksFilter.max = maxVal;
    
    // Auto-apply filter on change
    applyMarksFilter();
}

// Dependencies: globals.js (window.marksFilter), render.js (filterQuestions)
function applyMarksFilter() {
    const minVal = parseFloat(document.getElementById('min-marks').value);
    const maxVal = parseFloat(document.getElementById('max-marks').value);
    
    // Only activate filter if range is not 0-16 (i.e., user has changed it)
    window.marksFilter = {
        min: minVal,
        max: maxVal,
        active: (minVal > 0 || maxVal < 16)
    };
    
    // Trigger filter update
    filterQuestions();
}

// Dependencies: globals.js (window.marksFilter), render.js (filterQuestions)
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
    
    // Trigger filter update
    filterQuestions();
}