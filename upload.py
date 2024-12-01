import os
import requests
from pathlib import Path
import time

class FilestackUploader:
    def __init__(self, api_key):
        self.api_key = api_key
    
    def upload_file(self, filepath):
        """Upload a file to Filestack using basic multipart upload."""
        try:
            url = f"https://www.filestackapi.com/api/store/S3?key={self.api_key}"
            with open(filepath, 'rb') as file:
                files = {
                    'fileUpload': (filepath.name, file, 'audio/mpeg')
                }
                print(f"Uploading {filepath.name}...")
                response = requests.post(url, files=files)
                if response.status_code == 200:
                    data = response.json()
                    if 'url' in data:
                        return data['url']
                    elif 'handle' in data:
                        return f"https://cdn.filestackcontent.com/{data['handle']}"
                print(f"Upload failed with status code: {response.status_code}")
                print(f"Response: {response.text}")
                return None
        except Exception as e:
            print(f"Error uploading {filepath.name}: {str(e)}")
            return None

def process_mp3_files():
    # Configuration
    API_KEY = "AF4oXpqg4Re273cqEA0Hgz"
    MP3_DIR = Path("tractatus_audio")
    OUTPUT_FILE = "mp3_links.txt"
    
    # Initialize uploader
    uploader = FilestackUploader(API_KEY)
    
    # Get all MP3 files
    mp3_files = sorted(MP3_DIR.glob("*.mp3"))
    total_files = len(mp3_files)
    print(f"Found {total_files} MP3 files to process")
    
    # Dictionary to store results
    results = {}
    
    # Load existing results if any
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                if ': ' in line:
                    key, link = line.strip().split(': ', 1)
                    results[key] = link
        print(f"Loaded {len(results)} existing entries")
    
    # Keep track of new uploads
    new_uploads = {}
    
    # Process each file
    for i, mp3_path in enumerate(mp3_files, 1):
        key = mp3_path.stem  # filename without extension
        
        # Skip if already processed
        if key in results:
            print(f"Skipping {key} (already uploaded)")
            continue
            
        print(f"\nProcessing {i}/{total_files}: {mp3_path.name}")
        
        # Try upload with retries
        max_retries = 3
        for attempt in range(max_retries):
            if attempt > 0:
                print(f"Retry attempt {attempt + 1}/{max_retries}")
                time.sleep(5 * attempt)  # Increasing delay between retries
            
            direct_link = uploader.upload_file(mp3_path)
            if direct_link:
                print(f"Successfully uploaded: {mp3_path.name}")
                new_uploads[key] = direct_link
                
                # Append only the new upload to the file
                with open(OUTPUT_FILE, 'a', encoding='utf-8') as f:
                    f.write(f"{key}: {direct_link}\n")
                break
                
        if not direct_link:
            print(f"Failed to upload {mp3_path.name} after {max_retries} attempts")
        
        # Small delay between files
        time.sleep(2)
    
    print(f"\nUpload complete!")
    print(f"Previously uploaded: {len(results)} files")
    print(f"Newly uploaded: {len(new_uploads)} files")
    print(f"Total links in {OUTPUT_FILE}: {len(results) + len(new_uploads)}")

if __name__ == "__main__":
    try:
        process_mp3_files()
    except KeyboardInterrupt:
        print("\nUpload process interrupted by user")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {str(e)}")