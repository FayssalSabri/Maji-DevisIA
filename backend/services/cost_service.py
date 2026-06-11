from typing import Dict, Any

def calculate_costs(specs: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Industrial cost calculation engine for sheet metal fabrication.
    Uses standardized manufacturing formulas aligned with Maji Group business model.
    """
    material_spec = specs.get('material', {})
    dimensions = specs.get('dimensions', {})
    holes = specs.get('holes', [])
    bends = specs.get('bends', [])

    # Extract parameters with industrial defaults
    densities = params.get('densities', {})
    material_rates = params.get('materialRates', {})
    machine_rates = params.get('machineRates', {})
    times = params.get('times', {})
    labor_rate = params.get('laborRate', 35)
    margin_pct = params.get('defaultMargin', 0.25)
    machine_overhead = params.get('machineOverhead', 1.0)

    mat_type = material_spec.get('type', 'Steel')
    thickness = material_spec.get('thickness', 2.0)

    # ══════════════════════════════════════════════════════
    # 1. MATERIAL COST
    #    Mass = Length × Width × Thickness × Density
    #    Steel density ≈ 7.85 × 10⁻⁶ kg/mm³ (= 7.85 kg/dm³)
    #    Base cost: €2.50/kg (industrial steel benchmark)
    # ══════════════════════════════════════════════════════
    density = densities.get(mat_type, 7.85)  # kg/dm³
    material_rate = material_rates.get(mat_type, 2.50)  # €/kg

    length = dimensions.get('length', 0)
    width = dimensions.get('width', 0)
    volume_mm3 = dimensions.get('volume', 0)

    if volume_mm3 > 0:
        volume_dm3 = volume_mm3 / 1_000_000
    elif length > 0 and width > 0:
        volume_dm3 = (length * width * thickness) / 1_000_000
    else:
        dev_surface = dimensions.get('developedSurface', 0)
        volume_dm3 = dev_surface * thickness

    calculated_mass = volume_dm3 * density  # kg
    extracted_mass_g = dimensions.get('mass', 0)
    mass_to_use = (extracted_mass_g / 1000) if extracted_mass_g > 0 else calculated_mass

    material_cost = mass_to_use * material_rate

    # ══════════════════════════════════════════════════════
    # 2. LASER CUTTING COST
    #    Based on total cutting length (perimeter + hole cutouts)
    #    Base rate: €0.15 per mm of cut
    # ══════════════════════════════════════════════════════
    cutting_length = dimensions.get('cuttingLength', 0)
    if cutting_length <= 0:
        cutting_length = (length + width) * 2  # Perimeter approximation

    # Add hole perimeters to cutting length
    import math
    hole_cutting_length = sum(
        math.pi * h.get('diameter', 0) * h.get('quantity', 0) for h in holes
    )
    total_cutting_length = cutting_length + hole_cutting_length

    cutting_rate_per_mm = 0.15  # €/mm
    cutting_cost = total_cutting_length * cutting_rate_per_mm * machine_overhead

    # ══════════════════════════════════════════════════════
    # 3. BENDING / PRESS BRAKE COST
    #    Fixed fee per bend line
    #    Base rate: €1.50 per bend
    # ══════════════════════════════════════════════════════
    total_bends = sum(b.get('quantity', 0) for b in bends)
    bend_rate = 1.50  # €/bend
    bending_cost = total_bends * bend_rate

    # ══════════════════════════════════════════════════════
    # 4. SURFACE TREATMENT / INDUSTRIAL PAINTING
    #    Fixed masking/processing fee per piece
    #    Minimum 0.0004 m² processing area
    #    Base rate: €3.00 flat fee per piece
    # ══════════════════════════════════════════════════════
    dev_surface_m2 = dimensions.get('developedSurface', 0)
    if dev_surface_m2 <= 0 and length > 0 and width > 0:
        dev_surface_m2 = (length * width) / 1_000_000  # mm² to m²
    surface_treatment_cost = 3.00 if dev_surface_m2 >= 0.0004 else 0.00

    # ══════════════════════════════════════════════════════
    # 5. LABOR & OVERHEAD SETUP
    #    Setup time amortized + operational hourly labor rate
    # ══════════════════════════════════════════════════════
    setup_laser_min = times.get('setupLaser', 15)
    setup_bending_min = times.get('setupBending', 20) if total_bends > 0 else 0
    cutting_speed = times.get('cuttingSpeed', 2000)  # mm/min
    per_bend_time = times.get('perBend', 0.5)
    per_hole_time = times.get('perHole', 0.1)

    total_holes = sum(h.get('quantity', 0) for h in holes)
    cutting_time_min = total_cutting_length / cutting_speed if cutting_speed > 0 else 0
    bending_time_min = total_bends * per_bend_time
    holes_time_min = total_holes * per_hole_time

    total_machine_time_min = (
        setup_laser_min + setup_bending_min +
        cutting_time_min + bending_time_min + holes_time_min
    )
    labor_cost = (total_machine_time_min / 60) * labor_rate

    # ══════════════════════════════════════════════════════
    # TOTALS
    # ══════════════════════════════════════════════════════
    subtotal = material_cost + cutting_cost + bending_cost + surface_treatment_cost + labor_cost
    margin_amount = subtotal * margin_pct
    total_ht = subtotal + margin_amount
    vat_rate = 0.20
    vat_amount = total_ht * vat_rate
    total_ttc = total_ht + vat_amount

    return {
        "material": round(material_cost, 2),
        "cutting": round(cutting_cost, 2),
        "bending": round(bending_cost, 2),
        "surfaceTreatment": round(surface_treatment_cost, 2),
        "labor": round(labor_cost, 2),
        "subtotal": round(subtotal, 2),
        "margin": round(margin_amount, 2),
        "total": round(total_ht, 2),
        "vatAmount": round(vat_amount, 2),
        "totalTTC": round(total_ttc, 2),
        "details": {
            "calculatedMass": round(calculated_mass, 4),
            "totalMachineTimeMin": round(total_machine_time_min, 2),
            "totalCuttingLengthMm": round(total_cutting_length, 1),
            "totalBends": total_bends,
            "totalHoles": total_holes,
            "surfaceAreaM2": round(dev_surface_m2, 6),
            "marginPercent": round(margin_pct * 100, 1),
            "vatRate": round(vat_rate * 100, 1),
            "machineOverhead": machine_overhead,
            "laborRate": labor_rate,
        }
    }
