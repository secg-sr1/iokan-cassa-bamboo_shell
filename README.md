# Iokan / Bamboo shell

A minimal React + Vite viewer for the five GLB models in `models/`, using Three.js, React Three Fiber, Drei, and Tailwind CSS. Charcoal (`#2b2b2b`), restrained typography, muted bamboo, and cool directional lighting keep the environment sober.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173).

```sh
npm run build
npm run preview
```

The production build includes the GLB assets; no external model service, API key, or backend is needed.

## Explore

- **3D view:** drag to orbit, right-drag to pan, scroll or pinch to zoom.
- **Top view:** an orthographic plan; drag to pan and scroll or pinch to zoom.
- **Explode view:** separate the five systems vertically. Assemble restores their original alignment.
- **Reset camera:** frame the current view and assembly state again.
- **Layers:** toggle the eye to hide/show a system. Expand its row to inspect its element index.
- **Notes:** click an element, write an observation, and save. Click a numbered pin or a saved note to reopen it. Escape closes the editor. Notes can be deleted or exported as JSON from the Notes panel.
- **Mobile:** use **Layers & notes** in the bottom bar to open the inspector.

## Model organization

| Index | System | Source | Meshes |
| --- | --- | --- | --- |
| 01 | Columns | `columnas-00.glb` | 18 |
| 02 | Outer enclosure | `cerramiento-exterior-00.glb` | 40 |
| 03 | Inner enclosure | `cerramiento-centro-00.glb` | 54 |
| 04 | Rings | `anillos-00.glb` | 3 |
| 05 | Roof shell | `techo-envoltura-00.glb` | 96 |

Element IDs follow `layer.mesh`, for example `05.012`. Mesh ordering within each source determines the index. Re-exporting a model with a different mesh order can change these IDs, so export existing notes before replacing assets.

Source coordinates stay aligned: all files share one center and scale. Bounds are recomputed from vertex positions because the supplied GLBs contain inconsistent accessor bounds. The original files are unchanged. Black export materials are replaced in the viewer with matte bamboo-colored materials. A note's anchor is stored in its layer's local coordinates, so it follows the exploded motion.

Notes are stored in this browser's `localStorage` under `iokan-notes-v1`. They are not synced across devices. Export JSON to keep or share a copy; importing notes is not implemented.

## Validation

Production build and browser checks cover loading all 211 meshes, both camera presets, exploded assembly, layer controls, note creation/persistence/deletion, and a 390px mobile viewport. The Three.js bundle is large enough to trigger Vite's advisory chunk-size warning.
