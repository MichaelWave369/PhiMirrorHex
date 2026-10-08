# E8 · Robustness and Memory Compression

## Scope / evidence boundary

Entirely **synthetic** six-scale inputs, engineered truth and toy histories. No proof of φ optimality, real neural coupling, subjective experience, consciousness transfer, matter formation, medical signals or autonomous action permission.

## Primary question

After fitting five adaptive profiles in E7, how robust are the frozen six-scale learners to **unanticipated input transformations**, and what does a coarse-only Keyhole representation lose compared with signed channel-preserving memory?

E7's validation selection stays frozen. E8 does **not** train, retune, reselect by shifted test errors or generate easier shifted targets.

## Deterministic feature perturbations

128 held-out examples per engineered world, same target label and same learned weights across:

- `clean`: unchanged six readings, exact negative/no-op control.
- `noise`: add `0.25*(noise_i-.5)` per ring with independent deterministic seed **707**, then clip readings to [0,1].
- `dropout`: replace readings 1 and 4 with fixed neutral value **0.5**; **labels unchanged**.
- `mean_only`: replace all six features with their common arithmetic mean; identity-bearing differences are discarded.

Report held-out MAE/RMSE for all 25 frozen E7 models under all four scenarios. Each candidate still performs six weighted terms over 128 identical test labels. Also display a fixed/untrained equal-weight descriptive control (it is not equal to the adaptive models' training cost).

**This is a domain-shift toy, not adversarial certification.** Noise and shift strengths are predeclared; many real failure modes are not represented. Since all labels were originally generated from E6's known profiles, outcomes remain dependent on engineered data.

## Independent NBG-style memory compression control

Separately inspect the existing E5 delayed-conveyor witness:

- At frame 10, the two six-sector outer states are distinguishable when their full signed sector identities are kept; their *sums* both equal zero.
- Thus the constructed balanced two-case task yields **2/2** for full-sector identity, **1/2** for sum-only.
- At frame 12, the fixed E5 gain makes the coarse sums different and the same sum-only representation can now distinguish the two cases **2/2**.
- This is a deliberate **capacity/observability witness**, not an algorithm that learns to reconstruct hidden histories, nor a measurement of people.
- The E5 receipt is included read-only and explicitly `fed_to_learner=false`.

## Reproduction

```bash
python -m phimirrorhex --mode robustness --output e8-robustness-fixture.json
node tests/check-robustness-parity.mjs e8-robustness-fixture.json
python -m pytest -q
cd web && npm test && npm run build
```

The React **ROBUSTNESS** tab shows selectable programmed worlds, shift scenarios, frozen-model test error, shift delta relative to clean, and the E5 Keyhole data-loss witness. Cross-language CI checks numeric parity across all 100 scenario/model/world comparisons and the toy observer controls.

## Interpretation

Robustness to these shifts may favor different initializations in different engineered worlds; no φ advantage is assumed. A shift that reduces MAE is not intrinsically evidence of better calibration or more reliable causality. Real-world promotion requires independent externally sourced data, matched baselines, distributional uncertainty and predeclared success/failure gates.
