import pytest
from unittest.mock import patch, MagicMock
from services.ai_service import extract_specs_from_file, get_mock_extraction

@patch("services.ai_service.extract_text_from_file")
@patch("services.ai_service.groq_client")
def test_extract_specs_groq_success(mock_groq_client, mock_extract_text):
    # Setup mock for PyMuPDF text extraction
    mock_extract_text.return_value = "RENAULT TRUCKS \n REF: 21597494 \n MAT: Steel S235JR \n THICKNESS: 2mm"

    # Setup mock for Groq API response
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '''
    {
        "identification": {"reference": "21597494", "designation": "SUPPORT REAR BRAKE", "client": "RENAULT TRUCKS"},
        "material": {"type": "Steel", "nuance": "S235JR", "thickness": 2.0, "treatment": "Non renseigné"},
        "dimensions": {"length": 60.0, "width": 60.0, "height": 2.0, "developedSurface": 0.0004, "cuttingLength": 40.0, "volume": 8667.4, "mass": 68.0},
        "holes": [{"shape": "rond", "diameter": 4.0, "quantity": 2}],
        "bends": [{"angle": 45.0, "radius": 2.0, "length": 60.0, "quantity": 2}],
        "tolerances": {"iso": "ISO 2768 -m", "notes": "BENDING RADIUS: 2mm"}
    }
    '''
    mock_groq_client.chat.completions.create.return_value = mock_response

    # Dummy file bytes and name
    dummy_bytes = b"dummy pdf content"
    
    result = extract_specs_from_file(dummy_bytes, "dummy.pdf")

    # Assert expected JSON parsing
    assert result["identification"]["reference"] == "21597494"
    assert result["material"]["type"] == "Steel"
    assert result["material"]["thickness"] == 2.0
    assert len(result["holes"]) == 1
    
    # Assert confidences injected
    assert "confidences" in result
    assert result["confidences"]["reference"] == "high"


@patch("services.ai_service.extract_text_from_file")
def test_extract_specs_fallback(mock_extract_text):
    # If no text is extracted and no API keys are present, it falls back to mock
    mock_extract_text.return_value = ""
    
    # Temporarily remove API keys from env via patch or assume test env has them disabled
    with patch("services.ai_service.OPENROUTER_API_KEY", None), \
         patch("services.ai_service.GEMINI_API_KEY", None):
        
        result = extract_specs_from_file(b"", "dummy.pdf")
        
        # Should return exactly the mock extraction
        expected = get_mock_extraction()
        assert result["identification"]["reference"] == expected["identification"]["reference"]
