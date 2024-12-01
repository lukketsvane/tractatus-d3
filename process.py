import json
import re
from typing import Dict, Any, List

def strip_html_tags(text: str) -> str:
    """Remove HTML tags from text while preserving emphasized text content."""
    # First preserve emphasized text
    text = text.replace('<em>', '*').replace('</em>', '*')
    # Remove all HTML tags
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text).strip()

def process_node(node: Dict[Any, Any]) -> List[Dict[str, str]]:
    """Recursively process JSON nodes and extract key-text pairs."""
    results = []
    
    # Process current node if it has content with English text
    if 'content' in node and node['content'] and 'en' in node['content']:
        clean_text = strip_html_tags(node['content']['en'])
        if clean_text:  # Only add if there's actual text content
            results.append({
                'key': node['key'],
                'text': clean_text
            })
    
    # Recursively process children
    if 'children' in node and node['children']:
        for child in node['children']:
            results.extend(process_node(child))
            
    return results

def process_tractatus(input_file: str, output_file: str):
    """
    Process the Tractatus JSON file and write simplified version to output file.
    
    Args:
        input_file (str): Path to input JSON file
        output_file (str): Path to output JSON file
    """
    try:
        # Read input JSON
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Process the data
        processed_data = process_node(data)
        
        # Write to output file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(processed_data, f, indent=2, ensure_ascii=False)
            
        print(f"Successfully processed file. Output written to {output_file}")
        
    except FileNotFoundError:
        print(f"Error: Could not find input file {input_file}")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in input file {input_file}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    input_file = "simplified-tractatus.json"
    output_file = "tractatus-english.json"
    process_tractatus(input_file, output_file)