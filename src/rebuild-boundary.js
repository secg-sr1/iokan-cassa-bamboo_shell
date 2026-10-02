import {isBoundary} from './boundary.js';
export function rebuildBoundary(members,form){
 const mode=form.boundaryRebuild;if(!['smooth','straight'].includes(mode))return members;
 const edges=members.filter(isBoundary),anchors=members.filter(m=>['04.001','04.002','04.005'].includes(m.id)).flatMap(m=>m.points).concat(members.filter(m=>+m.layer<=2).flatMap(m=>[m.points[0],m.points.at(-1)]));
 const dist=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));const changes=[];
 const rebuilt=new Map(edges.map(m=>{const ps=m.points,lengths=[0];for(let i=1;i<ps.length;i++)lengths.push(lengths.at(-1)+dist(ps[i],ps[i-1]));const total=lengths.at(-1)||1,a=ps[0],b=ps.at(-1),mid=ps[Math.floor(ps.length/2)],control=mid.map((v,k)=>2*v-(a[k]+b[k])/2);const points=ps.map((p,i)=>{const t=lengths[i]/total,q=p.map((_,k)=>mode==='straight'?a[k]*(1-t)+b[k]*t:(1-t)**2*a[k]+2*t*(1-t)*control[k]+t*t*b[k]);changes.push({p,delta:q.map((v,k)=>v-p[k])});return q;});return [m.id,points];}));
 return members.map(m=>{if(rebuilt.has(m.id))return {...m,points:rebuilt.get(m.id)};if(+m.layer<=2||['04.001','04.002','04.005'].includes(m.id))return m;return {...m,points:m.points.map(p=>{let closest=changes[0],d=Infinity;for(const c of changes){const gap=dist(p,c.p);if(gap<d){closest=c;d=gap;}}const lock=Math.min(...anchors.map(a=>dist(p,a))),w=lock<1e-8?0:Math.exp(-d*d/9)*lock*lock/(lock*lock+d*d);return p.map((v,k)=>v+w*closest.delta[k]);})};});
}
