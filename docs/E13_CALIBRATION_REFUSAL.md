# E13 · Calibrated Keyhole Detection and Refusal

## The question

Can an observer from E12 distinguish a constructed hidden-state difference from **independent measurement noise**, while refusing to judge if a selected channel is explicitly faulty?

This is a controlled **synthetic** study. None of the numbers show physical, psychological or biological sensing, consciousness, φ optimality, deployed safety, or agent authority.

## No training/test overlap

- All **14 frozen E12 policies** are reused, with three masks each: robust maximin, original E10, and first-k. No re-selection.
- **Calibration seed 1401**, 48 synthetic noise-only null pairs; each null consists of the *same latent outer state* observed twice with independent sensor noise.
- **Prospective test seeds 1501–1505**, 48 independently generated counterposed A/B pairs each, alternating sparse and dense source patterns.
- Noise for each observation is fixed and deterministic from independent sample-feature streams, additive amplitude **0.018 × (u − 0.5)** per sector.
- Same calibrated threshold for a policy/arm across its held-out conditions; no tuning on test data.

### Threshold calibration

For each budget, readout and arm, evaluate 48 noise-only gaps. Choose

\`threshold = max(0.01, third-largest noise-only gap)\`.

Detection requires gap **strictly greater** than threshold. This ensures **at most 2 calibration null exceedances**, *on the calibration population only*. It is not a statistical false-alarm bound on future noise, and any test exceedances are reported.

### Sealed evaluation

Under the original outer probe and the shifted probe, count separately:

- Signal detections and misses among **non-abstained** counterposed pairs.
- Null false alarms and correct rejections among **non-abstained** identical-latent pairs.
- Refusals/abstentions from sensor faults, excluded explicitly from both detection denominators.

The **no-coupling condition** is a null-only negative control. It is not presented as a positive signal that somehow needs detecting.

### Observable fault policy

On every eighth case, a sensor at sector \`(seed + index) mod 6\` is marked unavailable. If the selected mask includes it, the observer **abstains**, meaning it returns neither a signal detection nor a correct null judgment. Observers with different masks may have different eligible-case subsets.

This creates a **coverage/detection tradeoff**. Raw detection-count comparisons across different masks are descriptive and may partly reflect differing abstentions; they are *not a paired conditional effect size* without matching eligible subsets.

### Descriptive gate

A frozen policy gets \`PASS_IN_TOY\` only if it has:

- nonempty sensor budget;
- coverage at least **75%** in every test cell;
- observed null false-alarm fraction at most **10%** in every test cell;
- at least one synthetic signal detection under each positive test cell.

A pass is deliberately *not* guaranteed by abstaining on every case or by always returning \`NO_DETECT\`. It does **not** permit any physical, model, or network action.

Every robust-policy trial exceeding the false-alarm limit, or having fewer raw signal detections than either frozen same-budget comparison, is retained in a complete failure ledger.

## Reproduction

\`\`\`bash
python -m phimirrorhex --mode calibrate --output e13-calibration-fixture.json
node tests/check-calibration-parity.mjs e13-calibration-fixture.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

The React **CALIBRATE** tab displays thresholds, false alarms, signal detection, abstention/coverage, null-only controls and the full failure ledger. Python/JavaScript parity compares the full synthetic report. Results are finite observations under one fixed procedural generator, not population confidence intervals or general physics.
