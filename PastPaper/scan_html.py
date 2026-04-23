import pathlib
import os

def scan_html_for_phrase(search_phrase, directory="."):
    """
    Scans all .html files in the given directory and its subdirectories
    for a specific phrase.
    """
    matching_files = []
    
    # Create a Path object for the target directory
    base_path = pathlib.Path(directory)
    
    # rglob("*.html") recursively finds all files ending in .html
    html_files = list(base_path.rglob("*.html"))
    
    print(f"Found {len(html_files)} HTML file(s). Scanning...")
    
    for file_path in html_files:
        try:
            # Open the file. We use encoding='utf-8' and errors='ignore' 
            # to prevent the script from crashing on unexpected characters.
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
                
                # Check if the phrase exists in the file
                if search_phrase in content:
                    matching_files.append(file_path)
                    
        except Exception as e:
            print(f"Could not read {file_path}. Error: {e}")
            
    return matching_files

if __name__ == "__main__":
    print("=== HTML File Scanner ===")
    
    # Ask the user for the phrase to search for
    phrase = input("Enter the phrase you want to look for: ")
    
    if phrase:
        print(f"\nSearching for: '{phrase}'\n")
        
        # Run the scan (defaults to the current directory ".")
        results = scan_html_for_phrase(phrase)
        
        # Display the summary report
        print("\n" + "="*30)
        print("       SUMMARY REPORT")
        print("="*30)
        
        if results:
            print(f"The phrase '{phrase}' was found in {len(results)} file(s):\n")
            for idx, file_name in enumerate(results, start=1):
                # Print the relative path to the file
                print(f"{idx}. {file_name}")
        else:
            print(f"No matches found for '{phrase}'.")
    else:
        print("No phrase entered. Canceling search.")
        
    print("="*30)
    
    # This input prompt prevents the CMD window from closing immediately
    input("\nPress Enter to exit...")