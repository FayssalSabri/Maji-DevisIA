import os
import json
from typing import Dict, Any

def get_average_historical_cost() -> float:
    try:
        db_path = "database.json"
        if os.path.exists(db_path):
            with open(db_path, "r") as f:
                data = json.load(f)
                if not data:
                    return 0.0
                total = sum(q.get("totalCost", 0) for q in data)
                return total / len(data)
    except Exception as e:
        print(f"Error reading historical cost from database.json: {e}")
    return 0.0

def validate_quotation(specs: Dict[str, Any], costs: Dict[str, Any], config: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    AI-powered coherence validation engine with anomaly detection guardrails.
    Checks material, dimensional, mass, and cost consistency.
    """
    if config is None:
        config = {
            "mass_diff_critical": 0.5,
            "mass_diff_warn": 0.2,
            "min_manufacturing_cost": 5.00,
            "historical_diff_warn": 2.0  # 200% difference from avg
        }

    issues = []

    material = specs.get('material', {})
    dimensions = specs.get('dimensions', {})
    bends = specs.get('bends', [])
    holes = specs.get('holes', [])
    cost_details = costs.get('details', {})

    # ── 1. Material validation ──
    mat_type = material.get('type', '')
    if not mat_type or mat_type == 'Non renseigné':
        issues.append({
            "level": "fail",
            "title": "Matière manquante",
            "message": "Le type de matière n'a pas pu être détecté. Assignez manuellement la matière avant de continuer."
        })
    elif material.get('nuance', '') in ('Non renseigné', ''):
        issues.append({
            "level": "warn",
            "title": "Nuance matière absente",
            "message": "La nuance exacte n'a pas été détectée. Une nuance standard a été appliquée par défaut."
        })
    else:
        issues.append({
            "level": "pass",
            "title": "Matière identifiée",
            "message": f"{mat_type} — {material.get('nuance', '')} (ép. {material.get('thickness', 0)} mm)"
        })

    # ── 2. Dimension validation ──
    length = dimensions.get('length', 0)
    width = dimensions.get('width', 0)
    thickness = material.get('thickness', 0)

    if length == 0 or width == 0 or thickness == 0:
        issues.append({
            "level": "fail",
            "title": "Dimensions critiques manquantes",
            "message": "Impossible de calculer le volume sans longueur, largeur ou épaisseur."
        })
    else:
        issues.append({
            "level": "pass",
            "title": "Dimensions cohérentes",
            "message": f"Format brut: {length}×{width}×{thickness} mm détecté correctement."
        })

    # ── 3. Mass consistency check ──
    extracted_mass_g = dimensions.get('mass', 0)
    calculated_mass_kg = cost_details.get('calculatedMass', 0)

    if extracted_mass_g > 0 and calculated_mass_kg > 0:
        mass_kg = extracted_mass_g / 1000
        diff_ratio = abs(mass_kg - calculated_mass_kg) / mass_kg if mass_kg > 0 else 1

        if diff_ratio > config["mass_diff_critical"]:
            issues.append({
                "level": "fail",
                "title": "Incohérence de masse critique",
                "message": f"La masse indiquée ({mass_kg:.3f} kg) diffère de >{config['mass_diff_critical']*100}% de la masse calculée ({calculated_mass_kg:.4f} kg). Vérifiez les dimensions ou la densité matière."
            })
        elif diff_ratio > config["mass_diff_warn"]:
            issues.append({
                "level": "warn",
                "title": "Écart de masse détecté",
                "message": f"La masse indiquée ({mass_kg:.3f} kg) diffère de >{config['mass_diff_warn']*100}% de la masse calculée ({calculated_mass_kg:.4f} kg). Cela peut indiquer des évidements ou ajouts non modélisés."
            })
        else:
            issues.append({
                "level": "pass",
                "title": "Masse cohérente",
                "message": f"Masse extraite ({mass_kg:.3f} kg) et calculée ({calculated_mass_kg:.4f} kg) concordent."
            })

    # ── 4. Bending feasibility ──
    if bends:
        bending_issue = any(b.get('radius', 0) < thickness for b in bends)
        if bending_issue:
            issues.append({
                "level": "warn",
                "title": "Faisabilité pliage",
                "message": "Certains rayons de pliage sont inférieurs à l'épaisseur de tôle — risque de déchirure."
            })
        else:
            issues.append({
                "level": "pass",
                "title": "Pliage faisable",
                "message": f"{sum(b.get('quantity', 0) for b in bends)} plis détectés — rayons compatibles."
            })

    # ── 5. ANOMALY DETECTION: Minimum cost threshold ──
    total_ht = costs.get('total', 0)
    subtotal = costs.get('subtotal', 0)
    
    if subtotal < config["min_manufacturing_cost"]:
        issues.append({
            "level": "warn",
            "title": "Seuil industriel bas",
            "message": f"Le coût de production ({subtotal:.2f} €) est inférieur au seuil minimum ({config['min_manufacturing_cost']:.2f} €). Vérifiez les quantités du lot ou les paramètres machine."
        })

    # ── 6. ANOMALY DETECTION: Historical Comparison ──
    avg_cost = get_average_historical_cost()
    if avg_cost > 0 and total_ht > 0:
        if total_ht > avg_cost * (1 + config["historical_diff_warn"]):
            issues.append({
                "level": "warn",
                "title": "Coût anormalement élevé",
                "message": f"Le coût total ({total_ht:.2f} €) est significativement supérieur à la moyenne historique ({avg_cost:.2f} €). Vérifiez les paramètres de temps de coupe ou les tarifs."
            })

    # ── 7. Missing holes check ──
    if not holes:
        issues.append({
            "level": "warn",
            "title": "Aucun perçage détecté",
            "message": "Aucun perçage n'a été détecté. Assurez-vous que c'est attendu pour cette pièce."
        })

    # ── 8. Surface area / weight plausibility ──
    surface_m2 = cost_details.get('surfaceAreaM2', 0)
    if surface_m2 > 0 and calculated_mass_kg > 0 and thickness > 0:
        # Standard density estimate kg/m2 per mm
        expected_mass = surface_m2 * 7.85 * thickness
        if expected_mass > 0:
            ratio = calculated_mass_kg / expected_mass
            if ratio > 3.0:
                issues.append({
                    "level": "warn",
                    "title": "Masse anormalement élevée",
                    "message": "La masse calculée semble trop élevée pour la surface et l'épaisseur données. Pièce massive ou pleine ?"
                })
            elif ratio < 0.3:
                issues.append({
                    "level": "warn",
                    "title": "Masse anormalement faible",
                    "message": "La masse calculée semble trop faible pour la surface. Beaucoup de découpes intérieures ?"
                })

    # ── Score calculation ──
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

    # ── AI Reasoning summary ──
    total_holes_count = cost_details.get('totalHoles', 0)
    total_bends_count = cost_details.get('totalBends', 0)
    cutting_length = cost_details.get('totalCuttingLengthMm', 0)

    ai_reasoning = (
        f"Analyse du plan technique — Réf. {specs.get('identification', {}).get('reference', 'N/A')}:\n"
        f"• Détecté {total_holes_count} perçage(s) et {total_bends_count} pli(s) à partir des annotations du plan.\n"
        f"• Longueur totale de découpe estimée: {cutting_length:.0f} mm (périmètre + découpes trous).\n"
        f"• Masse calculée: {calculated_mass_kg:.4f} kg basée sur la densité {mat_type}.\n"
        f"• Score de fiabilité global: {score}/100."
    )

    return {
        "issues": issues,
        "score": score,
        "status": status,
        "aiReasoning": ai_reasoning
    }
