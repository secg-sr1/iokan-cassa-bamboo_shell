const distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
const shifted=(points,height)=>points.map(p=>[p[0],p[1]+height,p[2]]);

// Individual culms and explicit webs, not an assumed composite beam section.
export function bundledFrame(members,form){
 const depth=Math.max(.2,Math.min(1.2,Number(form.frameDepth)||.6));
 const count=Math.max(2,Math.min(4,Math.round(Number(form.frameCulms)||3)));
 const ribCount=Math.max(4,Math.min(16,Math.round(Number(form.frameRibs)||8)));
 const added=[];let index=0;
 function add(role,points,closed=false){if(points.length<2||points.every(p=>distance(p,points[0])<.01))return;added.push({id:`04.RF${String(++index).padStart(3,'0')}`,layer:'04',points,closed,generated:true,role,method:'Reference-inspired built-up bamboo frame; explicit chord and web members'});}
 function bundle(points,role){
  const chords=Array.from({length:count},(_,i)=>shifted(points,depth*i/(count-1)));
  // The imported member is the first chord; retain its geometry and identity.
  for(const chord of chords.slice(1))add(role,chord,distance(chord[0],chord.at(-1))<.01);
  const stations=[0];let length=0;
  for(let i=1;i<points.length;i++){length+=distance(points[i-1],points[i]);if(length>=3||i===points.length-1){stations.push(i);length=0;}}
  for(let i=0;i<stations.length;i++){
   const a=stations[i];add('Frame cross tie',[chords[0][a],chords.at(-1)[a]]);
   if(i){const b=stations[i-1];add('Frame diagonal web',i%2?[chords[0][b],chords.at(-1)[a]]:[chords.at(-1)[b],chords[0][a]]);}
  }
 }
 for(const edge of members.filter(m=>['04.003','04.004'].includes(m.id)))bundle(edge.points,'Bundled perimeter chord');
 const shell=members.filter(m=>m.layer==='06');
 const ribs=Array.from(new Set(Array.from({length:Math.min(ribCount,shell.length)},(_,i)=>shell[Math.floor(i*shell.length/Math.min(ribCount,shell.length))])));
 for(const rib of ribs)bundle(rib.points,'Primary rib chord');
 const targets=members.filter(m=>['04.003','04.004'].includes(m.id)).concat(ribs).flatMap(m=>m.points);
 for(const column of members.filter(m=>['01','02'].includes(m.layer))){
  const a=column.points[0],b=column.points.at(-1),top=a[1]>b[1]?a:b;
  if(targets.length){const target=targets.reduce((best,p)=>distance(p,top)<distance(best,top)?p:best);add('Column head link',[top,target]);}
 }
 return [...members,...added];
}
