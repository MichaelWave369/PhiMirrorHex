# E12 · Sensor Economy & Prospective Transfer Gate

## Why this rung exists

E10 chose finite six-sector Keyhole masks on one synthetic training population. E11 repeated their held-out tests across five new deterministic seeds and retained all failures. E12 predeclares a *new development procedure* for choosing an observer robust to a changed outer intervention, and then evaluates the frozen choice on wholly separate test seeds.

**This is a controlled synthetic toy method.** It cannot establish physical, biological, neural, consciousness, photon, geometric, φ-optimality, or autonomous-agent claims.

## Sealed populations

- Three development seeds **1201, 1202, 1203**.
- One validation-only seed **1204**, not used in mask selection or hyperparameter choice.
- Five prospective test seeds **1301, 1302, 1303, 1304, 1305**, none used to select a mask.
- Each seed generates 48 symmetric A/B source pairs with 24 sparse and 24 dense patterns from E10's fixed procedural generator.
- The six-layer delayed conveyor and 12-step intervention remain unchanged. Detection floor is **strictly > 0.01**.

## Observer candidates and preregistered selection

For each sensor budget \(k=0,\dots,6\) and operator \`identity_max\` or \`masked_sum\`:

1. Enumerate all \(\binom{6}{k}\) masks at that budget.
2. On **development seeds alone**, measure the number of pairs distinguished under two conditions: **known probe at outer sector 0** and **shifted probe at sector 3**.
3. Select mask maximizing the **smaller** of those two pooled detection counts across all three development seeds.
4. Break ties by higher sum of the two development counts, then lower numeric mask.
5. Freeze the mask. Nothing in validation or prospective test modifies it.

This new robust-selection rule is a train-time design change, not permission to select a winner after examining held-out answers.

## Baselines and prospective evaluation

Evaluate three fixed masks **on the same paired cases** under all four intervention conditions:

- \`robust\`: development-only maximin mask described above.
- \`e10\`: original train-only E10 mask, unchanged.
- \`first_k\`: deterministic mask selecting the first k sectors.

All three use **exactly k sensor readings** and the same observation operator at a given row, though downstream computational cost differs between identity-max and summation.

For all **14 budgets/readouts × 4 scenarios × 5 prospective seeds = 280 cells**, retain total detection counts, sparse/dense strata, signed differences against both frozen baselines, and every losing comparison. No positive evidence is selectively published.

### Descriptive gate

A mask **passes in this toy** only when it loses to neither baseline on *any* prospective seed under **BOTH** known and shifted probes. Results from the no-probe and no-coupling controls are reported but not used in gate selection. This was defined without examining the prospective test outcomes.

This gate is **not a safety certification, a real-world deployment recommendation, or an authority grant**. A pass can arise from an uninformative tie, including the empty mask. Read both the gate result and raw detection counts.

## Negative controls

- Every \`no_coupling\` outer readout must remain blank; a nonzero reading fails qualification.
- Every zero-budget mask must remain blind.
- Sparse and dense detection counts must always add to the total.
- The Python reference and independent JavaScript engine must agree exactly (or within fixed numerical tolerance) on selected masks, training counts, validation results, prospective results, all losses and gates.
- No prospective data may affect the chosen sensor identities or threshold.

## Reproduction

\`\`\`bash
python -m phimirrorhex --mode transfer --output e12-transfer-fixture.json
node tests/check-transfer-parity.mjs e12-transfer-fixture.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

The React **TRANSFER** room shows seed-specific scores, three observer mask identities, sparse/dense breakdown, worst margins, the descriptive gate and the complete failure ledger. JSON exports are local and synthetic-only.

## Limits and future work

Repeated pseudorandom seeds from one constructed generator do not make independent real-world populations. Finite counts and observed minima are not confidence intervals or causal identification in nature. Prior to any externally sensed data or integration, require traceable provenance, consent where applicable, prospectively registered comparisons, independent replication, uncertainty quantification and an explicit authorization boundary.
