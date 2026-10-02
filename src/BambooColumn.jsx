import { useMemo } from 'react';
import { Quaternion, Vector3, DoubleSide } from 'three';
// Decorative node rings do not change the uniform section used by the solver.
export default function BambooColumn({ column, parameters, color, selected, onSelect, center, analysis = false }) {
  const { midpoint, rotation, length } = useMemo(() => {
    const a = new Vector3(...column.a), b = new Vector3(...column.b), axis = b.clone().sub(a);
    return { midpoint: a.add(b).multiplyScalar(0.5), rotation: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), axis.clone().normalize()), length: axis.length() };
  }, [column]);
  const valid = Number.isFinite(parameters.unitScale) && parameters.unitScale > 0 && Number.isFinite(parameters.diameter) && parameters.diameter > 0;
  if (!valid) return null;
  const radius = parameters.diameter / 2000 / parameters.unitScale;
  const wall = Math.min(radius * 0.95, Math.max(radius * 0.01, (parameters.thickness || 1) / 1000 / parameters.unitScale));
  const ringCount = Math.min(40, Math.max(1, Math.floor(length * parameters.unitScale / 0.45)));
  return <group position={midpoint} quaternion={rotation} onClick={event => {
    event.stopPropagation(); if (event.delta > 5) return;
    onSelect(column, event.point);
  }}>
    <mesh><cylinderGeometry args={[radius, radius, length, 12, 1, true]}/><meshStandardMaterial color={color} roughness={0.85} side={DoubleSide} emissive={selected ? '#947333' : '#000000'} emissiveIntensity={0.5}/></mesh>
    {[0, 1].map(end => <mesh key={end} position={[0, (end - 0.5) * length, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[radius - wall, radius, 12]}/><meshStandardMaterial color={color} roughness={0.9} side={DoubleSide}/></mesh>)}
    {!analysis && Array.from({ length: ringCount }, (_, i) => <mesh key={i} position={[0, -length / 2 + (i + 0.5) * length / ringCount, 0]}><cylinderGeometry args={[radius * 1.045, radius * 1.045, radius * 0.15, 12, 1, true]}/><meshStandardMaterial color="#998664" roughness={0.95} side={DoubleSide}/></mesh>)}
  </group>;
}
