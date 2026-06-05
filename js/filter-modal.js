// filter-modal.js

let currentModalFilterType = null;

/**
 * 打開共用篩選器 Modal
 * @param {string} filterType - 篩選器類型 (對應原本的 ID 前綴)
 * @param {string} title - Modal 標題
 */
function openFilterModal(filterType, title) {
    currentModalFilterType = filterType;
    document.getElementById('filter-modal-title').textContent = title;
    
    const modalBody = document.getElementById('filter-modal-body');
    // 支援 -options 或 -list 結尾的容器
    const originalContainer = document.getElementById(`${filterType}-options`) || document.getElementById(`${filterType}-list`);
    
    if (originalContainer) {
        // 1. 複製原本的 HTML 結構到 Modal 中
        modalBody.innerHTML = originalContainer.innerHTML;
        
        // 2. 重新綁定 Tri-state 選項點擊事件
        const items = modalBody.querySelectorAll('.tri-state-label, .tri-state-checkbox');
        items.forEach(item => {
            item.removeAttribute('onclick'); // 移除行內事件避免重複觸發
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                if (typeof toggleTriState === 'function') {
                    toggleTriState(this); // 呼叫原有邏輯
                }
                // 延遲刷新 Modal，讓畫面同步最新狀態
                setTimeout(() => {
                    if (currentModalFilterType === filterType) {
                        openFilterModal(filterType, title);
                    }
                }, 100);
            });
        });

        // 3. 重新綁定邏輯切換按鈕 (OR/AND)
        const toggles = modalBody.querySelectorAll('input[type="checkbox"]');
        toggles.forEach(toggle => {
            const onchangeStr = toggle.getAttribute('onchange');
            if (onchangeStr) {
                toggle.removeAttribute('onchange');
                toggle.addEventListener('change', function(e) {
                    if (onchangeStr.includes('toggleChapterLogic')) toggleChapterLogic(this);
                    if (onchangeStr.includes('toggleCurriculumLogic')) toggleCurriculumLogic(this);
                    
                    setTimeout(() => {
                        if (currentModalFilterType === filterType) openFilterModal(filterType, title);
                    }, 100);
                });
            }
        });

        // 4. 重新綁定特殊操作按鈕 (全選、清除)
        const actionBtns = modalBody.querySelectorAll('button');
        actionBtns.forEach(btn => {
            const onclickStr = btn.getAttribute('onclick');
            if (onclickStr) {
                btn.removeAttribute('onclick');
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (onclickStr.includes('clearYearFilter')) clearYearFilter();
                    if (onclickStr.includes('selectAllYears')) selectAllYears();
                    if (onclickStr.includes('clearChapterFilter')) clearChapterFilter();
                    if (onclickStr.includes('clearCurriculumFilter')) clearCurriculumFilter();
                    
                    setTimeout(() => {
                        if (currentModalFilterType === filterType) openFilterModal(filterType, title);
                    }, 100);
                });
            }
        });
    }

    // 5. 判斷是否需要顯示搜尋列 (動態標籤類才需要)
    const searchContainer = document.getElementById('filter-modal-search-container');
    const searchInput = document.getElementById('filter-modal-search');
    const dynamicTypes = ['graph', 'table', 'calculation', 'multiple-selection', 'concepts', 'patterns'];
    
    if (dynamicTypes.includes(filterType)) {
        searchContainer.style.display = 'block';
        searchInput.value = '';
        searchInput.onkeyup = function() {
            const filter = this.value.toUpperCase();
            const labels = modalBody.getElementsByClassName('tri-state-label');
            for (let i = 0; i < labels.length; i++) {
                const txtValue = labels[i].textContent || labels[i].innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    labels[i].style.display = "";
                } else {
                    labels[i].style.display = "none";
                }
            }
        };
    } else {
        searchContainer.style.display = 'none';
    }

    // 顯示 Modal
    document.getElementById('filter-modal').style.display = 'flex';
}

function closeFilterModal() {
    document.getElementById('filter-modal').style.display = 'none';
    currentModalFilterType = null;
}