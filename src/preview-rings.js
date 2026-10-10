// Ring-local edits on the connected preview network. Shared nodes move once.
export function editPreviewRings(nodes,elements,options){
 const rings=[['upper',['04.001','04.005']],['lower',['04.002']]].map(([key,ids])=>{const indices=new Set(elements.filter(e=>ids.includes(e.member)).flatMap(e=>[e.a,e.b]));const points=[...indices].map(i=>nodes[i]);if(!points.length)return null;const center=[0,1,2].map(k=>(Math.min(...points.map(p=>p[k]))+Math.max(...points.map(p=>p[k])))/2);return {key,indices,points,center,radius:Math.max(...points.map(p=>Math.hypot(p[0]-center[0],p[2]-center[2])))};}).filter(Boolean);
 const columns=new Set(elements.filter(e=>Number(e.layer)<=2).flatMap(e=>[e.a,e.b]));
 return nodes.map((p,i)=>{const own=rings.find(r=>r.indices.has(i));return p.map((v,k)=>v+rings.reduce((sum,r)=>{const factor=options[r.key+'Radius']??1,dy=options[r.key+'Height']??0;if(factor===1&&dy===0)return sum;let w=0;if(own)w=own===r?1:0;else if(!columns.has(i)){const distance=Math.min(...r.points.map(q=>Math.hypot(...q.map((x,j)=>x-p[j]))));w=Math.exp(-((distance/Math.max(.001,r.radius*.3))**2));}return sum+w*(k===1?dy:(p[k]-r.center[k])*(factor-1));},0));});
}

