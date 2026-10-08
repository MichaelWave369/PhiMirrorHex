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

## E5 · Nested Gear Coupling / Delayed Conveyor

**E5** adds a time-dependent synthetic extension to the same PhiMirrorHex repo:

- Six sectors in **six coupled layers**, with alternating local gear rotation and one-step conveyor memory;
- Two counterposed states, initially identical through the restricted Keyhole `P(x)=sum(outer ring)`;
- Delayed hidden-state arrival at frame **10**, while the coarse Keyhole still reports equality;
- A predetermined identical outer interface probe at frame **12** reveals the difference (default outer gap `0.0703125`);
- **No coupling / no probe / no conveyor** controls block the witness, separating transport effects from observation;
- **32 × 24 exact Python↔JavaScript replay comparisons** across all frozen coupling, gain and conveyor settings.

The React research site includes a **GEARS** tab with twin six-ring animated diagrams, transport controls, time scrubbing, the hidden/observable separation traces, and local synthetic JSON exports.

```bash
python -m phimirrorhex --mode gears --coupling 0.5 --probe-gain 0.5
python -m phimirrorhex --mode gears --coupling 0 --probe-gain 0.5
python -m phimirrorhex --mode gears-fixtures --output e5-gears-fixture.json
node tests/check-gears-parity.mjs e5-gears-fixture.json
```

See [E5 frozen protocol](docs/E5_NESTED_GEAR_COUPLING.md). This remains a **finite constructed toy**. Neither Φ nor Fibonacci is necessary for the separation, and no human, physiological, physical, model or consciousness measurement is claimed.

## E6 · Coherence Across Scales

E6 finally asks a testable version of the golden-ratio question: **does φ weighting have predictive value compared with equal or other six-scale weights?** In a frozen benchmark, five independent *engineered* worlds (equal, two φ orientations, center-weighted, alternating) each supply 128 validation and 128 held-out synthetic examples. All five candidate schemes read the same six normalized scale inputs and perform the same number of weighted contributions.

- Model choice is frozen on **validation seed 202** before scoring on **held-out seed 203**.
- Full MAE/RMSE results for every candidate in every world, plus label-shift negative controls.
- Equal weighting is expected to win when equal weighting generates the ground truth; a matching φ scheme wins in a φ-generated world **by construction**. This is a benchmark sanity check, not evidence of universal optimality.
- Python and independently written JavaScript reports are compared in CI with numerical tolerance. The **COHERENCE** React tab shows all five regimes, model rankings, ring weights and test examples.
- Synthetic/SIMULATED provenance and no authority, human data or consciousness claims.

```bash
python -m phimirrorhex --mode coherence --output e6-coherence-fixture.json
node tests/check-coherence-parity.mjs e6-coherence-fixture.json
cd web && npm test && npm run build
```

See [E6 frozen protocol](docs/E6_COHERENCE_BENCHMARK.md).
