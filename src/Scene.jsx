import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { layers, objectId } from './layers';
import ColumnLines from './ColumnLines';
import { transformPoint, inversePoint } from './variations';

function CameraRig({ view, exploded, reset, variation }) {
  const controls = useRef();
  const { camera, size } = useThree();
  const destination = useRef(null);
  useEffect(() => {
    const target = new THREE.Vector3(0, exploded ? 5.5 : 0, 0);
    const position = view === 'top' ? new THREE.Vector3(0, 35, 0.001) : new THREE.Vector3(18, 13, 22).add(target);
    position.sub(target).setLength((exploded?32:18)*Math.max(variation.width,variation.depth,variation.height)/Math.min(1,size.width/size.height)).add(target); destination.current = { position, target, zoom:1 };
  }, [camera, view, exploded, reset, size.width, size.height, variation]);
  useFrame((_, delta) => {
    if (!destination.current || !controls.current) return;
    const { position, target, zoom } = destination.current;
    const alpha = 1 - Math.exp(-delta * 7);
    camera.position.lerp(position, alpha);
    controls.current.target.lerp(target, alpha);
    camera.zoom = THREE.MathUtils.lerp(camera.zoom, zoom, alpha);
    camera.updateProjectionMatrix();
    controls.current.update();
    if (camera.position.distanceTo(position) < 0.01 && Math.abs(camera.zoom - zoom) < 0.01) destination.current = null;
  });
  return <OrbitControls ref={controls} makeDefault enableRotate={view !== 'top'} mouseButtons={{ LEFT: view === 'top' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }} touches={{ ONE: view === 'top' ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }} minDistance={3} maxDistance={160} maxPolarAngle={Math.PI / 2 - 0.03} enableDamping onStart={() => { destination.current = null; }} />;
}

function Part({ entry, index, model, scale, exploded, visible, selected, onSelect, notes, noteElements, center, baseCenter, display, result, parameters, confirmed, columns, variation, metric }) {
  const group = useRef();
  const projected = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }, delta) => {
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, exploded ? index * 2.2 / scale : 0, 7, delta);
    group.current.updateWorldMatrix(true, false);
    notes.forEach(note => {
      if (note.layer !== entry.id) return;
      const element = noteElements.current.get(note.id);
      if (!element) return;
      const source = note.point.map((v, i) => v + baseCenter[i]);
      const point = transformPoint(source, variation).map((v, i) => v - center[i]);
      group.current.localToWorld(projected.fromArray(point)).project(camera);
      element.style.display = visible && Math.abs(projected.z) <= 1 ? 'block' : 'none';
      element.style.left = `${(projected.x + 1) * size.width / 2}px`;
      element.style.top = `${(-projected.y + 1) * size.height / 2}px`;
    });
  });
  useEffect(() => {
    model.traverse(node => {
      if (!node.isMesh) return;
      const active = selected?.objectId === node.userData.objectId;
      node.material.emissive.set(active ? '#9a793d' : '#000000');
      node.material.emissiveIntensity = active ? 0.5 : 0;
      node.material.transparent = display === "results" || display === "deformed";
      node.material.opacity = node.material.transparent ? 0.18 : 1;
      node.material.depthWrite = !node.material.transparent;
    });
  }, [model, selected?.objectId, display]);
  return <group ref={group} visible={visible}>
    <primitive object={model} visible={Number(entry.id) > 2 && display !== "curves"} onClick={event => {
      if (display === 'results' || display === 'deformed') return;
      event.stopPropagation();
      if (event.delta > 5) return;
      const local = group.current.worldToLocal(event.point.clone()).toArray();
      const point = inversePoint(local.map((v, i) => v + center[i]), variation).map((v, i) => v - baseCenter[i]);
      onSelect({ layer: entry.id, objectId: event.object.userData.objectId, point });
    }} onPointerOver={event => { event.stopPropagation(); document.body.style.cursor = 'crosshair'; }} onPointerOut={() => { document.body.style.cursor = ''; }} />
    <ColumnLines layer={entry.id} center={center} display={display} result={result} parameters={parameters} confirmed={confirmed} columns={columns} metric={metric} selected={selected} onSelect={column => {
      const midpoint = column.a.map((v, i) => (v + column.b[i]) / 2);
      const point = inversePoint(midpoint, variation).map((v, i) => v - baseCenter[i]);
      onSelect({ layer: entry.id, objectId: column.id, point });
    }}/>
  </group>;
}

function Structure({ onReady, ...props }) {
  const gltfs = useGLTF(layers.map(layer => layer.url), "/draco/");
  const data = useMemo(() => {
    const box = new THREE.Box3();
    const counts = {};
    const models = gltfs.map((gltf, layerIndex) => {
      const scene = gltf.scene.clone(true);
      let index = 0;
      scene.traverse(node => {
        if (!node.isMesh) return;
        node.geometry.computeBoundingBox();
        node.geometry.computeBoundingSphere();
        node.material = new THREE.MeshStandardMaterial({ color: layers[layerIndex].color, roughness: 0.82, metalness: 0.03, side: THREE.DoubleSide });
        node.userData = { ...node.userData, objectId: objectId(layers[layerIndex].id, index++) };
      });
      scene.updateMatrixWorld(true);
      box.union(new THREE.Box3().setFromObject(scene, true));
      counts[layers[layerIndex].id] = index;
      return scene;
    });
    const baseCenter = box.getCenter(new THREE.Vector3());
    const center = new THREE.Vector3(...transformPoint(baseCenter.toArray(), props.variation));
    const size = box.getSize(new THREE.Vector3());
    const scale = 10 / Math.max(size.x, size.y, size.z);
    models.forEach(scene => { scene.applyMatrix4(new THREE.Matrix4().makeScale(props.variation.width, props.variation.height, props.variation.depth)); scene.position.sub(center); });
    return { models, scale, counts, center: center.toArray(), baseCenter: baseCenter.toArray() };
  }, [gltfs, props.variation]);
  useEffect(() => { onReady(data.counts); }, [data, onReady]);
  useEffect(() => () => { data.models.forEach(model => model.traverse(node => { if (node.isMesh) node.material.dispose(); })); }, [data]);
  return <group scale={data.scale}>{data.models.map((model, index) => <Part key={layers[index].id} model={model} index={index} entry={layers[index]} scale={data.scale} center={data.center} baseCenter={data.baseCenter} {...props} visible={props.visibility[layers[index].id]} />)}</group>;
}

export default function Scene({ view, exploded, reset, ...props }) {
  return <Canvas camera={{ position: [18, 13, 22], fov: 45, near: 0.1, far: 200 }} dpr={[1, 1.75]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }} aria-label="Interactive bamboo structure. Select a component to add a note." fallback={<div className="scene-error">WebGL is unavailable. Open this viewer in a browser with hardware acceleration enabled.</div>}>
    <color attach="background" args={['#2b2b2b']} />
    <ambientLight intensity={0.65} />
    <hemisphereLight args={['#d4dce1', '#494237', 1.5]} />
    <directionalLight position={[5, 14, 9]} intensity={2.3} color="#eee1c6" />
    <directionalLight position={[-12, 6, -8]} intensity={1.5} color="#b8c7d2" />
    <Suspense fallback={null}><Structure {...props} exploded={exploded} /></Suspense>
    <CameraRig view={view} exploded={exploded} reset={reset} variation={props.variation} />
  </Canvas>;
}
