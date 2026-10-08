# E7 · Adaptive Nested Coherence

## Frozen question

Does a **Φ-based initialization** confer any held-out prediction advantage versus an equal initialization when all adaptive learners see the same engineered six-scale data and get the *same number of online gradient updates*?

We explicitly ask about **initial conditions for a specific learning rule**, not whether Φ has any universal property or causes biological consciousness.

## Dependency separation

E7 reuses E6's deterministic synthetic feature generator and known programmed worlds, and reads one E5 delayed-Keyhole causal witness as a **separate, read-only diagnostic**.

The E5 witness is never a training feature, ground-truth target or selection signal. It demonstrates a distinct constructed principle: hidden information can reach a boundary before a coarse Keyhole reveals it. Do not attribute E5's result to E7's learner.

## Preregistered training design

- Five programmed worlds: `equal`, `phi_inner`, `phi_outer`, `center`, `alternating`.
- Five adaptive initializations from E6, all strictly positive and sum to 1.
- Six independent synthetic readings per case, 128 cases per split.
- Train seed 201, validation seed 202, held-out seed 203.
- One deterministic online pass, 128 steps per initialization, no early stopping.
- Frozen learning rate `η=2.0`.
- On each training example, make one six-weight prediction `ŷ=w·x`, calculate squared-error gradient `2(ŷ-y)x`, and update:
  `w'[i] = w[i] exp(-η · 2(ŷ-y) · x[i]) / Z`.
- Checkpoints after 0, 16, 32, 64, 96, 128 training updates.
- All adaptive arms evaluate precisely **six input readings, six gradient terms and six exponential multiplications per training example**. All have six mutable parameters. Relative computation cost is matched at the algorithmic operation-count level, not hardware wall time.
- Select the best final model among all initializations **using validation MAE only**, lexicographic tie breaker. Then score all five frozen models on held-out cases.
- Report held-out MAE/MSE, plus untrained fixed versions of the five initialization profiles. Fixed baselines have no training cost and are clearly labeled **descriptive controls, not compute matched adaptive learners**.
- Negative control: rerun the validation-selected initialization with training labels circularly shifted by 47 while still doing exactly 128 updates; evaluate on untouched test cases. Do not retune initialization.

## Why this is falsifiable

- Equal-initialized learner can outperform φ-initialized learner, or vice versa, depending on the constructed regime, learning rate, and sample budget.
- If all adaptive learners converge similarly, that weakens the claim that the φ start matters at this budget.
- If shuffled training labels yield similar test error, the generator may not supply sufficient learnable signal, regardless of how aesthetically convincing a trajectory looks.
- Even if a φ initialization wins on these engineered worlds, its superiority is limited to **this exact toy generator, optimizer, sample order and fixed rate**.

### Causal audit

The separate E5 receipt tracks:
- frame 10: hidden outer L1 contrast is nonzero but the coarse outer gap is zero;
- frame 12: a fixed interface probe makes the coarse gap nonzero.

This is not a live observation nor a discovered causal relation by E7. E7 explicitly records `fed_to_learner=false`.

## Reproduction

```bash
python -m phimirrorhex --mode adaptive --output e7-adaptive-fixture.json
node tests/check-adaptive-parity.mjs e7-adaptive-fixture.json
python -m pytest -q
cd web && npm test && npm run build
```

The React Pages site gains an **ADAPTIVE** tab with five worlds, validation selection, held-out rankings, six-scale learned weights and checkpoints, shuffled-label negative control, and a separate E5 hidden-arrival/observable-gap readout.

## Claim firewall

`SIMULATED` does not become `OBSERVED` or `VERIFIED` because a metric improves. E7 has no human data, neural sensors, biophoton input, authorized physical action, real-world notion of a soul or consciousness measurement, or direct integration with [NestedBubbleGear](https://github.com/MichaelWave369/NestedBubbleGear). Causal audit is a bounded read-only E5 toy check.
