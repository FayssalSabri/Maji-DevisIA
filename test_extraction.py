import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from services.ai_service import extract_specs_from_file

try:
    with open('app/public/piece_003.png', 'rb') as f:
        file_content = f.read()

    result = extract_specs_from_file(file_content, 'piece_003.png')
    print("EXTRACTION SUCCESSFUL:")
    print(result)
except Exception as e:
    print(f"EXTRACTION FAILED: {e}")
