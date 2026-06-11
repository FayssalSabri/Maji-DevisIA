import json
from services.ai_service import extract_specs_from_file

def test_extraction():
    try:
        with open("../docs/piece_003.pdf", "rb") as f:
            pdf_bytes = f.read()
        
        result = extract_specs_from_file(pdf_bytes, "piece_003.pdf")
        
        print("\n--- EXTRACTION RESULT ---")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("--- END OF RESULT ---\n")
    except Exception as e:
        print(f"Error reading file or extracting: {e}")

if __name__ == "__main__":
    test_extraction()
