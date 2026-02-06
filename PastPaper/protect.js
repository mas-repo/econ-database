(function() {
    // === CONFIGURATION ===
    const GAS_URL = "https://script.google.com/macros/s/AKfycby2ekiIw6zSJoCEQTo1XskkKVmO84IqZ4rsZHWi7kxWoSl1uXk59XqIXblddHlbvmap/exec"; 
    const LOGIN_PAGE = "https://mas-repo.github.io/econ-database/";
    const INDEX_URL = "https://mas-repo.github.io/econ-database/PastPaper/";
    const DATABASE_URL = "https://mas-repo.github.io/econ-database/";

    // 1. Immediate Block: Hide content while checking
    const style = document.createElement('style');
    style.id = 'protect-style';
    style.innerHTML = 'body { display: none !important; }';
    document.head.appendChild(style);

    // 2. Get Credentials
    const username = localStorage.getItem('username'); 

    if (!username) {
        window.location.href = LOGIN_PAGE;
        return;
    }

    // 3. Check Session Cache
    const cachedPermission = sessionStorage.getItem('past_paper_permission');
    
    if (cachedPermission === 'allowed') {
        revealContent();
        return;
    } else if (cachedPermission === 'denied') {
        showBlankPage();
        return;
    }

    // 4. Verify with Google Apps Script
    fetch(`${GAS_URL}?action=check_permission&username=${encodeURIComponent(username)}`)
        .then(response => response.json())
        .then(data => {
            if (data.allowed) {
                sessionStorage.setItem('past_paper_permission', 'allowed');
                revealContent();
            } else {
                sessionStorage.setItem('past_paper_permission', 'denied');
                showBlankPage();
            }
        })
        .catch(error => {
            console.error("Auth Error:", error);
            showBlankPage(); 
        });

    // === Helper Functions ===

    function safeDOMAction(callback) {
        if (document.body) {
            callback();
        } else {
            document.addEventListener('DOMContentLoaded', callback);
        }
    }

    function revealContent() {
        safeDOMAction(() => {
            addNavigationFooter();
            addScrollButtons(); // Updated function name
            const styleNode = document.getElementById('protect-style');
            if (styleNode) styleNode.remove();
        });
    }

    function showBlankPage() {
        safeDOMAction(() => {
            document.body.innerHTML = ""; 
            document.body.style.backgroundColor = "white";
            const styleNode = document.getElementById('protect-style');
            if (styleNode) styleNode.remove();
        });
    }

    function addNavigationFooter() {
        const footer = document.createElement('div');
        footer.id = "page-footer"; // Added ID for scrolling target
        
        footer.style.clear = 'both';
        footer.style.position = 'relative';
        footer.style.zIndex = '9999';
        footer.style.marginTop = '50px';
        footer.style.padding = '25px';
        footer.style.borderTop = '1px solid #ddd';
        footer.style.textAlign = 'center';
        footer.style.fontFamily = 'sans-serif';
        footer.style.backgroundColor = '#f9f9f9';
        footer.style.width = '100%'; 
        footer.style.boxSizing = 'border-box'; 
        footer.style.lineHeight = '2'; 

        const createLink = (text, url) => {
            const link = document.createElement('a');
            link.href = url;
            link.innerText = text;
            link.style.textDecoration = 'none';
            link.style.color = '#007bff';
            link.style.fontSize = '16px';
            link.style.fontWeight = 'bold';
            link.style.margin = '0 15px'; 
            link.style.display = 'inline-block'; 
            
            link.onmouseover = () => { link.style.textDecoration = 'underline'; };
            link.onmouseout = () => { link.style.textDecoration = 'none'; };
            return link;
        };

        const linkIndex = createLink("⬅ 返回目錄 (Back to Index)", INDEX_URL);
        const linkDb = createLink("🏠 返回資料庫 (Back to Database)", DATABASE_URL);
        const separator = document.createElement('span');
        separator.innerText = "|";
        separator.style.color = "#ccc";

        footer.appendChild(linkIndex);
        footer.appendChild(separator);
        footer.appendChild(linkDb);

        document.body.appendChild(footer);
    }

    function addScrollButtons() {
        // Container for both buttons
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.zIndex = '10000';
        container.style.display = 'flex';
        container.style.flexDirection = 'column'; // Stack vertically
        container.style.gap = '10px'; // Space between buttons

        // Helper to create a button
        const createBtn = (symbol, onClick) => {
            const btn = document.createElement('button');
            btn.innerHTML = symbol;
            btn.style.backgroundColor = '#007bff';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '50%';
            btn.style.width = '40px'; // Slightly smaller since there are two
            btn.style.height = '40px';
            btn.style.fontSize = '20px';
            btn.style.cursor = 'pointer';
            btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
            btn.style.transition = 'opacity 0.3s, transform 0.2s';
            
            btn.onmouseover = () => btn.style.transform = "scale(1.1)";
            btn.onmouseout = () => btn.style.transform = "scale(1)";
            btn.onclick = onClick;
            return btn;
        };

        // 1. Scroll to Top Button
        const btnUp = createBtn("⬆", () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // 2. Scroll to Bottom Button
        const btnDown = createBtn("⬇", () => {
            // Scroll to the footer we created
            const footer = document.getElementById('page-footer');
            if(footer) {
                footer.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        });

        container.appendChild(btnUp);
        container.appendChild(btnDown);
        document.body.appendChild(container);
    }
})();