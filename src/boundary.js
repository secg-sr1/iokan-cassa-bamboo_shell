export const boundaryDefaults={boundaryRebuild:'original',boundaryLength:1,boundaryWidth:1,boundaryLeft:0,boundaryRight:0,boundaryFront:0,boundaryBack:0};
export const isBoundary=m=>['04.003','04.004'].includes(m.id);
const distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
function curveDistance(p,curves){let best=Infinity;for(const ps of curves)for(let i=0;i<ps.length-1;i++){const a=ps[i],d=ps[i+1].map((v,k)=>v-a[k]),l=d.reduce((s,v)=>s+v*v,0),t=l?Math.max(0,Math.min(1,d.reduce((s,v,k)=>s+v*(p[k]-a[k]),0)/l)):0;best=Math.min(best,distance(p,a.map((v,k)=>v+t*d[k])));}return best;}
export function applyBoundaryControls(members,form){
 const f={...boundaryDefaults,...form};if(Object.keys(boundaryDefaults).every(k=>f[k]===boundaryDefaults[k]))return members;
 const edges=members.filter(isBoundary).map(m=>m.points),ps=edges.flat();
 const min=[0,2].map(k=>Math.min(...ps.map(p=>p[k]))),max=[0,2].map(k=>Math.max(...ps.map(p=>p[k]))),cx=(min[0]+max[0])/2,cz=(min[1]+max[1])/2;
 const rings=members.filter(m=>['04.001','04.002','04.005'].includes(m.id)).map(m=>m.points);
 const bases=members.filter(m=>+m.layer<=2).map(m=>m.points.reduce((a,b)=>a[1]<b[1]?a:b));
 return members.map(m=>({...m,points:m.points.map(p=>{
  if(['04.001','04.002','04.005'].includes(m.id))return p;
  const db=Math.min(...bases.map(a=>distance(p,a)));if(db<1e-8)return p;
  const edge=curveDistance(p,edges),anchor=Math.min(curveDistance(p,rings),db);
  const influence=isBoundary(m)?1:anchor<1e-8?0:1/(1+(edge/anchor)**2);
  const x=(p[0]-cx)/((max[0]-min[0])/2),z=(p[2]-cz)/((max[1]-min[1])/2);
  const w=[Math.max(0,-x)**4,Math.max(0,x)**4,Math.max(0,z)**4,Math.max(0,-z)**4],sum=w.reduce((s,v)=>s+v,0)||1;
  const dy=w.reduce((s,v,i)=>s+v*[f.boundaryLeft,f.boundaryRight,f.boundaryFront,f.boundaryBack][i],0)/sum;
  return [p[0]+influence*(p[0]-cx)*(f.boundaryLength-1),p[1]+influence*dy,p[2]+influence*(p[2]-cz)*(f.boundaryWidth-1)];
 })}));
}
// Form changes move end connections, never bend a column between them.
export function straightenColumns(members){return members.map(m=>{
 if(+m.layer>2)return m;
 const a=m.points[0],b=m.points.at(-1);const lengths=[0];for(let i=1;i<m.points.length;i++)lengths.push(lengths.at(-1)+distance(m.points[i-1],m.points[i]));const total=lengths.at(-1)||1;
 return {...m,points:m.points.map((_,i)=>i===0?a:i===m.points.length-1?b:a.map((v,k)=>v+(b[k]-v)*lengths[i]/total))};
});}
