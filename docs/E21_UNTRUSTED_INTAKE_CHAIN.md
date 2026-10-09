# E21 · Untrusted Evidence Intake Chain & Replay Defense

## Problem and limitations

E19 exports **unsigned** synthetic quorum receipts; E20 only permits quarantined local inspection. E21 tests a complementary operational *pattern*: a local append-only **in-memory** decision trail with per-consumer replay detection and optional caller-supplied digest pins.

**This is a demo reference, not a deployed trust service.** No external NBG, BrainC, or SuperPhiVessel receiver is connected. No persistent database, signed seal, identity provider, telemetry, network call, or real-world authority is created.

## Frozen local policy

Input is an E19 JSON packet, a named E20 consumer and an action (normally \`inspect\`), plus an **optional expected SHA-256** supplied by a caller. Every attempt produces a finite, explicit ledger event.

1. Reject an input if the current ledger fails self-consistency verification.
2. Record the **packet-claimed** lowercase SHA-256 as *untrusted metadata*. An invalid/unavailable field is recorded as null.
3. If an expected pin was supplied, reject any mismatch or invalid pin format **before** E20 verification. A matching caller pin does **not** authenticate the sender: the pin and packet may both be controlled by an adversary.
4. Otherwise call the frozen E20 \`receive\` / \`receiveEvidence\`. A verified E19 packet can only be \`QUARANTINED_READ_ONLY\`, never trusted.
5. A replay of a *verified* quarantined packet for the **same consumer, digest and \`inspect\` action** is \`DUPLICATE_QUARANTINED\`. No replay cache is shared with another consumer or process. Rejected packets cannot become duplicates merely because their claims match.
6. Known requested mutations (approve, execute, train, route, persist) remain \`REFUSED_ACTION\` as E20 decides. Unknown consumers/actions remain \`REJECTED\`.
7. Append a new event holding index, claimed hash, policy decision and reason codes, independent per-step previous hash, and zero action, memory, routing or external-write grants. No payload instructions are stored as executable text.

Each event's \`event_hash\` is SHA-256 over minified recursive sorted JSON of the event **without** \`event_hash\`. The chain starts at 64 ASCII zeros. Every new event links to the preceding event hash, and the ledger head is the last event hash.

## Important cryptography distinction

An unkeyed chain **only checks internal consistency**. Anyone controlling the ledger can rewrite earlier entries and recompute every subsequent hash. This does **not** establish immutability, provenance, public auditability, or producer identity. Real distributed ingestion would require authenticated inputs, trusted durable write paths, external checkpoint pins or signed/witnessed seals, replay caches scoped to origin and tenancy, retention policy, and permissions separate from these informational fields.

Also, an expected hash from the same untrusted source as the packet adds no trust. It can only act as a meaningful checksum *comparison* when a caller has independently obtained and protected an expected value. Even then it is not sufficient by itself to authorize actions.

## Frozen E21 qualification cases

Eleven scenarios are evaluated deterministically:

| Trial | Disposition |
| --- | --- |
| First E19 packet to NBG | QUARANTINED_READ_ONLY |
| Same NBG packet replayed | DUPLICATE_QUARANTINED |
| Same packet to BrainC | QUARANTINED_READ_ONLY |
| Same packet to SuperPhiVessel | QUARANTINED_READ_ONLY |
| Wrong caller-supplied SHA pin | REJECTED |
| Corrupted decision frames, old checksum | REJECTED |
| Recomputed checksum with forged execution authority | REJECTED |
| Recomputed checksum with prompt instruction | REJECTED |
| Fabricated publisher signature | REJECTED |
| Approval action targeting SuperPhiVessel | REFUSED_ACTION |
| Unknown receiver | REJECTED |

Expected: **3 quarantines, 1 replay duplicate, 6 rejections, 1 action refused, 0 granted authority, 0 external calls**. Every attempt remains visible, including failures.

## API, reproduction and future interfaces

Python:
\`\`\`python
from phimirrorhex.intake_chain import empty_ledger, intake, verify_chain
ledger = empty_ledger()
ledger = intake(ledger, packet, "BrainC", requested_action="inspect")
assert verify_chain(ledger)["valid"]
\`\`\`

JavaScript:
\`\`\`js
import {emptyLedger, intakeEvidence, verifyIntakeChain} from "./intake-chain-model.mjs";
let ledger = await intakeEvidence(emptyLedger(), packet, "BrainC");
const verdict = await verifyIntakeChain(ledger);
\`\`\`

Both are **purely in-memory**, return a new ledger without writing to disk, and produce no network or external agent actions.

CLI/CI:
\`\`\`bash
python -m phimirrorhex --mode intake-chain --output e21-intake-chain.json
node tests/check-intake-chain-parity.mjs e21-intake-chain.json
python -m pytest -q
cd web && npm test && npm run build
\`\`\`

The **INTAKE** React research room runs all 11 cases, displays each decision with its chained hash, verifies unaltered or manually altered local ledgers, and exports an unsigned JSON qualification receipt. No silent auto-ingest, implied trusted memory promotion, or external producer integration is permitted.

E21 remains a synthetic methods demonstration, not evidence of physical/biological phenomena, consciousness, cryptographic authenticity, or safe deployment.
