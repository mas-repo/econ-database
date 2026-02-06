import os
import requests
import json

# Configuration
FOLDER_PATH = "PastPaper"
GAS_URL = os.environ.get("GAS_URL")
REPO_BASE_URL = "https://mas-repo.github.io/econ-database/PastPaper/"

def get_all_html_files():
    files_list = []
    # Walk through the PastPaper directory
    for root, dirs, files in os.walk(FOLDER_PATH):
        for file in files:
            if file.endswith(".html"):
                # Create the full public URL
                full_url = REPO_BASE_URL + file
                files_list.append({
                    "filename": file,
                    "url": full_url
                })
    return files_list

def sync_to_google_sheets(data):
    if not GAS_URL:
        print("Error: GAS_URL environment variable is missing.")
        return

    # === Retrieve the secret key from environment ===
    secret_key = os.environ.get("ACTION_KEY")
    
    if not secret_key:
        print("Error: ACTION_KEY environment variable is missing.")
        return

    try:
        # Send data as a POST request to handle large payloads
        response = requests.post(
            GAS_URL, 
            json={
                "action": "batch_sync", 
                "secret": secret_key,
                "files": data
            },
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            print(f"Successfully synced {len(data)} files.")
            print("Server Response:", response.text)
        else:
            print(f"Failed to sync. Status Code: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    print("Scanning files...")
    all_files = get_all_html_files()
    print(f"Found {len(all_files)} HTML files.")
    
    if len(all_files) > 0:
        sync_to_google_sheets(all_files)
    else:
        print("No files found to sync.")