# E4 · Nested Vessel / Keyhole Measurement

> **Hypothesis boundary:** The vessel is a conceptual analogy for nested biological information processing; it is not a physical quartz model, evidence of a soul, a study of actual neural function, or a measure of subjective experience.

## Origin and scope

This module remains entirely inside **PhiMirrorHex** while drawing its *formal vocabulary* from [NestedBubbleGear](https://github.com/MichaelWave369/NestedBubbleGear): bounded domains (bubbles), constrained interfaces, ordered transformations (gears), coarse observer maps (Keyholes), hidden causal residue, and replayable provenance. No code is imported from or written to NBG.

The six display layers are illustrative, **not** six known ontological phases of consciousness:

| Ring | Analogical layer | Potential empirical proxy in future, subject to design and consent |
| --- | --- | --- |
| 0 | Environmental coupling | Controlled stimulus conditions |
| 1 | Sensory boundary | Transduction timing or sensory thresholds |
| 2 | Signal encoding | Time-locked encoding patterns |
| 3 | Local feedback loops | Delays and recurrent network dynamics |
| 4 | Integration proxy | Cross-regional coupling or dependency measures |
| 5 | Behavioral expression proxy | Task response or voluntary report |

The final ring intentionally says **behavioral expression proxy**: no direct observable is equated to felt experience.

## Frozen finite toy

Two different six-sector states:

```text
A0 = (+1, -1, 0, 0, 0, 0)
B0 = (-1, +1, 0, 0, 0, 0)
P(x) = sum(x[0:6])
P(A0) = P(B0) = 0
A0 != B0
```

A single admissible sequence of interfaces (the same rule on both states):

1. For each following layer, cyclically rotate the sector vector right by one.
2. At one preregistered probe layer `p`, multiply sector `p` by `1 + gain`; use identical operations on both states, without reading their identity.
3. Recompute the restricted Keyhole `P(x)` after every interface.

With `p=3` and `gain=0.5`, `P(A_i)=P(B_i)=0` for layers 0,1,2, and `P(A_i)=+0.5`, `P(B_i)=-0.5` for layers 3,4,5. The first separating Keyhole has **depth 3**. Other preregistered layers 1–5 are supported.

With `gain=0` (negative control), both states remain coarse-equivalent at all layers despite their differing hidden structure. An aggregate-only observer cannot tell the states apart at layer 0, while a full-state observer can. This reproduces the **shape of an NBG/Altermath toy witness**:

```text
P(A0) == P(B0), but P(T_p ... T_1(A0)) != P(T_p ... T_1(B0)).
```

The operation is intentionally asymmetric in a fixed coordinate. The observed separation is a consequence of that chosen interface and initial states, not evidence that a hexagon, golden ratio, or human body has this specific dynamics.

## Controls and falsifiers

- **Positive control:** finite-gain transition makes the originally hidden distinction observable at the selected probe depth.
- **Negative control:** zero gain retains coarse equality across all six rings.
- **Identity control:** state A/B are stored separately; no sum-only compression may claim to reconstruct their sign pattern.
- **Observer-depth control:** changing observation depth changes the visible measurement, not the underlying trajectory.
- **Authority control:** `action_authorized=false`; no physical/agent/device action.
- **Provenance:** `epistemic_origin=SIMULATED`; not OBSERVED or VERIFIED.
- **Claim firewall:** `physical_measurement=false`, `biometric_data=false`, `consciousness_measured=false`, `causal_claim_about_humans=false`.

This is a **known constructed toy** and cannot establish superiority to baselines in real biological, artificial, or physical systems. Future real studies require explicit measurement definitions, consent and ethics, calibration, matched model capacity, held-out subjects/sessions, negative controls, and preregistered promotion criteria.

## Run

```bash
python -m phimirrorhex --mode vessel --probe-layer 3 --gain 0.5 --observer-depth 3
python -m phimirrorhex --mode vessel --probe-layer 3 --gain 0 --observer-depth 5
python -m pytest -q
cd web && npm test
```

The React site adds a **VESSEL** tab with dual nested-hex state diagrams, Keyhole depth control, probe depth and strength control, coarse projection comparisons, and an observability witness readout.

## Compatible boundary for NBG

No native NBG adapter, data collection or authority grant is implied. A future read-only export would pin source revision, schema, provenance, observer map, interface word, and a digest; the destination would need to separately validate and accept it.
