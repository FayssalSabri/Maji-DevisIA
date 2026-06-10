export const calculateCosts = (specs, params) => {
  // 1. Material Cost
  const density = params.densities[specs.material.type] || 7.85;
  const materialRate = params.materialRates[specs.material.type] || 1.20;
  
  // Volume in dm3 for mass calculation
  // (length * width * thickness) / 1000000 = volume in dm3
  // Since we have developedSurface in m2, thickness in mm: volume = surface * thickness * 1000
  let volumeDm3;
  if (specs.dimensions.developedSurface > 0) {
    volumeDm3 = (specs.dimensions.developedSurface * specs.material.thickness);
  } else {
    volumeDm3 = (specs.dimensions.length * specs.dimensions.width * specs.material.thickness) / 1000000;
  }
  
  // Real mass in kg
  const calculatedMass = volumeDm3 * density;
  // Use specified mass if available, else calculated
  const massToUse = specs.dimensions.mass > 0 ? specs.dimensions.mass / 1000 : calculatedMass;
  
  const materialCost = massToUse * materialRate;

  // 2. Cutting Cost (Laser)
  const cuttingLengthMm = specs.dimensions.cuttingLength > 0 ? specs.dimensions.cuttingLength : (specs.dimensions.length + specs.dimensions.width) * 2;
  const cuttingTimeMin = cuttingLengthMm / params.times.cuttingSpeed;
  const cuttingCost = (cuttingTimeMin / 60) * params.machineRates.laser;

  // 3. Holes Cost (Punching or Laser)
  const totalHoles = specs.holes.reduce((sum, h) => sum + h.quantity, 0);
  const holesTimeMin = totalHoles * params.times.perHole;
  const holesCost = (holesTimeMin / 60) * params.machineRates.laser; // Assuming laser cuts holes too

  // 4. Bending Cost
  const totalBends = specs.bends.reduce((sum, b) => sum + b.quantity, 0);
  const bendingTimeMin = totalBends * params.times.perBend;
  const bendingCost = (bendingTimeMin / 60) * params.machineRates.bending;

  // 5. Setup / Labor
  const totalMachineTimeMin = params.times.setupLaser + (totalBends > 0 ? params.times.setupBending : 0) + cuttingTimeMin + holesTimeMin + bendingTimeMin;
  const laborCost = (totalMachineTimeMin / 60) * params.laborRate;

  const totalCost = materialCost + cuttingCost + holesCost + bendingCost + laborCost;
  const marginAmount = totalCost * params.defaultMargin;
  const sellingPrice = totalCost + marginAmount;

  return {
    material: materialCost,
    cutting: cuttingCost,
    holes: holesCost,
    bending: bendingCost,
    labor: laborCost,
    subtotal: totalCost,
    margin: marginAmount,
    total: sellingPrice,
    details: {
      calculatedMass: calculatedMass,
      totalMachineTimeMin: totalMachineTimeMin
    }
  };
};
