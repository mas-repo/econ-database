(function() {
    // === CONFIGURATION ===
    const GAS_URL = "https://script.google.com/macros/s/AKfycby2ekiIw6zSJoCEQTo1XskkKVmO84IqZ4rsZHWi7kxWoSl1uXk59XqIXblddHlbvmap/exec"; 
    const LOGIN_PAGE = "https://mas-repo.github.io/econ-database/";
    const INDEX_URL = "https://mas-repo.github.io/econ-database/PastPaper/";

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
            // 1. Add the navigation footer
            addNavigationFooter();

            // 2. Remove the hiding style
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
        // Create a footer container
        const footer = document.createElement('div');
        
        // === UPDATED STYLES FOR VISIBILITY ===
        // 1. clear: both -> ensures it drops below any floating elements
        // 2. position: relative -> ensures it respects z-index
        // 3. zIndex: 9999 -> ensures it sits on top of other elements
        footer.style.clear = 'both';
        footer.style.position = 'relative';
        footer.style.zIndex = '9999';
        
        footer.style.marginTop = '50px';
        footer.style.padding = '20px';
        footer.style.borderTop = '1px solid #ddd';
        footer.style.textAlign = 'center';
        footer.style.fontFamily = 'sans-serif';
        footer.style.backgroundColor = '#f9f9f9';
        footer.style.width = '100%'; // Ensure full width
        footer.style.boxSizing = 'border-box'; // Ensure padding doesn't overflow width

        // Create the link
        const link = document.createElement('a');
        link.href = INDEX_URL;
        link.innerText = "⬅ 返回目錄 (Back to Index)";
        
        link.style.textDecoration = 'none';
        link.style.color = '#007bff';
        link.style.fontSize = '16px';
        link.style.fontWeight = 'bold';
        
        link.onmouseover = () => { link.style.textDecoration = 'underline'; };
        link.onmouseout = () => { link.style.textDecoration = 'none'; };

        footer.appendChild(link);
        document.body.appendChild(footer);
    }
})();