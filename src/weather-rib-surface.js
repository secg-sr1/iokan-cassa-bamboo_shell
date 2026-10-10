// Loft adjacent ribs from the first imported outer-shell family (06.001–06.048).
// Network elements retain member traversal order; do not walk welded adjacency,
// which contains branches and small omitted segments at inferred intersections.
export function roofFromRibs(network,positions){
 const ids=[...new Set(network.elements.filter(e=>e.layer==='06'&&Number(e.member.split('.')[1])<=48).map(e=>e.member))].sort();
 if(ids.length<3)return null;
 const distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
 const starts=ids.map(id=>network.nodes[network.elements.find(e=>e.member===id).a]);const center=starts.reduce((s,p)=>s.map((v,k)=>v+p[k]/starts.length),[0,0,0]);ids.sort((a,b)=>{const angle=id=>{const p=network.nodes[network.elements.find(e=>e.member===id).a];return Math.atan2(p[2]-center[2],p[0]-center[0]);};return angle(a)-angle(b);});
 const ribs=ids.map(id=>{const edges=network.elements.filter(e=>e.member===id),indices=[];for(const e of edges){if(indices.at(-1)!==e.a)indices.push(e.a);if(indices.at(-1)!==e.b)indices.push(e.b);}const length=[0];for(let i=1;i<indices.length;i++)length.push(length.at(-1)+distance(network.nodes[indices[i-1]],network.nodes[indices[i]]));return Array.from({length:65},(_,j)=>{const target=length.at(-1)*j/64;let i=1;while(i<length.length-1&&length[i]<target)i++;const t=(target-length[i-1])/(length[i]-length[i-1]||1),a=positions[indices[i-1]],b=positions[indices[i]];return a.map((v,k)=>v+(b[k]-v)*t);});});
 const vertices=ribs.flat(),indices=[];for(let r=0;r<ribs.length;r++)for(let j=0;j<64;j++){const a=r*65+j,b=((r+1)%ribs.length)*65+j;indices.push(a,b,a+1,a+1,b,b+1);}let area=0;for(let i=0;i<indices.length;i+=3){const a=vertices[indices[i]],b=vertices[indices[i+1]].map((v,k)=>v-a[k]),c=vertices[indices[i+2]].map((v,k)=>v-a[k]);area+=Math.hypot(b[1]*c[2]-b[2]*c[1],b[2]*c[0]-b[0]*c[2],b[0]*c[1]-b[1]*c[0])/2;}return {panels:[{vertices,indices,area}],method:'outer-rib loft',ribCount:ribs.length,ribIds:ids};
}
