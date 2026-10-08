# E15 · Sequential Keyhole Change Detection & Refusal

## Research question

E14 evaluated synthetic noise drift in fixed 48-case batches. E15 evaluates **ordered 96-frame streams**: when a frozen Keyhole first alarms, how many alarms occur when no persistent change is present, and how long detection takes after a declared change point.

**Boundary:** all readings are simulated *null-only* sensor observations. There are no human, biological, photon, neural, conscious, physical or external agent measurements.

## Preregistered operators

- Source: all 14 E13 \`robust\` six-sector masks and their **unchanged** calibrated null floors.
- Each observation reads six synthetic noise channels from deterministic independent xorshift feature streams. The observer sees only its selected mask.
- **CUSUM**: at an available frame, \`c = max(0, previous + observed_gap / E13_frozen_floor − 0.75)\`.
- Every eighth frame marks sensor \`(seed + step) mod 6\` unavailable. If the selected mask needs that sensor the observer **ABSTAINS**, the gap is null and CUSUM is unchanged. Abstentions never become correct null rejections.
- Only the **first strict exceedance** of the calibrated threshold counts as an alarm. The trace continues for visualization but does not re-arm a second alarm.

## Development-only alert limit

Four nominal synthetic control streams are generated with seeds **1901, 1902, 1903, 1904**, each 96 frames at noise amplitude **0.018**. For each E13 policy, set

\`alert_limit = max(4 development maximum CUSUMs) + 1e-9\`.

That produces **zero alerts on those four controls by construction**. It is not an expected false-alarm probability bound for new streams. Critically, *no sealed test stream is examined for threshold selection*.

## Sealed streams and event definitions

Eight sealed test streams use disjoint seeds and predeclared synthetic regimes:

| Regime | Sealed seeds | Expected event |
| --- | --- | --- |
| Stationary | 2201, 2202 | No change; any alarm is false |
| Step shift | 2203, 2204 | Persistent noise change from frame 48, amplitude 0.018 → 0.054 |
| Ramp shift | 2205, 2206 | Persistent rise starts frame 48 and reaches amplitude 0.054 at frame 80 |
| Short spike | 2207, 2208 | Only frames 48–50 have amplitude 0.054; treated as a no-sustained-event stress control |

An alarm **before** frame 48 is a false alarm in step/ramp, and cannot also count as detection. An alarm **at or after** frame 48 counts as detecting the persistent change; delay is its index minus 48. No on-time alarm is a missed persistent event. Any alarm during stationary or short-spike streams is recorded as a false alarm under this **sustained-event target definition**, not necessarily a general mistake under other use cases.

## Failure evidence and toy gate

Every cell with a false alarm, missed persistent change, or coverage under 75% is retained in a failure ledger. Full traces include every frame, current CUSUM, gap/null, explicit abstention, and one-shot alarm markers.

The descriptive toy gate passes only for a **nonzero sensor budget**, with no false alarms, no missed persistent events and coverage ≥75% in every sealed stream. A pass is not a safety certification or deployment authority. Some methods may fail, and those failures are important evidence.

## Reproduce

\`\`\`bash
python -m phimirrorhex --mode sequential --output e15-sequential-fixture.json
node tests/check-sequential-parity.mjs e15-sequential-fixture.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

Python/JavaScript implementations must agree on selected masks, alert limits, every frame, first-alarm timing, missed events, abstention, and failure records.

The **SEQUENCE** React research room visualizes the entire 96-frame trace, chosen noise scenario, calibrated threshold, first alarm, detection delay, fault abstentions and complete loss ledger. No real-time outside integration is enabled.
