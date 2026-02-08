// Copy to clipboard function
// Dependencies: None

function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        // Change button text temporarily to show success
        const originalText = button.innerHTML;
        button.innerHTML = '✓';
        button.style.backgroundColor = '#27ae60';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.backgroundColor = '';
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('複製失敗，請手動複製');
    });
}

// Toggle question text expand/collapse
// Dependencies: None
function toggleQuestionText(button) {
    const textContent = button.parentElement.nextElementSibling;
    const isCollapsed = textContent.classList.contains('collapsed');
    
    if (isCollapsed) {
        textContent.classList.remove('collapsed');
        textContent.classList.add('expanded');
        button.innerHTML = '▼';
        button.title = '收起';
    } else {
        textContent.classList.remove('expanded');
        textContent.classList.add('collapsed');
        button.innerHTML = '▶';
        button.title = '展開';
    }
}


// Populate chapter filter options dynamically
// Dependencies: constants.js (CHAPTER_RANGE)
function populateChapterFilter() {
    // CHANGE 1: Target the new inner container 'chapter-list'
    // instead of the main dropdown 'chapter-options'
    const container = document.getElementById('chapter-list');
    
    // Safety check: if the new container doesn't exist yet, stop or fallback
    if (!container) {
        console.warn('Element #chapter-list not found. Make sure HTML is updated.');
        return;
    }
    
    let html = '';
    for (let i = CHAPTER_RANGE.min; i <= CHAPTER_RANGE.max; i++) {
        const chNumber = String(i).padStart(2, '0');
        // Note: For chapters, we apply the class directly to the item
        html += `<div class="tri-state-checkbox" data-filter="chapter" data-value="${chNumber}" onclick="toggleTriState(this)">${chNumber}</div>`;
    }
    
    // This now only updates the list area, leaving the Clear button (which is above this div) alone.
    container.innerHTML = html;
}

// Populate curriculum filter options dynamically
// Dependencies: constants.js (CURRICULUM_ITEMS)
function populateCurriculumFilter() {
    // Matches the new HTML structure
    const container = document.getElementById('curriculum-options');
    if (!container) return;
    
    let html = '';
    CURRICULUM_ITEMS.forEach(item => {
        html += `
            <div class="tri-state-label" onclick="toggleTriState(this)" data-filter="curriculum" data-value="${item}">
                <div class="tri-state-checkbox" data-filter="curriculum" data-value="${item}">
                    <span>${item}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}


// Populate feature filter options dynamically
// Dependencies: constants.js (FEATURE_ITEMS)
function populateFeatureFilter() {
    // Matches the new HTML structure
    const container = document.getElementById('feature-options');
    if (!container) return;
    
    let html = '';
    FEATURE_ITEMS.forEach(item => {
        html += `
            <div class="tri-state-label" onclick="toggleTriState(this)" data-filter="feature" data-value="${item}">
                <div class="tri-state-checkbox" data-filter="feature" data-value="${item}">
                    <span>${item}</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Populate curriculum form options (for the Add/Edit form)
// Dependencies: constants.js (CURRICULUM_ITEMS)
function populateCurriculumFormOptions() {
    const container = document.querySelector('#curriculum-options .options-list');
    if (!container) return;

    container.innerHTML = CURRICULUM_ITEMS.map(item => `
        <label><input type="checkbox" value="${item}"> ${item}</label>
    `).join('');
}

// Scroll to top
// Dependencies: None
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}