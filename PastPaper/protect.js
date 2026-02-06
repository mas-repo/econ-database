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
            
            // 2. Add the scroll to top button
            addScrollToTopButton();

            // 3. Remove the hiding style
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
        
        footer.style.clear = 'both';
        footer.style.position = 'relative';
        footer.style.zIndex = '9999';
        
        footer.style.marginTop = '50px';
        footer.style.padding = '20px';
        footer.style.borderTop = '1px solid #ddd';
        footer.style.textAlign = 'center';
        footer.style.fontFamily = 'sans-serif';
        footer.style.backgroundColor = '#f9f9f9';
        footer.style.width = '100%'; 
        footer.style.boxSizing = 'border-box'; 

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

    function addScrollToTopButton() {
        const btn = document.createElement('button');
        btn.innerHTML = "⬆"; // Up arrow character
        
        // Styling
        btn.style.position = 'fixed';
        btn.style.bottom = '20px';
        btn.style.left = '20px'; // Bottom Left
        btn.style.zIndex = '10000'; // Very high z-index
        btn.style.display = 'none'; // Hidden by default
        
        // Appearance
        btn.style.backgroundColor = '#007bff';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '50%';
        btn.style.width = '50px';
        btn.style.height = '50px';
        btn.style.fontSize = '24px';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        btn.style.transition = 'opacity 0.3s';

        // Functionality: Scroll to top
        btn.onclick = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        // Functionality: Show/Hide on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btn.style.display = 'block';
            } else {
                btn.style.display = 'none';
            }
        });

        document.body.appendChild(btn);
    }
})();