import {ribEnvelopeClearance} from './roof-envelope.js';
import {offsetPanels} from './surface-clearance.js';
import {wovenCovering} from './woven-covering.js';
export const coveringDefaults={coveringColorByLength:false,coveringSecondaryCount:16,coveringFlow:.12,coveringEnabled:false,coveringMode:'strips',coveringDirection:'radial',coveringCount:48,coveringGap:.06,coveringBow:0,coveringOpacity:.9};
const clamp=(v,min,max,fallback)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;
// Radial rail correspondence: explicit loft, not a reconstruction of a NURBS surface.
function buildCoveringBase(members,form={}){
 const f={...coveringDefaults,...form};if(!f.coveringEnabled)return {panels:[]};
 if(f.coveringMode==='woven')return wovenCovering(members);
 const ribRoof=wovenCovering(members);const hasRibs=ribRoof.panels.length>0;const clearance=Number.isFinite(f.coveringClearance)?Math.max(0,f.coveringClearance):.15;const skin=hasRibs?offsetPanels(ribRoof.panels,clearance+ribEnvelopeClearance(ribRoof.panels,members)):[];
 const inner=members.find(m=>m.id==='04.001')?.points,edges=members.filter(m=>['04.003','04.004'].includes(m.id)).map(m=>m.points);
 if(!inner||edges.length!==2)return {panels:[],error:'Roof covering needs the outer ring and both boundary curves.'};
 const boundary=[...edges[0],...edges[1].slice().reverse()];boundary.push(boundary[0]);const ring=[...inner,inner[0]];
 const referenceInner=f.coveringReference?.find(m=>m.id==='04.001')?.points||inner;
 const referenceEdges=f.coveringReference?f.coveringReference.filter(m=>['04.003','04.004'].includes(m.id)).map(m=>m.points):edges;
 const referenceBoundary=[...referenceEdges[0],...referenceEdges[1].slice().reverse()];referenceBoundary.push(referenceBoundary[0]);const referenceRing=[...referenceInner,referenceInner[0]];
 const cx=(Math.min(...referenceInner.map(p=>p[0]))+Math.max(...inner.map(p=>p[0])))/2,cz=(Math.min(...referenceInner.map(p=>p[2]))+Math.max(...inner.map(p=>p[2])))/2;
 function hit(curves,angle,mapped){const dx=Math.cos(angle),dz=Math.sin(angle),hits=[];for(const ps of curves)for(let i=1;i<ps.length;i++){const a=ps[i-1],b=ps[i],sx=b[0]-a[0],sz=b[2]-a[2],ax=a[0]-cx,az=a[2]-cz,den=dx*sz-dz*sx;if(Math.abs(den)<1e-10)continue;const r=(ax*sz-az*sx)/den,t=(ax*dz-az*dx)/den;if(r>0&&t>=-1e-8&&t<=1+1e-8)hits.push({r,p:(mapped?mapped[i-1]:a).map((v,k)=>v+((mapped?mapped[i]:b)[k]-v)*t)});}return hits.sort((a,b)=>b.r-a.r)[0];}
 const count=Math.round(clamp(f.coveringCount,8,96,48)),gap=f.coveringMode==='surface'?0:clamp(f.coveringGap,0,.4,.06),bow=clamp(f.coveringBow,-3,3,0),radial=f.coveringDirection!=='circumferential',panels=[];
 function sample(u,v){if(hasRibs){const r=((u%1+1)%1)*skin.length,i=Math.floor(r),t=r-i,j=Math.min(63,Math.floor(Math.max(0,Math.min(1,v))*64)),q=Math.max(0,Math.min(1,v))*64-j,vs=skin[i%skin.length].vertices;return [0,1,2].map(k=>(vs[j*2][k]*(1-t)+vs[j*2+1][k]*t)*(1-q)+(vs[(j+1)*2][k]*(1-t)+vs[(j+1)*2+1][k]*t)*q);}const angle=u*Math.PI*2,a=hit([referenceRing],angle,ring),b=hit([referenceBoundary],angle,boundary);if(!a||!b||(!f.coveringAllowFold&&b.r<=a.r+.01))throw new Error('The boundary must surround the outer ring in plan. Adjust the curves or disable the covering.');const p=a.p.map((x,k)=>x+(b.p[k]-x)*v);p[1]+=4*v*(1-v)*bow;return p;}
 try{
 const families=f.coveringMode==='crossed'?[{name:'U',radial:true,count},{name:'V',radial:false,count:Math.round(clamp(f.coveringSecondaryCount,8,96,16))}]:[{name:radial?'U':'V',radial,count}];
 for(const family of families)for(let strip=0;strip<family.count;strip++){
 const vertices=[],indices=[],nu=family.radial?2:128,nv=family.radial?48:2;
 function uv(i,j){let u=family.radial?(strip+gap/2+i/nu*(1-gap))/family.count:i/nu,v=family.radial?j/nv:(strip+gap/2+j/nv*(1-gap))/family.count;
 if(f.coveringMode==='flowing'){const flow=clamp(f.coveringFlow,-.2,.2,.12);if(family.radial)u+=flow*Math.sin(Math.PI*v);else v+=flow*Math.sin(2*Math.PI*u)*v*(1-v)*4;}
 const p=sample(u,v);if(f.coveringMode==='crossed'&&family.name==='V')p[1]+=.03;return p;}
 for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++)vertices.push(uv(i,j));
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;indices.push(a,c,b,b,c,d);}
 let area=0;for(let i=0;i<indices.length;i+=3){const a=vertices[indices[i]],b=vertices[indices[i+1]].map((v,k)=>v-a[k]),c=vertices[indices[i+2]].map((v,k)=>v-a[k]);area+=Math.hypot(b[1]*c[2]-b[2]*c[1],b[2]*c[0]-b[0]*c[2],b[0]*c[1]-b[1]*c[0])/2;}
 const center=uv(nu/2,nv/2),id=f.coveringMode==='crossed'?`RC.${family.name}.${String(strip+1).padStart(3,'0')}`:`RC.${String(strip+1).padStart(3,'0')}`;
 let length=0;const steps=family.radial?nv:nu;let previous=uv(family.radial?nu/2:0,family.radial?0:nv/2);for(let t=1;t<=steps;t++){const current=uv(family.radial?nu/2:t,family.radial?t:nv/2);length+=Math.hypot(...current.map((v,k)=>v-previous[k]));previous=current;}panels.push({id,family:family.name,vertices,indices,center,area,length});
 }return {panels,clearanceApplied:hasRibs};}catch(e){return {panels:[],error:e.message};}
}
// Display only; assembled and exported vertices stay unchanged.
export function stripExplodeOffset(panel,index,count,scale){const angle=index/Math.max(1,count)*Math.PI*2;return [Math.cos(angle)*1.2/scale,index/Math.max(1,count-1)*4/scale,Math.sin(angle)*1.2/scale];}


export function buildCovering(members,form={}){const roof=buildCoveringBase(members,form),lift=Number.isFinite(form.coveringClearance)?Math.max(0,form.coveringClearance):.15;return {...roof,panels:roof.clearanceApplied?roof.panels:offsetPanels(roof.panels,lift+(form.coveringMode==='woven'?ribEnvelopeClearance(roof.panels,members):0))};}


