// Independent, prismatic Euler–Bernoulli cantilevers. SI internally.
// This is not a connected frame/shell solver: no shell load transfer is inferred.
export const defaults = { unitScale: 1, diameter: 200, thickness: 20, modulus: 12, vertical: 0.2, horizontal: 0.02, amplification: 10 };
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
export function solveColumns(columns, parameters) {
  const { unitScale, diameter, thickness, modulus, vertical, horizontal } = parameters;
  if (![unitScale, diameter, thickness, modulus, vertical, horizontal].every(Number.isFinite) || unitScale <= 0 || diameter <= 0 || thickness <= 0 || thickness * 2 >= diameter || modulus <= 0 || vertical < 0) return { error: 'Use positive scale, diameter, wall and stiffness. Wall must be less than half the diameter; downward load cannot be negative.', members: [] };
  const D = diameter / 1000, d = D - 2 * thickness / 1000, E = modulus * 1e9;
  const A = Math.PI * (D * D - d * d) / 4, I = Math.PI * (D ** 4 - d ** 4) / 64;
  const F = [horizontal * 1000, -vertical * 1000, 0];
  const members = columns.map(column => {
    const delta = column.b.map((v, i) => (v - column.a[i]) * unitScale), L = Math.hypot(...delta);
    if (L <= 1e-9) throw new Error('Zero-length column');
    const axis = delta.map(v => v / L), axial = dot(F, axis), transverse = F.map((v, i) => v - axial * axis[i]);
    const shear = Math.hypot(...transverse), moment = shear * L;
    const compression = Math.max(0, -axial), euler = Math.PI ** 2 * E * I / (2 * L) ** 2;
    function displacement(t) {
      const x = t * L, bending = x * x * (3 * L - x) / (6 * E * I);
      return axis.map((v, i) => v * axial * x / (E * A) + transverse[i] * bending);
    }
    const tip = displacement(1), magnitude = Math.hypot(...tip);
    const points = Array.from({ length: 25 }, (_, i) => ({ t: i / 24, displacement: displacement(i / 24) }));
    return { ...column, L, axial, shear, moment, euler, bucklingRatio: compression / euler, stress: Math.abs(axial) / A + moment * D / (2 * I), tip, magnitude, points, largeDeflection: magnitude > L * 0.05, reaction: F.map(v => -v), baseMoment: [-(delta[1] * F[2] - delta[2] * F[1]), -(delta[2] * F[0] - delta[0] * F[2]), -(delta[0] * F[1] - delta[1] * F[0])] };
  });
  return { members, A, I, forcePerColumn: F, maxDisplacement: Math.max(0, ...members.map(m => m.magnitude)), maxStress: Math.max(0, ...members.map(m => m.stress)), maxBucklingRatio: Math.max(0, ...members.map(m => m.bucklingRatio)), outOfDomain: members.some(m => m.largeDeflection || m.bucklingRatio >= 1) };
}
