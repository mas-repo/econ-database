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
    const container = document.getElementById('chapter-options');
    if (!container) return;
    
    let html = '';
    for (let i = CHAPTER_RANGE.min; i <= CHAPTER_RANGE.max; i++) {
        const chNumber = String(i).padStart(2, '0');
        html += `<div class="tri-state-checkbox" data-filter="chapter" data-value="${chNumber}" onclick="toggleTriState(this)">${chNumber}</div>`;
    }
    container.innerHTML = html;
}

// Populate curriculum filter options dynamically
// Dependencies: constants.js (CURRICULUM_ITEMS)
function populateCurriculumFilter() {
    const container = document.getElementById('curriculum-dropdown');
    if (!container) return;
    
    let html = '';
    CURRICULUM_ITEMS.forEach(item => {
        html += `
            <div class="tri-state-checkbox" data-filter="curriculum" data-value="${item}" onclick="toggleTriState(this)">
                <span>${item}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}


// Populate feature filter options dynamically
// Dependencies: constants.js (FEATURE_ITEMS)
function populateFeatureFilter() {
    const container = document.getElementById('feature-dropdown');
    if (!container) return;
    
    let html = '';
    FEATURE_ITEMS.forEach(item => {
        html += `
            <div class="tri-state-checkbox" data-filter="feature" data-value="${item}" onclick="toggleTriState(this)">
                <span>${item}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Populate curriculum
// Dependencies: constants.js (CURRICULUM_ITEMS)
function populateCurriculumFormOptions() {
    const container = document.querySelector('#curriculum-options .options-list');
    if (!container) return;

    container.innerHTML = CURRICULUM_ITEMS.map(item => `
        <label><input type="checkbox" value="${item}"> ${item}</label>
    `).join('');
}