---
layout: default
title: FTS Persistence Pipeline
mathjax: true
---

# Finite Topological Space (FTS) Persistence Pipeline

This document describes the structure, semantics, and parameters of the
Finite Topological Space persistence pipeline.

The goal of the pipeline is to construct a filtration of finite topological
spaces on a fixed finite metric space \( X = \{1,\dots,n\} \), extract
weakly homotopy equivalent simplicial complexes, and compute persistent
homology from the resulting (non-nested) simplicial maps.

---

## 1. High-level overview

### Input
- A finite metric space \( (X, d) \), typically a point cloud
- Distance matrix \( D = (d(x,y)) \)
- Density scale \( k \)-NN radii \( r_k(x) \)
- A schedule of density thresholds \( \tau_1 < \tau_2 < \cdots < \tau_m \)

### Output
- A filtration of finite topological spaces:
  \[
  (X, T_1) \to (X, T_2) \to \cdots \to (X, T_m)
  \]
  where the identity map is continuous and topologies become coarser.
- Associated simplicial complexes \( K_i \) (order complexes of \( T_0 \)-quotients)
- Persistent homology groups \( H_0, H_1 \) with maps induced by identity

---

## 2. Mathematical model of a topology

Each topology \( T \) on \( X \) is represented as an **Alexandroff topology**
via its minimal open sets:

\[
U_x := \bigcap \{ U \in T : x \in U \}
\]

Properties:
- \( x \in U_x \)
- \( y \in U_x \Rightarrow U_y \subseteq U_x \)
- \( T \) is fully determined by \( \{U_x\}_{x\in X} \)

The topology is constructed from a family of **generator open sets**
\( \mathcal{G} \subseteq \mathcal{P}(X) \) via:
\[
U_x = \bigcap_{\substack{G \in \mathcal{G} \\ x \in G}} G
\]
If no generator contains \( x \), we set \( U_x = X \).

---

## 3. Script-level documentation

---

## 3.1 `pipeline.sage`

### Role
Orchestrates the entire filtration pipeline:
- iterates over density thresholds
- builds topologies
- enforces continuity
- computes invariants and homology

### Main function

#### `run_density_filtration(...)`

**Input:**  
- Distance matrix `D`
- Density parameters
- Topology construction parameters

**Output:**  
- A list of filtration levels, each containing:
  - minimal opens `U`
  - T0-poset
  - simplicial complex
  - homology data

---

## 3.2 `topology.sage`

### Role
Constructs the topology \( T_i \) at filtration step \( i \).

### Main function

#### `build_topology_step(...)`

**Input:**  
- `prev_U`: minimal opens of previous topology
- anchor parameters
- uncovered parameters

**Output:**  
- `U`: minimal opens defining the new topology

### Sub-steps
1. Construct anchor generators \( \mathcal{A} \)
2. Construct uncovered generators \( \mathcal{B} \)
3. Form intermediate minimal opens
4. Enforce continuity via saturation

---

## 3.3 `anchors.sage`

### Role
Constructs **anchor-based generator open sets** using density information.

### Key definitions

- \( r_k(x) \): distance to the \( k \)-th nearest neighbor of \( x \)
- \( \rho(x) \): density estimate, typically inverse to \( r_k(x) \)

---

### Function: `build_anchor_generators_density(...)`

**Input:**  
- `D`: distance matrix
- `r_k`: kNN radii
- `rho`: density values
- `tau`: density threshold
- `lambda_scale`: neighborhood expansion factor

**Output:**  
- A list of generator sets \( O_a \) and/or \( O_C \)

---

### Anchor neighborhood

For an anchor point \( a \):
\[
O_a := \{ x \in X : d(a,x) \le \lambda \cdot r_k(a) \}
\]

---

### Strong anchors and components

- Strong anchors satisfy:
\[
\rho(a) \ge \text{strong\_cut}(\tau)
\]

- A graph is built on strong anchors using:
  - kNN adjacency
  - overlap thresholds \( \theta \), \( \theta_{\text{contain}} \)

- Connected components yield:
\[
O_C := \bigcup_{a \in C} O_a
\]

---

## 3.4 `capping.sage`

### Role
Limits the number of anchor neighborhoods to control complexity.

### Idea
Select representative anchors so that:
- anchor balls are spatially separated
- coverage is approximately preserved

### Function: `cap_anchors_balls_for_tau(...)`

**Input:**  
- anchor candidates
- metric information
- cap parameters

**Output:**  
- Reduced list of anchors

---

## 3.5 `uncovered.sage`

### Role
Handles points not covered by anchor generators.

---

### Function: `uncovered_components_knn(...)`

**Purpose:**  
Cluster uncovered points using an undirected kNN graph.

**Definition:**  
Two uncovered points \( x,y \) are connected if:
\[
y \in \text{kNN}_k(x) \quad \text{or} \quad x \in \text{kNN}_k(y)
\]

**Parameters:**
- `k_inside`: number of nearest neighbors considered

**Output:**  
- List of connected components

---

### Function: `uncovered_components_radius_local(...)`

**Purpose:**  
Cluster uncovered points using a local radius criterion.

**Definition:**  
Connect \( x,y \) if:
\[
d(x,y) \le \alpha \cdot \min(r_k(x), r_k(y))
\]
and \( y \) is among the `k_cand` nearest neighbors of \( x \).

**Parameters:**
- `radius_mult = \alpha`
- `k_cand`: candidate neighbors

---

### Generator construction modes

- **prev_union**:
\[
B_C := \bigcup_{x \in C} U^{\text{prev}}_x
\]

- **attach**:
\[
B_C := C \cup (\text{nearby anchor neighborhoods})
\]

- **both**:
Single generator formed by union of the above

---

## 3.6 Continuity and saturation utilities

### Function: `continuity_ok(prev_U, curr_U)`

Checks whether the identity map
\[
(X, T_{\text{prev}}) \to (X, T_{\text{curr}})
\]
is continuous.

Equivalent condition:
\[
U^{\text{curr}}_x = \bigcup_{y \in U^{\text{curr}}_x} U^{\text{prev}}_y
\]

---

### Saturation

If continuity fails, redefine:
\[
U_x := \bigcup_{y \in V_x} U^{\text{prev}}_y
\]

This projects candidate opens into the previous topology.

---

## 3.7 `t0_poset.sage`

### Role
Constructs the \( T_0 \)-quotient and specialization poset.

### Definition
\[
x \sim y \iff U_x = U_y
\]

Poset order:
\[
[x] \le [y] \iff U_x \subseteq U_y
\]

---

## 3.8 `order_complex.sage`

### Role
Constructs the order complex of the specialization poset.

- Vertices: equivalence classes
- Edges: \( a < b \)
- Triangles: chains \( a < b < c \)

Only the 2-skeleton is constructed.

---

## 3.9 `homology.sage`

### Role
Computes simplicial homology over \( \mathbb{F}_2 \).

### Output
- \( \beta_0 \), \( \beta_1 \)
- Representative cycles (optional)

---

## 4. Global parameter glossary

| Parameter | Meaning |
|---------|--------|
| `k_density` | kNN parameter for density estimation |
| `r_k(x)` | distance to k-th nearest neighbor |
| `lambda_scale` | anchor neighborhood expansion |
| `tau` | density threshold |
| `theta` | overlap threshold |
| `theta_contain` | containment threshold |
| `radius_mult` | local radius scaling |
| `k_inside` | kNN for uncovered clustering |

---

## 5. Core invariants

At every filtration step:

1. \( x \in U_x \)
2. \( y \in U_x \Rightarrow U_y \subseteq U_x \)
3. \( U_x^{(i)} \) is open in \( T_{i-1} \)
4. Identity map is continuous
5. Vertex count of \( K_i \) is non-increasing

---

_End of document._
