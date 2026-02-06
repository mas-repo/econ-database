// Global variables - must be initialized first
var storage = null;
var currentTab = 'questions';
var editingId = null;
var searchScope = 'all';

var triStateFilters = {
    curriculum: {},
    feature: {},
    chapter: {},
    exam: {},
    qtype: {},
    concepts: {},
    patterns: {},
    multipleSelection: {},
    graph: {},
    table: {},
    calculation: {}
};

var paginationState = {
    questions: { page: 1, itemsPerPage: 20 }
};