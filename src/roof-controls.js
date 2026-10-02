export const roofDefaults={roofOffsets:[]};
const d2=(a,b)=>a.reduce((s,v,k)=>s+(v-b[k])**2,0);
const ringIds=['04.001','04.002','04.005'];
function anchors(members){return members.filter(m=>ringIds.includes(m.id)).flatMap(m=>m.points).concat(members.filter(m=>+m.layer<=2).flatMap(m=>[m.points[0],m.points.at(-1)]));}
export function roofControlPoints(members){
 const locks=anchors(members),points=members.filter(m=>m.layer==='06').flatMap(m=>m.points);
 if(!points.length)return [];
 const lo=[0,2].map(k=>Math.min(...points.map(p=>p[k]))),hi=[0,2].map(k=>Math.max(...points.map(p=>p[k])));
 const available=points.filter(p=>locks.every(a=>d2(p,a)>.64)),used=[];
 for(const z of [.15,.5,.85])for(const x of [.15,.5,.85]){
  if(x===.5&&z===.5)continue;
  const target=[lo[0]+x*(hi[0]-lo[0]),lo[1]+z*(hi[1]-lo[1])];
  let best=null,score=Infinity;
  for(const p of available){if(used.some(q=>d2(p,q.point)<1))continue;const s=(p[0]-target[0])**2+(p[2]-target[1])**2;if(s<score){score=s;best=p;}}
  if(best)used.push({id:used.length,point:best});
 }
 return used;
}
export function roofOffset(form,index){const n=form.roofOffsets?.[index];return Number.isFinite(n)?Math.max(-3,Math.min(3,n)):0;}
export function applyRoofControls(members,form){
 const controls=roofControlPoints(members);
 if(!controls.some(c=>roofOffset(form,c.id)))return members;
 const locks=anchors(members);
 function move(p){
  let weight=0,value=0,nearest=Infinity;
  for(const c of controls){const d=d2(p,c.point);if(d<1e-12)return [p[0],p[1]+roofOffset(form,c.id),p[2]];const w=1/(d*d);weight+=w;value+=w*roofOffset(form,c.id);nearest=Math.min(nearest,d);}
  const lock=Math.min(...locks.map(a=>d2(p,a)));
  return [p[0],p[1]+value/weight*lock/(lock+nearest),p[2]];
 }
 return members.map(m=>+m.layer<=2||ringIds.includes(m.id)?m:{...m,points:m.points.map(move)});
}
