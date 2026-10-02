
import {surfaceRings} from './surface-rings.js';
export const reinforcementDefaults={reinforcement:'none',bandCount:3,bandInset:.2,braceLevel:.7,ringElevation:null,ringSpacing:.35};
export const reinforcementOptions=[
 {id:'none',name:'Original structure',description:'Keep the imported assembly as the baseline.'},
 {id:'rings',name:'Level contour rings',description:'Level closed loops cut across the shell grid, following horizontal surface sections.'},
 {id:'rings-bracing',name:'Contour rings + bracing',description:'Closed surface-following rings with support bracing.'},
 {id:'bands',name:'Continuous bands',description:'Curved bands follow the boundary toward the upper ring, with explicit links from column heads.'},
 {id:'bracing',name:'Support bracing',description:'Straight crossed diagonals between neighboring column groups. Check clearance and joint details.'},
 {id:'combined',name:'Bands + bracing',description:'Combine the bands and support diagonals as a candidate load path.'},
];
const distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
function closest(p,points){let best=points[0],d=Infinity;for(let i=0;i<points.length-1;i++){const a=points[i],delta=points[i+1].map((v,k)=>v-a[k]),l=delta.reduce((s,v)=>s+v*v,0),t=l?Math.max(0,Math.min(1,delta.reduce((s,v,k)=>s+v*(p[k]-a[k]),0)/l)):0,q=a.map((v,k)=>v+t*delta[k]),gap=distance(p,q);if(gap<d){best=q;d=gap;}}return best;}
export function addReinforcement(members,form){
 const f={...reinforcementDefaults,...form};if(!['bands','bracing','combined','rings','rings-bracing'].includes(f.reinforcement))return members;
 const added=[],counts={B:0,L:0,D:0,C:0};function add(kind,points){if(points.length<2||points.every(p=>distance(p,points[0])<.05))return;const code=kind==='Closed surface ring'?'C':kind==='Continuous band'?'B':kind==='Column-to-band link'?'L':'D';added.push({id:`04.R${code}${String(++counts[code]).padStart(3,'0')}`,layer:'04',points,generated:true,role:kind,closed:kind==='Closed surface ring',method:'Proposed reinforcement; joints require review'});}
 const columns=members.filter(m=>+m.layer<=2).map(m=>{const a=m.points[0],b=m.points.at(-1);return {id:m.id,base:a[1]<b[1]?a:b,top:a[1]<b[1]?b:a};});
 // Cluster bundled columns; use a real column, not a floating centroid, as the attachment.
 const groups=[];for(const c of columns){const group=groups.find(g=>distance(g[0].top,c.top)<2);if(group)group.push(c);else groups.push([c]);}
 const reps=groups.map(g=>g[0]);const cx=reps.reduce((s,c)=>s+c.top[0],0)/reps.length,cz=reps.reduce((s,c)=>s+c.top[2],0)/reps.length;reps.sort((a,b)=>Math.atan2(a.top[2]-cz,a.top[0]-cx)-Math.atan2(b.top[2]-cz,b.top[0]-cx));
 if(f.reinforcement==='bands'||f.reinforcement==='combined'){
  const ring=members.find(m=>m.id==='04.001').points,bands=[];
  for(const edge of members.filter(m=>['04.003','04.004'].includes(m.id)))for(let band=0;band<Math.max(1,Math.min(4,Math.round(f.bandCount)));band++){
   const t=Math.min(.8,Math.max(.05,f.bandInset)+band*.07),points=edge.points.map(p=>{const q=closest(p,ring);return p.map((v,k)=>v+(q[k]-v)*t);});bands.push(points);add('Continuous band',points);
  }
  // Links end at actual band vertices so their intended connection is unambiguous.
  for(const c of columns){let target=bands.flat().reduce((best,p)=>distance(p,c.top)<distance(best,c.top)?p:best);add('Column-to-band link',[c.top,target]);}
 }
 if(['rings','rings-bracing'].includes(f.reinforcement)){
  const loops=surfaceRings(members,f.bandCount,f.bandInset,f.ringElevation,f.ringSpacing);
  for(const points of loops)add('Closed surface ring',points);
  for(const c of loops.length?columns:[]){const target=loops.flat().reduce((best,p)=>distance(p,c.top)<distance(best,c.top)?p:best);add('Column-to-band link',[c.top,target]);}
 }
 if(f.reinforcement==='bracing'||f.reinforcement==='combined'||f.reinforcement==='rings-bracing'){
  const level=Math.max(.35,Math.min(.9,f.braceLevel));
  for(let i=0;i<reps.length;i++){const a=reps[i],b=reps[(i+1)%reps.length];const lower=c=>c.base.map((v,k)=>v+(c.top[k]-v)*level);add('Support diagonal',[lower(a),b.top]);add('Support diagonal',[a.top,lower(b)]);}
 }
 return [...members,...added];
}
