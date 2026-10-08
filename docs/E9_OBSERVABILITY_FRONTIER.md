# E9 · Observability Frontier: Which channels must be retained?

**Status:** finite exact enumeration of deliberately constructed synthetic state pairs. Not a model of human consciousness, photons, physical carbon, actual biology, AI agent telemetry, or a general sensor-selection theorem.

## Question

E8 showed that collapsing signed outer sectors to one sum can erase the distinction between two deliberately counterposed E5 states. E9 asks: for every possible subset of six channel identities, how often does a restricted observer distinguish those two states at a given time and finite detection floor?

The comparison is **matched at each subset**:

- **Identity max** = maximum absolute A-vs-B sector difference among selected sectors.
- **Masked sum** = absolute difference between A's and B's *sums over the exact same selected sectors*.
- **Global sum** = separate all-six aggregate baseline, which always reads six sectors.

A detection is counted only when its gap is **strictly greater than** the predeclared threshold. A zero-channel mask never detects. A separate A-vs-A negative control always returns zero.

## Full census

- Six channels produce **64 bitmasks** (0 through 63). For budget k there are C(6,k) masks.
- Every mask evaluated at **24 frames**, four detection floors `0, 0.001, 0.01, 0.05`, and four frozen E5 conditions:
  - `coupled_probe` (coupling .5, gain .5, conveyor enabled);
  - `no_probe` (gain 0);
  - `no_coupling` (coupling 0);
  - `no_conveyor` (conveyor disabled).
- Each per-budget coverage fraction = number of separating masks divided by number of enumerated masks at that budget.
- All results computed **without sampling masks, optimization, retuning, training or viewing actual external measurements**.
- No sensor mask can be recommended for real-world use from this toy alone.

## Expected primary controls

The coupled+probe condition reproduces E5's constructed time structure:

- At frame 10, signed outer sectors differ but their six-way sum is zero.
- With full-six budget, the identity-preserving max separates the pair, while the sum-only observer fails. This holds at the strict zero threshold.
- At frame 12, the predetermined E5 probe creates nonzero global-sum contrast.
- `no_probe` preserves delayed hidden structure but has no fixed external probe to reveal it to the *global sum*.
- `no_coupling` and `no_conveyor` never transport the counterposed source to the outer ring, so the entire outer-sensor atlas stays blank.
- As detection floor increases, **detected mask count cannot increase**, at fixed frame, readout, and sensor budget.

**Subtlety:** A masked sum can distinguish a pair that the complete six-way sum cannot, because *partial summation removes some cancellation partners*. We therefore display equal-budget identity-vs-masked-sum comparisons alongside the full-six global sum, rather than claiming that all summation always loses information.

## Reproduce

```bash
python -m phimirrorhex --mode frontier --output e9-frontier-fixture.json
node tests/check-frontier-parity.mjs e9-frontier-fixture.json
python -m pytest -q
cd web && npm test && npm run build
```

The React **FRONTIER** tab lets you toggle individual sensors, inspect budget coverage, control causal interventions and detection floor, scrub 24 frames, and export local synthetic Keyhole receipts.

## Limits and next work

This census concerns **one engineered A/B pair per E5 condition**, not estimated detection probabilities, empirical confidence intervals, or out-of-distribution guarantees. The E5 interface is designed to reveal hidden structure. It establishes a limited finite witness, not the superiority of any geometry in nature.

Future E10 work should expand to independently generated source pairs and held-out intervention families, preserving provenance, masks, costs, and calibration, before promoting any robustness or generalization claim.
