import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shapeMembers,shellFormDefaults,buildNetwork} from '../src/shell-model.js';
import {roofControlPoints,applyRoofControls} from '../src/roof-controls.js';
const source=JSON.parse(fs.readFileSync(new URL('../src/generated/members.json',import.meta.url)));
test('roof handles interpolate their offsets while rings and columns remain fixed',()=>{
 const base=shapeMembers(source,shellFormDefaults),points=roofControlPoints(base);
 assert.equal(points.length,8);
 const offsets=[.8,-.4,.2,0,0,0,.3,0],edited=applyRoofControls(base,{roofOffsets:offsets});
 for(const c of points){const member=base.find(m=>m.layer==='06'&&m.points.includes(c.point));const i=member.points.indexOf(c.point);assert.ok(Math.abs(edited.find(m=>m.id===member.id).points[i][1]-c.point[1]-offsets[c.id])<1e-9);}
 for(const m of base.filter(m=>+m.layer<=2||['04.001','04.002','04.005'].includes(m.id)))assert.deepEqual(edited.find(n=>n.id===m.id),m);
 assert.deepEqual(applyRoofControls(base,{roofOffsets:[]}),base);
 assert.ok(edited.every(m=>m.points.flat().every(Number.isFinite)));
});
test('roof edits feed reinforcement and solver geometry and reset exactly',()=>{
 const form={...shellFormDefaults,reinforcement:'bands'},base=shapeMembers(source,form),edited=shapeMembers(source,{...form,roofOffsets:[.5,0,0,0,0,0,0,0]});
 assert.notDeepEqual(edited.filter(m=>m.generated),base.filter(m=>m.generated));
 const network=buildNetwork(edited);assert.equal(network.disconnected,0);assert.notDeepEqual(network.nodes,buildNetwork(base).nodes);
 assert.deepEqual(shapeMembers(source,{...form,roofOffsets:[]}),base);
});
