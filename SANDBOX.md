# Local structural sandbox

These changes are **not published**. Run `npm run dev` and open the displayed localhost URL. The public Sites version remains the earlier viewer.

The columns now use hollow bamboo geometry with editable diameter and wall thickness. See [BAMBOO-REFERENCES.md](BAMBOO-REFERENCES.md) for Guadua/Asper reference presets, model result visualization, and the Form controls for saved proportion studies.

## Current import

Six solid GLBs load as separate layers: columns A (12 meshes), columns B (6), inner rings (40 mesh primitives in 5 source nodes), main rings (5), inner shell (54), and outer shell (96). Total: 213 selectable mesh primitives. The `.glbbak` backup is not loaded.

All four supplied `*-curves-00.glb` files are 412-byte containers without nodes or meshes. They do not contain usable line geometry. Re-export curves as glTF LINES/LINE_STRIP primitives, or provide an ordered polyline JSON with points, member IDs, and connection IDs. Merely naming an export “curves” does not embed CAD curves in glTF.

## Generated column centerlines

Run `npm run import:models` to reproduce:

- `models/columnas-00-curves-generated.glb` (12 LINES primitives)
- `models/columnas-01-curves-generated.glb` (6 LINES primitives)
- `src/generated/columns.json` (IDs, endpoints, lengths, fit metadata)
- `src/generated/import-report.json`

The importer decodes Draco positions, applies node transforms, deduplicates seam vertices, estimates a principal axis with covariance power iteration, and averages the vertices within 1% of length at each end. Lower-Y endpoint is the assumed base. Original geometry is preserved; generated endpoints retain the source coordinate system. These are inferred straight axes, not surveyed or authored CAD centerlines. They must be reviewed if columns become tapered, bent, or have non-circular end geometry.

The fitted lengths are 7.68–10.65 **model units**. Units are not confirmed. The default 1 metre/model-unit is a trial assumption. Source radius is approximately 0.10 model units; solver diameter is an independently editable assumption and is not a measurement of the physical structure. Draco decoder files are served locally.

## First solver: independent 3D cantilever columns

This is an analytical Euler–Bernoulli member solver, not a global stiffness matrix or shell solver. Each column is fixed in all six degrees of freedom at its lower-Y end and free at its upper end. Uniform hollow circular section, uniform longitudinal stiffness, linear elasticity, and small displacements are assumed. Every column gets the same user-entered global +X and downward (-Y) force at its tip. Visibility does not change the calculation.

Inputs: metres/model-unit; outer diameter and wall thickness in mm; E in GPa; tip loads in kN. All calculations use SI. The defaults are illustrative, not recommended material or design values. Confirm the trial assumptions in Study to reveal results. Deformation amplification affects only display, not results (clamped to 0–1000×).

For axis n, length L, force F: N = F·n; transverse force V = F − Nn.

- A = π(D²−d²)/4; I = π(D⁴−d⁴)/64
- u(x) = n Nx/(EA) + V x²(3L−x)/(6EI)
- Base bending moment magnitude = |V|L
- Extreme elastic normal stress magnitude = |N|/A + |V|L D/(2I)
- Euler reference load = π²EI/(2L)², for fixed-free K = 2
- Reaction force = −F; reaction moment = −(Ln × F)

Positive N is tension. The compression/Euler ratio is **not** a code utilization or safety factor. There are no allowable-strength checks, no bamboo grading, no code load combinations, no shell-to-column load transfer, no connections, no self-weight, no bracing, no taper, no torsion/shear deformation, no second-order or post-buckling behavior, and no material nonlinearity. Displacements over 5% of member length or compression at/above Euler load are flagged as outside the linear screening range. A lower ratio does not establish safety.

Reference for cantilever bending: [University of British Columbia, 2D Cantilevered Beam](https://civil-terje.sites.olt.ubc.ca/files/2024/02/2D-Cantilevered-Beam.pdf). Element scope reference: [OpenSees modeling capabilities](https://opensees.berkeley.edu/OpenSees/user/modellingCapabilities.php).

## Next prerequisites for a connected solver

Provide nonempty centerlines, model units, physical section dimensions, material data, member-to-member joints and releases, supports, and load cases. Geometric crossings are not automatically structural joints. The current column boundary conditions must not be substituted for actual shell connectivity.

## Verification and notes

`npm test` checks axial shortening, bending displacement, Euler load, support reactions, zero-load response, load linearity, units, inclined forces, invalid sections and generated GLB integrity. `npm run build` produces the local static preview. Source exports and local notes are never sent to Sites by these commands.

Notes use a new model-specific browser storage key so old indices are not silently attached to different members. Old notes remain untouched under `iokan-notes-v1` and can still be exported from the unchanged public viewer on its own origin.

The default workspace now includes the [whole-structure frame study](WHOLE-STRUCTURE.md). The sections above describe the retained earlier column sandbox.
