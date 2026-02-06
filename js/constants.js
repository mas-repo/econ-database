/* ============================================
   Constants and Static Data
   ============================================ */
// Dependencies: None (core constants file)

// Curriculum classifications
const CURRICULUM_ITEMS = [
    'A 基本經濟概念',
    'B 廠商與生產',
    'C 市場與價格',
    'D 競爭與市場結構',
    'E 效率、公平和政府的角色',
    'F 經濟表現的量度',
    'G 國民收入決定及價格水平',
    'H 貨幣與銀行',
    'I 宏觀經濟問題和政府',
    'J 國際貿易和金融',
    'E1 選修單元一',
    'E2 選修單元二',
    '未分類'
];

// Curriculum mapping (short code to full name)
const CURRICULUM_NAMES = {
    'A 基本經濟概念': 'A',
    'B 廠商與生產': 'B',
    'C 市場與價格': 'C',
    'D 競爭與市場結構': 'D',
    'E 效率、公平和政府的角色': 'E',
    'F 經濟表現的量度': 'F',
    'G 國民收入決定及價格水平': 'G',
    'H 貨幣與銀行': 'H',
    'I 宏觀經濟問題和政府': 'I',
    'J 國際貿易和金融': 'J',
    'E1 選修單元一': 'E1',
    'E2 選修單元二': 'E2',
    '未分類': 'U',
};

// Reverse mapping (short code to full display name)
const CURRICULUM_DISPLAY = {
    'A': 'A 基本經濟概念',
    'B': 'B 廠商與生產',
    'C': 'C 市場與價格',
    'D': 'D 競爭與市場結構',
    'E': 'E 效率、公平和政府的角色',
    'F': 'F 經濟表現的量度',
    'G': 'G 國民收入決定及價格水平',
    'H': 'H 貨幣與銀行',
    'I': 'I 宏觀經濟問題和政府',
    'J': 'J 國際貿易和金融',
    'E1': 'E1 選修單元一',
    'E2': 'E2 選修單元二',
    'U': '未分類',
};

// Curriculum sort order
const CURRICULUM_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'E1', 'E2', 'U'];

// Feature filter items
const FEATURE_ITEMS = [
    '含圖表',
    '含表格',
    '含計算',
    '複選'
];

// Chapter range (1-29)
const CHAPTER_RANGE = {
    min: 1,
    max: 29
};

// Examination types
const EXAMINATION_TYPES = ['HKDSE', 'HKCEE', 'HKALE'];

// Question types
const QUESTION_TYPES = ['MC', '文字題 (SQ/LQ)'];

// Default publisher
const DEFAULT_PUBLISHER = 'HKEAA';

// Export all constants
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CURRICULUM_ITEMS,
        CURRICULUM_NAMES,
        CURRICULUM_DISPLAY,
        CURRICULUM_ORDER,
        FEATURE_ITEMS,
        CHAPTER_RANGE,
        EXAMINATION_TYPES,
        QUESTION_TYPES,
        DEFAULT_PUBLISHER
    };
}