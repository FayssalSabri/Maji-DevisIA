export const defaultCostParameters = {
  materialRates: {
    'Steel': 1.20, // per kg
    'Aluminum': 3.50,
    'Stainless Steel': 4.80,
  },
  densities: {
    'Steel': 7.85, // kg/dm3
    'Aluminum': 2.70,
    'Stainless Steel': 8.00,
  },
  machineRates: {
    laser: 85, // per hour
    bending: 65, // per hour
    punching: 70, // per hour
  },
  laborRate: 35, // per hour
  defaultMargin: 0.25, // 25%
  times: {
    setupLaser: 15, // minutes
    setupBending: 20, // minutes
    perBend: 0.5, // minutes
    perHole: 0.1, // minutes
    cuttingSpeed: 2000, // mm per minute (simulated)
  }
};
