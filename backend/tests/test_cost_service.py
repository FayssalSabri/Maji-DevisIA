import pytest
from services.cost_service import calculate_costs
from services.ai_service import get_mock_extraction

def test_calculate_costs_basic():
    specs = get_mock_extraction()
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
    assert "material" in costs
    assert "cutting" in costs
    assert "bending" in costs

def test_calculate_costs_unknown_material():
    specs = get_mock_extraction()
    specs["material"]["type"] = "Unobtainium"
    params = {
        'densities': {'Steel': 7.85},
        'materialRates': {'Steel': 2.50},
        'machineRates': {'laser': 85, 'bending': 65},
        'times': {}
    }
    # Should use fallback values without crashing
    costs = calculate_costs(specs, params)
    assert costs["material"] >= 0

def test_margin_as_percentage():
    specs = get_mock_extraction()
    params1 = {'defaultMargin': 0.25}
    costs1 = calculate_costs(specs, params1)
    
    params2 = {'defaultMargin': 25} # percentage
    costs2 = calculate_costs(specs, params2)
    
    # Margin should be normalized to 0.25 in both cases
    assert costs1["margin"] == costs2["margin"]

def test_zero_dimensions():
    specs = get_mock_extraction()
    specs["dimensions"] = {"length": 0, "width": 0, "height": 0, "developedSurface": 0, "cuttingLength": 0, "mass": 0}
    params = {'densities': {'Steel': 7.85}, 'materialRates': {'Steel': 2.50}, 'times': {}}
    costs = calculate_costs(specs, params)
    assert costs["material"] == 0

def test_empty_holes_and_bends():
    specs = get_mock_extraction()
    specs["holes"] = []
    specs["bends"] = []
    params = {'densities': {'Steel': 7.85}, 'materialRates': {'Steel': 2.50}, 'times': {}}
    costs = calculate_costs(specs, params)
    assert costs["bending"] == 0
    assert costs["details"]["totalHoles"] == 0

@pytest.mark.parametrize("material_type, density, expected_mass", [
    ("Steel", 7.85, 0.05652),
    ("Aluminum", 2.7, 0.01944),
    ("Stainless", 8.0, 0.0576)
])
def test_different_materials(material_type, density, expected_mass):
    specs = get_mock_extraction()
    # 60x60x2 mm = 7200 mm3 = 7.2 cm3
    specs["dimensions"] = {"length": 60, "width": 60, "height": 2}
    # remove precalculated mass to force calculation
    if "mass" in specs["dimensions"]:
        del specs["dimensions"]["mass"]
    specs["material"]["type"] = material_type
    
    params = {
        'densities': {material_type: density},
        'materialRates': {material_type: 2.50},
        'times': {}
    }
    costs = calculate_costs(specs, params)
    assert costs["details"]["calculatedMass"] == pytest.approx(expected_mass, 0.01)

