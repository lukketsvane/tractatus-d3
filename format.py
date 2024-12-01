import json

def convert_format():
    # Read the original file
    with open('mp3_links.txt', 'r') as file:
        lines = file.readlines()
    
    # Convert to dictionary
    links_dict = {}
    for line in lines:
        if ': ' in line:
            key, url = line.strip().split(': ')
            links_dict[key] = url
    
    # Write as JSON with specific formatting
    with open('mp3_links_formatted.txt', 'w') as file:
        for i, (key, value) in enumerate(links_dict.items()):
            # Add comma for all lines except the last one
            comma = "," if i < len(links_dict) - 1 else ""
            file.write(f'"{key}": "{value}"{comma}\n')

if __name__ == "__main__":
    convert_format()
    print("Conversion complete! Check mp3_links_formatted.txt")