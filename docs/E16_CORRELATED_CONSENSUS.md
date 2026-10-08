# E16 · Correlated Keyhole Quorum & Refusal

## Question

Does agreement between several E15 observers make a more useful **synthetic sequential warning system**, or can their correlated observations cause shared false alarms and missed sustained changes?

**This is not independent replication.** All three observers inspect the SAME procedural noise realization, often overlapping sensor sectors. This rung does not establish physical, neural, biological, or consciousness observations; no models, hardware or outside agents are granted authority.

## Frozen ensemble

Select three existing E15 policies, unchanged:

- Budget **2** / \`identity_max\`.
- Budget **3** / \`masked_sum\`.
- Budget **4** / \`identity_max\`.

Each member carries its *own frozen E15 threshold and mask*, developed exclusively on nominal streams 1901–1904. E16 adds **no test-tuned threshold or mask**.

The eight E15 held-out streams (stationary ×2, step ×2, ramp ×2 and transient spike ×2) are replayed with unchanged seeds 2201–2208, 96 frames each. **Members are not independent replicates**: they share noise generator, frame timing, event labels and often overlapping channels. The report publishes mask Jaccard overlaps and descriptive joint-positive counts to prevent inflated claims about three "independent votes."

## Quorum policies compared

Predeclared policies 1-of-3, 2-of-3, and 3-of-3, every one exposed to the exact same traces. For each frame:

1. Determine each member's **availability** from its E15 explicit sensor-fault metadata.
2. If available, vote YES exactly when that member's running CUSUM is **strictly above its frozen E15 limit**. This is a frame-local vote, **not** the member's historical first-alarm flag.
3. If fewer than **q** members are available, the ensemble **ABSTAINS**. No missing member is counted as a NO vote or successful null rejection.
4. Otherwise, emit an ensemble alarm if at least **q** *currently eligible members* vote YES. Only the **first** alarm is recorded; later frames remain visible.
5. Never tune quorum choice to the sealed outcomes: all three rules are reported, successes and failures alike.

The ensemble is fully constructed and read-only; it is not a functioning live-agent council, distributed sensor protocol, or safety certifier.

## Detection definitions and controls

- A sustained **step/ramp** event begins at frame 48. First alarm earlier than 48 is a **false alarm**, **not a detection**; if that alarm has already consumed the one-shot alert, the true sustained event is also **missed**.
- Any alarm in **stationary** and **brief-spike** streams is a false alarm **for the sustained-event target**.
- An on-time first alarm in step/ramp reports finite detection delay; no on-time first alarm is a miss.
- Coverage = frames where quorum members were eligible / 96. A refusal reduces coverage; it never increases correct-negative counts.
- Three voting policies have different availability requirements and must be compared jointly on both coverage and errors.

A toy gate passes only with no false alarms, no missed persistent changes and at least 75% coverage in every one of the eight fixed test streams. This is a finite descriptive gate and **does not authorize any real-world action**.

## Failure ledger and audit

Every policy/stream cell with a false alarm, missed sustained change or coverage under 75% appears in the ledger, including its first-alarm step, delay and refusal count. Python and independently implemented JavaScript must reproduce all 24 cells and every frame, vote, and error.

The overlap diagnostic reports selected-channel intersection/union/Jaccard; a separate **co-vote** diagnostic reports joint positives on jointly available frames. These are descriptive counts, not statistical tests for independence.

## Reproduce

\`\`\`bash
python -m phimirrorhex --mode consensus --output e16-consensus-fixture.json
node tests/check-consensus-parity.mjs e16-consensus-fixture.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

The static React **CONSENSUS** room provides quorum controls, a timeline of each member's votes/abstentions, first alert, worst failure counts, overlap warnings, and complete clickable refusal/failure records.

### Limitations and the next gate

E15 and E16 reuse the same sealed trajectories. Therefore E16 comparisons are **post-E15 reuse studies**, not an entirely fresh prospective validation. Before adopting a quorum rule even inside another simulation, define a new held-out batch of seeds and distinct noise/coupling generators, then register that comparison **before** evaluating it. For external sensors, independent collection, calibration, provenance and explicit consent/authorization would be required.
