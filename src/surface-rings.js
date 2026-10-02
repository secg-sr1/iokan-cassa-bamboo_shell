import {CatmullRomCurve3,Vector3} from 'three';
export function contourSettings(members,count=3,elevation=null,spacing=.35){
 const boundary=members.filter(m=>['04.003','04.004'].includes(m.id)).flatMap(m=>m.points);
 const upper=members.find(m=>m.id==='04.001').points;
 const min=Math.max(...boundary.map(p=>p[1]))+.05,max=Math.min(...upper.map(p=>p[1]))-.05;
 const n=Math.max(1,Math.min(4,Math.round(count)));
 if(max<=min)return {error:'No shared elevation range for closed contours. Adjust the boundary or upper ring.',min,max,count:n};
 const step=n>1?Math.max(.01,Math.min(Number.isFinite(spacing)?spacing:.35,(max-min)/(n-1))):0;
 const lastBase=max-step*(n-1),base=Math.max(min,Math.min(Number.isFinite(elevation)?elevation:min+.15*(max-min),lastBase));
 return {min,max,count:n,spacing:step,elevation:base,lastBase};
}
// Horizontal sections sampled directly from outer-shell axes. Smooth interpolation
// between intersections is an approximation to the continuous base surface.
export function surfaceRings(members,count=3,inset=.2,elevation=null,spacing=.35){
 const settings=contourSettings(members,count,elevation,spacing);if(settings.error)return [];
 const upper=members.find(m=>m.id==='04.001').points,cx=(Math.min(...upper.map(p=>p[0]))+Math.max(...upper.map(p=>p[0])))/2,cz=(Math.min(...upper.map(p=>p[2]))+Math.max(...upper.map(p=>p[2])))/2;
 const rings=[];
 for(let band=0;band<settings.count;band++){
  const height=settings.elevation+settings.spacing*band,hits=[];
  for(const m of members.filter(m=>m.layer==='06'))for(let i=0;i<m.points.length-1;i++){
   const a=m.points[i],b=m.points[i+1];if(Math.abs(b[1]-a[1])<1e-10)continue;const t=(height-a[1])/(b[1]-a[1]);if(t<0||t>1)continue;
   const p=a.map((v,k)=>v+t*(b[k]-v));hits.push({p,angle:Math.atan2(p[2]-cz,p[0]-cx),radius:Math.hypot(p[0]-cx,p[2]-cz)});
  }
  // Keep the outer branch where a horizontal plane crosses the shell twice.
  const bins=new Map();for(const h of hits){const k=Math.round((h.angle+Math.PI)*96/(2*Math.PI))%96;if(!bins.has(k)||bins.get(k).radius<h.radius)bins.set(k,h);}
  const ordered=[...bins.values()].sort((a,b)=>a.angle-b.angle);if(ordered.length<8)return [];
  const gap=Math.max(...ordered.map((h,i)=>((ordered[(i+1)%ordered.length].angle-h.angle+Math.PI*2)%(Math.PI*2))));if(gap>Math.PI/3)return [];
  const curve=new CatmullRomCurve3(ordered.map(h=>new Vector3(...h.p)),true,'centripetal');
  rings.push(curve.getPoints(384).map(p=>[p.x,height,p.z]));
 }
 return rings;
}
