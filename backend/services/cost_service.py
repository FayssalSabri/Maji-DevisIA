import math
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

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

    # Normalize margin (if provided as 25 instead of 0.25)
    if margin_pct > 1:
        margin_pct = margin_pct / 100.0

    mat_type = material_spec.get('type', 'Steel')
    thickness = material_spec.get('thickness', 2.0)

    # ══════════════════════════════════════════════════════
    # 1. MATERIAL COST
    # ══════════════════════════════════════════════════════
    density = densities.get(mat_type)
    if density is None:
        logger.warning(f"Material '{mat_type}' not found in densities. Defaulting to 7.85 (Steel).")
        density = 7.85
        
    material_rate = material_rates.get(mat_type)
    if material_rate is None:
        logger.warning(f"Material rate for '{mat_type}' not found. Defaulting to €2.50/kg.")
        material_rate = 2.50

    length = dimensions.get('length', 0)
    width = dimensions.get('width', 0)
    volume_mm3 = dimensions.get('volume', 0)

    if length > 0 and width > 0 and thickness > 0:
        volume_dm3 = (length * width * thickness) / 1_000_000
    else:
        dev_surface = dimensions.get('developedSurface', 0)
        if dev_surface > 0:
            volume_dm3 = dev_surface * thickness
        else:
            volume_dm3 = volume_mm3 / 1_000_000

    calculated_mass = volume_dm3 * density  # kg
    extracted_mass_g = dimensions.get('mass', 0)
    mass_to_use = (extracted_mass_g / 1000) if extracted_mass_g > 0 else calculated_mass

    material_cost = mass_to_use * material_rate

    # ══════════════════════════════════════════════════════
    # 2. LASER CUTTING COST
    # ══════════════════════════════════════════════════════
    cutting_length = dimensions.get('cuttingLength', 0)
    if cutting_length <= 0:
        cutting_length = (length + width) * 2  # Perimeter approximation

    hole_cutting_length = sum(
        math.pi * h.get('diameter', 0) * h.get('quantity', 0) for h in holes
    )
    total_cutting_length = cutting_length + hole_cutting_length

    # Use parameter or default
    cutting_speed = times.get('cuttingSpeed', 2000)
    cutting_rate = machine_rates.get('laser', 85)
    
    # Actually calculate time based on length/speed, then cost based on rate
    cutting_time_min = total_cutting_length / cutting_speed if cutting_speed > 0 else 0
    cutting_cost = (cutting_time_min / 60) * cutting_rate * machine_overhead

    # ══════════════════════════════════════════════════════
    # 3. HOLES COST
    # ══════════════════════════════════════════════════════
    per_hole_time = times.get('perHole', 0.1)
    total_holes = sum(h.get('quantity', 0) for h in holes)
    holes_time_min = total_holes * per_hole_time
    holes_cost = (holes_time_min / 60) * cutting_rate * machine_overhead

    # ══════════════════════════════════════════════════════
    # 4. BENDING / PRESS BRAKE COST
    # ══════════════════════════════════════════════════════
    total_bends = sum(b.get('quantity', 0) for b in bends)
    per_bend_time = times.get('perBend', 0.5)
    bending_rate = machine_rates.get('bending', 65)
    bending_time_min = total_bends * per_bend_time
    bending_cost = (bending_time_min / 60) * bending_rate * machine_overhead

    # ══════════════════════════════════════════════════════
    # 5. SURFACE TREATMENT
    # ══════════════════════════════════════════════════════
    dev_surface_m2 = dimensions.get('developedSurface', 0)
    if dev_surface_m2 <= 0 and length > 0 and width > 0:
        dev_surface_m2 = (length * width) / 1_000_000  # mm² to m²
    surface_treatment_cost = 3.00 if dev_surface_m2 >= 0.0004 else 0.00

    # ══════════════════════════════════════════════════════
    # 6. LABOR & OVERHEAD SETUP
    # ══════════════════════════════════════════════════════
    setup_laser_min = times.get('setupLaser', 15)
    setup_bending_min = times.get('setupBending', 20) if total_bends > 0 else 0

    total_machine_time_min = (
        setup_laser_min + setup_bending_min +
        cutting_time_min + bending_time_min + holes_time_min
    )
    labor_cost = (total_machine_time_min / 60) * labor_rate

    # ══════════════════════════════════════════════════════
    # TOTALS
    # ══════════════════════════════════════════════════════
    subtotal = material_cost + cutting_cost + holes_cost + bending_cost + surface_treatment_cost + labor_cost
    margin_amount = subtotal * margin_pct
    total_ht = subtotal + margin_amount
    vat_rate = 0.20
    vat_amount = total_ht * vat_rate
    total_ttc = total_ht + vat_amount

    return {
        "material": round(material_cost, 2),
        "cutting": round(cutting_cost, 2),
        "holes": round(holes_cost, 2),
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
