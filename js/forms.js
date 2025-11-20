// Form functions
// Dependencies: globals.js (window.editingId), storage-core.js (window.storage), main.js (refreshViews), constants.js (DEFAULT_PUBLISHER)

// Dependencies: globals.js (window.editingId), constants.js (DEFAULT_PUBLISHER)
function toggleForm() {
    const form = document.getElementById('form-section');
    const isHidden = form.classList.contains('hidden');
    
    if (isHidden) {
        form.classList.remove('hidden');
        document.getElementById('form-title').textContent = '新增題目';
        window.editingId = null;
        clearForm();
    } else {
        form.classList.add('hidden');
    }
}

// Dependencies: constants.js (DEFAULT_PUBLISHER)
function clearForm() {
    document.getElementById('question-form').reset();
    const publisherField = document.getElementById('publisher');
    if (publisherField) {
        publisherField.value = DEFAULT_PUBLISHER;
    }
}

// Dependencies: globals.js (window.editingId)
function cancelEdit() {
    document.getElementById('form-section').classList.add('hidden');
    window.editingId = null;
    clearForm();
}

// Check for duplicate questions
// Dependencies: storage-core.js (window.storage)
async function checkDuplicate(formData) {
    const questions = await window.storage.getQuestions();
    return questions.some(q => 
        q.examination === formData.examination &&
        q.year === formData.year &&
        q.section === formData.section &&
        q.questionNumber === formData.questionNumber &&
        q.id !== window.editingId // Don't count self when editing
    );
}

// Save question
// Dependencies: globals.js (window.editingId), storage-core.js (window.storage), main.js (refreshViews)
function setupFormHandler() {
    const form = document.getElementById('question-form');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Auto-fill '-' for empty fields
        const multipleSelectionType = document.getElementById('multiple-selection-type').value.trim() || '-';
        const graphType = document.getElementById('graph-type').value.trim() || '-';
        const tableType = document.getElementById('table-type').value.trim() || '-';
        
        const question = {
            id: window.editingId || document.getElementById('question-id').value.trim(),
            publisher: document.getElementById('publisher').value.trim(),
            examination: document.getElementById('examination').value,
            year: parseInt(document.getElementById('year').value),
            paper: document.getElementById('paper').value.trim(),
            questionType: document.getElementById('question-type').value,
            marks: parseFloat(document.getElementById('marks').value) || 0,
            section: document.getElementById('section').value.trim(),
            questionNumber: document.getElementById('question-number').value.trim(),
            questionTextChi: document.getElementById('question-text-chi').value.trim(),
            questionTextEng: document.getElementById('question-text-eng').value.trim(),
            multipleSelectionType: multipleSelectionType,
            graphType: graphType,
            tableType: tableType,
            calculationType: document.getElementById('calculation-type').value.trim() || '-',            
            answer: document.getElementById('answer').value.trim(),
            correctPercentage: parseFloat(document.getElementById('correct-percentage').value) || null,
            markersReport: document.getElementById('markers-report').value.trim(),
            curriculumClassification: document.getElementById('curriculum-classification').value.split(',').map(s => s.trim()).filter(s => s),
            AristochapterClassification: document.getElementById('chapter-classification').value.split(',').map(s => s.trim()).filter(s => s),
            concepts: document.getElementById('concepts').value.split(',').map(s => s.trim()).filter(s => s),
            patternTags: document.getElementById('pattern-tags').value.split(',').map(s => s.trim()).filter(s => s),
            optionDesign: document.getElementById('option-design').value.trim(),
            remarks: document.getElementById('remarks').value.trim(),
            dateAdded: window.editingId ? null : new Date().toISOString(),
            dateModified: new Date().toISOString()
        };
        
        if (!question.id) {
            alert('請輸入題目 ID');
            return;
        }

        // Check for duplicates (only when adding new questions)
        if (!window.editingId) {
            const isDuplicate = await checkDuplicate(question);
            if (isDuplicate) {
                const confirmMsg = `已存在相同的題目：\n\n` +
                                 `考試: ${question.examination}\n` +
                                 `年份: ${question.year}\n` +
                                 `Section: ${question.section}\n` +
                                 `題號: ${question.questionNumber}\n\n` +
                                 `確定要新增嗎？`;
                if (!confirm(confirmMsg)) {
                    return;
                }
            }
        }        

        await window.storage.addQuestion(question);
        await refreshViews();
        
        document.getElementById('form-section').classList.add('hidden');
        clearForm();
        window.editingId = null;
    });
}




// Edit question
// Dependencies: globals.js (window.editingId), storage-core.js (window.storage), constants.js (DEFAULT_PUBLISHER)
async function editQuestion(id) {
    const questions = await window.storage.getQuestions();
    const question = questions.find(q => q.id === id);
    
    if (!question) {
        alert('找不到題目');
        return;
    }
    
    window.editingId = id;
    
    document.getElementById('question-id').value = question.id;
    document.getElementById('publisher').value = question.publisher || DEFAULT_PUBLISHER;
    document.getElementById('examination').value = question.examination;
    document.getElementById('year').value = question.year;
    document.getElementById('paper').value = question.paper || '';
    document.getElementById('question-type').value = question.questionType;
    document.getElementById('marks').value = question.marks || '';
    document.getElementById('section').value = question.section || '';
    document.getElementById('question-number').value = question.questionNumber || '';
    document.getElementById('question-text-chi').value = question.questionTextChi || '';
    document.getElementById('question-text-eng').value = question.questionTextEng || '';
    
    // Don't show '-' in the form, leave it empty
    document.getElementById('multiple-selection-type').value = question.multipleSelectionType === '-' ? '' : (question.multipleSelectionType || '');
    document.getElementById('graph-type').value = question.graphType === '-' ? '' : (question.graphType || '');
    document.getElementById('table-type').value = question.tableType === '-' ? '' : (question.tableType || '');
    document.getElementById('calculation-type').value = question.calculationType === '-' ? '' : (question.calculationType || '');    
    document.getElementById('answer').value = question.answer || '';
    document.getElementById('correct-percentage').value = question.correctPercentage || '';
    document.getElementById('markers-report').value = question.markersReport || '';
    document.getElementById('curriculum-classification').value = (question.curriculumClassification || []).join(', ');
    document.getElementById('chapter-classification').value = (question.AristochapterClassification || []).join(', ');
    document.getElementById('concepts').value = (question.concepts || []).join(', ');
    document.getElementById('pattern-tags').value = (question.patternTags || []).join(', ');
    document.getElementById('option-design').value = question.optionDesign || '';
    document.getElementById('remarks').value = question.remarks || '';
    
    document.getElementById('form-section').classList.remove('hidden');
    document.getElementById('form-title').textContent = '編輯題目';
}

// Delete question
// Dependencies: storage-core.js (window.storage), main.js (refreshViews)
async function deleteQuestion(id) {
    if (confirm('確定要刪除此題目？')) {
        await window.storage.deleteQuestion(id);
        await refreshViews();
    }
}
