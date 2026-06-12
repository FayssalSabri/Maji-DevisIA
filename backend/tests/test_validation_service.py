import pytest
from services.validation_service import validate_quotation
from services.ai_service import get_mock_extraction

def test_validation_pass():
    specs = get_mock_extraction()
    costs = {
        "subtotal": 50.0,
        "total": 100.0,
        "details": {
            "calculatedMass": 0.068,  # Matches extracted exactly
            "surfaceAreaM2": 0.0004,
            "totalHoles": 4,
            "totalBends": 2,
            "totalCuttingLengthMm": 115
        }
    }
    result = validate_quotation(specs, costs)
    assert result["status"] == "pass"

def test_validation_fail_missing_material():
    specs = get_mock_extraction()
    specs["material"]["type"] = ""
    costs = {
        "subtotal": 50.0,
        "total": 100.0,
        "details": {
            "calculatedMass": 0.068,
            "surfaceAreaM2": 0.0004,
            "totalHoles": 4,
            "totalBends": 2,
            "totalCuttingLengthMm": 115
        }
    }
    result = validate_quotation(specs, costs)
    assert result["status"] == "fail"
    assert any(i["title"] == "Matière manquante" for i in result["issues"])

def test_validation_warn_mass_mismatch():
    specs = get_mock_extraction()
    # Extracted mass is 68g
    costs = {
        "subtotal": 50.0,
        "total": 100.0,
        "details": {
            "calculatedMass": 0.088,  # >20% diff, but <50% diff
            "surfaceAreaM2": 0.0004,
            "totalHoles": 4,
            "totalBends": 2,
            "totalCuttingLengthMm": 115
        }
    }
    result = validate_quotation(specs, costs)
    assert result["score"] < 100
    assert any(i["title"] == "Écart de masse détecté" for i in result["issues"])

def test_validation_fail_zero_dimensions():
    specs = get_mock_extraction()
    specs["dimensions"]["length"] = 0
    costs = {
        "subtotal": 50.0,
        "total": 100.0,
        "details": {
            "calculatedMass": 0,
            "surfaceAreaM2": 0,
            "totalHoles": 0,
            "totalBends": 0,
            "totalCuttingLengthMm": 0
        }
    }
    result = validate_quotation(specs, costs)
    assert result["status"] == "fail"
    assert any(i["title"] == "Dimensions critiques manquantes" for i in result["issues"])

def test_validation_missing_holes():
    specs = get_mock_extraction()
    specs["holes"] = []
    costs = {
        "subtotal": 50.0,
        "total": 100.0,
        "details": {
            "calculatedMass": 0.068,
            "surfaceAreaM2": 0.0004,
            "totalHoles": 0,
            "totalBends": 2,
            "totalCuttingLengthMm": 115
        }
    }
    result = validate_quotation(specs, costs)
    assert any(i["title"] == "Aucun perçage détecté" for i in result["issues"])
