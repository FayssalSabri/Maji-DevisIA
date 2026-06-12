import pytest
import json
from unittest.mock import patch, MagicMock
from services.ai_service import extract_specs_from_file, get_mock_extraction

@patch("services.ai_service.extract_text_from_file")
@patch("services.ai_service.groq_client")
def test_extract_specs_groq_success(mock_groq_client, mock_extract_text):
    mock_extract_text.return_value = "RENAULT TRUCKS \n REF: 21597494 \n MAT: Steel S235JR \n THICKNESS: 2mm"
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
    result = extract_specs_from_file(b"dummy pdf content", "dummy.pdf")
    assert result["identification"]["reference"] == "21597494"
    assert result["material"]["type"] == "Steel"
    assert "confidences" in result

@patch("services.ai_service.extract_text_from_file")
@patch("services.ai_service.groq_client")
def test_extract_specs_malformed_json(mock_groq_client, mock_extract_text):
    mock_extract_text.return_value = "Some valid text with more than 10 characters"
    mock_response = MagicMock()
    # Malformed JSON with markdown blocks
    mock_response.choices[0].message.content = '''
    Here is the result:
    ```json
    {
        "identification": {"reference": "123", "designation": "test", "client": "test"},
        "material": {"type": "Steel", "nuance": "S235JR", "thickness": 2.0, "treatment": "none"},
        "dimensions": {"length": 10, "width": 10, "height": 2, "developedSurface": 0, "cuttingLength": 0, "volume": 0, "mass": 0},
        "holes": [],
        "bends": [],
        "tolerances": {"iso": "none", "notes": "none"}
    }
    ```
    Have a nice day!
    '''
    mock_groq_client.chat.completions.create.return_value = mock_response
    
    # Should parse successfully because clean_json_response will strip markdown
    result = extract_specs_from_file(b"dummy pdf content", "dummy.pdf")
    assert result["identification"]["reference"] == "123"

@patch("services.ai_service.extract_images_base64_from_file")
@patch("services.ai_service.extract_text_from_file")
def test_extract_specs_fallback(mock_extract_text, mock_extract_image):
    mock_extract_text.return_value = ""
    mock_extract_image.return_value = ["dummy_base64"]
    
    with patch("services.ai_service.GROQ_API_KEY", None), \
         patch("services.ai_service.OPENROUTER_API_KEY", None), \
         patch("services.ai_service.GEMINI_API_KEY", None):
        
        result = extract_specs_from_file(b"", "dummy.pdf")
        expected = get_mock_extraction()
        assert result["identification"]["reference"] == expected["identification"]["reference"]
        assert result.get("is_mock") is True
