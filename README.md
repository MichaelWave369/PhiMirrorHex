# PhiMirrorHex

> **As Above, So Below. Coherence Through Symmetry.**

**Φ-Mirror Hex E1/E2** is a dependency-light, reproducible research prototype for sixfold agent coordination, pairwise verification, and causal-memory preservation.

The organizing picture is a **hexagonal bipyramid** (8 vertices, 18 physical edges, 12 triangular faces). The *logical* verification architecture is deliberately different from its geometry:

- **6 upper functions × 6 lower functions = 36 cross-plane channels**.
- **36 channels + 1 central gate = 37 logical records**.
- **37 choose 2 = 666 possible undirected comparison pairs**, composed of 630 channel-to-channel comparisons and 36 channel-to-gate comparisons.
- A Fibonacci-budget scheduler samples 55, 89, 144, 233, 377, 610, or 666 pairs; **all 36 gate connections are always included**.
- A candidate Φ-weighted coherence score can be compared against non-Φ baselines.
- Toy cancellation controls demonstrate a limitation of aggregate-only memory, **not** a claim of general AI improvement.

**Status:** E1 foundation merged; E2 deterministic synthetic simulation under review. These quantities are design choices and combinatorial identities, not evidence of a physical law, universal optimality, consciousness, or successful integration with other projects.

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

## E2: The Living Hex

E2 introduces **synthetic** streaming frames, three controlled disagreement injections, cross-language replay parity, 36 named channel values on Fibonacci-relative nested six-point rings, and read-only proposed observation envelopes. There is **no** production connection to NestedBubbleGear, SuperPhiVessel, PhiOS, or any external system.

```bash
# Generate and locally save a deterministic E2 series with SHA-256 digest
python -m phimirrorhex --mode e2 --steps 24 --seed 369 --output e2-report.json

# Generate a read-only proposal envelope for a future integration
python -m phimirrorhex --mode e2-bridge --target nestedbubblegear
python -m phimirrorhex --mode e2-bridge --target superphivessel

# Run the exact cross-language parity check, using Node.js 22+
node tests/check-parity.mjs e2-report.json

# Serve the instrument from localhost (the original E1 panels remain intact)
python -m http.server 8000 --directory docs
```

Open http://localhost:8000 and scroll to **E2 / The Living Hex**. Run/play frame controls and inspect individual labeled synthetic channels. This browser visualization runs the same deterministic frame equations as Python and uses Web Crypto to reproduce E1 SHA-256 audit ranking. It does **not** consume live models or sensor data.

See [E2 contract](docs/E2_CONTRACT.md) for equations, receipt format, constraints, negative controls, and future integration requirements.

## E4 · Nested Vessel / NBG-style Keyhole Measurement

A new **VESSEL** tab in the React GitHub Pages research lab introduces a **finite synthetic measurement experiment** inspired by the formal vocabulary of [NestedBubbleGear](https://github.com/MichaelWave369/NestedBubbleGear).

Two distinct six-sector internal states share a zero-sum coarse observation. Through the **same** fixed series of rotations and an adjustable interface gain, a delayed Keyhole probe can make their difference observable. Changing observer depth reveals the measurement ladder; turning gain off is a complete coarse-equivalence negative control.

- **Six illustrative rings:** environment, sensory boundary, encoding, local loops, integration *proxy*, behavioral expression *proxy*.
- **Deterministic positive and negative controls:** same interface for both states, delayed separating witness or no witness.
- **Python ↔ JavaScript parity:** 80 complete reports across five probe layers, four gain settings and four observer depths.
- **NBG provenance and claim firewall:** SIMULATED, no biometric measurement, no consciousness inference, no authorization.
- **No external dependency:** all implementation lives in this repository; NestedBubbleGear remains unchanged.

```bash
python -m phimirrorhex --mode vessel --probe-layer 3 --gain 0.5 --observer-depth 3
python -m phimirrorhex --mode vessel --probe-layer 3 --gain 0 --observer-depth 5
python -m phimirrorhex --mode vessel-fixtures --output e4-vessel-fixture.json
node tests/check-vessel-parity.mjs e4-vessel-fixture.json
```

See [E4 frozen methods](docs/E4_NESTED_VESSEL.md). The human-as-vessel interpretation is philosophical and conceptual, not an established physiological theory.
