import {roofFromRibs} from './weather-rib-surface.js';

// Follow actual edge connectivity so rail order is independent of node numbering.
export function weatherRoof(network,positions){
 const ribSurface=roofFromRibs(network,positions);if(ribSurface)return ribSurface;
 const members=['04.001','04.003','04.004'].map(id=>{const edges=network.elements.filter(e=>e.member===id),adj=new Map();for(const e of edges){for(const [a,b] of [[e.a,e.b],[e.b,e.a]]){if(!adj.has(a))adj.set(a,[]);adj.get(a).push(b);}}if(!adj.size)return {id,points:[]};let current=[...adj].find(([,ns])=>ns.length===1)?.[0]??edges[0].a;const points=[],used=new Set();for(let step=0;step<=edges.length;step++){points.push({source:network.nodes?.[current]??positions[current],point:positions[current]});const next=(adj.get(current)||[]).find(n=>!used.has([current,n].sort((a,b)=>a-b).join(':')));if(next===undefined)break;used.add([current,next].sort((a,b)=>a-b).join(':'));current=next;}return {id,points};});
 if(members.some(m=>m.points.length<2))return {panels:[],error:'Roof rails are missing from this network.'};

 // Match closed rails by source arc length instead of rays in plan.
 const d=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
 const ring=members[0].points;let a=members[1].points,b=members[2].points;
 if(d(a.at(-1).source,b[0].source)+d(b.at(-1).source,a[0].source)>d(a.at(-1).source,b.at(-1).source)+d(b[0].source,a[0].source))b=b.slice().reverse();
 function sample(ps){const closed=[...ps,ps[0]],lengths=[0];for(let i=1;i<closed.length;i++)lengths.push(lengths.at(-1)+d(closed[i-1].source,closed[i].source));const total=lengths.at(-1);if(total<1e-8)throw new Error('A roof rail has zero length.');return Array.from({length:128},(_,i)=>{const t=i/128*total;let j=1;while(j<lengths.length-1&&lengths[j]<t)j++;const f=(t-lengths[j-1])/(lengths[j]-lengths[j-1]||1);return {source:closed[j-1].source.map((v,k)=>v+f*(closed[j].source[k]-v)),point:closed[j-1].point.map((v,k)=>v+f*(closed[j].point[k]-v))};});}
 try{const inner=sample(ring),outer=sample([...a,...b]);let best=Infinity,offset=0,sign=1;for(const dir of [1,-1])for(let shift=0;shift<128;shift++){let cost=0;for(let i=0;i<128;i++)cost+=d(inner[i].source,outer[(shift+dir*i+256)%128].source)**2;if(cost<best){best=cost;offset=shift;sign=dir;}}
 const vertices=[],indices=[];for(let j=0;j<=16;j++)for(let i=0;i<=128;i++){const p=inner[i%128].point,q=outer[(offset+sign*(i%128)+256)%128].point;vertices.push(p.map((v,k)=>v+(q[k]-v)*j/16));}for(let j=0;j<16;j++)for(let i=0;i<128;i++){const n=j*129+i;indices.push(n,n+129,n+1,n+1,n+129,n+130);}let area=0;for(let i=0;i<indices.length;i+=3){const p=vertices[indices[i]],u=vertices[indices[i+1]].map((v,k)=>v-p[k]),v=vertices[indices[i+2]].map((v,k)=>v-p[k]);area+=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])/2;}return {panels:[{vertices,indices,area}]};}catch(e){return {panels:[],error:e.message};}
}
