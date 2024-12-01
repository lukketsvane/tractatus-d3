import os
import requests
from urllib.parse import urlparse

def download_file(url, filename):
    response = requests.get(url, stream=True)
    response.raise_for_status()
    with open(filename, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk: f.write(chunk)

def main():
    audio_dir = os.path.join(os.path.dirname(__file__), 'audio')
    os.makedirs(audio_dir, exist_ok=True)
    
    with open('links.txt', 'r') as f:
        lines = f.readlines()
    
    for i, line in enumerate(lines, 1):
        if not line.strip(): continue
        parts = line.strip().split(': ')
        url = parts[1] if len(parts) == 2 else line.strip()
        filename = parts[0] if len(parts) == 2 else os.path.basename(urlparse(url).path)
        filename = filename.replace(':', '_').replace('/', '_').replace('\\', '_')
        if not filename.endswith('.mp3'): filename += '.mp3'
        filepath = os.path.join(audio_dir, filename)
        
        print(f"[{i}/{len(lines)}] Downloading {filename}...")
        try:
            download_file(url, filepath)
            print(f"Done: {filename}")
        except Exception as e:
            print(f"Error: {filename} - {str(e)}")

if __name__ == "__main__":
    main()