import json
import requests
import time
import re
from pathlib import Path

def enhance_punctuation(text):
    """Add dramatic punctuation and handle emphasis for better speech synthesis."""
    # Handle emphasized words (marked with asterisks)
    text = re.sub(r'\*([^*]+)\*', r'... \1! ...', text)
    
    # Clean up any leftover asterisks
    text = text.replace('*', '')
    
    # Handle em dashes with proper pauses
    text = text.replace('—', '... -- ...')
    
    # Split into sentences (handling multiple punctuation marks)
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    enhanced_sentences = []
    for sentence in sentences:
        # Remove trailing periods for transformation
        sentence = sentence.rstrip('.')
        
        # Split into clauses
        clauses = re.split(r'(?:,|;|\sand\s|\sor\s)', sentence)
        
        # Process each clause
        enhanced_clauses = []
        for i, clause in enumerate(clauses):
            clause = clause.strip()
            
            if i == len(clauses) - 1:
                # Final clause gets strong ending
                if 'must' in clause or 'cannot' in clause or 'impossible' in clause:
                    clause = f"{clause}!"
                else:
                    clause = f"{clause}."
            elif i == 0:
                # First clause gets contemplative pause
                clause = f"{clause}..."
            else:
                # Middle clauses get varied punctuation
                if any(word in clause.lower() for word in ['not', 'no', 'cannot', 'impossible']):
                    clause = f"{clause}!"
                elif any(word in clause.lower() for word in ['must', 'essential', 'every', 'all']):
                    clause = f"{clause};"
                else:
                    clause = f"{clause},"
            
            enhanced_clauses.append(clause)
        
        # Join clauses
        enhanced_sentence = " ".join(enhanced_clauses)
        enhanced_sentences.append(enhanced_sentence)
    
    # Join sentences with proper spacing
    enhanced_text = " ".join(enhanced_sentences)
    
    # Clean up multiple punctuation
    enhanced_text = re.sub(r'([.!?])+', r'\1', enhanced_text)
    enhanced_text = re.sub(r'\s+', ' ', enhanced_text)
    
    return enhanced_text.strip()

class ElevenLabsGenerator:
    def __init__(self, api_key, voice_id):
        self.api_key = api_key
        self.voice_id = voice_id
        self.base_url = "https://api.elevenlabs.io/v1"
        self.headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }

    def generate_speech(self, text, output_path):
        """Generate speech from text and save to file."""
        url = f"{self.base_url}/text-to-speech/{self.voice_id}"
        
        # Enhance the punctuation for better speech synthesis
        enhanced_text = enhance_punctuation(text)
        print(f"Enhanced text: {enhanced_text}")
        
        data = {
            "text": enhanced_text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }

        try:
            response = requests.post(url, json=data, headers=self.headers)
            response.raise_for_status()
            
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            return True
        except requests.exceptions.RequestException as e:
            print(f"Error generating speech for {output_path}: {str(e)}")
            return False

def process_tractatus_to_speech():
    # Configuration
    API_KEY = "sk_3e09d2445d73884ece5fbd1d97441b413522a1e5e5660acc"
    VOICE_ID = "A9evEp8yGjv4c3WsIKuY"
    INPUT_FILE = "tractatus-english.json"
    OUTPUT_DIR = Path("tractatus_audio")
    
    # Create output directory if it doesn't exist
    OUTPUT_DIR.mkdir(exist_ok=True)
    
    # Initialize the generator
    generator = ElevenLabsGenerator(API_KEY, VOICE_ID)
    
    try:
        # Read the JSON file
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            entries = json.load(f)
        
        print(f"Found {len(entries)} entries to process.")
        
        # Process each entry
        for i, entry in enumerate(entries, 1):
            key = entry['key']
            text = entry['text']
            output_path = OUTPUT_DIR / f"{key}.mp3"
            
            # Skip if file already exists
            if output_path.exists():
                print(f"Skipping {key}.mp3 - already exists")
                continue
            
            print(f"\nProcessing entry {i}/{len(entries)}: {key}")
            print(f"Original text: {text}")
            success = generator.generate_speech(text, str(output_path))
            
            if success:
                print(f"Successfully generated {key}.mp3")
            
            # Add a small delay between requests to avoid rate limiting
            time.sleep(1)
            
    except FileNotFoundError:
        print(f"Error: Could not find input file {INPUT_FILE}")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in input file {INPUT_FILE}")
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    process_tractatus_to_speech()