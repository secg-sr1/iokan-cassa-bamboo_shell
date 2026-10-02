import fs from 'node:fs';
import meshes from './read-shell-meshes.mjs';
const members=[];let bad=[];
for(const m of meshes){
 const parent=m.points.map((_,i)=>i);const root=i=>parent[i]===i?i:parent[i]=root(parent[i]);
 const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 for(const f of m.faces)for(let i=0;i<3;i++){const a=f[i],b=f[(i+1)%3];if(dist(m.points[a],m.points[b])<.13)parent[root(a)]=root(b);}
 // Weld coincident seam vertices before computing ring centroids.
 const groups=new Map();m.points.forEach((p,i)=>{const r=root(i);if(!groups.has(r))groups.set(r,new Map());groups.get(r).set(p.map(x=>x.toFixed(4)).join(','),p);});
 const centers=new Map([...groups].map(([r,ps])=>[r,[0,1,2].map(k=>[...ps.values()].reduce((s,p)=>s+p[k],0)/ps.size)]));
 const adj=new Map([...groups.keys()].map(r=>[r,new Set()]));for(const f of m.faces)for(let i=0;i<3;i++){const a=root(f[i]),b=root(f[(i+1)%3]);if(a!==b){adj.get(a).add(b);adj.get(b).add(a);}}
 const ends=[...adj].filter(([,s])=>s.size===1).map(([r])=>r);const branch=[...adj].some(([,s])=>s.size>2);
 if(groups.size<2) throw new Error(m.id + " has no recoverable axis"); if(branch){ bad.push(m.id); const ids=[...centers.keys()]; const start=ends[0] ?? ids[0]; const ordered=[start], remaining=new Set(ids.filter(i=>i!==start)); while(remaining.size){const p=centers.get(ordered.at(-1)); const next=[...remaining].sort((a,b)=>dist(p,centers.get(a))-dist(p,centers.get(b)))[0]; remaining.delete(next); if(dist(p,centers.get(next))<.13)continue; ordered.push(next);} adj.clear();ordered.forEach((r,i)=>adj.set(r,new Set([ordered[i-1],ordered[i+1]].filter(x=>x!==undefined)))); ends.splice(0,ends.length,ordered[0],ordered.at(-1)); }
 let current=ends[0]??adj.keys().next().value,previous=-1;const order=[],seen=new Set();while(!seen.has(current)){seen.add(current);order.push(current);const next=[...adj.get(current)].find(n=>n!==previous);if(next===undefined)break;previous=current;current=next;}
 const closed=ends.length===0;const points=order.map(i=>centers.get(i));if(closed)points.push(points[0]);
 members.push({id:m.id,layer:m.layer,points,closed,repaired:branch,method:'Mesh cross-section ring centroids; inferred connectivity pending review'});
}
fs.writeFileSync('src/generated/members.json',JSON.stringify(members));console.log({members:members.length,points:members.reduce((s,m)=>s+m.points.length,0),bad});
