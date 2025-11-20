// Global variables - must be initialized first
var storage = null;
var currentTab = 'questions';
var editingId = null;
var triStateFilters = {
    curriculum: {},
    feature: {},
    chapter: {},
    exam: {},
    qtype: {} 
};

var paginationState = {
    questions: { page: 1, itemsPerPage: 20 }
};