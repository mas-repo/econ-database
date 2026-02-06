// Render publishers grid
async function renderPublishers() {
    const questions = await window.storage.getQuestions();
    const publishersMap = new Map();
    
    questions.forEach(q => {
        if (q.publisher) {
            if (!publishersMap.has(q.publisher)) {
                publishersMap.set(q.publisher, []);
            }
            publishersMap.get(q.publisher).push(q);
        }
    });

    const publishersData = await Promise.all(
        Array.from(publishersMap.entries()).map(async ([name, qs]) => {
            const metadata = await window.storage.getMetadata('publishers', name);
            return { name, count: qs.length, comment: metadata.comment || '' };
        })
    );

    publishersData.sort((a, b) => b.count - a.count);

    const container = document.getElementById('publishers-grid');
    
    if (publishersData.length === 0) {
        container.innerHTML = '<p class="empty-state">暫無出版社資料</p>';
        return;
    }

    container.innerHTML = publishersData.map(p => `
        <div class="item-card">
            <div class="item-header">
                <h3>${p.name}</h3>
                <span class="item-count">${p.count} 題</span>
            </div>
            <div class="item-comment">
                <textarea 
                    placeholder="添加備註..." 
                    onblur="saveMetadata('publishers', '${p.name.replace(/'/g, "\\'")}', this.value)"
                >${p.comment}</textarea>
            </div>
        </div>
    `).join('');
}

// Render topics grid
async function renderTopics() {
    const questions = await window.storage.getQuestions();
    const topicsMap = new Map();
    
    questions.forEach(q => {
        if (q.topic) {
            if (!topicsMap.has(q.topic)) {
                topicsMap.set(q.topic, []);
            }
            topicsMap.get(q.topic).push(q);
        }
    });

    const topicsData = await Promise.all(
        Array.from(topicsMap.entries()).map(async ([name, qs]) => {
            const metadata = await window.storage.getMetadata('topics', name);
            return { name, count: qs.length, comment: metadata.comment || '' };
        })
    );

    topicsData.sort((a, b) => b.count - a.count);

    const container = document.getElementById('topics-grid');
    
    if (topicsData.length === 0) {
        container.innerHTML = '<p class="empty-state">暫無主題資料</p>';
        return;
    }

    container.innerHTML = topicsData.map(t => `
        <div class="item-card">
            <div class="item-header">
                <h3>${t.name}</h3>
                <span class="item-count">${t.count} 題</span>
            </div>
            <div class="item-comment">
                <textarea 
                    placeholder="添加備註..." 
                    onblur="saveMetadata('topics', '${t.name.replace(/'/g, "\\'")}', this.value)"
                >${t.comment}</textarea>
            </div>
        </div>
    `).join('');
}

// Render concepts grid
async function renderConcepts() {
    const questions = await window.storage.getQuestions();
    const conceptsMap = new Map();
    
    questions.forEach(q => {
        if (q.concepts) {
            // ✅ FIX: Handle both array and string formats
            let conceptsList = [];
            
            if (Array.isArray(q.concepts)) {
                // Already an array from new format
                conceptsList = q.concepts;
            } else if (typeof q.concepts === 'string') {
                // String format from old data
                conceptsList = q.concepts.split(',').map(c => c.trim());
            }
            
            conceptsList.forEach(concept => {
                const c = typeof concept === 'string' ? concept.trim() : String(concept).trim();
                if (c) {
                    if (!conceptsMap.has(c)) {
                        conceptsMap.set(c, []);
                    }
                    conceptsMap.get(c).push(q);
                }
            });
        }
    });

    const conceptsData = await Promise.all(
        Array.from(conceptsMap.entries()).map(async ([name, qs]) => {
            const metadata = await window.storage.getMetadata('concepts', name);
            return { name, count: qs.length, comment: metadata.comment || '' };
        })
    );

    conceptsData.sort((a, b) => b.count - a.count);

    const container = document.getElementById('concepts-grid');
    
    if (conceptsData.length === 0) {
        container.innerHTML = '<p class="empty-state">暫無概念資料</p>';
        return;
    }

    container.innerHTML = conceptsData.map(c => `
        <div class="item-card">
            <div class="item-header">
                <h3>${c.name}</h3>
                <span class="item-count">${c.count} 題</span>
            </div>
            <div class="item-comment">
                <textarea 
                    placeholder="添加備註..." 
                    onblur="saveMetadata('concepts', '${c.name.replace(/'/g, "\\'")}', this.value)"
                >${c.comment}</textarea>
            </div>
        </div>
    `).join('');
}

// Render patterns grid
async function renderPatterns() {
    const questions = await window.storage.getQuestions();
    const patternsMap = new Map();
    
    questions.forEach(q => {
        if (q.pattern) {
            if (!patternsMap.has(q.pattern)) {
                patternsMap.set(q.pattern, []);
            }
            patternsMap.get(q.pattern).push(q);
        }
    });

    const patternsData = await Promise.all(
        Array.from(patternsMap.entries()).map(async ([name, qs]) => {
            const metadata = await window.storage.getMetadata('patterns', name);
            return { name, count: qs.length, comment: metadata.comment || '' };
        })
    );

    patternsData.sort((a, b) => b.count - a.count);

    const container = document.getElementById('patterns-grid');
    
    if (patternsData.length === 0) {
        container.innerHTML = '<p class="empty-state">暫無模式資料</p>';
        return;
    }

    container.innerHTML = patternsData.map(p => `
        <div class="item-card">
            <div class="item-header">
                <h3>${p.name}</h3>
                <span class="item-count">${p.count} 題</span>
            </div>
            <div class="item-comment">
                <textarea 
                    placeholder="添加備註..." 
                    onblur="saveMetadata('patterns', '${p.name.replace(/'/g, "\\'")}', this.value)"
                >${p.comment}</textarea>
            </div>
        </div>
    `).join('');
}

// Save metadata
async function saveMetadata(storeName, name, comment) {
    await window.storage.updateMetadata(storeName, name, comment);
}