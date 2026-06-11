export const defaultCostParameters = {
  materialRates: {
    'Steel': 2.50,           // €/kg — industrial steel benchmark
    'Aluminum': 4.80,        // €/kg
    'Stainless Steel': 6.50, // €/kg
  },
  densities: {
    'Steel': 7.85,           // kg/dm³ (= 7.85 × 10⁻⁶ kg/mm³)
    'Aluminum': 2.70,
    'Stainless Steel': 8.00,
  },
  machineRates: {
    laser: 85,     // €/hour
    bending: 65,   // €/hour
    punching: 70,  // €/hour
  },
  laborRate: 35,         // €/hour
  defaultMargin: 0.25,  // 25%
  machineOverhead: 1.0, // coefficient (1.0 = no overhead)
  times: {
    setupLaser: 15,     // minutes
    setupBending: 20,   // minutes
    perBend: 0.5,       // minutes per bend
    perHole: 0.1,       // minutes per hole
    cuttingSpeed: 2000, // mm per minute
  }
};
