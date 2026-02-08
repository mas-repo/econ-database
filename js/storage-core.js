// Dependencies: None (core storage layer)

class IndexedDBStorage {
    constructor() {
        this.dbName = 'EconQuestionsDB';
        this.version = 3; 
        this.db = null;
        this.availableFields = new Set();
        this.storeName = 'questions'; 
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

                // Create questions store
                if (!db.objectStoreNames.contains('questions')) {
                    const questionStore = db.createObjectStore('questions', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    questionStore.createIndex('exam', 'exam', { unique: false });
                    questionStore.createIndex('year', 'year', { unique: false });
                    questionStore.createIndex('qtype', 'qtype', { unique: false });
                }

                // Create other stores
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
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(question);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Significantly faster than adding one by one
    async addQuestions(questions) {
        console.log("batch processing " + questions.length + " items");
        return new Promise((resolve, reject) => {
            // FIX: this.storeName is now defined, so this transaction will work
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            questions.forEach(q => {
                store.put(q);
            });

            transaction.oncomplete = () => resolve(questions.length);
            transaction.onerror = (e) => reject(transaction.error || e.target.error);
        });
    }

    async updateQuestion(question) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(question); 

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getQuestions(filters = {}) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                let questions = request.result;
                // Note: Ensure `this.applyFilters` exists or logic is handled elsewhere.
                // If applyFilters is not a method of this class, just return questions.
                if (typeof this.applyFilters === 'function') {
                    questions = this.applyFilters(questions, filters);
                }
                resolve(questions);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteQuestion(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
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
            const stores = ['questions', 'publishers', 'topics', 'concepts', 'patterns'];
            const transaction = this.db.transaction(stores, 'readwrite');
            
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