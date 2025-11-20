// Dependencies: storage-core.js (extends IndexedDBStorage)

// Add filter logic to IndexedDBStorage
IndexedDBStorage.prototype.applyFilters = function(questions, filters) {
    // Apply search filter
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        questions = questions.filter(q => {
            return (
                (q.id && String(q.id).toLowerCase().includes(searchLower)) ||
                (q.examination && q.examination.toLowerCase().includes(searchLower)) ||
                (q.section && q.section.toLowerCase().includes(searchLower)) ||
                (q.questionNumber && q.questionNumber.toLowerCase().includes(searchLower)) ||
                (q.questionTextChi && q.questionTextChi.toLowerCase().includes(searchLower)) ||
                (q.questionTextEng && q.questionTextEng.toLowerCase().includes(searchLower)) ||
                (q.publisher && q.publisher.toLowerCase().includes(searchLower))
            );
        });
    }
    
    // Apply exam filter
    if (filters.examination) {
        questions = questions.filter(q => q.examination === filters.examination);
    }
    
    // Apply year filter
    if (filters.year) {
        questions = questions.filter(q => String(q.year) === String(filters.year));
    }
    
    // Apply question type filter
    if (filters.questionType) {
        questions = questions.filter(q => q.questionType === filters.questionType);
    }

    // Percentage filter
    if (filters.percentageFilter && filters.percentageFilter.active) {
        const { min, max } = filters.percentageFilter;
        
        questions = questions.filter(q => {
            if (q.correctPercentage === undefined || 
                q.correctPercentage === null || 
                q.correctPercentage === '') {
                return false;
            }
            
            const percentage = parseFloat(q.correctPercentage);
            
            if (isNaN(percentage)) {
                return false;
            }
            
            return percentage >= min && percentage <= max;
        });
        
    }

    // Marks filter
        if (filters.marksFilter && filters.marksFilter.active) {
            const { min, max } = filters.marksFilter;
            
            questions = questions.filter(q => {
                if (q.marks === undefined || 
                    q.marks === null || 
                    q.marks === '') {
                    return false;
                }
                
                const marks = parseFloat(q.marks);
                
                if (isNaN(marks)) {
                    return false;
                }
                
                return marks >= min && marks <= max;
            });
        }

    // Tri-state filters
    if (filters.triState) {
        // Exam type filters
        if (filters.triState.exam) {
            const checkedExams = Object.keys(filters.triState.exam).filter(k => filters.triState.exam[k] === 'checked');
            const excludedExams = Object.keys(filters.triState.exam).filter(k => filters.triState.exam[k] === 'excluded');
            
            if (checkedExams.length > 0) {
                questions = questions.filter(q => checkedExams.includes(q.examination));
            }
            
            if (excludedExams.length > 0) {
                questions = questions.filter(q => !excludedExams.includes(q.examination));
            }
        }

        // Question type filters
        if (filters.triState.qtype) {
            const checkedQtypes = Object.keys(filters.triState.qtype).filter(k => filters.triState.qtype[k] === 'checked');
            const excludedQtypes = Object.keys(filters.triState.qtype).filter(k => filters.triState.qtype[k] === 'excluded');
            
            if (checkedQtypes.length > 0) {
                questions = questions.filter(q => checkedQtypes.includes(q.questionType));
            }
            
            if (excludedQtypes.length > 0) {
                questions = questions.filter(q => !excludedQtypes.includes(q.questionType));
            }
        }

        // Curriculum filters
        if (filters.triState.curriculum) {
            const checkedCurr = Object.keys(filters.triState.curriculum).filter(k => filters.triState.curriculum[k] === 'checked');
            const excludedCurr = Object.keys(filters.triState.curriculum).filter(k => filters.triState.curriculum[k] === 'excluded');
            
            if (checkedCurr.length > 0) {
                questions = questions.filter(q => {
                    if (!q.curriculumClassification || !Array.isArray(q.curriculumClassification)) return false;
                    return checkedCurr.some(curr => q.curriculumClassification.includes(curr));
                });
            }
            
            if (excludedCurr.length > 0) {
                questions = questions.filter(q => {
                    if (!q.curriculumClassification || !Array.isArray(q.curriculumClassification)) return true;
                    return !excludedCurr.some(curr => q.curriculumClassification.includes(curr));
                });
            }
        }

        // Chapter filters
        if (filters.triState.chapter) {
            const checkedChapter = Object.keys(filters.triState.chapter).filter(k => filters.triState.chapter[k] === 'checked');
            const excludedChapter = Object.keys(filters.triState.chapter).filter(k => filters.triState.chapter[k] === 'excluded');
            
            if (checkedChapter.length > 0) {
                questions = questions.filter(q => {
                    if (!q.AristochapterClassification || !Array.isArray(q.AristochapterClassification)) return false;
                    // Add "Ch" prefix to filter values when comparing
                    return checkedChapter.some(chapter => q.AristochapterClassification.includes('Ch' + chapter));
                });
            }
            
            if (excludedChapter.length > 0) {
                questions = questions.filter(q => {
                    if (!q.AristochapterClassification || !Array.isArray(q.AristochapterClassification)) return true;
                    // Add "Ch" prefix to filter values when comparing
                    return !excludedChapter.some(chapter => q.AristochapterClassification.includes('Ch' + chapter));
                });
            }
        }        

        // Feature filters
        if (filters.triState.feature) {
            const features = filters.triState.feature;
            
            Object.entries(features).forEach(([value, state]) => {
                if (state === 'checked') {
                    questions = questions.filter(q => {
                        if (value === '含圖表') {
                            return q.graphType && 
                                q.graphType !== '' && 
                                q.graphType !== '-' && 
                                q.graphType !== '沒有圖';
                        } else if (value === '含表格') {
                            return q.tableType && 
                                q.tableType !== '' && 
                                q.tableType !== '-' && 
                                q.tableType !== '沒有表格';
                        } else if (value === '複選') {
                            return q.multipleSelectionType && 
                                q.multipleSelectionType !== '' && 
                                q.multipleSelectionType !== '-' && 
                                q.multipleSelectionType !== '並非複選型' && 
                                q.multipleSelectionType !== '不適用';
                        } else if (value === '含計算') {
                            return q.calculationType && 
                                q.calculationType !== '' && 
                                q.calculationType !== '-' && 
                                q.calculationType !== '沒有計算';
                        }
                        return true;
                    });
                } else if (state === 'excluded') {
                    questions = questions.filter(q => {
                        if (value === '含圖表') {
                            return !q.graphType || 
                                q.graphType === '' || 
                                q.graphType === '-' || 
                                q.graphType === '沒有圖';
                        } else if (value === '含表格') {
                            return !q.tableType || 
                                q.tableType === '' || 
                                q.tableType === '-' || 
                                q.tableType === '沒有表格';
                        } else if (value === '複選') {
                            return !q.multipleSelectionType || 
                                q.multipleSelectionType === '' || 
                                q.multipleSelectionType === '-' || 
                                q.multipleSelectionType === '並非複選型' || 
                                q.multipleSelectionType === '不適用';
                        } else if (value === '含計算') {
                            return !q.calculationType || 
                                q.calculationType === '' || 
                                q.calculationType === '-' || 
                                q.calculationType === '沒有計算';
                        }                     
                        return true;
                    });
                }
            });
        }
    }
    
    return questions;
};