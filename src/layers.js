import columns from '../models/columnas-00.glb?url';
import exterior from '../models/cerramiento-exterior-00.glb?url';
import center from '../models/cerramiento-centro-00.glb?url';
import rings from '../models/anillos-00.glb?url';
import roof from '../models/techo-envoltura-00.glb?url';
export const layers = [
  { id: '01', name: 'Columns', original: 'Columnas', url: columns, color: '#a39878' },
  { id: '02', name: 'Outer enclosure', original: 'Cerramiento exterior', url: exterior, color: '#b4a17c' },
  { id: '03', name: 'Inner enclosure', original: 'Cerramiento centro', url: center, color: '#c1af87' },
  { id: '04', name: 'Rings', original: 'Anillos', url: rings, color: '#d0ba8d' },
  { id: '05', name: 'Roof shell', original: 'Techo envoltura', url: roof, color: '#bbaa85' },
];
export const objectId = (layer, index) => `${layer}.${String(index + 1).padStart(3, '0')}`;
