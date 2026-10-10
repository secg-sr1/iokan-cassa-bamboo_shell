// Average shared vertex normals so adjacent panels retain a continuous seam.
export function offsetPanels(panels,distance){
 const normals=new Map(),key=p=>p.map(v=>v.toFixed(6)).join(',');let upward=0;
 for(const p of panels)for(let i=0;i<p.indices.length;i+=3){const [a,b,c]=p.indices.slice(i,i+3).map(j=>p.vertices[j]),u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];upward+=n[1];for(const q of [a,b,c]){const k=key(q),sum=normals.get(k)||[0,0,0];normals.set(k,sum.map((v,j)=>v+n[j]));}}
 const sign=upward<0?-1:1;return panels.map(p=>{const vertices=p.vertices.map(v=>{const n=normals.get(key(v))||[0,1,0],length=Math.hypot(...n)||1;return v.map((x,k)=>x+sign*distance*n[k]/length);});const vertexNormals=p.vertices.map(v=>{const n=normals.get(key(v))||[0,1,0],length=Math.hypot(...n)||1;return n.map(x=>sign*x/length);});return {...p,vertices,normals:vertexNormals,center:p.center?vertices.reduce((sum,v)=>sum.map((x,k)=>x+v[k]/vertices.length),[0,0,0]):p.center};});
}
