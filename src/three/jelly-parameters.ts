// Physics uses world-sized local units. Constraint strengths are in the range 0-1.
export const jellyParameters = {
  physics: {
    cells: [8, 6, 2] as const,
    timestep: 1 / 120,
    maxSubsteps: 6,
    iterations: 5,
    stiffness: 0.65,
    volumePreservation: 0.95,
    damping: 3.5,
    gravity: -0.6,
    recovery: 18,
    grabRadius: 0.38,
    grabStrength: 0.35,
    maxStretch: 0.85,
  },
  surface: { height: 1.32, depth: 1, radius: 0.115, segments: 8 },
  material: { transmission: 0.78, roughness: 0.23, ior: 1.38, absorption: 2.2 },
};
