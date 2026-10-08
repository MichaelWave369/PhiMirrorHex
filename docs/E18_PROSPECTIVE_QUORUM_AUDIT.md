# E18 · Frozen Quorum Selection & Prospective Audit

## Research question

E16 compared three same-stream Keyhole quorums; E17 replayed all rules on different synthetic generator families. E18 asks whether selecting a rule using **E17's already observed results as retrospective development data** can survive a *separate new sealed synthetic test*.

**Important historical qualification:** E17's data was originally published as test data, **not pre-registered as training data**. E18 transparently reuses it as retrospective development evidence. E18's new sealed streams are not used to choose a rule, but this is *not* proof of scientific prospectiveness or independent physical replication.

## Policy-selection boundary

E16/E17's three original observer masks, per-member readouts, E13 floors, E15 CUSUM limits, fault rules and 1-of-3, 2-of-3, 3-of-3 quorum semantics are unchanged.

Before generating any E18 evaluation outcomes, calculate three E17 retrospective-development scores:

\`loss(q) = 5 × missed-persistent cells + 4 × false-alarm cells + 2 × low-coverage cells\`.

Define low coverage as strictly less than **75%**. Choose the lowest loss. Break ties by fewer total abstained frames, then quorum closest to 2, then numerically smallest quorum. Report **every candidate's E17 loss** and resulting selected quorum; do not refit anything using E18 scores.

All three rules are evaluated and reported on E18. The historical E17 chosen rule is marked as such; no new winner is silently promoted.

## New sealed streams

E17 used sequential LCG32 draws with seeds 3101–3112. E18 uses **counter-addressed avalanche mix32**, seeded fresh at **4101–4112**, independent of E17's draws. Each 96-frame stream still feeds the same shared six-channel observations to all three members, so **members are correlated and not independent witnesses**.

| Frozen family | Seeds | Target |
| --- | --- | --- |
| independent_null | 4101, 4102 | No change, unshared sector noise |
| shared_null | 4103, 4104 | No change, 70% common-sector noise |
| lagged_step | 4105, 4106 | Sustained ×3 noise shift starting frame 48 |
| lagged_ramp | 4107, 4108 | Sustained ramp from 48, saturation at 80 |
| burst_null | 4109, 4110 | Four-frame ×3 transient on frames 48–51, plus extra sensor outages, **not** a persistent target |
| outlier_step | 4111, 4112 | Sustained step plus sparse ×2.5 sector outliers |

Baseline amplitude **0.018**, shifted amplitude **0.054**; shared-sector families use 30% idiosyncratic + 70% common disturbance. Lagged families blend the current draw with the previous step, 60/40. An outlier occurs under the fixed predicate \`(step + 7×sector) % 17 == 0\`, tripling neither the truth label nor the baseline, but multiplying both channel disturbances by 2.5.

Every eighth frame has a declared faulty sector \`(seed+step)%6\`. The burst-null family also faults a channel on frames 48–51. If the member mask requires it, that member **abstains and does not update CUSUM**. If fewer than q members are eligible, the group **abstains**, not a correct negative.

## Outcomes & honest controls

All **36 quorum/stream cells × 96 frames = 3,456** frame-level ensemble outcomes are published, including member gaps, frozen CUSUM scores, availability, votes, first alarm, delays, refusals and the full failure ledger.

- A first alarm before a persistent event is a **false alarm and does not count as detection**.
- An alarm in a stationary or short burst control is false *for the sustained-event objective*.
- Never alarming on a persistent step/ramp is a missed event.
- Coverage is the proportion of frames with sufficient available members; refusals are counted independently.
- The strict **toy-only gate** demands zero false alerts, zero missed persistent events and at least 75% coverage in every sealed stream.
- No evaluation selects a new policy, calibrates thresholds or authorizes any outside action.

## Interpretation and limitations

Sealed E18 generation prevents this **implementation** from selecting a rule after inspecting the new scores. It does **not** prevent researchers from repeatedly designing further procedural worlds after seeing outcomes; these are engineered tests, not a statistical certification. Genuine external validation would need independent sensors, traceable collection, consent if applicable, prospective protocols, separate researchers and domain-appropriate uncertainty.

The E18 selection is **retrospective E17 analysis**, not E17 training preregistered before it was originally run. There is no claim of natural physical phenomena, human consciousness measurement, general optimality, production learning or independent multi-agent confirmation.

## Reproduce

\`\`\`bash
python -m phimirrorhex --mode prospective-audit --output e18-prospective-audit-fixture.json
node tests/check-prospective-audit-parity.mjs e18-prospective-audit-fixture.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

The React **PROSPECTIVE** room displays all E17 selection losses, the frozen selected rule, 12 new sealed streams, the complete frame-level votes and refusals, side-by-side results for all quorums, and the complete failure ledger.
