# Whole-structure exploration (local, unpublished)

Open the default viewer at http://127.0.0.1:5173/. The **Imported viewer** button retains the prior GLB viewer, column sandbox, and its notes.

## What is modeled

All 213 imported solids have inferred curved centerlines, recovered by grouping short mesh edges into cross-section rings and ordering their centroids. Eight axes needed nearest-neighbor ordering repairs; their `repaired` flags are exported. This is reconstruction, not original CAD geometry. Run `npm run import:shell` after changing the solid GLBs and inspect the recovered paths. The four supplied curve GLBs remain empty.

The default network has 4,959 nodes and 8,418 straight 3D Euler–Bernoulli beam elements. Curves are simplified with a 0.06 model-unit chord tolerance. Closest segment approaches within the editable 0.25 model-unit proximity threshold create assumed joints; interior near-parallel culms are excluded. Points are welded within 0.08 model units. Proximity events and section sizes do not establish real bamboo connection locations or capacities. The JSON export includes nodes, elements, supports, inferred-event count, maximum gap, disconnected members and source IDs for audit.

## Joint cases

- **Rigid:** connected nodes share all three translations and rotations.
- **Pinned:** translations are shared at intersections; each distinct culm has independent rotations. The same culm remains continuous through its intermediate nodes. This is not a truss with every beam segment hinged.
- **Compare:** runs both and retains separate results. Failed residual/equilibrium checks withhold result colors. Neither case represents calibrated lashing slip or a measured semi-rigid joint.

All retained columns have their lowest centerline point fixed in six degrees of freedom. Visibility does not change the analysis. Removing column sets in Form changes the actual network and support set.

## Loads and material

Editable E and G govern axial/bending and torsion respectively; the shear modulus is an unverified assumption. Each layer has its own hollow circular diameter and wall thickness. Guadua and Asper E presets retain the limitations documented in [BAMBOO-REFERENCES.md](BAMBOO-REFERENCES.md). Density is also an editable trial assumption.

Self-weight is lumped equally at element endpoints. Roof gravity equals the specified kN/m² times the convex hull of the shell in plan; its nodal distribution follows projected shell-member length. Concavities and openings are not removed from that area. Horizontal loading is a total +X force distributed with the same weights, not a wind-pressure calculation. There is no shell membrane, cladding stiffness, prestress, creep, joint slip, taper, nonlinear buckling, or code capacity check.

## Computation and interpretation

The worker assembles the 3D frame stiffness matrix, constrains supports, scales the equations, reorders with reverse Cuthill–McKee, and solves with sparse LDL factorization (`cholesky-solve`). No artificial physical springs are added. Recomputed free-DOF residual, total force equilibrium and moment equilibrium gate the results. Disconnected layouts are blocked before solving.

The initial rigid case balances equilibrium but predicts excessive displacement, especially in the inner ring family. The initial pinned case fails the residual check. These are diagnostics of the inferred model, not predictions of a built shell. Results over the deliberately conservative 50 mm screening threshold disable the deformation display and carry an outside-linear-range label. Stress colors show elastic demand only, not strength utilization. A connected network alone does not establish structural stability or correct connectivity.

## Whole-structure parameters

Form changes span X/Z, height, crown rise, height-dependent twist and column-base spread. All layers are reconstructed as circular bamboo members from the changed axes, and the analysis network is rebuilt. Shell spacing retains every first, second or third imported member; it is thinning by source order, not a newly generated regular lattice. Support layout retains A, B or both column sets. Layer section sizes change both the display and stiffness. Changes clear stale results and cancel running studies.

Up to eight local snapshots retain the form, assumptions and optional numerical summary. Restoring requires rerunning. Notes are attached to member IDs and retained locally; export JSON to retain geometry, assumptions, results and notes outside the browser. The previous viewer's notes remain in its separate store.

## Verification

Tests cover axial and biaxial cantilever benchmarks, symmetry/rigid translation, load transfer through split continuous culms, a released-joint mechanism, disconnected and invalid models, all-six-layer shape changes, layout changes, and full-network force/moment balance. These verify implementation behavior, not the imported building's engineering adequacy.

Reference formulation: [Warsaw University of Technology, 3D frame element lecture](https://www.meil.pw.edu.pl/zwmik/content/download/62453/326674/file/Lecture%2011A_3D_frame_element_v2.pdf). Connection context: [University of Sheffield, Bamboo for gridshell structures](https://etheses.whiterose.ac.uk/id/eprint/35549/).

## Two design-ring controls

Form → Ring radius & height controls the upper outer ring (04.001 and its coincident duplicate 04.005) and the lower opening ring (04.002) independently. Gold/blue guides identify the actual controlled axes. Radius means equal-area horizontal-plan radius, preserving the imported elliptical proportions; elevation is the midpoint of each ring's vertical bounds. Values are shown in metres using the Study model-unit scale. Global form transforms apply first, then any explicit ring targets. Reset both rings restores their globally transformed baseline dimensions.

A shared inverse-distance deformation blends each ring's radial/elevation change through nearby members and anchors the retained column bases. This is geometric form exploration, not elastic deformation or a guarantee that all proposed joints remain valid. The network is rebuilt and prior results are invalidated after changes. Saved variations and exports include the ring targets; earlier variations without these fields use the original ring sizes. Tests cover independent targets, combined targets after global transforms, duplicate-ring consistency, unchanged bases, shell following, and legacy defaults.

Opening-ring edits now affect only member 04.002 and inner-shell layer 05. Outer covering 06, columns, other rings and framing retain their geometry, including when outer-ring targets are also active. Outer-ring edits retain their assembly-wide influence. The network is rebuilt after changes; geometric following does not guarantee connection continuity.

## Boundary curve and straight columns
Form → Boundary guide curve controls the paired outer boundary members 04.003/04.004. Length and width scale their plan shape; four smoothly blended elevation offsets control −X, +X, +Z and −Z zones. A coral overlay identifies the guide. Nearby shell members follow while the two design rings and column bases remain anchored during boundary edits. Boundary changes apply before ring overrides. After all form transformations, column intermediate points are reconstructed on a straight line between their transformed endpoints, preserving those endpoints exactly. This is form generation, not structural deformation. Controls persist with saved variations and exported form data.

## Reinforcement alternatives

Form → Shell bands & bracing offers Original, Continuous bands, Support bracing, and Bands + bracing. Generated members are added to Main rings, inherit that layer's section, and enter the analysis and self-weight. Role-specific indices distinguish bands, links and diagonals. Layout controls and run summaries are retained by saved variations and JSON exports.

Bands interpolate between the two boundary halves and the upper ring, with adjustable count and inset. Explicit straight links run from column heads to band vertices. The curves are not projected onto the shell: contact, gaps, bendability and splice details must be reviewed. Bracing connects real column attachment points in neighboring support groups; lower connection level is adjustable. Diagonals may cross circulation space and require clearance review. Existing members and straight columns are retained.

Connectivity tests verify every generated member enters a support-connected analysis network. This does not verify real connection strength or structural adequacy. Run `node scripts/compare-reinforcement.mjs` for a reproducible comparison using the same default rigid-joint assumptions and loads. All tested options remain outside the linear screening range; reduced computed movement is not approval of a design.

## Closed surface rings
The Closed surface rings and Surface rings + bracing alternatives create complete periodic loops, with optional support bracing. A radial surface chart is inferred from outer-shell centerline samples between the boundary and upper ring. Local smooth residual fitting estimates the surface height; periodic centripetal splines close each ring without a corner. This is approximate contact with a reconstructed reference surface, not verified tangency to the exterior faces of bamboo solids. Ring count and position are editable; the older band alternatives remain available. Generated ring IDs use 04.RC, and links attach them to column heads. Closure, seam direction and support connectivity are tested.

The ring option now uses **Level contour rings** to match the dashed reference: horizontal planes intersect outer-shell centerlines, the outer branch is ordered around the structure, and a periodic spline closes each section. Every point on a ring has the same elevation. Lowest elevation and vertical spacing replace radial inset for this option. Levels are constrained to the shared range between the highest boundary and lowest upper-ring point; incomplete section coverage does not produce a ring. Between source-axis intersections, surface contact remains approximate. This supersedes the earlier radial surface-chart ring method.

## Reference-inspired bundled bamboo frame
The Bundled bamboo frame alternative follows the supplied CASSA renderings as a visual concept: a built-up perimeter, selected primary ribs, short transverse ties and alternating diagonal webs. Existing shell members and straight columns are retained. Added chords are vertically offset above their source paths; depth is 0.2–1.2 model units, with 2–4 chords per bundle and 4–16 primary ribs selected from the retained outer-shell member order. The imported source culm is the first chord. Column-head links terminate at actual frame vertices.

The local viewer opens with this candidate selected; Original structure and Reset entire form restore the baseline. Added members use Main rings sections, enter self-weight and the beam network, and carry 04.RF indices for notes. Explicit webs are modeled as individual bamboo members: no composite section stiffness is assumed. This is not a reconstruction of the reference building's verified engineering, and no strength or stability claim is made. Geometry tests check baseline preservation, finite unique members, control effects and support connectivity.

## Roof control points
Form now offers eight selectable cyan roof handles, positioned on outer-shell axes near a 3-by-3 plan grid with its center omitted. Height offsets are bounded to ±3 model units and displayed in metres using the study unit scale. An inverse-distance field interpolates each offset, attenuated toward ring vertices and column endpoints. Rings and columns remain unchanged; the remaining shell members share the deformation field. Reinforcement is rebuilt afterward, and existing result invalidation requires a fresh study run.

These are vertical shape controls on inferred curves, not a NURBS surface editor or draggable XYZ handles. Locations are recalculated when overall form or member spacing changes. Reset roof points removes only their offsets; saved variations and JSON exports retain them. Model buttons and the point dropdown select the same handle. Handles are hidden in exploded view. The camera keeps its orbit during edits. Tests verify exact handle displacement, preserved rings/columns, reinforcement regeneration, connectivity for the tested edit and exact reset.

## XYZ Bézier cage editor
The roof UI now uses a 4-by-4 cubic tensor-product Bézier displacement cage, replacing the eight height handles. The displayed net is a spatial editing scaffold inferred from the roof bounds; it is not an exact NURBS reconstruction of imported geometry. Zero displacements preserve the imported shape. Sixteen XYZ vectors blend through Bernstein weights in the original plan coordinates. Control vertices generally do not lie on the resulting roof surface. Offsets are limited to ±8 source units per axis, displayed in metres.

Select one vertex, a U row, a V column or the entire net. Numeric XYZ edits and a translation gumball apply the same offset operation. The gumball is rendered in world space outside the normalized model group; orbit controls are disabled during dragging. Release commits the geometry and rebuilds the analysis network. Edits carry into saved variations and exports. Roof members and reinforcement rebuild, column heads move, column bases stay fixed, and columns are straightened. Optional ring locking fades the displacement toward rings. Ring controls describe the input geometry before cage deformation. Older saved height-point edits remain supported and can be cleared independently.

Verification: 27 geometry/solver tests pass, including uniform XYZ displacement, fixed bases, straight columns, row editing, ring locking, connected edited reinforcement and reset. Browser testing confirmed a vertical gumball drag updates the Y offset while X/Z stay unchanged. This is a form-editing feature, not structural validation.

## Boundary rebuilding and Revit geometry export
The bundled bamboo frame is removed from active layouts and defaults. Legacy saved reference layouts fall back to the original structure.
Boundary guide curve now offers Original, Smooth arch (quadratic reconstruction through the broad mid-region), and Straight (end-to-end chord per side). Rebuilding is applied after cage deformation and blends changes into nearby shell curves. Design rings and columns remain anchored during rebuilding. Boundary diameter follows the Main rings section.
Study includes Export geometry for Revit · IFC. It writes IFC2x3 with a project/site/building/storey hierarchy, IfcColumn/IfcMember identities, presentation layers and bamboo material. Every centerline segment becomes an analytic hollow circular extrusion with the configured diameter and wall thickness. Coordinates use metres with Y-up converted to Z-up as (x,-z,y). All active geometry is exported, independent of display visibility/explosion and analysis displacement. Curves are segmented, and adjacent solids are not boolean-unioned. These are imported geometric elements, not native parametric Revit families. Open using Revit File > Open > IFC. Tests cover references, units, member count and sections; direct Revit round-trip has not been verified on this machine.

## Strapped main-ring section detail
Form includes Bamboo bundle + steel straps for the outer and opening rings (04.001, 04.002, and imported duplicate 04.005). This changes beam cross-section only: diameter 200–800 mm, strap spacing 100–1000 mm, width 10–80 mm, thickness 0.5–5 mm. Rendering uses a cylindrical bundle envelope with longitudinal seam lines and instanced annular steel bands perpendicular to the local curve tangent. Spacing is evenly distributed by arc length, no larger than the requested maximum. Buckles, individual interior bamboo strips and fastening details are not modeled.

The parameter object is retained with saved studies. Any edit invalidates results. While enabled, structural runs are disabled because the hollow-culm model cannot represent the bundle's slip and composite action. Disabling restores the original hollow-section study. IFC exports solid bundle envelopes and separate hollow-profile steel straps with member-based IDs and distinct materials; it does not assert fabrication readiness or verified Revit round-trip. Tests cover station spacing/unit conversion, unchanged centerlines, section dimensions, IFC entities and material distinctions. Browser checks verify the visual option and study guard.

Boundary detail extension: the bundle + steel straps controls now provide independent ring and boundary toggles. Boundary targets are 04.003 (+Z) and 04.004 (-Z); rings and boundary share diameter and strap dimensions. The detail follows the current member axes, including cage edits and smooth/straight boundary rebuilding. Selection is shared by the renderer and IFC exporter. Either toggle activates the uncalibrated-bundle study guard. Legacy ring-only settings remain ring-only. 31 tests pass, including independent boundary IFC selection and unchanged centerlines.

## Optional roof covering inspired by Stripper
Form → Roof covering builds a mesh loft between the outer design ring (04.001) and the joined boundary halves (04.003/004). The correspondence uses plan-angle rays from the outer-ring centre; small source seams are closed for sampling. The central opening stays clear. The rails must remain nested and intersect every sampling ray, otherwise the UI reports an error and covering export is blocked.

Options include open strips or gap-free continuous panels, radial/circumferential direction, 8–96 strips, gap fraction, mid-span vertical bow and opacity. The mesh updates from edited rails, including cage/boundary changes. This is a rail loft, not an exact fit to all imported shell members, and may intersect the frame. Panels have RC indices and export as IFC2x3 face-based surfaces under Roof covering. They have zero thickness and do not add solver stiffness or automatic self-weight; users must supply a roof-gravity allowance. Strip developability, nesting and unfolding are not implemented. Geometry is inspired by the public mesh/edge-loop concepts described at https://www.food4rhino.com/en/app/stripper and does not execute or reproduce the Grasshopper plugin.

## Crossing/flowing strips and exploded inspection
Roof covering adds Crossed U + V bands (separate U and V counts) and Flowing bands (a bounded sinusoidal change of parameter direction). Crossed V bands are offset vertically by 0.03 model units; this is a conceptual layered assembly, not an engineered woven connection. Families have distinct colors, stable IDs and summed triangulated surface area; overlaps count twice in total material area. Area is not a fabrication takeoff allowance.
Explode applies a distinct radial and vertical display offset to each strip, auto-frames the assembly, and labels hovered strips. Inspect strip isolates any index in assembled or exploded view. Total and family counts remain visible. Geometry used for IFC stays assembled and complete regardless of inspection selection. The implementation follows regular U/V mesh-band concepts, not arbitrary singularity-aware mesh traversal or developable unfolding. 35 tests pass including family counts, flowing geometry, area and non-mutating explode offsets.

## Length inspection, original-only reinforcement, and animated explode
Strip length is sampled along each panel's mid-width curve (including a complete loop for circumferential strips). A blue-to-amber length scale uses all generated strips, so isolation does not rescale the legend. The canvas and controls show min/max metres; the strip selector and hover label show individual lengths. Units follow the study scale. These are geometric centre-line lengths, without lap/waste allowances.

The viewer now always shapes the original member set: retired reinforcement modes in legacy saves do not generate additions. Their generator utilities remain dormant for future work and retain isolated algorithm tests. The UI exposes only Original structure.

Enabled ring/boundary bundle members separate laterally in exploded view. Each shows its ID, centre-line length and strap count; the control panel lists all quantities and totals. Imported duplicate 04.005 is explicitly included and flagged. Explosion progress and camera framing use exponential easing in both directions, including beam axes and strip offsets. Guide labels are hidden during exploded inspection to reduce clutter. Export remains assembled. Validation: 37 tests pass and the production build succeeds; browser preview confirms length colors, original-only controls and bundle quantity labels.

## Rebuild tab: goal-based reverse engineering
A new Rebuild tab uses the current inferred beam network as reference topology. Nodes belonging to columns, inner framing, main rings and boundary are hard anchors. Remaining roof nodes can start at a common mean elevation or at their reference positions. A background worker balances normalized edge-length corrections, reference attraction and neighbor smoothing with damped Jacobi updates. It stops below 1e-5 model units RMS step motion or after 800 iterations. These goals are geometric and not physical stiffness/load parameters.

Grey reference, cyan candidate and gold fixed nodes are displayed together. Diagnostics include RMS distance to all reference nodes, RMS relative edge error on edges with a free endpoint, and RMS free-node step movement. Numerical settling does not imply that all goals are satisfied. Run, stop, reset, seed preview and JSON recipe/geometry export are provided. Preview does not modify the working geometry or IFC export. Changes to source geometry reset the reconstruction.

This is an independent browser implementation inspired by the goal-based workflow described in the TU Delft Kangaroo lesson and Daniel Piker's examples. It does not embed Kangaroo, perform MeshMachine adaptive remeshing, recover unique historical design intent, or establish fabrication/structural validity. Rest lengths are derived from the current shell; reference attraction deliberately biases reconstruction toward it. Bamboo bending stiffness, prestress, gravity, collision and connection slip are not calibrated here. Sources: https://www.food4rhino.com/en/app/kangaroo-physics ; https://interactivetextbooks.tudelft.nl/rhino-grasshopper/Grasshopper_Rhino_course/2_Knowledge_base/Generative_Design/Generative_Form_Finding/!index.html ; https://github.com/dan-piker/kangaroo-examples ; https://github.com/Dan-Piker/MeshMachine . Food4Rhino returned an HTTP 405 during direct retrieval; the available university workflow and GitHub descriptions informed implementation.

Validation: 40 tests pass, with anchor invariance, stationary target geometry, convergence toward target and rest-length sensitivity benchmarks. Build succeeds. Browser full-shell test: 4,959 nodes, 933 anchored, 4,026 free; defaults settled after 100 iterations, approximately 0.009 m RMS target distance and 4.65% RMS relative edge error. This is a reference-fitting demonstration, not a prediction of construction behavior.

## Generative experiments
The Rebuild tab includes hanging-net and tension-net presets. Both disable reference attraction; users can choose anchor scope and vary rest-length factor, smoothing and downward geometric bias. Generate 6 variations sweeps length factor against loading (or smoothing for unloaded nets), stores each result and displays selectable projected shape thumbnails. Recipe exports include all generated alternatives.

These are geometric analogues, not calibrated gravity, soap-film area minimization, bamboo bending or engineering verification. Each run is capped at 800 iterations and reports movement and goal errors; the tested hanging-net sweep reached the iteration limit for all six alternatives. Results remain previews and do not replace the working geometry. Browser verification confirmed six thumbnails and selection updating the displayed metrics. Production build and 42 automated tests passed.

## Floor-to-shell inverse reconstruction
Rebuild > Floor to shell > Inverse relax shell starts non-support nodes at the minimum model elevation and retains base supports. A smooth moving target and damped positional updates raise the projected network toward the current geometry. This is an animated target-guided reconstruction, not a pressure or material solver. Other relaxation controls and variation sweeps are disabled for this mode. Show seed, Stop and Reset remain available. The default 4,959-node browser run settled at 620 iterations with 18 fixed supports and displayed RMS target error 0.000 m. Six solver tests and the production build pass.

## Editable floor workflow
The Rebuild UI now exposes only Floor to shell. It opens on the floor automatically. Width, depth, rise and plan skew edit an affine target; every edit cancels the worker and restores the flat seed. Footprint changes move base locations with the shell, while bases stay fixed during the rising animation. Affine transformations preserve straight columns. Reset restores the current source shell proportions. Exports include edited parameters and preview positions. These controls transform a known shell rather than solving pressure equilibrium. Seven solver regression tests pass.

Live shape edits now preserve the current inflation stage (floor, partial or raised). Edits stop an active worker and immediately rebuild the edited preview at that stage. Edit on floor explicitly returns to the seed. Mirrored pulls and dimensional controls share this behavior. Nine solver tests pass.

Weather exposure preview in Rebuild provides manual wind speed/travel direction, rainfall, assumed fall speed and air density. Gold/blue trajectories are uniform incident motion with no geometry interaction. Dynamic pressure is 0.5 rho V², not roof pressure. Rain input mm/h equals L/h per horizontal m². No CFD, runoff, shelter, ponding or live weather lookup is implemented. Actual weather-performance analysis remains future work requiring an explicit roof surface and solver.

## Construction and procurement exploration (2026-10-09)
The default shell now has 48 rib-based woven-mat panels with a procedural weave appearance inspired by the user's tower image. This is a visual assembly concept, not a verified waterproof specification. Form offers an optional tower-inspired crossed-bay layout; custom steel joints and engineering capacities are not reproduced.

Construction offers four stages with eased transitions: assembled axes, separated layers, floor length diagrams, and stock cutting groups. Floor representations straighten curved culms and use equivalent-area covering rectangles, not fabrication unfolding. Bundles expand using an editable constituent count; split-slat conversion and constituent section remain unspecified. Straps are counted separately. The duplicate imported ring 04.005 remains included and flagged.

Stock scenarios 8/10/15 m use first-fit decreasing by section, 0.10 m end trim and 5 mm between cuts. Oversize members are unresolved by default. Optional 0.5 m overlap splices are explicitly unverified. The recommendation minimizes purchased linear metres among the three scenarios, not cost. Covering sheet area provides a lower bound only, not nesting or a purchase order. Default geometry: 213 members, 4320.4 m centre-line length, 48 panels, 860.5 m². With assumed splices enabled, the current heuristic chooses 8 m / 5152 m purchased / 441 joints. Without splices no option fits every member.

CFD follows the user's Ansys methodology reference in a new setup/export explanation. Mesh resolution is selectable (20/28/40 cubed). Export includes metre-based roof triangles and fluid/inlet settings. No Fluent, Navier–Stokes or turbulent backend has been connected; potential flow remains a labeled preview. Woven permeability, boundary layers, ground, water collision and runoff remain unresolved.
