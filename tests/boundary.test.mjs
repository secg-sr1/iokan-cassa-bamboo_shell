import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {shapeMembers,shellFormDefaults} from '../src/shell-model.js';import {isBoundary} from '../src/boundary.js';
const source=JSON.parse(fs.readFileSync(new URL('../src/generated/members.json',import.meta.url)));
test('columns stay collinear after combined global, ring and boundary changes',()=>{
 for(const form of [shellFormDefaults,{...shellFormDefaults,twist:15,rise:2,supportSpread:1.2,outerRingHeight:14,outerRingRadius:12,boundaryWidth:1.2,boundaryFront:2,boundaryLeft:-1}]){
 const ms=shapeMembers(source,form);for(const m of ms.filter(m=>+m.layer<=2)){const a=m.points[0],b=m.points.at(-1),v=b.map((x,i)=>x-a[i]),L=Math.hypot(...v);for(const p of m.points){const w=p.map((x,i)=>x-a[i]),cross=[v[1]*w[2]-v[2]*w[1],v[2]*w[0]-v[0]*w[2],v[0]*w[1]-v[1]*w[0]];assert.ok(Math.hypot(...cross)/L<1e-9,m.id);}}
 }
});
test('boundary changes move covering while retaining design rings and column bases',()=>{
 const base=shapeMembers(source,shellFormDefaults),edited=shapeMembers(source,{...shellFormDefaults,boundaryFront:2,boundaryLength:1.15});
 for(const id of ['04.001','04.002','04.005'])assert.deepEqual(edited.find(m=>m.id===id).points,base.find(m=>m.id===id).points);
 for(const m of base.filter(m=>+m.layer<=2)){const p=m.points.reduce((a,b)=>a[1]<b[1]?a:b),q=edited.find(n=>n.id===m.id).points.reduce((a,b)=>a[1]<b[1]?a:b);assert.deepEqual(p,q);}
 assert.ok(edited.some((m,i)=>isBoundary(m)&&JSON.stringify(m.points)!==JSON.stringify(base[i].points)));
 assert.ok(edited.some((m,i)=>m.layer==='06'&&JSON.stringify(m.points)!==JSON.stringify(base[i].points)));
});
