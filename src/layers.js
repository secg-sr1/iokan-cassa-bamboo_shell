import a from '../models/columnas-00.glb?url';
import b from '../models/columnas-01.glb?url';
import c from '../models/anillos_interiores-00.glb?url';
import d from '../models/anillos_principales-00.glb?url';
import e from '../models/envoltura-interior-00.glb?url';
import f from '../models/envoltura-00.glb?url';
export const layers = [
  { id: '01', name: 'Columns · A', original: 'Columnas 00', url: a, color: '#a39878' },
  { id: '02', name: 'Columns · B', original: 'Columnas 01', url: b, color: '#b4a17c' },
  { id: '03', name: 'Inner rings', original: 'Anillos interiores', url: c, color: '#c1af87' },
  { id: '04', name: 'Main rings', original: 'Anillos principales', url: d, color: '#d0ba8d' },
  { id: '05', name: 'Inner shell', original: 'Envoltura interior', url: e, color: '#bbaa85' },
  { id: '06', name: 'Outer shell', original: 'Envoltura', url: f, color: '#c4b48f' },
];
export const objectId = (layer, index) => `${layer}.${String(index + 1).padStart(3, '0')}`;
