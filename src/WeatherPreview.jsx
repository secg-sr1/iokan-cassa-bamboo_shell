import FlowLegend from './FlowLegend';
import {Html} from '@react-three/drei';
import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {windVector} from './weather-study';
export default function WeatherPreview({positions,weather}){
 const ref=useRef();const box=useMemo(()=>{const min=[0,1,2].map(k=>Math.min(...positions.map(p=>p[k]))),max=[0,1,2].map(k=>Math.max(...positions.map(p=>p[k])));return {min:min.map(v=>v-2),span:max.map((v,k)=>Math.max(1,v-min[k])+4)};},[positions]);
 const buffer=useMemo(()=>new Float32Array(600*6),[]),dir=windVector(weather.direction);
 useFrame(({clock})=>{if(!ref.current)return;const t=weather.paused?0:clock.elapsedTime;for(let i=0;i<600;i++){const rain=i>=300;if(!rain||weather.rain===0){buffer.fill(0,i*6,i*6+6);continue;}const velocity=rain?[dir[0]*weather.speed,-weather.fall,dir[2]*weather.speed]:dir.map(v=>v*weather.speed);for(let k=0;k<3;k++){const fraction=((i*(.618033+k*.137)+t*velocity[k]/(box.span[k]*weather.units))%1+1)%1;const v=box.min[k]+fraction*box.span[k];buffer[i*6+k]=v;buffer[i*6+3+k]=v-velocity[k]*.04/weather.units;}}ref.current.attributes.position.needsUpdate=true;});
 const colors=useMemo(()=>new Float32Array(Array.from({length:1200},(_,i)=>i<600?[.85,.7,.4]:[.3,.65,1]).flat()),[]);
 return <group><Html style={{pointerEvents:'none'}}><FlowLegend weather={weather} rain/></Html><lineSegments frustumCulled={false}><bufferGeometry ref={ref}><bufferAttribute attach="attributes-position" args={[buffer,3]}/><bufferAttribute attach="attributes-color" args={[colors,3]}/></bufferGeometry><lineBasicMaterial vertexColors transparent opacity={.55}/></lineSegments></group>;
}
