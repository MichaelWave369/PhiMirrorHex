# E11 · Replication & Failure Ledger

## Scope

A synthetic, deterministic evaluation of E10's **already frozen, training-only selected sensor masks** on five new seeds. No real-world measurement, human perception, photons, consciousness, neural states, causal discovery, or φ optimality evidence.

## Frozen replication design

- **Policy**: reuse the E10 training-selected mask at every budget k=0..6 and each readout (identity-max and masked sum).
- **No new policy selection**: E10's validation/test data and all E11 outcomes are barred from mask choice.
- **Replicate seeds**: 1101, 1102, 1103, 1104, 1105. Each builds **48** E10-style synthetic A/B pairs: **24 sparse** and **24 dense**.
- **Four fixed interventions**: matched probe at sector 0, shifted probe at sector 3, no probe, no coupling.
- **Threshold**: E10's frozen 0.01 strict detection floor. No threshold tuning from replication results.
- **Baseline**: deterministic first-k channels, same budget and same readout, not an optimized test oracle.
- **Each score**: both counts among the same 48 pairs, rate, signed detection-count difference, sparse and dense strata.
- **Aggregate**: mean rates across five equally-sized synthetic replicates, observed minimum and maximum rates, worst signed count difference, win/tie/loss counts.
- **Failure ledger**: every cell where the frozen selected mask detects *fewer* test pairs than its first-k baseline is stored with seed, budget, readout, scenario and shortfall. There is **no conditional suppression of negative findings**.

There are 14 policies × 4 scenarios × 5 seeds = **280 policy/scenario/seed cells**, evaluated over 240 distinct held-out A/B pairs. Both observers use k sensor readings; post-processing costs of max and summation may differ.

## Negative controls and falsifiers

- With **no coupling**, no contrast should reach the outer ring, so both observers must be blind under all masks.
- With **zero sensors**, neither observer can distinguish a pair.
- For each seed, sparse/dense stratum counts must sum to the total detection count.
- Every negative delta in the full matrix must appear in the failure ledger. If there are no failures for a given seed set, report that honestly while explicitly forbidding a universal win claim.
- The Python and independently maintained JavaScript implementations must agree on **all masks, counts, rates, stratum breakdowns and failure records**. No test-time re-selection is permitted.

### Important interpretation

The min/max range is a descriptive range over five *fixed procedural seeds*, not a confidence interval for a real population. Source pairs are created by a pseudorandom generator inside one designed dynamical family, so replication here is limited methodological stress testing.

A strong result for a particular mask does not establish a fundamental information law or an advantage from φ. A failure against the first-k baseline is evidence that this toy's train-selected mask can lose under the specified finite holdout circumstances. Neither outcome should be advertised as validation in biology or AI systems.

## Reproduce

\`\`\`bash
python -m phimirrorhex --mode replicate --output e11-replication-fixture.json
node tests/check-replication-parity.mjs e11-replication-fixture.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

The React **REPLICATE** tab displays all seeds, worst-case outcomes, per-family error evidence, selectable policy/scenario and a browsable failure ledger. Reports are synthetic-only with SHA-256 integrity receipts, not signatures.

## Promotion gate

Only consider actual external observations after documenting collection provenance, independent study designs and prospective protocol approval; privacy/consent and an explicit ability-to-refuse boundary would be required. The research site remains read-only and offers no network/model/device authority.
