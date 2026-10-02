# Bamboo reference values in the local sandbox

The columns represent natural hollow bamboo culms. Culm diameter and wall thickness control both their visual section and solver section. Visible internode rings are decorative and do not increase calculated stiffness. No strength grade is assigned.

## Guadua angustifolia

[INBAR Working Paper 79, Grading of Bamboo, Table 7](https://www.inbar.int/wp-content/uploads/2020/05/1491896803.pdf) reports a mean static bending modulus of 17,204 N/mm² (17.204 GPa) for 168 specimens. The reported sample mean moisture content is 11.2%. This is the basis of the Guadua reference preset. It is a sample mean, not a characteristic modulus, allowable stress, or universally applicable species property. Measured dimensions and grading for the actual supply remain necessary.

## Dendrocalamus asper

[Gauss, Kadivar & Savastano (2019), Journal of Wood Science](https://doi.org/10.1186/s10086-019-1804-6) reports static bending MOE of 15.9–16.2 GPa across treatment conditions. The Asper preset uses 15.9 GPa as a sensitivity input, not a design lower bound. Specimens were prismatic strips cut from mature internodes in Brazil; this is not a full-culm structural grading dataset. The paper distinguishes static bending, dynamic, and compressive moduli; its compressive modulus differs from bending. Do not interchange these without validation.

## Applicability to this model

Both presets set only E. The current simplified solver uses that single E in EA and EI, explicitly an approximation. It does not model orthotropic transverse behavior, connection splitting, taper, moisture adjustments, duration effects, creep, local buckling, or design load combinations. No test mean strength has been turned into an allowable capacity.

[ISO 22156:2021](https://www.iso.org/obp/ui?_escaped_fragment_=iso%3Astd%3Aiso%3A22156%3Aed-2%3Av1%3Aen) covers structural design with bamboo culms. For a design model, obtain applicable-code requirements, actual supply grading, geometry, moisture/treatment conditions, and verified connection and support details. The sandbox makes no ISO compliance claim.

## Using the viewer

- **Study → Species / reference:** choose Guadua, Asper, or custom. Editing E changes the material label to custom.
- **Show results on model:** colors columns by member maximum displacement, stress, or compression/Euler ratio. The legend rescales per current variation; compare absolute numeric results, not colors across separate studies.
- **Deformation + shell context:** the shell is an undeformed ghost. The column deformation is amplified by the stated factor. Arrows indicate the applied per-column force direction, with symbolic fixed length. Gold markers show assumed fixed bases. Click a column to inspect its trial results.
- **Form:** width, depth, and height apply an affine change to all imported layers and to the solver axes. Column cross-sections remain circular and retain the chosen diameter; shell meshes, including their apparent thickness, are geometrically scaled. No new topology or connection design is generated.
- **Save current variation:** keep up to eight local snapshots of shape, section/material inputs, loads and numerical maxima. Restore a snapshot to rerun it. Study JSON export includes transformed column endpoints and the selected reference. Original downloadable GLBs remain the unmodified inferred base axes.

This work remains local and unpublished.
