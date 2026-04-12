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

    const renderImageButtons = (urls, lang) => {
        if (!urls || urls === '-') return '';
        
        // Split by comma, trim whitespace, and remove empty strings
        const urlArray = urls.split(',').map(u => u.trim()).filter(u => u);
        if (urlArray.length === 0) return '';
        
        const label = lang === 'chi' ? 'ZH' : 'EN';
        const titlePrefix = lang === 'chi' ? '原題圖片 (中文)' : '原題圖片 (英文)';
        
        return urlArray.map((url, index) => {
            // If there's more than 1 image, append the number (e.g., ZH1, ZH2)
            const displayLabel = urlArray.length > 1 ? `${label}${index + 1}` : label;
            const displayTitle = urlArray.length > 1 ? `${titlePrefix} - P.${index + 1}` : titlePrefix;
            
            return `
                <a href="${url}" target="_blank" class="ai-btn" title="${displayTitle}" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 30px; padding: 0 6px; border-radius: 15px; background-color: #eff6ff; border: 1px solid #93c5fd; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1); margin-left: 8px; font-size: 0.85em; transition: all 0.2s; cursor: pointer; color: #2563eb; font-weight: bold;">
                    ${displayLabel}
                </a>
            `;
        }).join('');
    };    

    document.getElementById('question-count').textContent = `總題目數: ${questions.length}`;
    
    const grid = document.getElementById('question-grid');
    
    if (questions.length === 0) {
        grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #7f8c8d;">未找到題目</p>';
        return;
    }

    // Helper function to determine tag style based on filter state
    const getTagStyle = (category, value) => {
        const isChecked = triStateFilters[category] && triStateFilters[category][value] === 'checked';
        return isChecked 
            ? 'cursor:pointer; background-color: #e3f2fd; border: 1px solid #2196f3; color: #1565c0; font-weight: 600;' 
            : 'cursor:pointer; color:var(--secondary-color);';
    };

    // Helper function to render collapsible text sections (Answers/Reports)
    const renderCollapsibleSection = (label, content) => {
        if (!content || content.trim() === '' || content === '-') return '';
        
        // Escape content for HTML display
        const escapedContent = escapeHTML(content.trim());
        // Escape content for the copy button function call
        const jsonContent = JSON.stringify(content).replace(/"/g, '&quot;');

        return `
            <div class="question-text">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                    <button class="expand-btn" onclick="toggleQuestionText(this)" title="展開/收起">▶</button>
                    <strong style="flex: 1;">${label}</strong>
                    <button class="copy-btn" onclick="copyToClipboard(${jsonContent}, this)" title="複製" style="flex-shrink: 0;">
                        📋
                    </button>
                </div>
                <div class="question-text-content collapsed">${escapedContent}</div>
            </div>
        `;
    };
    
    grid.innerHTML = paginatedQuestions.map(q => {
        
        // Sort curriculum classifications by CURRICULUM_ORDER
        const sortedCurriculum = q.curriculumClassification ? 
            [...q.curriculumClassification].sort((a, b) => {
                // Find the index of 'a' based on matching it against the full display names derived from CURRICULUM_ORDER
                const indexA = CURRICULUM_ORDER.findIndex(code => CURRICULUM_DISPLAY[code] === a);
                const indexB = CURRICULUM_ORDER.findIndex(code => CURRICULUM_DISPLAY[code] === b);
                
                // If found, use that index. If not found (e.g. -1), push to the end (999).
                const valA = indexA === -1 ? 999 : indexA;
                const valB = indexB === -1 ? 999 : indexB;
                
                return valA - valB;
            }) : [];
        
        // Sort chapter classifications numerically
        const sortedChapters = q.AristochapterClassification ? 
            [...q.AristochapterClassification].sort((a, b) => {
                const getNum = (str) => {
                    const match = str.match(/(\d+)/);
                    return match ? parseInt(match[0], 10) : 9999; // No number = put at end
                };
                return getNum(a) - getNum(b);
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
                            <span class="tag clickable-tag" onclick="filterByTag('curriculum', '${escapeAttr(c)}')" style="${getTagStyle('curriculum', c)}">
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
                            const match = c.match(/(\d+)/);
                            const val = match ? match[0] : c; 
                            const displayLabel = c.replace(/^(Ch|Chapter)\s*/i, '');
                            return `
                            <span class="tag clickable-tag" onclick="filterByTag('chapter', '${escapeAttr(val)}')" style="${getTagStyle('chapter', val)}">
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
                            <span class="tag clickable-tag" onclick="filterByTag('concepts', '${escapeAttr(c)}')" style="${getTagStyle('concepts', c)}">
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
                            <span class="tag clickable-tag" onclick="filterByTag('patterns', '${escapeAttr(p)}')" style="${getTagStyle('patterns', p)}">
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
                    ${renderImageButtons(q.imageChi, 'chi')}
                    ${renderImageButtons(q.imageEng, 'eng')}              
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
                ${renderCollapsibleSection('題目：', q.questionTextChi)}
                ${renderCollapsibleSection('Question:', q.questionTextEng)}

                <!-- Answer Display Logic -->
                ${(q.answerMC && q.answerMC !== '-') ? `
                    <div class="info-item" style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                        <strong>答案：</strong> 
                        <span style="font-weight: bold; color: #2c3e50;">${escapeHTML(q.answerMC)}</span>
                    </div>
                ` : ''}

                ${renderCollapsibleSection('答案：', q.answerChi)}
                ${renderCollapsibleSection('Answer:', q.answerEng)}

                <!-- Markers Report Display Logic -->
                ${renderCollapsibleSection('評卷報告：', q.markersReportChi)}
                ${renderCollapsibleSection('Markers Report:', q.markersReportEng)}

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