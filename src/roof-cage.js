// Tensor-product cubic Bezier displacement cage. Zero offsets preserve imported geometry.
export const cageDefaults={roofCage:[],roofLockRings:false};
export function cageVector(form,i){return [0,1,2].map(k=>{const v=form.roofCage?.[i]?.[k];return Number.isFinite(v)?Math.max(-8,Math.min(8,v)):0;});}
const bernstein=t=>[(1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3];
export function cageBounds(members){const ps=members.filter(m=>m.layer==='06').flatMap(m=>m.points);return {points:ps,min:[0,2].map(k=>Math.min(...ps.map(p=>p[k]))),max:[0,2].map(k=>Math.max(...ps.map(p=>p[k])))};}
export function cagePoints(members,form){
 const {points,min,max}=cageBounds(members);if(!points.length)return [];
 return Array.from({length:16},(_,id)=>{const u=id%4,v=Math.floor(id/4),x=min[0]+u/3*(max[0]-min[0]),z=min[1]+v/3*(max[1]-min[1]);let sum=0,y=0;for(const p of points){const w=1/((p[0]-x)**2+(p[2]-z)**2+.2)**2;sum+=w;y+=w*p[1];}const base=[x,y/sum,z],offset=cageVector(form,id);return {id,u,v,base,point:base.map((p,k)=>p+offset[k])};});
}
export function editCage(form,selected,scope,delta){return Array.from({length:16},(_,i)=>{const affected=scope==='all'||i===selected||scope==='row'&&Math.floor(i/4)===Math.floor(selected/4)||scope==='column'&&i%4===selected%4;return cageVector(form,i).map((v,k)=>Math.max(-8,Math.min(8,v+(affected?delta[k]:0))));});}
export function applyCage(members,form){
 const offsets=Array.from({length:16},(_,i)=>cageVector(form,i));if(offsets.every(p=>p.every(v=>v===0)))return members;
 const {points,min,max}=cageBounds(members);if(!points.length)return members;
 const rings=members.filter(m=>['04.001','04.002','04.005'].includes(m.id)).flatMap(m=>m.points);
 function move(p){const b=bernstein(Math.max(0,Math.min(1,(p[0]-min[0])/(max[0]-min[0]||1)))),c=bernstein(Math.max(0,Math.min(1,(p[2]-min[1])/(max[1]-min[1]||1))));const shift=[0,0,0];for(let i=0;i<16;i++)for(let k=0;k<3;k++)shift[k]+=b[i%4]*c[Math.floor(i/4)]*offsets[i][k];const distance=Math.min(...rings.map(q=>Math.hypot(...q.map((v,k)=>v-p[k]))));const fade=form.roofLockRings?1-Math.exp(-distance*distance/4):1;return p.map((v,k)=>v+shift[k]*fade);}
 return members.map(m=>{if(+m.layer<=2){const a=m.points[0],b=m.points.at(-1),first=a[1]>b[1];return {...m,points:m.points.map((p,i)=>i===(first?0:m.points.length-1)?move(p):p)};}if(form.roofLockRings&&['04.001','04.002','04.005'].includes(m.id))return m;return {...m,points:m.points.map(move)};});
}
