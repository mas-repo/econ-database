// Global variables - must be initialized first
var storage = null;
var currentTab = 'questions';
var editingId = null;
var searchScope = 'all'; // Added: Default search scope

var triStateFilters = {
    curriculum: {},
    feature: {},
    chapter: {},
    exam: {},
    qtype: {},
    concepts: {}, // Added: For tag filtering
    patterns: {}  // Added: For tag filtering
};

var paginationState = {
    questions: { page: 1, itemsPerPage: 20 }
};