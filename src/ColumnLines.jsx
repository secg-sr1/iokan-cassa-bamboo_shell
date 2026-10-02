import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { Color, CatmullRomCurve3, Vector3 } from 'three';
import BambooColumn from './BambooColumn';
import { metricValue } from './variations';
function DeflectedCulm({ points, radius, color, onClick }) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map(p => new Vector3(...p))), [points]);
  return <mesh onClick={e => { e.stopPropagation(); if (e.delta <= 5) onClick(); }}><tubeGeometry args={[curve, 32, radius, 8, false]}/><meshStandardMaterial color={color} roughness={0.7}/></mesh>;
}
export default function ColumnLines({ layer, center, display, result, parameters, confirmed, columns, metric, selected, onSelect }) {
  const enabled = confirmed && !result.error;
  const deform = display === 'deformed' && enabled;
  const analysis = (display === 'results' || display === 'deformed') && enabled;
  const max = Math.max(1e-12, ...result.members.map(m => metricValue(m, metric)));
  const validSection = !result.error;
  return <group position={center.map(v => -v)}>{columns.filter(c => c.layer === layer).map(c => {
    const member = result.members.find(m => m.id === c.id);
    const points = deform && member ? member.points.map(p => c.a.map((v, i) => v + (c.b[i] - v) * p.t + p.displacement[i] * Math.max(0, Math.min(1000, parameters.amplification || 0)) / parameters.unitScale)) : [c.a, c.b];
    const color = analysis ? new Color('#4c9dc6').lerp(new Color('#f2a65d'), metricValue(member, metric) / max).getStyle() : '#b5a174';
    const force = enabled ? new Vector3(...result.forcePerColumn) : new Vector3();
    return <group key={c.id}>
      {display !== 'curves' && !deform && validSection && <BambooColumn column={c} parameters={parameters} color={color} selected={selected?.objectId === c.id} onSelect={onSelect} analysis={analysis}/>}
      {display !== 'solids' && <Line points={[c.a, c.b]} color={analysis ? '#929083' : '#8fcbd2'} transparent opacity={analysis ? 0.4 : 0.8} lineWidth={1} depthTest={display !== 'overlay'}/>}
      {deform && <DeflectedCulm points={points} radius={parameters.diameter / 2000 / parameters.unitScale} color={color} onClick={() => onSelect(c)}/>}
      {display !== 'solids' && <mesh position={c.a}><octahedronGeometry args={[0.18, 0]}/><meshBasicMaterial color="#cdb681" depthTest={false}/></mesh>}
      {analysis && force.length() > 0 && <arrowHelper args={[force.normalize(), new Vector3(...points[points.length - 1]), 1.2, '#e4d5a0', 0.3, 0.16]}/>}
    </group>;
  })}</group>;
}
