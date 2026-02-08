// Render questions
// Dependencies: storage-core.js (storage), storage-filters.js (applyFilters), globals.js (paginationState, triStateFilters, window.percentageFilter, window.marksFilter), pagination.js (updatePaginationInfo, generatePagination), admin.js (isAdminMode), utils.js (copyToClipboard, toggleQuestionText), sort.js, constants.js (CURRICULUM_ORDER)

// ==========================================
// Tag Visibility
// ==========================================
if (typeof window.showQuestionTags === 'undefined') {
    window.showQuestionTags = true;
}

window.toggleTags = function(checkbox) {
    window.showQuestionTags = checkbox.checked;
    renderQuestions(); // Re-render immediately
};
// ==========================================

async function renderQuestions() {
    // Added searchScope to the filters object
    const filters = {
        search: document.getElementById('search').value,
        searchScope: window.searchScope || 'all', 
        year: document.getElementById('year-filter').value,
        triState: triStateFilters,
        percentageFilter: window.percentageFilter,
        marksFilter: window.marksFilter
    };
    
    let questions = await storage.getQuestions(filters);

    // Get sort order and apply sorting
    const sortSelect = document.getElementById('sort-order');
    const sortBy = sortSelect ? sortSelect.value : 'default';
    questions = sortQuestions(questions, sortBy);    

    const currentPage = paginationState.questions.page;
    const itemsPerPage = paginationState.questions.itemsPerPage;
    
    const totalPages = itemsPerPage === -1 ? 1 : Math.max(1, Math.ceil(questions.length / itemsPerPage));
    const paginatedQuestions = itemsPerPage === -1 ? questions : questions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    updatePaginationInfo(currentPage, questions.length, itemsPerPage);
    generatePagination(currentPage, totalPages);
    
    document.getElementById('question-count').textContent = `總題目數: ${questions.length}`;
    
    const grid = document.getElementById('question-grid');
    
    if (questions.length === 0) {
        grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #7f8c8d;">未找到題目</p>';
        return;
    }

    // Helper function to determine tag style based on filter state
    const getTagStyle = (category, value) => {
        const isChecked = triStateFilters[category] && triStateFilters[category][value] === 'checked';
        // If active: Light blue background, blue border, bold text
        // If inactive: Standard link color, pointer cursor
        return isChecked 
            ? 'cursor:pointer; background-color: #e3f2fd; border: 1px solid #2196f3; color: #1565c0; font-weight: 600;' 
            : 'cursor:pointer; color:var(--secondary-color);';
    };
    
    grid.innerHTML = paginatedQuestions.map(q => {
        // Check if answer is short (single character or very brief)
        const isShortAnswer = q.answer && q.answer.trim().length <= 10;
        
        // Sort curriculum classifications by CURRICULUM_ORDER
        const sortedCurriculum = q.curriculumClassification ? 
            [...q.curriculumClassification].sort((a, b) => {
                const indexA = CURRICULUM_ORDER.indexOf(a);
                const indexB = CURRICULUM_ORDER.indexOf(b);
                return indexA - indexB;
            }) : [];
        
        // Sort chapter classifications numerically
        const sortedChapters = q.AristochapterClassification ? 
            [...q.AristochapterClassification].sort((a, b) => {
                const numA = parseInt(a.replace('Chapter ', ''));
                const numB = parseInt(b.replace('Chapter ', ''));
                return numA - numB;
            }) : [];

        // --- PRE-GENERATE HTML FOR CLASSIFICATIONS TO GROUP THEM ---
        
        let classificationHtml = '';
        const hasClassifications = window.showQuestionTags && (
            sortedCurriculum.length > 0 || 
            sortedChapters.length > 0 || 
            (q.concepts && q.concepts.length > 0) || 
            (q.patterns && q.patterns.length > 0)
        );

        if (hasClassifications) {
            classificationHtml += `<div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #e0e0e0; display: flex; flex-wrap: wrap; gap: 15px; row-gap: 8px; align-items: baseline;">`;

            // 1. Curriculum
            if (sortedCurriculum.length > 0) {
                classificationHtml += `
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <strong style="white-space: nowrap; font-size: 0.9em; color: #555;">課程:</strong>
                        ${sortedCurriculum.map(c => `
                            <span class="tag clickable-tag" onclick="filterByTag('curriculum', '${c}')" style="${getTagStyle('curriculum', c)}">
                                ${c}
                            </span>
                        `).join('')}
                    </div>
                `;
            }

            // 2. Chapters
            if (sortedChapters.length > 0) {
                classificationHtml += `
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <strong style="white-space: nowrap; font-size: 0.9em; color: #555;">Chapter:</strong>
                        ${sortedChapters.map(c => {
                            // Extract the number for the filter value logic (existing logic)
                            const match = c.match(/(\d+)/);
                            const val = match ? match[0] : c; 
                            
                            // Create a display label that removes "Ch" or "Chapter" (case insensitive)
                            // This affects ONLY the visual text inside the span
                            const displayLabel = c.replace(/^(Ch|Chapter)\s*/i, '');

                            return `
                            <span class="tag clickable-tag" onclick="filterByTag('chapter', '${val}')" style="${getTagStyle('chapter', val)}">
                                ${displayLabel}
                            </span>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            // 3. Concepts
            if (q.concepts && q.concepts.length > 0) {
                classificationHtml += `
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <strong style="white-space: nowrap; font-size: 0.9em; color: #555;">概念:</strong>
                        ${q.concepts.map(c => `
                            <span class="tag clickable-tag" onclick="filterByTag('concepts', '${c}')" style="${getTagStyle('concepts', c)}">
                                ${c}
                            </span>
                        `).join('')}
                    </div>
                `;
            }

            // 4. Patterns
            if (q.patterns && q.patterns.length > 0) {
                classificationHtml += `
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <strong style="white-space: nowrap; font-size: 0.9em; color: #555;">題型:</strong>
                        ${q.patterns.map(p => `
                            <span class="tag clickable-tag" onclick="filterByTag('patterns', '${p}')" style="${getTagStyle('patterns', p)}">
                                ${p}
                            </span>
                        `).join('')}
                    </div>
                `;
            }

            classificationHtml += `</div>`;
        }
        
        return `
        <div class="question-card">
            <div class="question-header">
                <div class="question-title">
                    ${q.id}
                    ${q.AIExplanation ? `
                        <a href="${q.AIExplanation}" target="_blank" class="ai-btn" title="AI 詳解" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background-color: #e3f2fd; border: 1px solid #90caf9; margin-left: 8px; font-size: 1.2em; transition: all 0.2s; cursor: pointer;">
                            🤖
                        </a>
                    ` : ''}                    
                    <button class="feedback-btn" onclick="openFeedbackModal('${q.id.replace(/'/g, "\\'")}')" title="回報問題" style="background: none; border: none; cursor: pointer; font-size: 1.2em; opacity: 0.6; transition: opacity 0.2s; padding: 0; margin-left: 8px;">
                        📢
                    </button>                   
                </div>
                <div class="question-badges">
                    ${q.year && q.year !== '-' ? `<span class="badge badge-year">${q.year}</span>` : ''}
                    ${q.questionType && q.questionType !== '-' ? `<span class="badge badge-type">${q.questionType}</span>` : ''}
                    ${q.marks > 0 ? `<span class="badge badge-marks">${q.marks}分</span>` : ''}
                    ${q.section && q.section !== '-' ? `<span class="badge badge-section">Section ${q.section}</span>` : ''}
                </div>
            </div>
            
            <div class="question-content">
                ${q.questionTextChi ? `
                    <div class="question-text">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                            <button class="expand-btn" onclick="toggleQuestionText(this)" title="展開/收起">
                                ▶
                            </button>
                            <strong style="flex: 1;">題目 (中)：</strong>
                            <button class="copy-btn" onclick="copyToClipboard(${JSON.stringify(q.questionTextChi).replace(/"/g, '&quot;')}, this)" title="複製" style="flex-shrink: 0;">
                                📋
                            </button>
                        </div>
                        <div class="question-text-content collapsed">${escapeHTML(q.questionTextChi.trim())}</div>
                    </div>
                ` : ''}
                ${q.questionTextEng ? `
                    <div class="question-text">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                            <button class="expand-btn" onclick="toggleQuestionText(this)" title="Expand/Collapse">
                                ▶
                            </button>
                            <strong style="flex: 1;">Question (Eng):</strong>
                            <button class="copy-btn" onclick="copyToClipboard(${JSON.stringify(q.questionTextEng).replace(/"/g, '&quot;')}, this)" title="Copy" style="flex-shrink: 0;">
                                📋
                            </button>
                        </div>
                        <div class="question-text-content collapsed">${escapeHTML(q.questionTextEng.trim())}</div>
                    </div>
                ` : ''}

                    ${q.answer ? (isShortAnswer ? `
                        <div class="info-item" style="display: flex; align-items: center; gap: 8px;">
                            <strong>答案：</strong> 
                            <span style="flex: 1;">${escapeHTML(q.answer)}</span>
                            <button class="copy-btn" onclick="copyToClipboard(${JSON.stringify(q.answer).replace(/"/g, '&quot;')}, this)" title="複製答案" style="flex-shrink: 0;">
                                📋
                            </button>
                        </div>
                    ` : `
                        <div class="question-text">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                <button class="expand-btn" onclick="toggleQuestionText(this)" title="展開/收起">
                                    ▶
                                </button>
                                <strong style="flex: 1;">答案：</strong>
                                <button class="copy-btn" onclick="copyToClipboard(${JSON.stringify(q.answer).replace(/"/g, '&quot;')}, this)" title="複製答案" style="flex-shrink: 0;">
                                    📋
                                </button>
                            </div>
                            <div class="question-text-content collapsed">${escapeHTML(q.answer.trim())}</div>
                        </div>
                    `) : ''}                  

                ${q.markersReport ? `
                    <div class="info-item" style="margin-top: 10px; display: flex; align-items: flex-start; gap: 8px;">
                        <div style="flex: 1;">
                            <strong>評卷報告：</strong> ${escapeHTML(q.markersReport.substring(0, 150))}${q.markersReport.length > 150 ? '...' : ''}
                        </div>
                        <button class="copy-btn" onclick="copyToClipboard(${JSON.stringify(q.markersReport).replace(/"/g, '&quot;')}, this)" title="複製評卷報告" style="flex-shrink: 0;">
                            📋
                        </button>
                    </div>
                ` : ''}

                <div class="question-info">             

                    ${q.correctPercentage !== null && q.correctPercentage !== undefined ? `<div class="info-item"><strong>答對率：</strong> ${q.correctPercentage}%</div>` : ''}


                    ${(window.showQuestionTags && q.graphType && q.graphType !== '-') ? `
                        <div class="info-item">
                            <strong>圖表：</strong> 
                            <span class="tag clickable-tag" onclick="filterByTag('graph', '${q.graphType}')" style="${getTagStyle('graph', q.graphType)}">
                                ${q.graphType}
                            </span>
                        </div>
                    ` : ''}
                    
                    ${(window.showQuestionTags && q.tableType && q.tableType !== '-') ? `
                        <div class="info-item">
                            <strong>表格：</strong> 
                            <span class="tag clickable-tag" onclick="filterByTag('table', '${q.tableType}')" style="${getTagStyle('table', q.tableType)}">
                                ${q.tableType}
                            </span>
                        </div>
                    ` : ''}
                    
                    ${(window.showQuestionTags && q.calculationType && q.calculationType !== '-') ? `
                        <div class="info-item">
                            <strong>計算：</strong> 
                            <span class="tag clickable-tag" onclick="filterByTag('calculation', '${q.calculationType}')" style="${getTagStyle('calculation', q.calculationType)}">
                                ${q.calculationType}
                            </span>
                        </div>
                    ` : ''}

                    ${(window.showQuestionTags && q.multipleSelectionType && q.multipleSelectionType !== '-') ? `
                        <div class="info-item">
                            <strong>複選：</strong> 
                            <span class="tag clickable-tag" onclick="filterByTag('multipleSelection', '${q.multipleSelectionType}')" style="${getTagStyle('multipleSelection', q.multipleSelectionType)}">
                                ${q.multipleSelectionType}
                            </span>
                        </div>
                    ` : ''}                    

                    </div>
                

                <div></div>
                
                <!-- Combined Classifications Section -->
                ${classificationHtml}
                
            </div>
            
            ${isAdminMode ? `
                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button class="btn btn-warning" onclick="editQuestion('${q.id}')">編輯</button>
                    <button class="btn btn-danger" onclick="deleteQuestion('${q.id}')">刪除</button>
                </div>
            ` : ''}
        </div>
    `;
    }).join('');
}