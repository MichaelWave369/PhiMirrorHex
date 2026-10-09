# E26 · Snapshot Recovery & Rollback Refusal

## Research question

E25 demonstrated dual-signed fixture key rotation, but a fresh in-memory verifier forgot the old key's retirement and replay sequence. E26 tests a minimal **snapshot + separately held reference comparison** before allowing locally reconstructed demo state. This is a carefully limited methods experiment, **not a durable or secure crash-recovery implementation**.

There is no filesystem writer or automatic cross-session persistence. Both the state and reference are exported/pasted by a human in the React research room. No trusted external custodian or authenticated reference exists. If an adversary controls both copies, they can rewrite both and defeat the check. A matching SHA-256 is a self-consistency comparison, **not a signature, authenticated writer proof or authorization**.

## Frozen contracts

- Snapshot schema: \`phimirrorhex.e26.recovery-audit.v1\`: \`schema\`, \`generation\` (nonnegative revision counter), \`state\` (E25 memory-only key lifecycle state), and \`digest\` (SHA-256 of canonical sorted compact JSON of the other three fields).
- Reference schema: \`phimirrorhex.e26.held-state-reference.v1\`: \`minimum_generation\`, \`expected_digest\`, \`origin: UNAUTHENTICATED_HELD_COPY\`, and **false** for all identity/authentication/authority assertions.
- A freshly made reference is **not independently trusted** merely because it was exported to a separate file. It would need genuinely protected custody beyond this exercise.

The recovery policy requires valid reference structure, valid E25 state invariants, correct snapshot SHA-256, **exact match of both pinned generation and digest**. Otherwise return a distinct refusal:
\`REFUSED_NO_REFERENCE\`, \`REFUSED_INVALID_REFERENCE\`, \`REFUSED_INVALID_SNAPSHOT\`, \`REFUSED_ROLLBACK\`, \`REFUSED_UNPINNED_ADVANCE\`, or \`REFUSED_FORK\`.

A matching pair produces **\`RECOVERED_DEMO_UNTRUSTED\`**, never \`AUTHENTICATED\`, \`READY_TO_EXECUTE\`, a trusted-memory write or model authority. A newer snapshot is not automatically promoted without a newly protected continuity reference.

## Frozen twelve scenarios

| # | Challenge | Expected |
|---|---|---|
| 1 | Correct epoch-two sequence-12 snapshot and retained pin | RECOVERED_DEMO_UNTRUSTED |
| 2 | Older sequence-11 snapshot against generation-12 pin | REFUSED_ROLLBACK |
| 3 | Edited snapshot without recalculating digest | REFUSED_INVALID_SNAPSHOT |
| 4 | Rehashed edited state, pinned reference unchanged | REFUSED_FORK |
| 5 | Rehash state and reference together | RECOVERED_DEMO_UNTRUSTED (blind spot) |
| 6 | Reference missing | REFUSED_NO_REFERENCE |
| 7 | Reference falsely asserts authenticated custody | REFUSED_INVALID_REFERENCE |
| 8 | Future snapshot without corresponding newer pin | REFUSED_UNPINNED_ADVANCE |
| 9 | Structurally impossible E25 state with a valid checksum | REFUSED_INVALID_SNAPSHOT |
| 10 | Reference digest altered, snapshot unchanged | REFUSED_FORK |
| 11 | Old snapshot and its co-rewound reference | RECOVERED_DEMO_UNTRUSTED (blind spot) |
| 12 | Fresh epoch-one genesis and self-issued matching reference | RECOVERED_DEMO_UNTRUSTED (blind spot) |

Expected **12 cases, 4 untrusted recoveries, 1 rollback refusal, 2 fork refusals, 2 invalid snapshots, 1 missing reference, 1 invalid reference, 1 unpinned advance, 0 authority grants**.

An independent E25 claim replay probe compares:
- Recovery of epoch-two sequence-12 state refuses the old key: \`REFUSED_REVOKED\`.
- Recovery of co-issued epoch-one genesis accepts the old signature again: \`ACCEPTED_DEMO_UNTRUSTED\`.

That accepted replay is a **required exposed vulnerability**, not evidence of secure recovery. The experimental code cannot prove an external party saved the right reference, operated a protected storage device, used secret keys, or kept anything durable across sessions.

## Reproduce

\`\`\`bash
python -m phimirrorhex --mode recovery --output e26-recovery-qualification.json
node tests/check-recovery-parity.mjs e26-recovery-qualification.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

Python API: \`make_snapshot\`, \`hold_reference\`, \`recover\`, \`recovery_qualification_report\`.

JavaScript API: \`makeRecoverySnapshot\`, \`holdRecoveryReference\`, \`recoverLocalSnapshot\`, \`recoveryQualificationReport\`.

Both produce the identical 12-case full synthetic report and canonical SHA-256. The **RECOVERY** React room allows human-held JSON exports and paste-only comparison with visible refusal results. It never reads or writes persistent storage, signs a new trust root, controls an agent, or establishes identity.

A real governed recovery service would require secure key custody, authenticated and mutually isolated durable storage, monotonic non-rollback counters, repair protocols, replay hardening across crashes, signed independent references, and explicit capability authorization. E26 implements **none** of those production claims.
