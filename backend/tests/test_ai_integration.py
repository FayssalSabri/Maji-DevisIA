import os
import pytest
from unittest.mock import patch
from services.ai_service import extract_specs_from_file

# Check if we have real API keys in the environment
HAS_REAL_KEYS = bool(os.getenv("GROQ_API_KEY"))

@pytest.mark.skipif(not HAS_REAL_KEYS, reason="Skipping integration test because GROQ_API_KEY is not set (e.g., in GitHub Actions)")
@patch("services.ai_service.extract_text_from_file")
def test_real_groq_extraction(mock_extract_text):
    """
    Integration test that makes a REAL API call to Groq.
    It will run locally if you have GROQ_API_KEY in your .env.
    It will be skipped in GitHub actions to prevent failures.
    """
    # We only mock the PDF extraction to simulate a real drawing's text
    mock_extract_text.return_value = "RENAULT TRUCKS \n REF: 21597494 \n MAT: Steel S235JR \n THICKNESS: 2mm"
    
    # This will make a REAL call to Groq because groq_client is NOT mocked
    result = extract_specs_from_file(b"dummy pdf content", "dummy.pdf")
    
    # We assert the real AI correctly parsed the text
    assert result["identification"]["reference"] == "21597494"
    assert "Steel" in result["material"]["type"]
    assert "confidences" in result

