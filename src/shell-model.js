import {towerFrame} from './tower-frame.js';
import {coveringDefaults} from './roof-covering.js';
import {rebuildBoundary} from './rebuild-boundary.js';
import {applyCage,cageDefaults} from './roof-cage.js';
import {applyRoofControls,roofDefaults} from './roof-controls.js';
import {addReinforcement,reinforcementDefaults} from './reinforcement.js';
import {applyBoundaryControls,boundaryDefaults,straightenColumns} from './boundary.js';
import {applyRingControls,ringFormDefaults} from './rings.js';
// Geometric inference only: proximity joints must be reviewed against construction details.
export const shellDefaults={unitScale:1,modulus:12,shearModulus:0.8,density:700,roofLoad:0.25,wind:0,selfWeight:true,joint:'rigid',tolerance:0.25,amplification:20,materialId:'custom',sections:{'01':[200,20],'02':[200,20],'03':[150,15],'04':[200,20],'05':[100,10],'06':[100,10]}};
export const shellFormDefaults={width:1,depth:1,height:1,rise:0,twist:0,supportSpread:1,innerSpacing:1,outerSpacing:1,supports:'all',...coveringDefaults,...cageDefaults,...roofDefaults,...ringFormDefaults,...boundaryDefaults,...reinforcementDefaults,coveringEnabled:true,coveringMode:'woven',coveringColorByLength:false,coveringOpacity:1};
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const distance=(a,b)=>Math.hypot(...sub(a,b));
export function shapeMembers(source,form){
 const all=source.flatMap(m=>m.points),lo=[0,1,2].map(k=>Math.min(...all.map(p=>p[k]))),hi=[0,1,2].map(k=>Math.max(...all.map(p=>p[k]))),cx=(lo[0]+hi[0])/2,cz=(lo[2]+hi[2])/2;
 const shaped = source.filter(m=>{const i=Number(m.id.split('.')[1])-1;return !(m.layer==='05'&&i%form.innerSpacing || m.layer==='06'&&i%form.outerSpacing || m.layer==='01'&&form.supports==='B' || m.layer==='02'&&form.supports==='A');}).map(m=>({...m,points:m.points.map(p=>{
 const h=(p[1]-lo[1])/(hi[1]-lo[1]),x=(p[0]-cx)*form.width,z=(p[2]-cz)*form.depth,t=form.twist*Math.PI/180*h;
 const crown=Math.max(0,1-((p[0]-cx)/(hi[0]-lo[0])*2)**2)*Math.max(0,1-((p[2]-cz)/(hi[2]-lo[2])*2)**2);
 const spread=Number(m.layer)<=2?1+(form.supportSpread-1)*(1-h):1;
 return [cx+(x*Math.cos(t)-z*Math.sin(t))*spread,lo[1]+(p[1]-lo[1])*form.height+form.rise*crown*h,cz+(x*Math.sin(t)+z*Math.cos(t))*spread];
 })}));
 return towerFrame(straightenColumns(rebuildBoundary(applyCage(applyRoofControls(applyRingControls(applyBoundaryControls(shaped,form),form),form),form),form)),form.towerFrame);
}
function simplify(ps,tol=.06){
 if(ps.length<3)return ps;const a=ps[0],b=ps.at(-1),ab=sub(b,a),d=dot(ab,ab);let max=0,index=0;
 for(let i=1;i<ps.length-1;i++){const t=d?Math.max(0,Math.min(1,dot(sub(ps[i],a),ab)/d)):0,e=distance(ps[i],add(a,mul(ab,t)));if(e>max){max=e;index=i;}}
 return max>tol?[...simplify(ps.slice(0,index+1),tol).slice(0,-1),...simplify(ps.slice(index),tol)]:[a,b];
}
function closest(a,b,c,d){
 const u=sub(b,a),v=sub(d,c),w=sub(a,c),A=dot(u,u),B=dot(u,v),C=dot(v,v),D=dot(u,w),E=dot(v,w),den=A*C-B*B;
 let s=den>1e-12?Math.max(0,Math.min(1,(B*E-C*D)/den)):0,t=(B*s+E)/C;
 if(t<0){t=0;s=Math.max(0,Math.min(1,-D/A));}else if(t>1){t=1;s=Math.max(0,Math.min(1,(B-D)/A));}
 const p=add(a,mul(u,s)),q=add(c,mul(v,t));return {s,t,p,q,gap:distance(p,q),parallel:Math.abs(B/Math.sqrt(A*C))};
}
export function buildNetwork(members,tolerance=.25){
 const segs=[];members.forEach(m=>{const ps=simplify(m.points);for(let i=0;i<ps.length-1;i++)if(distance(ps[i],ps[i+1])>.001)segs.push({a:ps[i],b:ps[i+1],member:m.id,layer:m.layer,cuts:[{t:0,p:ps[i]},{t:1,p:ps[i+1]}]});});
 const bins=new Map(),cell=2,candidates=new Set();
 segs.forEach((s,i)=>{const lo=s.a.map((v,k)=>Math.floor((Math.min(v,s.b[k])-tolerance)/cell)),hi=s.a.map((v,k)=>Math.floor((Math.max(v,s.b[k])+tolerance)/cell));for(let x=lo[0];x<=hi[0];x++)for(let y=lo[1];y<=hi[1];y++)for(let z=lo[2];z<=hi[2];z++){const key=[x,y,z].join(',');for(const j of bins.get(key)||[])candidates.add(j*segs.length+i);if(!bins.has(key))bins.set(key,[]);bins.get(key).push(i);}});
 let inferred=0,maxGap=0;
 for(const pair of candidates){const i=Math.floor(pair/segs.length),j=pair%segs.length,a=segs[i],b=segs[j];if(a.member===b.member)continue;const c=closest(a.a,a.b,b.a,b.b);if(c.gap>tolerance || c.parallel>.985 && c.s>.01&&c.s<.99&&c.t>.01&&c.t<.99)continue;
 const p=mul(add(c.p,c.q),.5);a.cuts.push({t:c.s,p});b.cuts.push({t:c.t,p});inferred++;maxGap=Math.max(maxGap,c.gap);}
 const nodes=[],hash=new Map(),weld=.08;
 function node(p){const key=p.map(v=>Math.floor(v/weld));for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)for(const i of hash.get([key[0]+x,key[1]+y,key[2]+z].join(','))||[])if(distance(nodes[i],p)<weld)return i;const i=nodes.length;nodes.push(p);const k=key.join(',');if(!hash.has(k))hash.set(k,[]);hash.get(k).push(i);return i;}
 const elements=[],seen=new Set();for(const s of segs){s.cuts.sort((a,b)=>a.t-b.t);const cs=[];for(const c of s.cuts){const n=node(c.p);if(cs.at(-1)!==n)cs.push(n);}for(let i=0;i<cs.length-1;i++){const a=cs[i],b=cs[i+1],key=s.member+':'+[a,b].sort((a,b)=>a-b).join(',');if(a===b||seen.has(key)||distance(nodes[a],nodes[b])<.05)continue;seen.add(key);elements.push({a,b,member:s.member,layer:s.layer});}}
 // All selected column bases are fixed, independent of their vertical level.
 const supports=members.filter(m=>+m.layer<=2).map(m=>{const p=m.points.reduce((a,b)=>a[1]<b[1]?a:b);let best=0;nodes.forEach((n,i)=>{if(distance(n,p)<distance(nodes[best],p))best=i;});return best;});
 const adj=nodes.map(()=>[]);elements.forEach(e=>{adj[e.a].push(e.b);adj[e.b].push(e.a);});const supported=new Set(supports),reach=new Set(),stack=[...supports];while(stack.length){const n=stack.pop();if(reach.has(n))continue;reach.add(n);stack.push(...adj[n].filter(x=>!reach.has(x)));}
 const disconnected=elements.filter(e=>!reach.has(e.a));
 return {nodes,elements,supports:[...supported],inferred,maxGap,disconnected:disconnected.length,disconnectedMembers:[...new Set(disconnected.map(e=>e.member))],members:members.map(m=>({id:m.id,layer:m.layer,repaired:m.repaired,generated:m.generated,role:m.role})),segmentCount:segs.length};
}


