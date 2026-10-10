import {useMemo,useEffect} from 'react';
import {Html} from '@react-three/drei';
import * as T from 'three';
import {weatherRoof} from './weather-roof';
import {windVector} from './weather-study';
export default function WeatherRoof({network,positions,weather,result}){
 const roof=useMemo(()=>weatherRoof(network,positions),[network,positions]);
 const geometry=useMemo(()=>{const g=new T.BufferGeometry(),vertices=[],colors=[],wind=weather.mode==='rain'?new T.Vector3(0,-1,0):new T.Vector3(...windVector(weather.direction));for(const panel of roof.panels)for(let j=0;j<panel.indices.length;j+=3){const tri=panel.indices.slice(j,j+3).map(i=>new T.Vector3(...panel.vertices[i]));const n=tri[1].clone().sub(tri[0]).cross(tri[2].clone().sub(tri[0])).normalize();const exposure=Math.abs(n.dot(wind));for(let k=0;k<3;k++){const p=tri[k],cp=weather.speed===0?0:result?.surfaceCp?.[panel.indices[j+k]],c=weather.mode==='rain'?new T.Color('#246cba').lerp(new T.Color('#f4ce65'),exposure):cp===undefined?new T.Color('#9ca5a5'):new T.Color('#eeeeee').lerp(new T.Color(cp<0?'#246cba':'#db593e'),Math.min(1,Math.abs(cp)));vertices.push(...p.toArray());colors.push(c.r,c.g,c.b);}}g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;},[roof,weather.direction,weather.mode,weather.speed,result]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 if(roof.error)return <Html center><div style={{background:'#222',padding:12,width:240,color:'#edba83'}}>Roof surface unavailable: {roof.error}</div></Html>;
 return <mesh geometry={geometry}><meshStandardMaterial vertexColors side={T.DoubleSide} roughness={.8} metalness={.05}/></mesh>;
}
