import {Triangle,Vector3} from 'three';
// Measure the crossing rib family's outward deviation from the loft, rather
// than assuming both imported families have identical centre-line surfaces.
export function ribEnvelopeClearance(panels,members){
 const faces=[];let up=0;
 for(const panel of panels)for(let i=0;i<panel.indices.length;i+=3){const tri=new Triangle(...panel.indices.slice(i,i+3).map(k=>new Vector3(...panel.vertices[k]))),normal=tri.getNormal(new Vector3()),center=tri.getMidpoint(new Vector3());up+=normal.y*tri.getArea();faces.push({tri,normal,center,radius:Math.max(...[tri.a,tri.b,tri.c].map(p=>p.distanceTo(center)))});}
 const sign=up<0?-1:1,p=new Vector3(),closest=new Vector3(),delta=new Vector3();let outward=0;
 for(const member of members.filter(m=>m.layer==='06'))for(const point of member.points){p.fromArray(point);let best=Infinity,signed=0;for(const face of faces){if(p.distanceTo(face.center)-face.radius>Math.sqrt(best))continue;face.tri.closestPointToPoint(p,closest);const distance=p.distanceToSquared(closest);if(distance<best){best=distance;signed=delta.subVectors(p,closest).dot(face.normal)*sign;}}outward=Math.max(outward,signed);}
 return outward;
}
