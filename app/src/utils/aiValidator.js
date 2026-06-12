export const validateQuotation = (specs, costs) => {
  const issues = [];
  
  // 1. Check material info completeness
  if (!specs.material.type || specs.material.type === 'Non renseigné') {
    issues.push({
      level: 'fail',
      title: 'Matière manquante',
      message: 'Le type de matière n\'a pas pu être détecté de manière fiable sur le plan.'
    });
  } else if (!specs.material.nuance || specs.material.nuance === 'Non renseigné') {
    issues.push({
      level: 'warn',
      title: 'Nuance matière absente',
      message: 'Une nuance standard (ex: S235JR) a été assignée par défaut.'
    });
  }

  // 2. Check dimension consistency
  if (specs.dimensions.length === 0 || specs.dimensions.width === 0 || specs.material.thickness === 0) {
    issues.push({
      level: 'fail',
      title: 'Dimensions critiques manquantes',
      message: 'Impossible de valider le volume sans L, l ou épaisseur.'
    });
  }

  // 3. Compare extracted mass vs calculated mass
  if (specs.dimensions.mass > 0 && costs.details.calculatedMass > 0) {
    const massKg = specs.dimensions.mass / 1000;
    const diffRatio = Math.abs(massKg - costs.details.calculatedMass) / massKg;
    
    // If difference is > 20%
    if (diffRatio > 0.2) {
      issues.push({
        level: 'warn',
        title: 'Incohérence de masse',
        message: `La masse indiquée (${massKg.toFixed(3)}kg) diffère de plus de 20% de la masse théorique calculée (${costs.details.calculatedMass.toFixed(3)}kg).`
      });
    } else {
      issues.push({
        level: 'pass',
        title: 'Masse cohérente',
        message: 'La masse extraite correspond à la géométrie de la pièce.'
      });
    }
  }

  // 4. Feasibility (Bending radius vs thickness)
  let bendingIssue = false;
  (specs.bends || []).forEach(b => {
    if (b.radius < specs.material.thickness) {
      bendingIssue = true;
    }
  });
  if (bendingIssue) {
    issues.push({
      level: 'warn',
      title: 'Faisabilité pliage',
      message: 'Attention, certains rayons de pliage sont inférieurs à l\'épaisseur de tôle, risque de déchirure.'
    });
  }

  // Overall score
  let score = 100;
  let hasFail = false;
  issues.forEach(i => {
    if (i.level === 'fail') { score -= 30; hasFail = true; }
    if (i.level === 'warn') score -= 10;
  });

  return {
    issues,
    score: Math.max(0, score),
    status: hasFail ? 'fail' : (score < 80 ? 'warn' : 'pass')
  };
};
