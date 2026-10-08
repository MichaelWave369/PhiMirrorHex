# E14 · Drift Sentinel & Shadow Recalibration

## Question and evidence boundary

When sensor noise increases, can a previously calibrated Keyhole **detect the false-alarm drift**, refuse unsafe classification, and evaluate a threshold adjustment separately without silently adopting that new threshold?

All signals and faults are generated within a six-sector **synthetic** simulator. No connection to real sensors, organisms, consciousness, photons, agent execution or external data is made.

## Frozen preregistration

- Source: E13's 14 policy rows, taking their frozen \`robust\` masks and original E13 calibration thresholds.
- Regimes: **nominal** noise amplitude 0.018, **noise_shift** amplitude 0.054, **recovered** amplitude 0.018.
- Exactly **three disjoint synthetic datasets per regime**:
  - Monitor seeds: 1601, 1602, 1603 (null-only monitor, 48 cases).
  - Shadow calibration seeds: 1701, 1702, 1703 (null-only threshold candidate, 48 cases).
  - Sealed evaluation seeds: 1801, 1802, 1803 (48 matched-probe A/B pairs with paired nulls).
- Each source population alternates sparse and dense balanced synthetic patterns from E10.
- Sensor faults are declared on every eighth case at sector \`(seed + case index) % 6\`. If a selected sensor is faulted, the observer **abstains**, which is never counted as a correct decision.
- Observation noise is independent between the two readings: amplitude × \`(uniform_feature - 0.5)\`; deterministic sources are derived from separately seeded E6 feature streams.

## Locked baseline, prospective monitor

For each policy/regime, measure the **noise-only** observed false-alarm fraction under its **unchanged E13 threshold**, including explicit abstention denominator. A rate **strictly greater than 10%** triggers:

\`ABSTAIN_AND_EVALUATE_SHADOW\`.

Otherwise the monitor emits \`KEEP_FROZEN_MONITORING\`. This rule is frozen in the protocol, not chosen from the sealed evaluation.

## Shadow path cannot deploy

When and only when the monitor flags drift, generate a **new threshold candidate** on a disjoint null-only shadow population:

\`candidate_floor = max(0.01, third-largest shadow null gap)\`.

This yields ≤2/48 calibration exceedances *on that shadow calibration population alone*, **not a promise about future noise**. If the monitor does not flag drift, the candidate is simply the unchanged frozen threshold.

On the separate sealed evaluation pairs, show **both thresholds side-by-side** with:
- null false alarms and attempted-case false-alarm fraction;
- constructed signal detections and misses;
- abstention and coverage;
- differences in threshold and signal count.

The toy gate requires nonempty sensors, no missed sealed false-alarm breach while monitoring did not flag, candidate false-alarm fraction ≤10%, coverage ≥75%, at least one positive detection, and **no signal loss compared with the frozen threshold on the very same sealed cases**. This is an intentionally strict finite stress gate, not deployment safety qualification. A pass never promotes a candidate threshold or grants action authority.

## Mandatory negative and failure evidence

- A zero-sensor mask remains blind, including under higher noise.
- Every case abstains when and only when it requires a declared faulty selected sector.
- Monitor false negatives (sealed frozen false-alarm breach unflagged by monitor) remain in the ledger.
- Candidate false-alarm breaches, coverage failures, eliminated signals, and signal-count losses are all reported.
- Full Python/JS parity checks masks, baseline and shadow floors, monitor decisions, sealed counts and every ledger entry. Threshold selection never reads sealed outcomes.
- **Recovery is evaluated separately**, with no in-place mutation of E13's frozen calibration.

## Reproduction

\`\`\`bash
python -m phimirrorhex --mode drift --output e14-drift-fixture.json
node tests/check-drift-parity.mjs e14-drift-fixture.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

React **DRIFT** room displays the fixed baseline, monitor status, shadow proposal, held-out errors, abstentions, and complete failure ledger.

### Interpretation

The monitor uses labeled synthetic null pairs; a real system would need a consented, validated way to obtain comparable null references. This experiment is not an unsupervised drift detector, statistical false-alarm guarantee, or justification to self-modify a deployed model.
