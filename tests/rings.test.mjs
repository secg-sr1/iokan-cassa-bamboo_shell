import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shapeMembers,shellFormDefaults} from '../src/shell-model.js';
import {ringDimensions} from '../src/rings.js';
const source=JSON.parse(fs.readFileSync(new URL('../src/generated/members.json',import.meta.url)));
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('ring targets independently control radius and elevation and retain the other ring',()=>{
 const base=shapeMembers(source,shellFormDefaults),dims=ringDimensions(base);
 for(const key of ['outer','inner']){
 const ref=dims.find(r=>r.key===key),form={...shellFormDefaults,[key+'RingRadius']:ref.radius*1.15,[key+'RingHeight']:ref.height+1.2},changed=shapeMembers(source,form),out=ringDimensions(changed);
 close(out.find(r=>r.key===key).radius,ref.radius*1.15);close(out.find(r=>r.key===key).height,ref.height+1.2);
 const other=dims.find(r=>r.key!==key),unchanged=out.find(r=>r.key!==key);close(other.radius,unchanged.radius);close(other.height,unchanged.height);
 for(const m of base.filter(m=>+m.layer<=2)){const i=m.points.reduce((best,p,j)=>p[1]<m.points[best][1]?j:best,0);m.points[i].forEach((v,k)=>close(v,changed.find(c=>c.id===m.id).points[i][k]));}
 for(const layer of key==='inner'?['05']:['05','06'])assert.ok(changed.some((m,i)=>m.layer===layer&&m.points.some((p,j)=>p.some((v,k)=>Math.abs(v-base[i].points[j][k])>.001))));
 }
});

test('opening radius and height leave covering and framing unchanged, including combined ring edits',()=>{
 for(const outer of [{},{outerRingRadius:11,outerRingHeight:13}]){
  const baseline=shapeMembers(source,{...shellFormDefaults,...outer});
  for(const edit of [{innerRingHeight:7},{innerRingRadius:6},{innerRingRadius:6,innerRingHeight:7}]){
   const changed=shapeMembers(source,{...shellFormDefaults,...outer,...edit});
   baseline.forEach((m,i)=>{if(m.layer!=='05'&&m.id!=='04.002')assert.deepEqual(changed[i].points,m.points,`${m.id} moved with the opening`);});
   assert.ok(changed.some((m,i)=>m.layer==='05'&&JSON.stringify(m.points)!==JSON.stringify(baseline[i].points)));
  }
 }
});
test('both ring dimensions remain exact after global form transforms and legacy forms retain defaults',()=>{
 const form={...shellFormDefaults,width:1.1,depth:.9,twist:5,rise:.4,outerRingRadius:11,outerRingHeight:13,innerRingRadius:4,innerRingHeight:5};const ms=shapeMembers(source,form),d=ringDimensions(ms);close(d[0].radius,11);close(d[0].height,13);close(d[1].radius,4);close(d[1].height,5);
 const a=ms.find(m=>m.id==='04.001'),b=ms.find(m=>m.id==='04.005');assert.deepEqual(a.points,b.points);
 const old={...shellFormDefaults};for(const k of Object.keys(old).filter(k=>k.includes('Ring')))delete old[k];assert.deepEqual(shapeMembers(source,old),shapeMembers(source,shellFormDefaults));
});
