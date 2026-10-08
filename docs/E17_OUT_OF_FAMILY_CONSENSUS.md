# E17 · Out-of-Family Consensus Transfer

## Research question

E16 compared three quorum rules by replaying E15's synthetic test streams. Does the same *frozen* three-Keyhole ensemble behave comparably on **previously unseen synthetic streams and generator families**?

**Scope warning:** different procedural seeds and a distinct pseudorandom algorithm are independent *simulation draws*, not independent people, devices, laboratories, physical measurements, or causal evidence of any natural phenomena.

## Frozen policies

Import E16 **three observers** without modifying masks, E13 calibration floors, E15 CUSUM warning limits, quorum rules or alert semantics:

- 2-channel identity-max readout
- 3-channel masked sum readout
- 4-channel identity-max readout

Compare 1-of-3, 2-of-3 and 3-of-3 **all at once**, with no rule selection based on the new test. A current-frame member votes YES iff its required selected sector data is available *and* its current CUSUM strictly exceeds its frozen E15 warning limit.

When fewer than q observations are available, ensemble **ABSTAINS**; missing values are never interpreted as NO or correct negative evidence. Only the first quorum crossing produces an alert. A premature alarm is **both a false alarm and a miss** for a later persistent event.

## New held-out streams

E15/E16 used xorshift-based procedural features on seeds 2201–2208. E17 uses an **LCG32 generator**, constants 1664525 and 1013904223, 14 uniform draws per frame from new seeds **3101–3112**. Within each stream, all members share exactly the same six-channel pair of noise observations.

| Family | Seeds | Intended target |
| --- | --- | --- |
| iid_stationary | 3101, 3102 | no change, independent per-sector draws |
| correlated_stationary | 3103, 3104 | no change, 65% shared channel component |
| correlated_step | 3105, 3106 | persistent ×3 noise amplitude from frame 48 |
| correlated_ramp | 3107, 3108 | linear amplitude increase from frame 48 to 80 |
| impulse_stationary | 3109, 3110 | brief ×3 excursion at frames 48–50; no sustained event |
| outlier_step | 3111, 3112 | persistent ×3 change and deterministic sector outliers |

Each stream has **96 ordered frames**. Baseline amplitude is 0.018 and shifted amplitude 0.054. The first 14 LCG draws are allocated to six A channels, six B channels, and two common factors. Correlated regimes assign **35% idiosyncratic + 65% shared** noise factor, thereby making member errors more correlated. In \`outlier_step\`, the component is tripled when \`(step + 7×sector) % 19 == 0\`. All patterns are fixed before evaluating any streams.

Sensor faults occur every eighth frame on sector \`(seed+step)%6\`. A member requiring that sector **ABSTAINS**, and its CUSUM cannot advance. Three quorum policies have different eligibility and therefore different coverage.

## Evaluation & failure definitions

For a persistent step/ramp/outlier-step event, only first alarms **at or after frame 48** count as detections. An earlier alarm cannot later be reclassified as success and also counts as a miss of the persistent change. A missing on-time alarm counts as a miss. Any alarm on stationary and transient-impulse streams is false under the sustained-event objective.

Every **36 policy × test-stream cells** is reported, with all **96 frame-level** records: three available flags, gaps, cumulative scores, YES/NO votes, ensemble abstention and first-alarm marker.

Failure ledger includes every false alarm, persistent miss, or coverage below 75%. Outcomes under the original E16 streams appear **only as historical context**; none influence quorum selection or frozen thresholds. A toy gate passes only with no recorded error and adequate coverage on all 12 streams. **It grants no authority.**

## Negative controls and limitations

- Stationary iid and correlated streams plus the brief impulse are negative controls for a sustained-event detector.
- Correlated observations are expressly **not independent witnesses**; E16's mask overlaps remain visible.
- All four members of a reported stream share a procedural noise realization: the synthetic environment and three Keyholes. E17 does **not** prove quorum generalization in natural systems.
- This is the **first separately seeded out-of-family transfer test after E16**, but does not turn comparison of its three rules into prospective validation of a *selected winner*. A new preregistered independent test would be necessary for that.
- Read-only local research reports. No live sensors, device actions, human observation or consciousness claims.

## Reproduction

\`\`\`bash
python -m phimirrorhex --mode consensus-transfer --output e17-consensus-transfer-fixture.json
node tests/check-consensus-transfer-parity.mjs e17-consensus-transfer-fixture.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

The **OUT-OF-FAMILY** React room displays frozen masks, quorum selector, new regime cards, frame-by-frame majority votes, refusal coverage, first alarm, family differences, E16 contextual metrics and the complete failure ledger. Both Python and JavaScript must reproduce every new procedural value and conclusion.
