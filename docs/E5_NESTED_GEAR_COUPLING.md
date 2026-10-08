# E5 · Nested Gear Coupling / Delayed Conveyor Measurement

**Scope:** a fully specified *synthetic finite mathematical toy* of layered transport and hidden-state observability. No photons, carbon chemistry, biological or neural signals, human participants, consciousness measurement, or device actions.

## Motivation

E4 proved a constructed, single-probe NBG-style Keyhole separation witness. E5 adds **time**, multiple coupled six-sector layers, rotating local gear dynamics and explicit one-step transport memory. The goal is to determine exactly when hidden distinctions move to the outer boundary and when they first become visible to a restricted Keyhole.

The model adopts **NBG terminology** from [NestedBubbleGear](https://github.com/MichaelWave369/NestedBubbleGear) but imports no external NBG runtime and changes no other repository.

## Frozen algorithm

There are six rings, each with six signed sectors. At t=0:

```text
A[0] = (+1,-1,0,0,0,0); B[0] = (-1,+1,0,0,0,0)
A[1..5] = B[1..5] = (0,0,0,0,0,0)
Conveyor[0..5] = 0
P(X_t) = sum(outer ring 5 sectors)
```

For each t -> t+1:
- **Local gear:** rotate each ring one sector right on even-indexed rings and left on odd-indexed rings.
- **Retention:** multiply rotated local sector by **0.5**.
- **Conveyor:** add coupling × *previously buffered* inbound sector, independently to every sector. The next conveyor for ring l>0 is the current state of ring l−1; thus a change takes **two time steps per cross-ring hop**. Ring 0 has zero inbound buffer.
- **Perturbation:** only when t+1=12, multiply *outer ring 5, sector 0* by (1 + probe_gain), using the same fixed rule on A and B. No hidden-identity inspection is used by the operator.

```text
next[l,s] = 0.5 × rotate_l(current[l])[s] + coupling × conveyor[l,s]
conveyor_next[l] = current[l-1]  (l > 0), else 0
if step == 12: next[5,0] *= (1 + probe_gain)
```

Parameters: coupling ∈ {0, 0.25, 0.5, 1}; probe_gain ∈ {0, 0.25, 0.5, 1}; conveyor_on ∈ {false,true}. Exactly 24 deterministic frames, no randomness or timestamps. All factors are binary rationals for exact Python/JavaScript parity.

## Frozen primary witness

Default coupling=0.5, gain=0.5, conveyor=true.

- Frames 0–9: no hidden difference at the outer ring.
- **Frame 10:** the outer ring carries distinct sector histories, but both sums remain zero. The Keyhole cannot distinguish them.
- **Frame 12:** the fixed outer-sector perturbation reveals the difference: P(A)=+0.03515625 and P(B)=−0.03515625, giving gap **0.0703125**.
- In the absence of coupling, the outer ring never receives the hidden structure.
- With gain=0, the outer Keyhole remains zero for both states.
- With conveyor disabled, no inner state reaches the outer ring.

The successful toy witness demonstrates **causal distinguishability under the selected interface**. Because the intervention is intentionally asymmetric, it is not a discovery of a physical law or proof that the model is biologically plausible.

## Measurements & baseline

Every frame retains independently for both states:
- all 6×6 ring-sector states and 6×6 lag buffers;
- coarse outer sums, absolute outer projection gap, full-state L1 difference;
- outer hidden L1 difference, conveyor L1 difference;
- whether the fixed probe was applied.

Balanced **two-case classification** asks which initial ring-zero sector sign the system had:
- An initial coarse-only sum is zero in both cases, so any deterministic tie classifier can only get **1/2** correct.
- Initial full-state identity gets **2/2** correct.
- The outer Keyhole after the selected probe gets **2/2** correct if a separating witness exists; otherwise **1/2**.

These are *constructed two-case sanity controls*, not evidence of broad model improvement. Neither Φ nor Fibonacci is required to produce the separation. The Fibonacci radii are a visualization choice; they are not a causal parameter of the E5 transport.

## Qualification / falsifiers

- Frozen witness at t=10 (hidden arrival) and t=12 (first coarse separation).
- No-coupling / no-probe / no-conveyor negative controls.
- 32 scenarios (4 × 4 × 2), cross-language replay for all 24 frames.
- SHA-256 integrity receipt in Python; not a signature or evidence of authenticity.
- All provenance flags remain `SIMULATED`, `physical_measurement=false`, `consciousness_measured=false`, and `action_authorized=false`.
- No attempted integration with actual NBG/BrainC/PhiOS memory or real sensor inputs.

## Run

```bash
python -m phimirrorhex --mode gears --coupling 0.5 --probe-gain 0.5
python -m phimirrorhex --mode gears --coupling 0
python -m phimirrorhex --mode gears-fixtures --output e5-gears-fixture.json
node tests/check-gears-parity.mjs e5-gears-fixture.json
cd web && npm test
```

The React Pages site gains a **GEARS** tab displaying six linked rings, independently named states A/B, a 24-step time scrubbing control, perturbation switches, trajectory graph and causal-delay explanation.
