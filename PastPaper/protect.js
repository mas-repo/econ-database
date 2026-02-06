(function() {
    // === CONFIGURATION ===
    const GAS_URL = "https://script.google.com/macros/s/AKfycby2ekiIw6zSJoCEQTo1XskkKVmO84IqZ4rsZHWi7kxWoSl1uXk59XqIXblddHlbvmap/exec"; 
    const LOGIN_PAGE = "https://mas-repo.github.io/econ-database/";
    const INDEX_URL = "https://mas-repo.github.io/econ-database/PastPaper/";

    // 1. Immediate Block: Hide content while checking
    // This must run immediately in the <head>
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
            // 1. Add the navigation footer first
            addNavigationFooter();

            // 2. Remove the hiding style to show the page
            const styleNode = document.getElementById('protect-style');
            if (styleNode) styleNode.remove();
        });
    }

    function showBlankPage() {
        safeDOMAction(() => {
            // 1. Clear the body content FIRST
            document.body.innerHTML = ""; 
            document.body.style.backgroundColor = "white";
            
            // 2. THEN remove the hiding style
            const styleNode = document.getElementById('protect-style');
            if (styleNode) styleNode.remove();
        });
    }

    function addNavigationFooter() {
        // Create a footer container
        const footer = document.createElement('div');
        
        // Style the footer to look clean and centered at the bottom
        footer.style.marginTop = '50px';
        footer.style.padding = '20px';
        footer.style.borderTop = '1px solid #ddd';
        footer.style.textAlign = 'center';
        footer.style.fontFamily = 'sans-serif';
        footer.style.backgroundColor = '#f9f9f9';

        // Create the link
        const link = document.createElement('a');
        link.href = INDEX_URL;
        link.innerText = "⬅ 返回目錄 (Back to Index)";
        
        // Style the link
        link.style.textDecoration = 'none';
        link.style.color = '#007bff';
        link.style.fontSize = '16px';
        link.style.fontWeight = 'bold';
        
        // Hover effect logic
        link.onmouseover = () => { link.style.textDecoration = 'underline'; };
        link.onmouseout = () => { link.style.textDecoration = 'none'; };

        // Append link to footer, and footer to body
        footer.appendChild(link);
        document.body.appendChild(footer);
    }
})();