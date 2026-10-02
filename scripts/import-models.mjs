import fs from 'node:fs';
import draco3d from 'draco3d';
import { Matrix4, Quaternion, Vector3 } from 'three';
const D = await draco3d.createDecoderModule({});
const columns = [], report = [];
function positions(p, j, bin) {
  const ext = p.extensions.KHR_draco_mesh_compression, view = j.bufferViews[ext.bufferView];
  const bytes = bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
  const buffer = new D.DecoderBuffer(), decoder = new D.Decoder(), mesh = new D.Mesh(), values = new D.DracoFloat32Array();
  buffer.Init(new Int8Array(bytes), bytes.length);
  const status = decoder.DecodeBufferToMesh(buffer, mesh);
  if (!status.ok()) throw new Error(status.error_msg());
  decoder.GetAttributeFloatForAllPoints(mesh, decoder.GetAttributeByUniqueId(mesh, ext.attributes.POSITION), values);
  const points = [];
  for (let i = 0; i < values.size(); i += 3) points.push(new Vector3(values.GetValue(i), values.GetValue(i + 1), values.GetValue(i + 2)));
  [values, mesh, decoder, buffer].forEach(v => D.destroy(v));
  return points;
}
function fit(points) {
  const ps = [...new Map(points.map(p => [p.toArray().map(v => v.toFixed(5)).join(','), p])).values()];
  const mean = ps.reduce((s, p) => s.add(p), new Vector3()).divideScalar(ps.length), cov = Array(9).fill(0);
  for (const p of ps) { const v = p.clone().sub(mean).toArray(); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cov[i * 3 + j] += v[i] * v[j]; }
  const axis = new Vector3(0.3, 1, 0.2).normalize();
  for (let k = 0; k < 80; k++) { const v = axis.toArray(); axis.set(...[0, 1, 2].map(i => cov[i * 3] * v[0] + cov[i * 3 + 1] * v[1] + cov[i * 3 + 2] * v[2])).normalize(); }
  const ts = ps.map(p => p.clone().sub(mean).dot(axis)), lo = Math.min(...ts), hi = Math.max(...ts);
  function end(t) { const ring = ps.filter((_, i) => Math.abs(ts[i] - t) < (hi - lo) * 0.01); return ring.reduce((s, p) => s.add(p), new Vector3()).divideScalar(ring.length); }
  let a = end(lo), b = end(hi); if (a.y > b.y) [a, b] = [b, a];
  const rmsRadius = Math.sqrt(ps.reduce((s, p) => { const v = p.clone().sub(mean); return s + v.lengthSq() - v.dot(axis) ** 2; }, 0) / ps.length);
  return { a: a.toArray(), b: b.toArray(), length: a.distanceTo(b), rmsRadius, method: 'PCA axis + end-ring centroids; inferred from solid' };
}
for (const file of fs.readdirSync('models').filter(f => f.endsWith('.glb') && !f.includes('generated'))) {
  const bytes = fs.readFileSync('models/' + file), n = bytes.readUInt32LE(12), j = JSON.parse(bytes.subarray(20, 20 + n)), bin = bytes.subarray(28 + n);
  report.push({ file, nodes: j.nodes?.length || 0, primitives: j.meshes?.reduce((n, m) => n + m.primitives.length, 0) || 0, empty: !j.meshes?.length });
  if (!file.startsWith('columnas-')) continue;
  const layer = file === 'columnas-00.glb' ? '01' : '02'; let index = 0;
  function walk(ni, parent = new Matrix4()) {
    const node = j.nodes[ni], local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(new Vector3().fromArray(node.translation || [0, 0, 0]), new Quaternion().fromArray(node.rotation || [0, 0, 0, 1]), new Vector3().fromArray(node.scale || [1, 1, 1]));
    const transform = parent.clone().multiply(local);
    if (node.mesh !== undefined) for (const p of j.meshes[node.mesh].primitives) columns.push({ id: `${layer}.${String(++index).padStart(3, '0')}`, layer, source: file, ...fit(positions(p, j, bin).map(p => p.applyMatrix4(transform))) });
    node.children?.forEach(child => walk(child, transform));
  }
  j.scenes[j.scene || 0].nodes.forEach(node => walk(node));
}
fs.mkdirSync('src/generated', { recursive: true });
fs.writeFileSync('src/generated/columns.json', JSON.stringify(columns, null, 2));
fs.writeFileSync('src/generated/import-report.json', JSON.stringify(report, null, 2));
for (const layer of ['01', '02']) {
  const cs = columns.filter(c => c.layer === layer), bin = Buffer.from(new Float32Array(cs.flatMap(c => [...c.a, ...c.b])).buffer);
  const j = { asset: { version: '2.0', generator: 'Iokan inferred centerlines' }, scene: 0, scenes: [{ nodes: cs.map((_, i) => i) }], nodes: cs.map((c, i) => ({ name: c.id, mesh: i, extras: { source: c.source, method: c.method } })), meshes: cs.map((_, i) => ({ primitives: [{ attributes: { POSITION: i }, mode: 1 }] })), buffers: [{ byteLength: bin.length }], bufferViews: cs.map((_, i) => ({ buffer: 0, byteOffset: i * 24, byteLength: 24 })), accessors: cs.map((c, i) => ({ bufferView: i, componentType: 5126, count: 2, type: 'VEC3', min: c.a.map((v, k) => Math.min(v, c.b[k])), max: c.a.map((v, k) => Math.max(v, c.b[k])) })) };
  let json = Buffer.from(JSON.stringify(j)); json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
  const h = Buffer.alloc(20); h.writeUInt32LE(0x46546c67, 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(28 + json.length + bin.length, 8); h.writeUInt32LE(json.length, 12); h.writeUInt32LE(0x4e4f534a, 16);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(`models/columnas-${layer === '01' ? '00' : '01'}-curves-generated.glb`, Buffer.concat([h, json, bh, bin]));
}
console.log(JSON.stringify({ columns: columns.length, report, lengths: columns.map(c => ({ id: c.id, length: c.length, rmsRadius: c.rmsRadius })) }, null, 2));
