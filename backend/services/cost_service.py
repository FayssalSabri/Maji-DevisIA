from typing import Dict, Any

def calculate_costs(specs: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
    # Extract specs
    material_spec = specs.get('material', {})
    dimensions = specs.get('dimensions', {})
    holes = specs.get('holes', [])
    bends = specs.get('bends', [])

    # Extract parameters
    densities = params.get('densities', {})
    material_rates = params.get('materialRates', {})
    machine_rates = params.get('machineRates', {})
    times = params.get('times', {})
    
    # 1. Material Cost
    mat_type = material_spec.get('type', 'Steel')
    thickness = material_spec.get('thickness', 2.0)
    density = densities.get(mat_type, 7.85)
    material_rate = material_rates.get(mat_type, 1.20)

    # Volume in dm3
    developed_surface = dimensions.get('developedSurface', 0)
    length = dimensions.get('length', 0)
    width = dimensions.get('width', 0)
    volume_mm3 = dimensions.get('volume', 0)
    
    if volume_mm3 > 0:
        volume_dm3 = volume_mm3 / 1000000
    elif length > 0 and width > 0:
        volume_dm3 = (length * width * thickness) / 1000000
    else:
        # Fallback to surface * thickness (m2 * mm = dm3)
        volume_dm3 = developed_surface * thickness

    calculated_mass = volume_dm3 * density
    extracted_mass = dimensions.get('mass', 0) / 1000 # Convert g to kg
    
    mass_to_use = extracted_mass if extracted_mass > 0 else calculated_mass
    material_cost = mass_to_use * material_rate

    # 2. Cutting Cost
    cutting_length = dimensions.get('cuttingLength', 0)
    if cutting_length <= 0:
        cutting_length = (length + width) * 2
        
    cutting_speed = times.get('cuttingSpeed', 2000)
    cutting_time_min = cutting_length / cutting_speed if cutting_speed > 0 else 0
    
    laser_rate = machine_rates.get('laser', 85)
    cutting_cost = (cutting_time_min / 60) * laser_rate

    # 3. Holes Cost
    total_holes = sum(h.get('quantity', 0) for h in holes)
    per_hole_time = times.get('perHole', 0.1)
    holes_time_min = total_holes * per_hole_time
    holes_cost = (holes_time_min / 60) * laser_rate

    # 4. Bending Cost
    total_bends = sum(b.get('quantity', 0) for b in bends)
    per_bend_time = times.get('perBend', 0.5)
    bending_time_min = total_bends * per_bend_time
    
    bending_rate = machine_rates.get('bending', 65)
    bending_cost = (bending_time_min / 60) * bending_rate

    # 5. Setup / Labor
    setup_laser = times.get('setupLaser', 15)
    setup_bending = times.get('setupBending', 20) if total_bends > 0 else 0
    
    total_machine_time_min = setup_laser + setup_bending + cutting_time_min + holes_time_min + bending_time_min
    
    labor_rate = params.get('laborRate', 35)
    labor_cost = (total_machine_time_min / 60) * labor_rate

    # Totals
    total_cost = material_cost + cutting_cost + holes_cost + bending_cost + labor_cost
    margin_pct = params.get('defaultMargin', 0.25)
    margin_amount = total_cost * margin_pct
    selling_price = total_cost + margin_amount

    return {
        "material": round(material_cost, 2),
        "cutting": round(cutting_cost, 2),
        "holes": round(holes_cost, 2),
        "bending": round(bending_cost, 2),
        "labor": round(labor_cost, 2),
        "subtotal": round(total_cost, 2),
        "margin": round(margin_amount, 2),
        "total": round(selling_price, 2),
        "details": {
            "calculatedMass": round(calculated_mass, 3),
            "totalMachineTimeMin": round(total_machine_time_min, 2)
        }
    }
