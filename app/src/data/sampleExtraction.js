export const sampleExtraction = {
  identification: {
    reference: '21597494',
    designation: 'SUPPORT REAR BRAKE',
    client: 'Renault Group' // Mocked based on context
  },
  material: {
    type: 'Steel',
    nuance: 'S235JR', // Realistic guess if unassigned
    thickness: 2,
    treatment: 'None'
  },
  dimensions: {
    length: 60,
    width: 60,
    height: 2,
    developedSurface: 0.0004,
    cuttingLength: 40,
    volume: 8667.4,
    mass: 68
  },
  holes: [
    { shape: 'rond', diameter: 4, quantity: 2 },
    { shape: 'rond', diameter: 8, quantity: 2 }
  ],
  bends: [{ angle: 45, radius: 2, length: 60, quantity: 2 }],
  tolerances: {
    iso: 'ISO 2768 -m',
    notes: 'BENDING RADIUS: 2mm, UNDIMENSIONED RADIUS: 2mm, NO PAINT ON THREADS'
  },
  // Simulated AI confidences for UI
  confidences: {
    reference: 'high',
    designation: 'high',
    material: 'medium', // Because it wasn't specified in PDF text
    thickness: 'high',
    dimensions: 'high',
    holes: 'high',
    bends: 'medium'
  }
};
