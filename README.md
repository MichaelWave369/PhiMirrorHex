# PhiMirrorHex

> **As Above, So Below. Coherence Through Symmetry.**

**Φ-Mirror Hex E1** is a dependency-light, reproducible research prototype for sixfold agent coordination, pairwise verification, and causal-memory preservation.

The organizing picture is a **hexagonal bipyramid** (8 vertices, 18 physical edges, 12 triangular faces). The *logical* verification architecture is deliberately different from its geometry:

- **6 upper functions × 6 lower functions = 36 cross-plane channels**.
- **36 channels + 1 central gate = 37 logical records**.
- **37 choose 2 = 666 possible undirected comparison pairs**, composed of 630 channel-to-channel comparisons and 36 channel-to-gate comparisons.
- A Fibonacci-budget scheduler samples 55, 89, 144, 233, 377, 610, or 666 pairs; **all 36 gate connections are always included**.
- A candidate Φ-weighted coherence score can be compared against non-Φ baselines.
- Toy cancellation controls demonstrate a limitation of aggregate-only memory, **not** a claim of general AI improvement.

**Status:** E1 research prototype. These quantities are design choices and combinatorial identities, not evidence of a physical law, universal optimality, consciousness, or successful integration with other projects.

## Quick start

Python 3.11+; no runtime dependencies.

```bash
python -m pip install -e ".[dev]"
python -m phimirrorhex --budget 144 --seed 369
python -m pytest -q
```

For the standalone interactive visualization:

```bash
python -m http.server 8000 --directory docs
```

Open http://localhost:8000 in a browser. The website is a client-side explanatory instrument; its slider is not executing the Python harness.

## E1 invariants

| Quantity | Expected | Interpretation |
| --- | ---: | --- |
| Bipyramid vertices / edges / faces | 8 / 18 / 12 | Physical geometry |
| Upper roles / lower roles | 6 / 6 | Functional partition |
| Cross-plane channels | 36 | Cartesian product |
| Audit nodes | 37 | 36 channels plus central gate |
| Pairwise audit relationships | 666 | Complete undirected logical comparison graph |
| Channel-channel relationships | 630 | C(36,2) |
| Channel-gate relationships | 36 | 1 per channel |

The gate represents an *audit/decision boundary*, **not** autonomous permission to run actions. An external governed runtime must enforce authorization; E1 has no tool execution or network capability.

## Experimental plan

1. **E1-A, topology:** assert geometry and graph invariants, pair uniqueness, deterministic sampling, and mandatory gate coverage.
2. **E1-B, weighting:** compare candidate Φ penalty to equal and tuned penalties on held-out labeled examples; report calibration as well as accuracy.
3. **E1-C, scheduling:** compare Fibonacci budgets against same-cost fixed/doubling/random sampling, keeping the gate policy constant.
4. **E1-D, causal memory:** contrast channel-preserving, sum-only, and identity-swapped representations on balanced cancellation cases. Progress to hidden-state sequences, delayed interventions, and true held-out tests.

Don't promote a Φ or Fibonacci advantage without cost-matched baselines, independent seeds, and negative controls. The first toy control here is a **sanity check**, not experimental proof of advantage.

## Components

- `phimirrorhex/core.py`: exact geometry, 37-node graph, audit sampler, candidate coherence score.
- `phimirrorhex/experiments.py`: deterministic E1 report and toy causal controls.
- `phimirrorhex/__main__.py`: JSON CLI.
- `tests/`: invariants and negative-control expectations.
- `docs/index.html`: sixfold interactive visual explainer.
- `.github/workflows/ci.yml`: Python 3.11/3.12 tests.

## Integration boundaries

Later, read-only adapters may provide audit receipts to **NestedBubbleGear**, **BrainC/SuperPhiVessel**, **PhiOS**, **Domistika**, and **PixelForge**. None are integrated in E1; no module may bypass the destination project's own authority or reality gate.

## License

MIT. See [LICENSE](LICENSE).
