export const baseVariation = { width: 1, depth: 1, height: 1 };
export const variationPresets = [
  { name: 'Original', ...baseVariation },
  { name: 'Wide canopy', width: 1.3, depth: 1.1, height: 0.85 },
  { name: 'Tall shell', width: 0.9, depth: 0.9, height: 1.25 },
  { name: 'Compact', width: 0.8, depth: 0.8, height: 0.85 },
];
export function transformPoint(point, variation) { return [point[0] * variation.width, point[1] * variation.height, point[2] * variation.depth]; }
export function inversePoint(point, variation) { return [point[0] / variation.width, point[1] / variation.height, point[2] / variation.depth]; }
export function varyColumns(columns, variation) {
  return columns.map(column => { const a = transformPoint(column.a, variation), b = transformPoint(column.b, variation); return { ...column, a, b, length: Math.hypot(...a.map((v, i) => b[i] - v)) }; });
}
export function metricValue(member, metric) {
  return metric === 'stress' ? member.stress / 1e6 : metric === 'buckling' ? member.bucklingRatio : member.magnitude * 1000;
}
export const metrics = { displacement: { label: 'Tip displacement', unit: 'mm' }, stress: { label: 'Peak elastic stress', unit: 'MPa' }, buckling: { label: 'Compression / Euler', unit: '' } };
