export const calculateCosts = (specs, params) => {
  if (!specs || !params) return null;

  // 1. Material Cost
  const density = params.densities[specs.material?.type] || 7.85;
  const materialRate = params.materialRates[specs.material?.type] || 1.20;
  
  let volumeDm3 = 0;
  if (specs.dimensions?.developedSurface > 0) {
    volumeDm3 = specs.dimensions.developedSurface * (specs.material?.thickness || 0);
  } else {
    volumeDm3 = ((specs.dimensions?.length || 0) * (specs.dimensions?.width || 0) * (specs.material?.thickness || 0)) / 1000000;
  }
  
  const calculatedMass = volumeDm3 * density;
  const massToUse = (specs.dimensions?.mass > 0) ? (specs.dimensions.mass / 1000) : calculatedMass;
  const materialCost = massToUse * materialRate;

  // 2. Cutting Cost (Laser)
  const holesList = specs.holes || [];
  const holesPerimeter = holesList.reduce((sum, h) => sum + (Math.PI * (h.diameter || 0) * (h.quantity || 0)), 0);
  
  let cuttingLengthMm = specs.dimensions?.cuttingLength > 0 
    ? specs.dimensions.cuttingLength 
    : ((specs.dimensions?.length || 0) + (specs.dimensions?.width || 0)) * 2;
  
  cuttingLengthMm += holesPerimeter;

  const machineOverhead = params.machineOverhead || 1.0;
  const cuttingTimeMin = cuttingLengthMm / (params.times?.cuttingSpeed || 2000);
  const cuttingCost = (cuttingTimeMin / 60) * (params.machineRates?.laser || 85) * machineOverhead;

  // 3. Holes Time (Punching/Laser Setup)
  const totalHoles = holesList.reduce((sum, h) => sum + (h.quantity || 0), 0);
  const holesTimeMin = totalHoles * (params.times?.perHole || 0.1);
  const holesCost = (holesTimeMin / 60) * (params.machineRates?.laser || 85) * machineOverhead;

  // 4. Bending Cost
  const bendsList = specs.bends || [];
  const totalBends = bendsList.reduce((sum, b) => sum + (b.quantity || 0), 0);
  const bendingTimeMin = totalBends * (params.times?.perBend || 0.5);
  const bendingCost = (bendingTimeMin / 60) * (params.machineRates?.bending || 65) * machineOverhead;

  // 5. Surface Treatment
  let surfaceTreatmentCost = 0;
  const surfaceAreaM2 = specs.dimensions?.developedSurface || 
    (((specs.dimensions?.length || 0) * (specs.dimensions?.width || 0)) / 1000000);
  
  if (surfaceAreaM2 >= 0.0004) {
    surfaceTreatmentCost = 3.00;
  }

  // 6. Setup / Labor
  const setupLaser = params.times?.setupLaser || 15;
  const setupBending = totalBends > 0 ? (params.times?.setupBending || 20) : 0;
  
  const totalMachineTimeMin = setupLaser + setupBending + cuttingTimeMin + holesTimeMin + bendingTimeMin;
  const laborCost = (totalMachineTimeMin / 60) * (params.laborRate || 35);

  // Totals
  const subtotal = materialCost + cuttingCost + holesCost + bendingCost + surfaceTreatmentCost + laborCost;
  
  let marginPercent = params.defaultMargin || 0.25;
  if (marginPercent > 1) {
    marginPercent = marginPercent / 100;
  }
  
  const marginAmount = subtotal * marginPercent;
  const totalHT = subtotal + marginAmount;
  
  const vatRate = 0.20;
  const vatAmount = totalHT * vatRate;
  const totalTTC = totalHT + vatAmount;

  return {
    material: materialCost,
    cutting: cuttingCost,
    holes: holesCost,
    bending: bendingCost,
    surfaceTreatment: surfaceTreatmentCost,
    labor: laborCost,
    subtotal: subtotal,
    margin: marginAmount,
    total: totalHT,
    vatAmount: vatAmount,
    totalTTC: totalTTC,
    details: {
      calculatedMass: calculatedMass,
      totalMachineTimeMin: totalMachineTimeMin,
      totalCuttingLengthMm: cuttingLengthMm,
      totalBends: totalBends,
      totalHoles: totalHoles,
      surfaceAreaM2: surfaceAreaM2,
      marginPercent: marginPercent,
      vatRate: vatRate,
      machineOverhead: machineOverhead,
      laborRate: params.laborRate || 35
    }
  };
};
