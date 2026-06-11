import pytest
from services.cost_service import calculate_costs
from services.ai_service import get_mock_extraction

def test_calculate_costs_basic():
    # Use mock extraction as the base specs
    specs = get_mock_extraction()
    
    # Default parameters as seen in the frontend `costParameters.js`
    params = {
        'densities': {'Steel': 7.85},
        'materialRates': {'Steel': 2.50},
        'machineRates': {'laser': 85, 'bending': 65},
        'times': {
            'setupLaser': 15,
            'setupBending': 20,
            'perBend': 0.5,
            'perHole': 0.1,
            'cuttingSpeed': 2000
        },
        'laborRate': 35,
        'defaultMargin': 0.25,
        'machineOverhead': 1.0
    }

    costs = calculate_costs(specs, params)

    # Validate output dictionary shape
    assert "material" in costs
    assert "cutting" in costs
    assert "bending" in costs
    assert "surfaceTreatment" in costs
    assert "labor" in costs
    assert "subtotal" in costs
    assert "total" in costs

    # Material cost check:
    # Mass was given as 68.0g -> 0.068 kg. Rate is 2.50 €/kg.
    # Cost = 0.068 * 2.50 = 0.17 €
    assert costs["material"] == pytest.approx(0.17, 0.01)

    # Cutting cost check:
    # Perimeter: cuttingLength = 40.0
    # Holes: 2x 4mm = 2*pi*4 = ~25.13
    # 2x 8mm = 2*pi*8 = ~50.26
    # Total cut = 40 + 25.13 + 50.26 = 115.39
    # Rate = 0.15 €/mm. Cost = 115.39 * 0.15 = 17.31 €
    assert costs["cutting"] == pytest.approx(17.31, 0.1)

    # Bending cost check:
    # 2 bends at 1.50 €/bend = 3.0 €
    assert costs["bending"] == 3.0

    # Surface treatment:
    # Developed surface is 0.0004 m², so rate applies -> 3.0 €
    assert costs["surfaceTreatment"] == 3.0

    # Labor time check:
    # Setup: 15 (laser) + 20 (bending) = 35 min
    # Cutting time: 115.39 / 2000 = 0.057 min
    # Bending time: 2 * 0.5 = 1 min
    # Holes time: 4 * 0.1 = 0.4 min
    # Total time = 35 + 0.057 + 1 + 0.4 = 36.457 min
    # Labor cost = (36.457 / 60) * 35 = 21.26 €
    assert costs["labor"] == pytest.approx(21.26, 0.1)

    # Total check:
    expected_subtotal = 0.17 + 17.31 + 3.0 + 3.0 + 21.26
    assert costs["subtotal"] == pytest.approx(expected_subtotal, 0.1)

def test_calculate_costs_no_surface_treatment():
    specs = get_mock_extraction()
    specs["dimensions"]["developedSurface"] = 0.0001 # Under 0.0004
    specs["dimensions"]["length"] = 10
    specs["dimensions"]["width"] = 10 # 100 mm2 = 0.0001 m2
    
    params = {'densities': {'Steel': 7.85}, 'materialRates': {'Steel': 2.50}, 'times': {}}
    
    costs = calculate_costs(specs, params)
    
    # Should be 0 because the area is too small
    assert costs["surfaceTreatment"] == 0.0

