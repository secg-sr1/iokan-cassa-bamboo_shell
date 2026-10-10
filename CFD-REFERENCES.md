# CFD reference review

User references: https://www.youtube.com/watch?v=-MkRBeQkLk8 and https://www.youtube.com/watch?v=76Pc4V-Tt6w. Direct playback was unavailable; identification was corroborated through indexed pages and official project documentation.

- FluidX3D: https://github.com/ProjectPhysX/FluidX3D — GPU/CPU OpenCL lattice-Boltzmann solver; supports transient flow and visualization. Licensing is free for non-commercial use; commercial integration needs license review.
- NVIDIA CAE: https://www.nvidia.com/en-us/solutions/cae/ — accelerated engineering workflows, including Luminary virtual wind tunnels.

Current implementation remains a coarse 28³ finite-difference potential-flow prototype. It is not FluidX3D or Luminary, and cannot predict turbulent wakes. Numerical convergence alone does not validate its physical accuracy.

Next solver integration requires: a finite-thickness watertight roof volume preserving the opening, units and ground/domain boundaries, inlet profile and viscosity, a transient viscous solver, mesh/time-step convergence checks, then velocity/pressure result import. Do not label the geometric incidence roof map as pressure. Rain collision/runoff is a separate model and is not implemented.

Legend now separates streamline speed in m/s (0–2× inlet, clipped) and dimensionless roof incidence (0–1); rain has a separate legend.
