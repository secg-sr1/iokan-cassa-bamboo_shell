import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {shapeMembers,shellFormDefaults,buildNetwork} from '../src/shell-model.js';
import {cagePoints,editCage} from '../src/roof-cage.js';
const source=JSON.parse(fs.readFileSync(new URL('../src/generated/members.json',import.meta.url)));
test('Bezier cage translates roof in XYZ, holds bases and keeps columns straight',()=>{
 const base=shapeMembers(source,shellFormDefaults),delta=[.4,.6,-.3],roofCage=editCage({},0,'all',delta),ms=shapeMembers(source,{...shellFormDefaults,roofCage});
 assert.equal(cagePoints(base,{}).length,16);
 for(const m of base.filter(m=>+m.layer>2)){const actual=ms.find(n=>n.id===m.id);m.points.forEach((p,i)=>p.forEach((v,k)=>assert.ok(Math.abs(actual.points[i][k]-v-delta[k])<1e-8)));}
 for(const m of ms.filter(m=>+m.layer<=2)){const old=base.find(n=>n.id===m.id),i=old.points[0][1]<old.points.at(-1)[1]?0:old.points.length-1;assert.deepEqual(m.points[i],old.points[i]);const a=m.points[0],b=m.points.at(-1),d=b.map((v,k)=>v-a[k]);for(const p of m.points){const q=p.map((v,k)=>v-a[k]);assert.ok(Math.hypot(q[1]*d[2]-q[2]*d[1],q[2]*d[0]-q[0]*d[2],q[0]*d[1]-q[1]*d[0])<1e-7);}}
});
test('row edits, ring locking, reset and reinforcement regeneration',()=>{
 const roofCage=editCage({},5,'row',[0,.5,0]);assert.equal(roofCage.filter(p=>p[1]).length,4);
 const f={...shellFormDefaults,reinforcement:'bands'},base=shapeMembers(source,f),ms=shapeMembers(source,{...f,roofCage,roofLockRings:true});
 for(const id of ['04.001','04.002','04.005'])assert.deepEqual(ms.find(m=>m.id===id),base.find(m=>m.id===id));
 assert.notDeepEqual(ms,base);assert.equal(buildNetwork(ms).disconnected,0);
 assert.deepEqual(shapeMembers(source,{...f,roofCage:[]}),base);
});

