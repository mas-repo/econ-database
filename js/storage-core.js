// Dependencies: None (core storage layer)

class IndexedDBStorage {
    constructor() {
        this.dbName = 'EconQuestionsDB';
        this.version = 2;
        this.db = null;
        this.availableFields = new Set();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('questions')) {
                    const questionStore = db.createObjectStore('questions', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    questionStore.createIndex('exam', 'exam', { unique: false });
                    questionStore.createIndex('year', 'year', { unique: false });
                    questionStore.createIndex('qtype', 'qtype', { unique: false });
                }

                if (!db.objectStoreNames.contains('publishers')) {
                    db.createObjectStore('publishers', { keyPath: 'name' });
                }
                if (!db.objectStoreNames.contains('topics')) {
                    db.createObjectStore('topics', { keyPath: 'name' });
                }
                if (!db.objectStoreNames.contains('concepts')) {
                    db.createObjectStore('concepts', { keyPath: 'name' });
                }
                if (!db.objectStoreNames.contains('patterns')) {
                    db.createObjectStore('patterns', { keyPath: 'name' });
                }
            };
        });
    }

    async addQuestion(question) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['questions'], 'readwrite');
            const store = transaction.objectStore('questions');
            const request = store.add(question);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getQuestions(filters = {}) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['questions'], 'readonly');
            const store = transaction.objectStore('questions');
            const request = store.getAll();

            request.onsuccess = () => {
                let questions = request.result;
                
                // Apply filters (delegated to storage-filters.js)
                questions = this.applyFilters(questions, filters);
                
                resolve(questions);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteQuestion(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['questions'], 'readwrite');
            const store = transaction.objectStore('questions');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async updateMetadata(storeName, name, comment) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({ name, comment: comment || '' });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getMetadata(storeName, name) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(name);

            request.onsuccess = () => resolve(request.result || { name, comment: '' });
            request.onerror = () => reject(request.error);
        });
    }

    async getAllMetadata(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clear() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['questions', 'publishers', 'topics', 'concepts', 'patterns'], 'readwrite');
            
            const stores = ['questions', 'publishers', 'topics', 'concepts', 'patterns'];
            let completed = 0;
            
            stores.forEach(storeName => {
                const request = transaction.objectStore(storeName).clear();
                request.onsuccess = () => {
                    completed++;
                    if (completed === stores.length) resolve();
                };
                request.onerror = () => reject(request.error);
            });
        });
    }
}