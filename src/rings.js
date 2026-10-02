// The two principal design rings marked in the reference image.
// 04.005 duplicates the upper ring in the imported assembly and follows it too.
export const ringDefinitions = [
  { key: 'outer', name: 'Outer ring', id: '04.001', ids: ['04.001', '04.005'], color: '#e4c17d' },
  { key: 'inner', name: 'Opening ring', id: '04.002', ids: ['04.002'], color: '#8dcbd8' },
];
export const ringFormDefaults = { outerRingRadius: null, outerRingHeight: null, innerRingRadius: null, innerRingHeight: null };
export function ringDimensions(members) {
  return ringDefinitions.map(def => {
    const points = members.find(m => m.id === def.id).points;
    const min = [0,1,2].map(k => Math.min(...points.map(p => p[k])));
    const max = [0,1,2].map(k => Math.max(...points.map(p => p[k])));
    const center = min.map((v,k) => (v + max[k])/2);
    const area = Math.abs(points.reduce((sum,p,i) => { const q=points[(i+1)%points.length]; return sum+p[0]*q[2]-q[0]*p[2]; },0))/2;
    return { ...def, points, center, radius: Math.sqrt(area/Math.PI), height: center[1] };
  });
}
function distanceToRing(p,points) {
  let best=Infinity;
  for(let i=0;i<points.length-1;i++) {
    const a=points[i],b=points[i+1],d=b.map((v,k)=>v-a[k]);
    const length=d.reduce((s,v)=>s+v*v,0);
    const t=length?Math.max(0,Math.min(1,d.reduce((s,v,k)=>s+v*(p[k]-a[k]),0)/length)):0;
    const sq=p.reduce((s,v,k)=>s+(v-a[k]-t*d[k])**2,0);
    best=Math.min(best,sq);
  }
  return Math.sqrt(best);
}
export function applyRingControls(members,form) {
  const rings=ringDimensions(members).map(r=>({...r, targetRadius: Number.isFinite(form[r.key+'RingRadius'])&&form[r.key+'RingRadius']>0?form[r.key+'RingRadius']:r.radius, targetHeight:Number.isFinite(form[r.key+'RingHeight'])?form[r.key+'RingHeight']:r.height}));
  if(rings.every(r=>r.targetRadius===r.radius&&r.targetHeight===r.height))return members;
  const bases=members.filter(m=>Number(m.layer)<=2).map(m=>m.points.reduce((a,b)=>a[1]<b[1]?a:b));
  return members.map(m=>({...m,points:m.points.map(p=>{
    const own=rings.findIndex(r=>r.ids.includes(m.id));
    let weights;
    if(own>=0) weights=rings.map((_,i)=>i===own?1:0);
    else {
      // Outer-ring changes influence the assembly; opening changes affect only
      // the inner shell (05). Keep the covering and its framing independent.
      const distances=rings.map(r=>distanceToRing(p,r.points));
      const baseDistance=Math.min(...bases.map(a=>Math.hypot(...p.map((v,k)=>v-a[k]))));
      if(baseDistance<1e-8)return p;
      const exact=distances.findIndex(d=>d<1e-8);
      if(exact>=0)weights=rings.map((_,i)=>i===exact?1:0);
      else {const raw=distances.map(d=>1/(d*d)),anchor=1/(baseDistance*baseDistance),sum=raw.reduce((s,v)=>s+v,anchor);weights=raw.map(v=>v/sum);}
    }
    return p.map((v,k)=>v+rings.reduce((sum,r,i)=>{
      if(r.key==='inner' && m.layer!=='05' && !r.ids.includes(m.id))return sum;
      return sum+weights[i]*(k===1?r.targetHeight-r.height:(p[k]-r.center[k])*(r.targetRadius/r.radius-1));
    },0));
  })}));
}
