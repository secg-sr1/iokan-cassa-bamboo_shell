import test from 'node:test';import assert from 'node:assert/strict';import {strapStations,detailExportMembers} from '../src/ring-detail.js';import {exportIFC} from '../src/export-ifc.js';
const m={id:'04.001',layer:'04',points:[[0,0,0],[1,0,0]]},p={unitScale:1,sections:{'04':[200,20]},ringDetail:{enabled:true,diameter:400,spacing:250,width:25,thickness:2}};
test('strap spacing follows arc length, scales units, and detail preserves axes',()=>{const stations=strapStations(m,p);assert.equal(stations.length,4);assert.deepEqual(stations[0].point,[.125,0,0]);assert.equal(strapStations(m,{...p,unitScale:2}).length,8);const parts=detailExportMembers([m],p);assert.equal(parts.length,5);assert.deepEqual(parts[0].points,m.points);assert.deepEqual(parts[0].exportSection,[400,0]);assert.deepEqual(parts[1].exportSection,[404,2]);assert.equal(detailExportMembers([m],{...p,ringDetail:{enabled:false}})[0],m);});
test('IFC distinguishes bamboo envelope and steel strap solids and materials',()=>{const file=exportIFC([m],p);assert.match(file,/IFCCIRCLEPROFILEDEF/);assert.match(file,/IFCCIRCLEHOLLOWPROFILEDEF/);assert.match(file,/IFCMATERIAL\('Stainless steel \(concept\)'\)/);assert.equal((file.match(/=IFCMEMBER\(/g)||[]).length,5);assert.ok(!file.includes('NaN'));});

test('boundary detail independently selects both edges for geometry and IFC',()=>{
 const boundary=[{...m,id:'04.003'},{...m,id:'04.004'}],members=[m,...boundary,{...m,id:'04.RB001'}];
 const params={...p,ringDetail:{...p.ringDetail,enabled:false,boundaryEnabled:true}};
 const parts=detailExportMembers(members,params);
 assert.equal(parts.length,12);assert.equal(parts[0],m);assert.equal(parts.at(-1),members.at(-1));
 for(const edge of boundary){assert.deepEqual(parts.find(x=>x.id===edge.id).points,edge.points);assert.equal(parts.filter(x=>x.id.startsWith(edge.id+'.S')).length,4);}
 assert.equal((exportIFC(members,params).match(/=IFCMEMBER\(/g)||[]).length,12);
 assert.equal(detailExportMembers(members,{...params,ringDetail:{...params.ringDetail,enabled:true}}).length,16);
});
