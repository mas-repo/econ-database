import os
import json
import sys

# Configuration
IGNORE_DIRS = {'.git', '__pycache__', '.github', 'js', 'css', 'img', 'projects'}
IGNORE_FILES = {'index.html', 'generate_index.py', 'protect.js', 'sync_database.py'}

# HTML Template
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <script src="/econ-database/PastPaper/protect.js"></script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DSE Question Explanation</title>
    <style>
        :root { --primary: #2563eb; --bg: #f8fafc; --text: #1e293b; --border: #e2e8f0; }
        body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        header { text-align: center; margin-bottom: 30px; }
        .search-box { width: 100%; max-width: 500px; padding: 12px; border: 2px solid var(--border); border-radius: 8px; font-size: 16px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .card { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border: 1px solid var(--border); }
        .card-header { background: var(--primary); color: white; padding: 10px 15px; font-weight: bold; display: flex; justify-content: space-between; }
        .file-list { list-style: none; padding: 0; margin: 0; max-height: 300px; overflow-y: auto; }
        .file-list li a { display: block; padding: 10px 15px; text-decoration: none; color: var(--text); border-bottom: 1px solid var(--border); }
        .file-list li a:hover { background: #eff6ff; color: var(--primary); padding-left: 20px; transition: 0.2s; }
    </style>
</head>
<body>
<div class="container">
    <header>
        <h1 style="color: var(--primary)">DSE Question Explanation</h1>
        <input type="text" id="search" class="search-box" placeholder="Search year or question...">
    </header>
    <div id="grid" class="grid"></div>
</div>

<script>
    // DATA IS INJECTED HERE BY PYTHON
    const db = __JSON_DATA__;

    const grid = document.getElementById('grid');
    const search = document.getElementById('search');

    function render(filter = '') {
        grid.innerHTML = '';
        const term = filter.toLowerCase();
        
        for (const [year, files] of Object.entries(db)) {
            const matches = files.filter(f => f.toLowerCase().includes(term) || year.includes(term));
            
            if (matches.length > 0) {
                const card = document.createElement('div');
                card.className = 'card';
                
                let listHtml = '';
                matches.forEach(f => {
                    // Link is relative: ./Year/Filename.html
                    listHtml += `<li><a href="./${year}/${f}" target="_blank">${f.replace('.html','')}</a></li>`;
                });

                card.innerHTML = `
                    <div class="card-header">
                        <span>${year}</span>
                        <span style="font-size:0.8em; background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:10px">${matches.length}</span>
                    </div>
                    <ul class="file-list">${listHtml}</ul>
                `;
                grid.appendChild(card);
            }
        }
    }

    render();
    search.addEventListener('input', (e) => render(e.target.value));
</script>
</body>
</html>
"""

def generate_site():
    data = {}
    
    # 1. Determine the directory where this script resides (PastPaper folder)
    base_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"--- Starting Index Generation ---")
    print(f"Script location: {base_dir}")

    # 2. Iterate through subdirectories (e.g., 2012, 2013)
    if not os.path.exists(base_dir):
        print(f"Error: Directory {base_dir} does not exist.")
        sys.exit(1)

    for item in os.listdir(base_dir):
        item_path = os.path.join(base_dir, item)
        
        # We only care about directories (Years) that are not ignored
        if os.path.isdir(item_path) and item not in IGNORE_DIRS:
            folder_name = item
            html_files = []
            
            try:
                for file in os.listdir(item_path):
                    if file.endswith('.html') and file not in IGNORE_FILES:
                        html_files.append(file)
            except OSError as e:
                print(f"Warning: Could not read folder {folder_name}: {e}")
                continue

            if html_files:
                html_files.sort()
                data[folder_name] = html_files
                print(f"Indexed: {folder_name} ({len(html_files)} files)")
            else:
                print(f"Skipped: {folder_name} (No HTML files found)")

    # 3. Sort data by Year (Folder name)
    sorted_data = dict(sorted(data.items()))
    
    # 4. Inject JSON into HTML
    json_string = json.dumps(sorted_data)
    final_html = HTML_TEMPLATE.replace('__JSON_DATA__', json_string)

    # 5. Write index.html to the same directory as this script
    output_path = os.path.join(base_dir, 'index.html')
    
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(final_html)
        print(f"--- Success ---")
        print(f"Generated index.html at: {output_path}")
    except IOError as e:
        print(f"Error writing file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    generate_site()