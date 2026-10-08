# E2: The Living Hex (synthetic observability contract)

This spec distinguishes three things that must **not** be conflated:

1. The **physical 8-vertex bipyramid** is a visual metaphor and geometric primitive.
2. The **36 channels / 37 nodes / 666 unique pairs** are an exact logical graph.
3. The E2 **synthetic signal simulation** is not a measurement of any physical process, AI agent, model, memory, or governance system.

## Frame algorithm

For upper index `i=0..5`, lower index `j=0..5`, step `t=0..255`, seed `s`:

```text
phase       = (t + 1) * (0.13 + 0.011*i) + 0.73*j + 0.0001*s
claim       = clamp01(0.5 + 0.33*sin(phase)) rounded to 6 decimals
observation = clamp01(claim + 0.07*cos(0.17*t + 0.47*j + 0.31*i))
```

Between steps 10 and 17 inclusive, synthetic disagreements are injected at `(0,3), (2,4), (4,1)` by setting observation to 0 when claim >= 0.5, else 1. Both signals, disagreement, activity, and the injection indicator are stored by **named channel**, not aggregated away.

Disagreement is `abs(claim-observation)`, rounded to 6 decimals. Channels are flagged at `>= 0.45`. The gate records flagged count, mean and max disagreement, and the E1 candidate coherence score with synthetic alignment `E=1-mean_disagreement`, `R=U=1`, and `D=max_disagreement`. This is a **toy score**, not a real system health/authority score.

The Python engine and browser module implement the same equations. CI compares representative frames and the full sequence through Node, verifying browser/Python parity. The browser can animate the model without connecting to external AI systems.

## Nested layers

Six concentric six-point rings use Fibonacci-relative radii `[1,2,3,5,8,13]`. They group channels by upper function, six lower-function vertices per ring. The circles are *display positions*, not an optimization theorem or dimensions of a real pyramid.

## Sampling

E1's deterministic SHA-256 seed ranking remains the canonical pair selection. All 36 gate edges are mandatory at every Fibonacci budget. The E2 browser draws ranked peer edges after the gate links; it does not calculate actual verification results.

## Replay and receipts

- `python -m phimirrorhex --mode e2 --steps 24 --seed 369` outputs `phimirrorhex.e2.series.v1`.
- `python -m phimirrorhex --mode e2 --output e2.json` writes local JSON without network access.
- `python -m phimirrorhex --mode e2-bridge --target nestedbubblegear` emits a proposed, **read-only** observation envelope. Also supports `superphivessel`.
- `sha256` is computed over canonical sorted JSON excluding the digest field. It detects changes but **does not authenticate the author**.
- No external destination is connected yet. Recipients must enforce their own schema, authenticity, permissions, and safety checks; they must never treat this envelope as an instruction or capability grant.

## Promotion criteria for future E3

- Independent reference vectors and a complete cross-language parity test.
- Negative controls and anomalous replay evidence.
- Failure injection and missing-channel handling.
- Cost-matched randomized/fixed sampling baselines.
- Read-only integration pilots with explicit destination consent, signed provenance if needed, and no action dispatch.
