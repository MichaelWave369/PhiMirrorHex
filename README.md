# PhiMirrorHex

> **As Above, So Below. Coherence Through Symmetry.**

**Φ-Mirror Hex E1–E17** is a dependency-light, reproducible research prototype for sixfold agent coordination, pairwise verification, and causal-memory preservation.

The organizing picture is a **hexagonal bipyramid** (8 vertices, 18 physical edges, 12 triangular faces). The *logical* verification architecture is deliberately different from its geometry:

- **6 upper functions × 6 lower functions = 36 cross-plane channels**.
- **36 channels + 1 central gate = 37 logical records**.
- **37 choose 2 = 666 possible undirected comparison pairs**, composed of 630 channel-to-channel comparisons and 36 channel-to-gate comparisons.
- A Fibonacci-budget scheduler samples 55, 89, 144, 233, 377, 610, or 666 pairs; **all 36 gate connections are always included**.
- A candidate Φ-weighted coherence score can be compared against non-Φ baselines.
- Toy cancellation controls demonstrate a limitation of aggregate-only memory, **not** a claim of general AI improvement.

**Status:** E1–E9 merged; E10 causal generalization experiment under review. These quantities are design choices and combinatorial identities, not evidence of a physical law, universal optimality, consciousness, or successful integration with other projects.

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

## E7 · Adaptive Nested Coherence

The **ADAPTIVE** React tab compares five six-scale model initializations (equal, φ-inner, φ-outer, center, alternating), each using the **same exponentiated-gradient learning rule, six parameters, 128 training updates, and identical synthetic inputs**. Train seed **201**, validation seed **202**, held-out test seed **203**.

- Frozen learning rate η=2.0; one online training pass.
- Model selection occurs on validation MAE **only**; all test metrics are reported.
- Frozen initial profiles are descriptive no-training baselines, explicitly not compute-matched to adaptive training.
- Label-shift negative control retrains the selected initialization with the **same 128 updates**.
- Independent **E5 Keyhole receipt** confirms a constructed hidden-information arrival at frame 10 and coarse reveal at frame 12, but **is never a training feature**.
- Full Python/JavaScript parity tests, six ring-weight trajectory views and synthetic receipt export.

```bash
python -m phimirrorhex --mode adaptive --output e7-adaptive-fixture.json
node tests/check-adaptive-parity.mjs e7-adaptive-fixture.json
python -m pytest -q
cd web && npm test && npm run build
```

See [E7 frozen protocol](docs/E7_ADAPTIVE_NESTED_COHERENCE.md). Any accuracy advantage applies only to these programmed synthetic worlds; **there is no φ optimality, biological or consciousness claim**.

## E8 · Robustness & Memory Compression

**E8** keeps E7's five adaptive learners **frozen** and evaluates them against new synthetic sensor conditions, with identical held-out target labels and fixed candidate selection:

- `clean`: no-op negative control;
- `noise`: deterministic independent bounded per-ring noise;
- `dropout`: neutral imputation for missing rings 1 and 4;
- `mean_only`: collapse six input identities into a common arithmetic mean.

Across five programmed worlds × five learners × four input scenarios, the same 128 held-out labels are retained, with no retraining or test-based switching. An independent read-only E5 Keyhole check compares six signed outer-sector values against their one-number sum: at frame 10, full state distinguishes the constructed cases **2/2** while sum-only gives **1/2**. At frame 12, the fixed probe exposes the distinction through the coarse sum.

The React Pages site adds a **ROBUSTNESS** tab with scenario selection, held-out error comparison, shift metrics, per-scale signals and the identity-compression witness. E8 remains completely simulated and non-authorizing.

```bash
python -m phimirrorhex --mode robustness --output e8-robustness-fixture.json
node tests/check-robustness-parity.mjs e8-robustness-fixture.json
python -m pytest -q
cd web && npm test && npm run build
```

Full protocol: [E8 robustness and memory compression](docs/E8_ROBUSTNESS_MEMORY.md).

## E9 · The Observability Frontier

Extends E8's hidden-state observability result into an **exhaustive, finite measurement census**. For every subset of six E5 outer-sector channels (64 masks including the empty mask), compare a restricted identity-preserving maximum gap against a sum-only gap over the **exact same selected channels**. Enumerate **24 frames × 4 detection thresholds × 4 causal controls**.

- Different sensor budgets `k=0…6`: exact C(6,k) mask census, no sampling or tuning.
- Controls: coupled+probe, no probe, no coupling, no delayed conveyor.
- Thresholds: 0, 0.001, 0.01, 0.05. A sensor subset detects only when its gap exceeds the threshold.
- At E5 frame 10, full signed identity retains a difference while the all-six sum cancels; after the fixed frame-12 probe, the coarse sum can also distinguish the pair.
- **Important:** some partial sums can reveal a difference that the complete sum hides. The React **FRONTIER** tab displays that nuance rather than claiming all summation fails.
- Python/Javascript parity, deterministic SHA-256 receipts and read-only E5 provenance. No real-world sensors, model connections or claims about consciousness.

```bash
python -m phimirrorhex --mode frontier --output e9-frontier-fixture.json
node tests/check-frontier-parity.mjs e9-frontier-fixture.json
cd web && npm test && npm run build
```

See [E9 frozen protocol](docs/E9_OBSERVABILITY_FRONTIER.md).

## E10 · Independent Causal Generalization

E9 enumerated sensor masks for one specially constructed state pair. E10 chooses a mask from **48 synthetic training episodes** (seed 901), reports **24 validation episodes** (seed 902), then evaluates a frozen choice on **48 held-out pairs**, half in a previously unseen dense-pattern family (seed 903).

The six-layer delayed-conveyor model is evaluated at step 12 under known-probe, unseen probe-sector, no-probe and no-coupling conditions. All 64 candidate masks are considered for **each** of seven sensor budgets and two readouts (identity-preserving max vs same-mask sum). Mask selection uses training only. A same-budget precommitted first-k baseline and a **post-hoc test oracle clearly forbidden for selection** are separately reported. Zero-coupling is a transport negative control; no-probe may still reveal differences to *partial* masks.

The live **GENERALIZE** tab includes a budget selector, held-out scoreboard, frozen-mask comparisons and six synthetic A/B case views. Python and JavaScript independently reproduce all train-only choices, test counts and example states with CI parity.

```bash
python -m phimirrorhex --mode generalize --output e10-generalization-fixture.json
node tests/check-generalization-parity.mjs e10-generalization-fixture.json
python -m pytest -q
cd web && npm test && npm run build
```

See [E10 frozen protocol](docs/E10_CAUSAL_GENERALIZATION.md). All results remain synthetic and non-authorizing.

## E11 · Replication & Failure Ledger

E11 preserves the **14 trained E10 sensor policies**, then repeats held-out tests across **five preregistered new synthetic seeds** (1101–1105), with **48 counterposed pairs per seed** (24 sparse, 24 dense), and all **four E10 intervention controls**.

- **No reselection or retraining:** E10 training masks and the detection threshold are frozen.
- **Matched first-k baseline:** compare detection counts at identical channel count and readout on each seeded synthetic population.
- **280 comparison cells:** 14 policies × 4 interventions × 5 seeds, keeping sparse and dense strata.
- **Failure evidence:** all cells where the selected mask loses to the simple baseline are retained, not hidden by averages.
- **Worst-case and replication range:** selected mean/min/max, win/tie/loss and worst signed difference across the five seeds. These are **descriptive ranges, not confidence intervals**.
- **Negative controls:** no-coupling and empty-sensor masks must remain blind.
- **Read-only live REPLICATE tab:** interactive comparisons, per-seed records, strata and clickable failure ledger.
- Full independent Python/JS parity with frozen SHA-256 reproducibility receipts in CI.

```bash
python -m phimirrorhex --mode replicate --output e11-replication-fixture.json
node tests/check-replication-parity.mjs e11-replication-fixture.json
python -m pytest -q
cd web && npm test && npm run build
```

See [E11 frozen protocol](docs/E11_REPLICATION_FAILURE_LEDGER.md). No live sensors, consciousness claims, external agents or real-world inference are involved.

## E12 · Sensor Economy & Prospective Transfer Gate

E12 asks whether a **new sensor policy optimized for both known and shifted probes** transfers across genuinely separate synthetic populations without further tuning. For each of seven sensor budgets and two Keyhole readouts, enumerate eligible masks on **development seeds 1201/1202/1203**, maximize the *worst* of known-probe and shifted-probe pooled detection counts, and break ties by total count and lowest mask integer.

Freeze the selected mask, report a separate **validation seed 1204**, then evaluate on five sealed prospective seeds **1301–1305** (48 constructed pairs each, half sparse, half dense). Compare against **unchanged E10 training mask** and the **first-k fixed mask** with identical sensor budgets. Retain complete failure evidence across 14 × 4 × 5 = **280** scenario comparisons.

The **TRANSFER** React tab displays the development-selected mask, controls, three-way observer scores, dense/sparse breakdowns, worst prospective margins and a strictly **descriptive** two-probe transfer gate. No pass grants execution or model authority; no human or physical sensor measurements are used.

```bash
python -m phimirrorhex --mode transfer --output e12-transfer-fixture.json
node tests/check-transfer-parity.mjs e12-transfer-fixture.json
python -m pytest -q
cd web && npm test && npm run build
```

See [E12 frozen protocol](docs/E12_SENSOR_TRANSFER_GATE.md).

## E13 · Calibrated Keyhole Detection & Refusal

The E13 **CALIBRATE** research room tests whether frozen E12 sensor masks can discriminate an engineered A/B contrast from **independent additive sensor noise**, and refuse to classify a pair when a selected measurement channel has an explicit fault flag.

- **48 null-only calibration cases** on seed **1401**, entirely separated from five prospective test seeds **1501–1505**.
- Fixed nuisance amplitude **0.018**; thresholds set from the third-largest calibration null gap, floored at **0.01**, so at most two calibration false alarms by construction. This **does not** guarantee the prospective false-alarm rate.
- Three unchanged same-budget mask arms: E12 robust, E10 trained and first-k fixed.
- Three conditions: matched probe, shifted probe, and no-coupling **null-only** control.
- Every eighth case has a declared unavailable sensor. If the policy needs that channel, it **ABSTAINS**, without earning detection or correct-rejection credit.
- All 14 policies × 5 seeds × 3 conditions = **210 test cells**; false alarms, signal hits/misses, coverage, calibration thresholds, explicit abstentions and full loss ledger.
- Synthetic `PASS_IN_TOY` requires nonzero sensor budget, ≥75% coverage, ≤10% observed false alarms and nonzero constructed positive detections. **No result authorizes external action.**
- Independent Python/JS parity and complete source/threshold/evidence receipts in CI.

```bash
python -m phimirrorhex --mode calibrate --output e13-calibration-fixture.json
node tests/check-calibration-parity.mjs e13-calibration-fixture.json
python -m pytest -q
cd web && npm test && npm run build
```

See [E13 frozen protocol](docs/E13_CALIBRATION_REFUSAL.md).

## E14 · Drift Sentinel & Shadow Recalibration

E14 starts with **frozen E13 sensor masks and calibration thresholds**, then tests whether false-alarm monitoring detects a change in synthetic observation noise without touching those thresholds. Three predeclared regimes: nominal amplitude **0.018**, noise shift **0.054**, recovered **0.018**. Each uses **three disjoint 48-case populations**: null-only monitor seeds 1601–1603, independent shadow calibration seeds 1701–1703, and sealed test seeds 1801–1803.

If the frozen monitor's null false-alarm fraction exceeds **10%**, it outputs **ABSTAIN_AND_EVALUATE_SHADOW**. A proposed threshold is fit on an independent null-only shadow population, **never deployed**, then evaluated alongside the unchanged E13 floor on the sealed test population. Zero sensors and declared sensor faults are explicit negative controls; false-alarm breaches, monitor misses, missed signals, coverage and all failures are preserved.

All **14 sensor policies × 3 environments = 42 cells** are reproducible in independent Python and JavaScript engines, with a full ledger and SHA-256 source receipts in CI. The live React site adds a **DRIFT** research tab to explore the monitor, candidate, sealed results and failure reasons.

```bash
python -m phimirrorhex --mode drift --output e14-drift-fixture.json
node tests/check-drift-parity.mjs e14-drift-fixture.json
python -m pytest -q
cd web && npm test && npm run build
```

See [E14 frozen protocol](docs/E14_DRIFT_SHADOW.md). SIMULATED only; no self-recalibrating deployed sensor, biological inference or external action permission.

## E15 · Sequential Keyhole Change Detection & Refusal

E15 turns the E14 batch-noise drift experiment into a finite **96-frame synthetic stream**. It uses the 14 E13 robust masks and their unchanged noise floors, then calibrates a one-shot CUSUM alert limit using **four nominal-only development streams** (seeds 1901–1904). No test stream adjusts the threshold.

Eight sealed streams use independent seeds 2201–2208 in four predeclared noise regimes: stationary/no change, sustained step at frame 48, gradual ramp starting frame 48, and brief three-frame spike (transient negative control). Each step records the measurement gap, CUSUM, fault-triggered abstention and first alert. Earlier-than-change warnings remain **false alarms**, never converted to detection. Persistent changes with no on-time first alarm remain missed events.

The **SEQUENCE** React tab includes selectable observation budgets, interactive 96-frame CUSUM timelines, a fixed alert limit, detection delays, missed-event counts, sensor coverage and the full failure ledger. There are **14 frozen policies × 8 sealed streams = 112 evaluated cells**; both Python and independently implemented JavaScript must agree for every frame in CI.

**Limited interpretation:** all signals, null pairs and change points are programmed; zero development false alarms result from threshold selection on those four controls, not a population guarantee. No external sensors or agent authority.

```bash
python -m phimirrorhex --mode sequential --output e15-sequential-fixture.json
node tests/check-sequential-parity.mjs e15-sequential-fixture.json
python -m pytest -q
cd web && npm test && npm run build
```

See [E15 frozen protocol](docs/E15_SEQUENTIAL_CHANGE.md).

## E16 · Correlated Keyhole Consensus & Refusal

E16 compares three fixed E15 observers on the **same eight sealed synthetic 96-frame streams**. Each observer retains its E15 trained CUSUM threshold and mask: budgets **2 identity-max, 3 masked-sum, 4 identity-max**. No voting rule or threshold is selected using test outcomes.

- Compare **1-of-3, 2-of-3 and 3-of-3** frame-local voting, with one-shot group alerts.
- A Keyhole votes YES only if it is available **at the current frame** and its CUSUM exceeds its unchanged E15 threshold.
- If fewer than q witnesses have usable readings, the group **ABSTAINS**. Missing votes never count as successful negative evidence.
- All **24 policy/stream cells** include first-alarm time, change delay, false alarms, missed sustained changes, coverage and explicit refusals, with full 96-frame traces.
- Publish **sensor-mask Jaccard overlaps** and conditional **co-vote** counts. The three observers share synthetic noise and often overlap channels. **Their votes are correlated, not independent confirmations.**
- Every failure retained, plus independent Python↔JavaScript cross-language parity in CI.
- New read-only **CONSENSUS** React room with quorum selector, all member traces, vote/eligibility breakdown, failure ledger and provenance.

```bash
python -m phimirrorhex --mode consensus --output e16-consensus-fixture.json
node tests/check-consensus-parity.mjs e16-consensus-fixture.json
python -m pytest -q
cd web && npm test && npm run build
```

See [E16 frozen protocol](docs/E16_CORRELATED_CONSENSUS.md). **This reuses E15 test streams** as a comparative replay; a new, independent prospective seed series is needed before promoting a rule even within a different simulator. No real physical, consciousness or external agent evidence is claimed.

## E17 · Out-of-Family Consensus Transfer

E16 compared quorum rules on previously used E15 synthetic streams; **E17 tests them again on 12 fresh, procedurally different streams** generated by LCG32 rather than E15's xorshift feature generator. All three member masks, E15 alarm thresholds, and all three 1/2/3-of-3 quorum rules stay frozen.

Six predefined families (two seeds each): independent-channel stationary, correlated stationary, correlated persistent step, correlated ramp, brief impulse control, and persistent step with deterministic sector outliers. On all **36 policy/stream cells**, retain every 96-frame vote/availability/CUSUM receipt, first-alarm time, false alarm, persistent miss, detection delay, abstention/coverage and complete failure ledger. The 3 members see the **same** noise draws, so their votes are still correlated, not independent confirmations.

The **OUT-OF-FAMILY** React room compares all voting rules across fresh noise families, with a 96-frame scrub-able timeline, unchanged observer masks, E16 historical context, group refusal and full failure records. Nothing is selected based on test outcomes. All synthetic, non-authorizing.

```bash
python -m phimirrorhex --mode consensus-transfer --output e17-consensus-transfer-fixture.json
node tests/check-consensus-transfer-parity.mjs e17-consensus-transfer-fixture.json
python -m pytest -q
cd web && npm test && npm run build
```

See [E17 frozen protocol](docs/E17_OUT_OF_FAMILY_CONSENSUS.md). This is finite simulation stress testing, not real-world physical/biological evidence, consciousness measurement, or agent action permission.
