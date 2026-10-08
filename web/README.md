# Φ-Mirror Hex: React research lab (E3)

A static React/Vite lab deployed to **GitHub Pages** from `web/`. No server, API token, data ingestion, or deployment secret is required.

**Production URL:** https://michaelwave369.github.io/PhiMirrorHex/

## Development

Requires Node.js 22+.

```bash
cd web
npm install
npm test
npm run dev
npm run build
```

The React app imports the **exact canonical E2 deterministic synthetic simulator** and seeded SHA-256 peer ranking from `../docs/living-hex.mjs`, avoiding a forked experimental algorithm. This source has no DOM side effects when the legacy E2 canvas is not present.

## Deploy

1. Merge the React lab PR into `main`.
2. In repository **Settings → Pages → Build and deployment**, choose **Source: GitHub Actions** if not already configured.
3. Workflow `React Lab · GitHub Pages` runs on `main` changes under `web/`, the shared E2 simulator, or the workflow; manual dispatch is also supported.
4. Wait for the GitHub Actions deploy job to be successful before treating the production URL as live. A successful PR build alone does not publish.

The legacy static `docs/` E1/E2 instrument remains available in the repository, but the published project root now serves the React app.

## What is real?

- **Exact:** the 6×6 labeling scheme, 36 channels, 37 nodes, 666 audit relations (630 peer + 36 gate), and Fibonacci budget counts.
- **Deterministic, synthetic:** frame values, conflict injections, candidate coherence score, simulated activity, seeded peer ranking.
- **Visual only:** the 3D bipyramid orientation and animated pulses.
- **Not implemented:** live agent feeds, sensor ingestion, write access, autonomous decisions, integration with PhiOS / SuperPhiVessel / NestedBubbleGear.

The 666 edge comparisons count possible logical pairs, **not** 666 physical pyramid edges and not 666 verified factual claims. `Φ` and Fibonacci remain research hypotheses that require control comparisons.

## E4 Nested Vessel tab

The VESSEL tab uses `src/NestedVessel.jsx` and `src/vessel-model.mjs` to visualize the exact finite NBG-style Keyhole experiment. No data from users or external sensors is collected. The Keyhole-depth/gear gain controls show a delayed mathematical witness and zero-gain negative control. Python/JS parity is checked by the repository CI across 80 scenarios. See [`../docs/E4_NESTED_VESSEL.md`](../docs/E4_NESTED_VESSEL.md).

## E5 GEARS tab

The **GEARS** tab renders the frozen E5 synthetic delayed-conveyor witness with six nested six-sector rings, temporal Keyholes and intervention controls. Its implementation lives in `src/NestedGears.jsx` and `src/gears-model.mjs`, with a Python counterpart in `../phimirrorhex/gears.py`. There are **32 complete cross-language test cases**, plus Python and browser unit tests. All E5 inputs are synthetic; no live sensors or external connections.

## E6 COHERENCE tab

`src/CoherenceLab.jsx` compares equal, φ-inner, φ-outer, center, and alternating weighting schemes against five deliberately **engineered** synthetic ground-truth regimes, selecting on validation and reporting held-out error. Nothing is connected to live models, physics or biometric inputs. Core `src/coherence-model.mjs` mirrors the Python reference and passes CI cross-language parity tests.

## E7 ADAPTIVE tab

The E7 lab compares five six-weight positive-simplex online learners with matched training budgets on engineered, split-isolated worlds. `src/adaptive-model.mjs` is independently tested against the Python reference, and `src/AdaptiveLab.jsx` presents training trajectories, holdout scores and the shifted-label negative control. The E5 Keyhole causal receipt is **read-only** and cannot influence training or grant authority.

## E8 ROBUSTNESS tab

`src/RobustnessLab.jsx` uses `src/robustness-model.mjs` to visualize **unchanged E7 learned weights** under four preregistered synthetic input scenarios. The independent read-only E5 comparison demonstrates a concrete failure of sum-only compression at frame 10. The reference Python experiment and browser implementation are parity-checked in CI. No real-world physiology, live agent calls or authorization is implied.

## E9 FRONTIER tab

The **FRONTIER** tab enumerates all 64 subsets of the six synthetic E5 outer sensors, comparing an identity-aware Keyhole to a same-mask summed Keyhole across time, detection thresholds, and intervention controls. `src/frontier-model.mjs` independently reproduces `../phimirrorhex/frontier.py`; CI checks the complete generated report. No external data or action permissions are involved.

## E10 GENERALIZE tab

The GENERALIZE room visualizes preregistered training-only mask selection, independent validation and held-out source pairs, an unseen dense source family and a fixed intervention-sector shift. It compares selected policies against fixed first-k masks and a post-hoc test oracle (not permitted to influence selection). `src/generalization-model.mjs` and `../phimirrorhex/generalization.py` are independently compared in CI.

## E11 REPLICATE tab

A complete synthetic five-seed OOD replication and failure ledger, `src/ReplicationLab.jsx` compares frozen E10 training-selected Keyhole masks against identical-budget deterministic baseline masks. It retains per-seed, per-family and per-intervention counts, min/max outcomes and all losing runs, with read-only JSON exports. Python and JS engines are independently parity-tested in CI.

## E12 TRANSFER tab

The TRANSFER research room compares maximin-development Keyhole masks against unchanged E10 and first-k baselines across five prospectively isolated synthetic seeds. It includes a strictly non-authorizing transfer criterion, intervention controls, per-family metrics, and a full failure ledger. `src/transfer-model.mjs` is independently parity-tested against `../phimirrorhex/transfer.py` in CI.

## E13 CALIBRATE tab

Displays calibrated noise-only detection thresholds, prospective false-alarm and signal counts, fault-triggered abstentions, mask/coverage metrics and complete synthetic failure evidence. `src/calibration-model.mjs` is parity-tested against `../phimirrorhex/calibration.py`, and all earlier rooms remain available.
