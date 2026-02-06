(function() {
    // === CONFIGURATION ===
    const GAS_URL = "https://script.google.com/macros/s/AKfycby2ekiIw6zSJoCEQTo1XskkKVmO84IqZ4rsZHWi7kxWoSl1uXk59XqIXblddHlbvmap/exec"; 
    const LOGIN_PAGE = "https://mas-repo.github.io/econ-database/";

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
            // This prevents the content from flashing before being deleted
            const styleNode = document.getElementById('protect-style');
            if (styleNode) styleNode.remove();
            
        });
    }
})();