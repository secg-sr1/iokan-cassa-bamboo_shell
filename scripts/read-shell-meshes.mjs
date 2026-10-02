import fs from 'node:fs';
import draco3d from 'draco3d';
import { Matrix4, Quaternion, Vector3 } from 'three';
const D = await draco3d.createDecoderModule({});
const files=['columnas-00.glb','columnas-01.glb','anillos_interiores-00.glb','anillos_principales-00.glb','envoltura-interior-00.glb','envoltura-00.glb'];
const all=[];
for(const [li,file] of files.entries()){
 const bytes=fs.readFileSync('models/'+file),n=bytes.readUInt32LE(12),j=JSON.parse(bytes.subarray(20,20+n)),bin=bytes.subarray(28+n);let index=0;
 function walk(ni,parent=new Matrix4()){
 const node=j.nodes[ni],local=node.matrix?new Matrix4().fromArray(node.matrix):new Matrix4().compose(new Vector3().fromArray(node.translation||[0,0,0]),new Quaternion().fromArray(node.rotation||[0,0,0,1]),new Vector3().fromArray(node.scale||[1,1,1]));const transform=parent.clone().multiply(local);
 if(node.mesh!==undefined)for(const p of j.meshes[node.mesh].primitives){
 const ext=p.extensions.KHR_draco_mesh_compression,view=j.bufferViews[ext.bufferView],data=bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
 const b=new D.DecoderBuffer(),d=new D.Decoder(),m=new D.Mesh(),v=new D.DracoFloat32Array(),f=new D.DracoInt32Array();b.Init(new Int8Array(data),data.length);d.DecodeBufferToMesh(b,m);d.GetAttributeFloatForAllPoints(m,d.GetAttributeByUniqueId(m,ext.attributes.POSITION),v);
 const points=[];for(let k=0;k<v.size();k+=3)points.push(new Vector3(v.GetValue(k),v.GetValue(k+1),v.GetValue(k+2)).applyMatrix4(transform).toArray());
 const faces=[];for(let k=0;k<m.num_faces();k++){d.GetFaceFromMesh(m,k,f);faces.push([f.GetValue(0),f.GetValue(1),f.GetValue(2)]);}
 const layer=String(li+1).padStart(2,'0');all.push({id:layer+'.'+String(++index).padStart(3,'0'),layer,points,faces});[b,d,m,v,f].forEach(o=>D.destroy(o));
 }node.children?.forEach(c=>walk(c,transform));}
 j.scenes[j.scene||0].nodes.forEach(i=>walk(i));
}
export default all;
