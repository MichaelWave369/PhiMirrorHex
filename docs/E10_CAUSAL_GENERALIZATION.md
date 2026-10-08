# E10 · Independent Causal Generalization

**Research boundary:** Entirely constructed synthetic worlds, no human data, neural observables, photons, physical causality or consciousness measurement. E10 does not grant agent execution authority, nor prove a universal optimal observer.

## Goal

E9 exhaustively compared masked Keyholes on one designed A/B pair. E10 freezes a **mask-selection policy using training pairs alone** and tests the same policy on previously unseen generated pairs and an unseen intervention location, with no test-time tuning.

This is a stronger *toy-method generalization check*, not evidence that the toy transfers to biology.

## Frozen populations

- **Training**: 48 independently seeded source draws; seed **901**, *sparse* source family.
- **Validation**: 24 draws with seed **902**, sparse source family; results visible but not used for selection.
- **Holdout**: 48 draws with seed **903**; 24 sparse and **24 dense** six-sector balanced sources, alternating, so dense source construction is never seen by policy selection.
- All sources sum to zero at t0. Each A source is paired with B = −A; both undergo **exactly the same** predeclared mechanical operations.
- Samples are deterministic draws from limited procedural families; they are not observationally independent real-world data or guaranteed to be unique. All split counts are finite descriptive counts, not inference confidence intervals.

For sparse sources, choose two distinct sectors and place equal/opposite magnitudes (0.5, 1, 1.5 or 2). For held-out dense sources, draw six signed coefficients in [−3,3], subtract their six-way mean and multiply by 0.5. Pseudorandom source is fixed xorshift32 with independent split seed. Seeds and source rules are *part of the frozen protocol*, not fitted from holdout scores.

## Shared operator and intervention conditions

Every A/B source is propagated through six alternating directional gear rotations, 0.5 retention and a one-step conveyor for **12 time steps**, matching E5's finite delayed transport structure. The outer interface is probed at step 12:

- **matched_probe**: fixed gain 0.5 in outer sector **0**, as in training.
- **shifted_probe**: same gain 0.5 but moved to previously untrained outer sector **3**.
- **no_probe**: same gears with probe gain 0.
- **no_coupling**: coupling removed; no inner state should arrive at outer ring.

No per-source state identity is inspected by the probe. There is no mutation of ground truth, no intervention chosen from the holdout results, and no sensor-mask change after training.

## Policy selection, comparisons and failure modes

Every one of the **64 possible six-sector bitmasks** (including zero) is evaluated for each observation mode:

1. **identity_max**: maximum absolute signed-sector gap among selected channels.
2. **masked_sum**: absolute A/B sum difference over exactly the same selected channels.

At each fixed sensor count k ∈ {0,1,2,3,4,5,6}, select the mask with the largest count of detected training A/B pairs under the **matched probe only**, at floor 0.01, breaking ties by *lowest mask integer*. Then freeze the resulting 14 policies (7 budgets × 2 readouts).

For each policy, report:

- Training count, independently generated sparse validation count, held-out matched count and shifted-probe/no-probe/no-coupling counts.
- Deterministic **first-k mask** baseline using the same budget and readout.
- **Post-hoc held-out oracle** maximum possible mask at same budget, clearly labeled a *diagnostic upper bound* with forbidden test access; never used for policy selection.
- Six example held-out trajectories, including dense cases.

All observations use exactly k sensor values per mask. The two readouts have different downstream computational operators (max vs sum), so same-sensor-budget is not an equal arithmetic-op cost claim.

### Nuance: no-probe is not a universal negative for partial Keyholes

The complete six-way sum remains zero with gain 0 on counterposed zero-sum sources. However, some **partial sums** or signed-channel identity measurements can still distinguish A/B without any probe because they omit cancelling sectors. Only the **no-coupling** condition guarantees a blind outer observer across all masks.

## Reproduction and replay

\`\`\`bash
python -m phimirrorhex --mode generalize --output e10-generalization-fixture.json
node tests/check-generalization-parity.mjs e10-generalization-fixture.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

All reports include a Python SHA-256 digest for deterministic integrity, synthetic-only provenance and no authority. JavaScript independently reimplements source generation, transport and train-only selection; CI compares reports including mask choices, counts and held-out example vectors.

The React lab gains a **GENERALIZE** tab with frozen budgets, observer mode, four interventions, train/validation/holdout scoreboards, fixed-mask baselines, post-hoc regret, and visual A/B held-out pairs.

## Interpretation and next gate

This study can falsify claims of guaranteed success from a hand-selected Keyhole when the source family or intervention changes. It does **not** establish general causal insight beyond these toy families. Promotion would require external provenance, calibrated real observables, held-out populations defined before data collection, uncertainty estimates, and approval for any real-sensor interface.
