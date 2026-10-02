import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, solveColumns } from '../src/solver.js';
import fs from 'node:fs';
import { baseVariation, transformPoint, inversePoint, varyColumns } from '../src/variations.js';
const c = [{ id: 'test', a: [0, 0, 0], b: [0, 3, 0] }];
const close = (a, b) => assert.ok(Math.abs(a - b) < Math.max(1e-10, Math.abs(b) * 1e-10), `${a} != ${b}`);
test('parametric geometry changes actual solver lengths and has a reversible note transform', () => {
  const v = { width: 1.3, depth: 0.8, height: 1.5 };
  const point = [3, 7, -5]; inversePoint(transformPoint(point, v), v).forEach((x, i) => close(x, point[i]));
  const base = varyColumns(c, baseVariation), taller = varyColumns(c, v);
  close(base[0].length, 3); close(taller[0].length, 4.5);
  const p = { ...defaults, vertical: 0, horizontal: 0.1 };
  close(solveColumns(taller, p).maxDisplacement / solveColumns(base, p).maxDisplacement, 1.5 ** 3);
  close(solveColumns(taller, p).members[0].euler / solveColumns(base, p).members[0].euler, 1 / 1.5 ** 2);
});
test('vertical member matches PL/EA and PL³/3EI, reactions and fixed base', () => {
  const p = { ...defaults, vertical: 1, horizontal: 0.1 }, r = solveColumns(c, p), m = r.members[0], E = p.modulus * 1e9;
  close(m.tip[0], 100 * 3 ** 3 / (3 * E * r.I)); close(m.tip[1], -1000 * 3 / (E * r.A));
  close(m.euler, Math.PI ** 2 * E * r.I / 6 ** 2); close(m.moment, 300);
  assert.deepEqual(m.points[0].displacement.map(v => v || 0), [0, 0, 0]); assert.deepEqual(m.reaction.map(v => v || 0), [-100, 1000, 0]);
});
test('zero load, linearity and geometry unit scaling', () => {
  const zero = solveColumns(c, { ...defaults, vertical: 0, horizontal: 0 }); close(zero.maxDisplacement, 0);
  const a = solveColumns(c, defaults), b = solveColumns(c, { ...defaults, vertical: defaults.vertical * 2, horizontal: defaults.horizontal * 2 }); close(b.maxDisplacement, a.maxDisplacement * 2);
  const mm = solveColumns([{ id: 'test', a: [0, 0, 0], b: [0, 3000, 0] }], { ...defaults, unitScale: 0.001 }); close(mm.maxDisplacement, a.maxDisplacement);
});
test('inclined member force projection and validation', () => {
  const r = solveColumns([{ id: 'inclined', a: [0, 0, 0], b: [3, 4, 0] }], { ...defaults, vertical: 1, horizontal: 0 }); close(r.members[0].axial, -800); close(r.members[0].shear, 600);
  assert.ok(solveColumns(c, { ...defaults, thickness: 200 }).error); assert.ok(solveColumns(c, { ...defaults, modulus: NaN }).error);
});
test('generated GLBs contain 18 finite two-point lines in source coordinates', () => {
  const columns = JSON.parse(fs.readFileSync(new URL('../src/generated/columns.json', import.meta.url)));
  assert.equal(columns.length, 18);
  for (const [file, layer] of [['00', '01'], ['01', '02']]) {
    const bytes = fs.readFileSync(new URL(`../models/columnas-${file}-curves-generated.glb`, import.meta.url));
    assert.equal(bytes.readUInt32LE(0), 0x46546c67); assert.equal(bytes.readUInt32LE(8), bytes.length);
    const size = bytes.readUInt32LE(12), json = JSON.parse(bytes.subarray(20, 20 + size));
    const members = columns.filter(c => c.layer === layer);
    assert.equal(json.nodes.length, members.length);
    json.meshes.forEach((mesh, i) => {
      assert.equal(mesh.primitives[0].mode, 1);
      const member = members[i]; assert.ok(member.a.every(Number.isFinite) && member.b.every(Number.isFinite));
      assert.ok(member.a[1] < member.b[1]); assert.ok(member.length > 7 && member.length < 11);
      [...member.a, ...member.b].forEach((v, k) => assert.ok(Math.abs(bytes.readFloatLE(28 + size + i * 24 + k * 4) - v) < 1e-5));
    });
  }
});
