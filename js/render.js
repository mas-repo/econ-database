// Render questions
// Dependencies: storage-core.js (storage), storage-filters.js (applyFilters), globals.js (paginationState, triStateFilters, window.percentageFilter, window.marksFilter), pagination.js (updatePaginationInfo, generatePagination), admin.js (isAdminMode), utils.js (copyToClipboard, toggleQuestionText), sort.js, constants.js (CURRICULUM_ORDER)

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
                        <div class="question-text-content collapsed">${q.questionTextChi.trim()}</div>
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
                        <div class="question-text-content collapsed">${q.questionTextEng.trim()}</div>
                    </div>
                ` : ''}
                
                <div class="question-info">
                    ${q.multipleSelectionType && q.multipleSelectionType !== '-' ? `
                        <div class="info-item">
                            <strong>複選：</strong> 
                            <span class="tag clickable-tag" onclick="filterByTag('multipleSelection', '${q.multipleSelectionType}')" style="cursor:pointer; color:var(--secondary-color);">
                                ${q.multipleSelectionType}
                            </span>
                        </div>
                    ` : ''}
                    
                    ${q.graphType && q.graphType !== '-' ? `
                        <div class="info-item">
                            <strong>圖表：</strong> 
                            <span class="tag clickable-tag" onclick="filterByTag('graph', '${q.graphType}')" style="cursor:pointer; color:var(--secondary-color);">
                                ${q.graphType}
                            </span>
                        </div>
                    ` : ''}
                    
                    ${q.tableType && q.tableType !== '-' ? `
                        <div class="info-item">
                            <strong>表格：</strong> 
                            <span class="tag clickable-tag" onclick="filterByTag('table', '${q.tableType}')" style="cursor:pointer; color:var(--secondary-color);">
                                ${q.tableType}
                            </span>
                        </div>
                    ` : ''}
                    
                    ${q.calculationType && q.calculationType !== '-' ? `
                        <div class="info-item">
                            <strong>計算：</strong> 
                            <span class="tag clickable-tag" onclick="filterByTag('calculation', '${q.calculationType}')" style="cursor:pointer; color:var(--secondary-color);">
                                ${q.calculationType}
                            </span>
                        </div>
                    ` : ''}
                    
                    ${q.correctPercentage !== null && q.correctPercentage !== undefined ? `<div class="info-item"><strong>答對率：</strong> ${q.correctPercentage}%</div>` : ''}
                </div>
                
                ${q.answer ? (isShortAnswer ? `
                    <div class="info-item" style="display: flex; align-items: center; gap: 8px;">
                        <strong>答案：</strong> 
                        <span style="flex: 1;">${q.answer}</span>
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
                        <div class="question-text-content collapsed">${q.answer.trim()}</div>
                    </div>
                `) : ''}
                <div></div>
                ${sortedCurriculum.length > 0 ? `
                    <div style="display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap;">
                        <strong style="white-space: nowrap;">課程分類：</strong>
                        <div class="tag-container" style="flex: 1; margin: 0;">
                            ${sortedCurriculum.map(c => `
                                <span class="tag clickable-tag" onclick="filterByTag('curriculum', '${c}')" style="cursor:pointer; color:var(--secondary-color);">
                                    ${c}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${sortedChapters.length > 0 ? `
                    <div style="display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap;">
                        <strong style="white-space: nowrap;">Chapter(s):</strong>
                        <div class="tag-container" style="flex: 1; margin: 0;">
                            ${sortedChapters.map(c => {
                                // Extract the number (e.g., "Chapter 01" -> "01") to match the sidebar filter logic
                                const match = c.match(/(\d+)/);
                                const val = match ? match[0] : c; 
                                return `
                                <span class="tag clickable-tag" onclick="filterByTag('chapter', '${val}')" style="cursor:pointer; color:var(--secondary-color);">
                                    ${c}
                                </span>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}                 

                ${q.concepts && q.concepts.length > 0 ? `
                    <div style="display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap;">
                        <strong style="white-space: nowrap;">涉及概念：</strong>
                        <div class="tag-container" style="flex: 1; margin: 0;">
                            ${q.concepts.map(c => `
                                <span class="tag clickable-tag" onclick="filterByTag('concepts', '${c}')" style="cursor:pointer; color:var(--secondary-color);">
                                    ${c}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${q.patterns && q.patterns.length > 0 ? `
                    <div style="display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap;">
                        <strong style="white-space: nowrap;">題型：</strong>
                        <div class="tag-container" style="flex: 1; margin: 0;">
                            ${q.patterns.map(p => `
                                <span class="tag clickable-tag" onclick="filterByTag('patterns', '${p}')" style="cursor:pointer; color:var(--secondary-color);">
                                    ${p}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''} 
                
                ${q.markersReport ? `
                    <div class="info-item" style="margin-top: 10px; display: flex; align-items: flex-start; gap: 8px;">
                        <div style="flex: 1;">
                            <strong>評卷報告：</strong> ${q.markersReport.substring(0, 150)}${q.markersReport.length > 150 ? '...' : ''}
                        </div>
                        <button class="copy-btn" onclick="copyToClipboard(${JSON.stringify(q.markersReport).replace(/"/g, '&quot;')}, this)" title="複製評卷報告" style="flex-shrink: 0;">
                            📋
                        </button>
                    </div>
                ` : ''}
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