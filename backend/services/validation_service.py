from typing import Dict, Any

def validate_quotation(specs: Dict[str, Any], costs: Dict[str, Any]) -> Dict[str, Any]:
    issues = []
    
    material = specs.get('material', {})
    dimensions = specs.get('dimensions', {})
    bends = specs.get('bends', [])
    cost_details = costs.get('details', {})

    # 1. Check material
    mat_type = material.get('type', '')
    if not mat_type or mat_type == 'Non renseigné':
        issues.append({
            "level": "fail",
            "title": "Matière manquante",
            "message": "Le type de matière n'a pas pu être détecté de manière fiable sur le plan."
        })
    elif material.get('nuance', '') == 'Non renseigné':
        issues.append({
            "level": "warn",
            "title": "Nuance matière absente",
            "message": "Une nuance standard a été assignée par défaut."
        })

    # 2. Check dimensions
    length = dimensions.get('length', 0)
    width = dimensions.get('width', 0)
    thickness = material.get('thickness', 0)
    
    if length == 0 or width == 0 or thickness == 0:
        issues.append({
            "level": "fail",
            "title": "Dimensions critiques manquantes",
            "message": "Impossible de valider le volume sans L, l ou épaisseur."
        })

    # 3. Compare mass
    extracted_mass_g = dimensions.get('mass', 0)
    calculated_mass_kg = cost_details.get('calculatedMass', 0)
    
    if extracted_mass_g > 0 and calculated_mass_kg > 0:
        mass_kg = extracted_mass_g / 1000
        diff_ratio = abs(mass_kg - calculated_mass_kg) / mass_kg
        
        if diff_ratio > 0.2:
            issues.append({
                "level": "warn",
                "title": "Incohérence de masse",
                "message": f"La masse indiquée ({mass_kg:.3f}kg) diffère de plus de 20% de la masse calculée ({calculated_mass_kg:.3f}kg)."
            })
        else:
            issues.append({
                "level": "pass",
                "title": "Masse cohérente",
                "message": "La masse extraite correspond à la géométrie."
            })

    # 4. Feasibility (bending radius)
    bending_issue = any(b.get('radius', 0) < thickness for b in bends)
    if bending_issue:
        issues.append({
            "level": "warn",
            "title": "Faisabilité pliage",
            "message": "Attention, certains rayons de pliage sont inférieurs à l'épaisseur de tôle, risque de déchirure."
        })

    # Score
    score = 100
    has_fail = False
    
    for i in issues:
        if i['level'] == 'fail':
            score -= 30
            has_fail = True
        elif i['level'] == 'warn':
            score -= 10
            
    score = max(0, score)
    status = 'fail' if has_fail else ('warn' if score < 80 else 'pass')

    return {
        "issues": issues,
        "score": score,
        "status": status
    }
